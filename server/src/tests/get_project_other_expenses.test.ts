import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, otherExpensesTable } from '../db/schema';
import { getProjectOtherExpenses } from '../handlers/get_project_other_expenses';
import { eq } from 'drizzle-orm';

describe('getProjectOtherExpenses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return other expenses for a project', async () => {
    // Create test project first
    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A project for testing',
        start_date: new Date('2024-01-01'),
        end_date: null,
        status: 'planning'
      })
      .returning()
      .execute();

    const projectId = project[0].id;

    // Create test other expenses
    const testExpenses = [
      {
        project_id: projectId,
        name: 'Permit Fee',
        description: 'Building permit',
        price: '150.50',
        expense_date: new Date('2024-01-15')
      },
      {
        project_id: projectId,
        name: 'Insurance',
        description: null,
        price: '250.75',
        expense_date: null
      },
      {
        project_id: projectId,
        name: 'Equipment Rental',
        description: 'Excavator rental for 3 days',
        price: '450.00',
        expense_date: new Date('2024-01-20')
      }
    ];

    await db.insert(otherExpensesTable)
      .values(testExpenses)
      .execute();

    const result = await getProjectOtherExpenses(projectId);

    // Should return 3 expenses
    expect(result).toHaveLength(3);

    // Verify the expenses are returned correctly
    const expenseNames = result.map(e => e.name);
    expect(expenseNames).toContain('Permit Fee');
    expect(expenseNames).toContain('Insurance');
    expect(expenseNames).toContain('Equipment Rental');

    // Verify numeric conversion
    result.forEach(expense => {
      expect(typeof expense.price).toBe('number');
      expect(expense.price).toBeGreaterThan(0);
    });

    // Verify specific expense details
    const permitFee = result.find(e => e.name === 'Permit Fee');
    expect(permitFee).toBeDefined();
    expect(permitFee!.description).toBe('Building permit');
    expect(permitFee!.price).toBe(150.50);
    expect(permitFee!.project_id).toBe(projectId);
    expect(permitFee!.expense_date).toBeInstanceOf(Date);
    expect(permitFee!.created_at).toBeInstanceOf(Date);
    expect(permitFee!.updated_at).toBeInstanceOf(Date);

    const insurance = result.find(e => e.name === 'Insurance');
    expect(insurance).toBeDefined();
    expect(insurance!.description).toBeNull();
    expect(insurance!.price).toBe(250.75);
    expect(insurance!.expense_date).toBeNull();
  });

  it('should return empty array for project with no other expenses', async () => {
    // Create test project first
    const project = await db.insert(projectsTable)
      .values({
        name: 'Empty Project',
        description: null,
        start_date: new Date('2024-01-01'),
        end_date: null,
        status: 'planning'
      })
      .returning()
      .execute();

    const result = await getProjectOtherExpenses(project[0].id);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return only expenses for specified project', async () => {
    // Create two test projects
    const projects = await db.insert(projectsTable)
      .values([
        {
          name: 'Project 1',
          description: null,
          start_date: new Date('2024-01-01'),
          end_date: null,
          status: 'planning'
        },
        {
          name: 'Project 2',
          description: null,
          start_date: new Date('2024-01-01'),
          end_date: null,
          status: 'planning'
        }
      ])
      .returning()
      .execute();

    const project1Id = projects[0].id;
    const project2Id = projects[1].id;

    // Create expenses for both projects
    await db.insert(otherExpensesTable)
      .values([
        {
          project_id: project1Id,
          name: 'Project 1 Expense',
          description: 'For project 1 only',
          price: '100.00',
          expense_date: new Date('2024-01-15')
        },
        {
          project_id: project2Id,
          name: 'Project 2 Expense',
          description: 'For project 2 only',
          price: '200.00',
          expense_date: new Date('2024-01-16')
        },
        {
          project_id: project1Id,
          name: 'Another Project 1 Expense',
          description: null,
          price: '150.00',
          expense_date: null
        }
      ])
      .execute();

    // Get expenses for project 1 only
    const result = await getProjectOtherExpenses(project1Id);

    expect(result).toHaveLength(2);
    result.forEach(expense => {
      expect(expense.project_id).toBe(project1Id);
    });

    const expenseNames = result.map(e => e.name);
    expect(expenseNames).toContain('Project 1 Expense');
    expect(expenseNames).toContain('Another Project 1 Expense');
    expect(expenseNames).not.toContain('Project 2 Expense');
  });

  it('should handle non-existent project gracefully', async () => {
    const nonExistentProjectId = 999999;
    
    const result = await getProjectOtherExpenses(nonExistentProjectId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should verify expenses are saved correctly in database', async () => {
    // Create test project
    const project = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: null,
        start_date: new Date('2024-01-01'),
        end_date: null,
        status: 'planning'
      })
      .returning()
      .execute();

    const projectId = project[0].id;

    // Create test expense
    await db.insert(otherExpensesTable)
      .values({
        project_id: projectId,
        name: 'Test Expense',
        description: 'Testing database storage',
        price: '123.45',
        expense_date: new Date('2024-01-15')
      })
      .execute();

    // Query directly from database to verify
    const directDbQuery = await db.select()
      .from(otherExpensesTable)
      .where(eq(otherExpensesTable.project_id, projectId))
      .execute();

    expect(directDbQuery).toHaveLength(1);
    expect(directDbQuery[0].name).toBe('Test Expense');
    expect(directDbQuery[0].description).toBe('Testing database storage');
    expect(parseFloat(directDbQuery[0].price)).toBe(123.45);

    // Test handler result matches database
    const handlerResult = await getProjectOtherExpenses(projectId);
    expect(handlerResult).toHaveLength(1);
    expect(handlerResult[0].name).toBe('Test Expense');
    expect(handlerResult[0].price).toBe(123.45);
    expect(typeof handlerResult[0].price).toBe('number');
  });
});