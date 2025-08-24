import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, materialsTable, workersTable, otherExpensesTable } from '../db/schema';
import { type GetCostSummaryInput } from '../schema';
import { getProjectCostSummary } from '../handlers/get_project_cost_summary';

describe('getProjectCostSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should calculate cost summary for project with all expense types', async () => {
    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'Test description',
        start_date: new Date('2024-01-01'),
        end_date: null,
        status: 'planning'
      })
      .returning()
      .execute();

    const project_id = projectResult[0].id;

    // Add materials
    await db.insert(materialsTable).values([
      {
        project_id,
        name: 'Material 1',
        quantity: '10.5',
        unit: 'pieces',
        price_per_unit: '25.50',
        purchase_date: new Date('2024-01-05')
      },
      {
        project_id,
        name: 'Material 2',
        quantity: '5.0',
        unit: 'kg',
        price_per_unit: '15.00',
        purchase_date: new Date('2024-01-10')
      }
    ]).execute();

    // Add workers
    await db.insert(workersTable).values([
      {
        project_id,
        name: 'Worker 1',
        daily_pay_rate: '100.00',
        days_worked: 5,
        start_date: new Date('2024-01-02'),
        end_date: null
      },
      {
        project_id,
        name: 'Worker 2',
        daily_pay_rate: '120.00',
        days_worked: 3,
        start_date: new Date('2024-01-03'),
        end_date: null
      }
    ]).execute();

    // Add other expenses
    await db.insert(otherExpensesTable).values([
      {
        project_id,
        name: 'Expense 1',
        description: 'Test expense',
        price: '50.00',
        expense_date: new Date('2024-01-06')
      },
      {
        project_id,
        name: 'Expense 2',
        description: null,
        price: '30.75',
        expense_date: new Date('2024-01-08')
      }
    ]).execute();

    const input: GetCostSummaryInput = {
      project_id,
      as_of_date: null
    };

    const result = await getProjectCostSummary(input);

    // Expected calculations:
    // Materials: (10.5 * 25.50) + (5.0 * 15.00) = 267.75 + 75.00 = 342.75
    // Workers: (5 * 100.00) + (3 * 120.00) = 500.00 + 360.00 = 860.00
    // Other expenses: 50.00 + 30.75 = 80.75
    // Total: 342.75 + 860.00 + 80.75 = 1283.50

    expect(result.project_id).toEqual(project_id);
    expect(result.materials_cost).toEqual(342.75);
    expect(result.workers_cost).toEqual(860.00);
    expect(result.other_expenses_cost).toEqual(80.75);
    expect(result.total_cost).toEqual(1283.50);
    expect(result.as_of_date).toBeNull();
  });

  it('should return zero costs for project with no expenses', async () => {
    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Empty Project',
        description: null,
        start_date: new Date('2024-01-01'),
        end_date: null,
        status: 'planning'
      })
      .returning()
      .execute();

    const project_id = projectResult[0].id;

    const input: GetCostSummaryInput = {
      project_id,
      as_of_date: null
    };

    const result = await getProjectCostSummary(input);

    expect(result.project_id).toEqual(project_id);
    expect(result.materials_cost).toEqual(0);
    expect(result.workers_cost).toEqual(0);
    expect(result.other_expenses_cost).toEqual(0);
    expect(result.total_cost).toEqual(0);
    expect(result.as_of_date).toBeNull();
  });

  it('should filter expenses by as_of_date correctly', async () => {
    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Date Filter Project',
        description: null,
        start_date: new Date('2024-01-01'),
        end_date: null,
        status: 'planning'
      })
      .returning()
      .execute();

    const project_id = projectResult[0].id;

    // Add materials with different purchase dates
    await db.insert(materialsTable).values([
      {
        project_id,
        name: 'Early Material',
        quantity: '10.0',
        unit: 'pieces',
        price_per_unit: '10.00',
        purchase_date: new Date('2024-01-05')
      },
      {
        project_id,
        name: 'Late Material',
        quantity: '5.0',
        unit: 'pieces',
        price_per_unit: '20.00',
        purchase_date: new Date('2024-01-15')
      }
    ]).execute();

    // Add workers with different start dates
    await db.insert(workersTable).values([
      {
        project_id,
        name: 'Early Worker',
        daily_pay_rate: '100.00',
        days_worked: 3,
        start_date: new Date('2024-01-02'),
        end_date: null
      },
      {
        project_id,
        name: 'Late Worker',
        daily_pay_rate: '150.00',
        days_worked: 2,
        start_date: new Date('2024-01-12'),
        end_date: null
      }
    ]).execute();

    // Add expenses with different dates
    await db.insert(otherExpensesTable).values([
      {
        project_id,
        name: 'Early Expense',
        description: null,
        price: '25.00',
        expense_date: new Date('2024-01-07')
      },
      {
        project_id,
        name: 'Late Expense',
        description: null,
        price: '40.00',
        expense_date: new Date('2024-01-20')
      }
    ]).execute();

    const input: GetCostSummaryInput = {
      project_id,
      as_of_date: new Date('2024-01-10')
    };

    const result = await getProjectCostSummary(input);

    // Expected calculations up to 2024-01-10:
    // Materials: only Early Material = 10.0 * 10.00 = 100.00
    // Workers: only Early Worker = 3 * 100.00 = 300.00
    // Other expenses: only Early Expense = 25.00
    // Total: 100.00 + 300.00 + 25.00 = 425.00

    expect(result.project_id).toEqual(project_id);
    expect(result.materials_cost).toEqual(100.00);
    expect(result.workers_cost).toEqual(300.00);
    expect(result.other_expenses_cost).toEqual(25.00);
    expect(result.total_cost).toEqual(425.00);
    expect(result.as_of_date).toEqual(new Date('2024-01-10'));
  });

  it('should handle null dates in expense records when filtering by as_of_date', async () => {
    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Null Dates Project',
        description: null,
        start_date: new Date('2024-01-01'),
        end_date: null,
        status: 'planning'
      })
      .returning()
      .execute();

    const project_id = projectResult[0].id;

    // Add materials with null purchase date
    await db.insert(materialsTable).values({
      project_id,
      name: 'No Date Material',
      quantity: '5.0',
      unit: 'pieces',
      price_per_unit: '10.00',
      purchase_date: null
    }).execute();

    // Add workers with null start date
    await db.insert(workersTable).values({
      project_id,
      name: 'No Date Worker',
      daily_pay_rate: '100.00',
      days_worked: 2,
      start_date: null,
      end_date: null
    }).execute();

    // Add expenses with null expense date
    await db.insert(otherExpensesTable).values({
      project_id,
      name: 'No Date Expense',
      description: null,
      price: '25.00',
      expense_date: null
    }).execute();

    const input: GetCostSummaryInput = {
      project_id,
      as_of_date: new Date('2024-01-10')
    };

    const result = await getProjectCostSummary(input);

    // When filtering by as_of_date, records with null dates should be excluded
    expect(result.project_id).toEqual(project_id);
    expect(result.materials_cost).toEqual(0);
    expect(result.workers_cost).toEqual(0);
    expect(result.other_expenses_cost).toEqual(0);
    expect(result.total_cost).toEqual(0);
    expect(result.as_of_date).toEqual(new Date('2024-01-10'));
  });

  it('should handle decimal calculations correctly', async () => {
    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Decimal Test Project',
        description: null,
        start_date: new Date('2024-01-01'),
        end_date: null,
        status: 'planning'
      })
      .returning()
      .execute();

    const project_id = projectResult[0].id;

    // Add materials with decimal quantities and prices
    await db.insert(materialsTable).values({
      project_id,
      name: 'Decimal Material',
      quantity: '3.75',
      unit: 'kg',
      price_per_unit: '12.33',
      purchase_date: new Date('2024-01-05')
    }).execute();

    // Add workers with decimal rates
    await db.insert(workersTable).values({
      project_id,
      name: 'Decimal Worker',
      daily_pay_rate: '125.50',
      days_worked: 4,
      start_date: new Date('2024-01-02'),
      end_date: null
    }).execute();

    // Add decimal expense
    await db.insert(otherExpensesTable).values({
      project_id,
      name: 'Decimal Expense',
      description: null,
      price: '99.99',
      expense_date: new Date('2024-01-06')
    }).execute();

    const input: GetCostSummaryInput = {
      project_id,
      as_of_date: null
    };

    const result = await getProjectCostSummary(input);

    // Expected calculations:
    // Materials: 3.75 * 12.33 = 46.2375 -> 46.24 (rounded)
    // Workers: 4 * 125.50 = 502.00
    // Other expenses: 99.99
    // Total: 46.24 + 502.00 + 99.99 = 648.23

    expect(result.project_id).toEqual(project_id);
    expect(result.materials_cost).toBeCloseTo(46.24, 2);
    expect(result.workers_cost).toEqual(502.00);
    expect(result.other_expenses_cost).toEqual(99.99);
    expect(result.total_cost).toBeCloseTo(648.23, 2);
  });

  it('should return correct numeric types', async () => {
    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Type Test Project',
        description: null,
        start_date: new Date('2024-01-01'),
        end_date: null,
        status: 'planning'
      })
      .returning()
      .execute();

    const project_id = projectResult[0].id;

    const input: GetCostSummaryInput = {
      project_id,
      as_of_date: null
    };

    const result = await getProjectCostSummary(input);

    // Verify all cost fields are numbers
    expect(typeof result.materials_cost).toBe('number');
    expect(typeof result.workers_cost).toBe('number');
    expect(typeof result.other_expenses_cost).toBe('number');
    expect(typeof result.total_cost).toBe('number');
  });
});