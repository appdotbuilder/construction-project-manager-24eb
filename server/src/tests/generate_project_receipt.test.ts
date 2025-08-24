import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, materialsTable, workersTable, otherExpensesTable } from '../db/schema';
import { type GenerateReceiptInput } from '../schema';
import { generateProjectReceipt } from '../handlers/generate_project_receipt';

describe('generateProjectReceipt', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate a complete receipt for a project with all expense types', async () => {
    // Create a test project
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Construction Project',
        description: 'A comprehensive test project',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-03-01'),
        status: 'completed'
      })
      .returning()
      .execute();

    const project = projectResult[0];

    // Create test materials
    await db.insert(materialsTable)
      .values([
        {
          project_id: project.id,
          name: 'Concrete',
          quantity: '10.5',
          unit: 'cubic meters',
          price_per_unit: '150.00',
          purchase_date: new Date('2024-01-15')
        },
        {
          project_id: project.id,
          name: 'Steel Bars',
          quantity: '25.0',
          unit: 'pieces',
          price_per_unit: '45.50',
          purchase_date: new Date('2024-01-20')
        }
      ])
      .execute();

    // Create test workers
    await db.insert(workersTable)
      .values([
        {
          project_id: project.id,
          name: 'John Doe',
          daily_pay_rate: '200.00',
          days_worked: 15,
          start_date: new Date('2024-01-10'),
          end_date: new Date('2024-01-30')
        },
        {
          project_id: project.id,
          name: 'Jane Smith',
          daily_pay_rate: '180.00',
          days_worked: 20,
          start_date: new Date('2024-01-05'),
          end_date: new Date('2024-02-05')
        }
      ])
      .execute();

    // Create test other expenses
    await db.insert(otherExpensesTable)
      .values([
        {
          project_id: project.id,
          name: 'Equipment Rental',
          description: 'Excavator rental for 5 days',
          price: '1500.00',
          expense_date: new Date('2024-01-12')
        },
        {
          project_id: project.id,
          name: 'Transportation',
          description: 'Material delivery costs',
          price: '350.75',
          expense_date: new Date('2024-01-18')
        }
      ])
      .execute();

    const input: GenerateReceiptInput = {
      project_id: project.id
    };

    const receipt = await generateProjectReceipt(input);

    // Verify project details
    expect(receipt.project.id).toEqual(project.id);
    expect(receipt.project.name).toEqual('Test Construction Project');
    expect(receipt.project.description).toEqual('A comprehensive test project');
    expect(receipt.project.status).toEqual('completed');

    // Verify materials
    expect(receipt.materials).toHaveLength(2);
    
    const concrete = receipt.materials.find(m => m.name === 'Concrete');
    expect(concrete).toBeDefined();
    expect(concrete!.quantity).toEqual(10.5);
    expect(concrete!.price_per_unit).toEqual(150.00);
    expect(concrete!.unit).toEqual('cubic meters');

    const steel = receipt.materials.find(m => m.name === 'Steel Bars');
    expect(steel).toBeDefined();
    expect(steel!.quantity).toEqual(25.0);
    expect(steel!.price_per_unit).toEqual(45.50);

    // Verify workers
    expect(receipt.workers).toHaveLength(2);
    
    const johnDoe = receipt.workers.find(w => w.name === 'John Doe');
    expect(johnDoe).toBeDefined();
    expect(johnDoe!.daily_pay_rate).toEqual(200.00);
    expect(johnDoe!.days_worked).toEqual(15);

    const janeSmith = receipt.workers.find(w => w.name === 'Jane Smith');
    expect(janeSmith).toBeDefined();
    expect(janeSmith!.daily_pay_rate).toEqual(180.00);
    expect(janeSmith!.days_worked).toEqual(20);

    // Verify other expenses
    expect(receipt.other_expenses).toHaveLength(2);
    
    const equipment = receipt.other_expenses.find(e => e.name === 'Equipment Rental');
    expect(equipment).toBeDefined();
    expect(equipment!.price).toEqual(1500.00);
    expect(equipment!.description).toEqual('Excavator rental for 5 days');

    const transport = receipt.other_expenses.find(e => e.name === 'Transportation');
    expect(transport).toBeDefined();
    expect(transport!.price).toEqual(350.75);

    // Verify cost calculations
    const expectedMaterialsCost = (10.5 * 150.00) + (25.0 * 45.50); // 1575 + 1137.5 = 2712.5
    const expectedWorkersCost = (15 * 200.00) + (20 * 180.00); // 3000 + 3600 = 6600
    const expectedOtherExpensesCost = 1500.00 + 350.75; // 1850.75
    const expectedTotalCost = expectedMaterialsCost + expectedWorkersCost + expectedOtherExpensesCost; // 11163.25

    expect(receipt.cost_summary.materials_cost).toEqual(expectedMaterialsCost);
    expect(receipt.cost_summary.workers_cost).toEqual(expectedWorkersCost);
    expect(receipt.cost_summary.other_expenses_cost).toEqual(expectedOtherExpensesCost);
    expect(receipt.cost_summary.total_cost).toEqual(expectedTotalCost);
    expect(receipt.cost_summary.project_id).toEqual(project.id);
    expect(receipt.cost_summary.as_of_date).toBeNull();

    // Verify generated_at is recent
    expect(receipt.generated_at).toBeInstanceOf(Date);
    expect(Date.now() - receipt.generated_at.getTime()).toBeLessThan(5000); // Within 5 seconds
  });

  it('should generate receipt for project with no expenses', async () => {
    // Create a project with no materials, workers, or other expenses
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

    const project = projectResult[0];

    const input: GenerateReceiptInput = {
      project_id: project.id
    };

    const receipt = await generateProjectReceipt(input);

    // Verify project details
    expect(receipt.project.id).toEqual(project.id);
    expect(receipt.project.name).toEqual('Empty Project');
    expect(receipt.project.description).toBeNull();
    expect(receipt.project.status).toEqual('planning');

    // Verify empty arrays
    expect(receipt.materials).toHaveLength(0);
    expect(receipt.workers).toHaveLength(0);
    expect(receipt.other_expenses).toHaveLength(0);

    // Verify zero costs
    expect(receipt.cost_summary.materials_cost).toEqual(0);
    expect(receipt.cost_summary.workers_cost).toEqual(0);
    expect(receipt.cost_summary.other_expenses_cost).toEqual(0);
    expect(receipt.cost_summary.total_cost).toEqual(0);
    expect(receipt.cost_summary.project_id).toEqual(project.id);

    expect(receipt.generated_at).toBeInstanceOf(Date);
  });

  it('should handle project with only materials', async () => {
    // Create project with only materials
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Materials Only Project',
        description: 'Project with materials but no workers or other expenses',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-02-01'),
        status: 'in_progress'
      })
      .returning()
      .execute();

    const project = projectResult[0];

    await db.insert(materialsTable)
      .values({
        project_id: project.id,
        name: 'Bricks',
        quantity: '100.0',
        unit: 'pieces',
        price_per_unit: '2.50',
        purchase_date: new Date('2024-01-10')
      })
      .execute();

    const input: GenerateReceiptInput = {
      project_id: project.id
    };

    const receipt = await generateProjectReceipt(input);

    expect(receipt.materials).toHaveLength(1);
    expect(receipt.workers).toHaveLength(0);
    expect(receipt.other_expenses).toHaveLength(0);

    expect(receipt.cost_summary.materials_cost).toEqual(250.00); // 100 * 2.50
    expect(receipt.cost_summary.workers_cost).toEqual(0);
    expect(receipt.cost_summary.other_expenses_cost).toEqual(0);
    expect(receipt.cost_summary.total_cost).toEqual(250.00);
  });

  it('should handle workers with zero days worked', async () => {
    // Create project with worker who hasn't worked yet
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Workers Project',
        description: null,
        start_date: new Date('2024-01-01'),
        end_date: null,
        status: 'in_progress'
      })
      .returning()
      .execute();

    const project = projectResult[0];

    await db.insert(workersTable)
      .values({
        project_id: project.id,
        name: 'New Worker',
        daily_pay_rate: '150.00',
        days_worked: 0, // Zero days worked
        start_date: new Date('2024-01-01'),
        end_date: null
      })
      .execute();

    const input: GenerateReceiptInput = {
      project_id: project.id
    };

    const receipt = await generateProjectReceipt(input);

    expect(receipt.workers).toHaveLength(1);
    expect(receipt.workers[0].name).toEqual('New Worker');
    expect(receipt.workers[0].days_worked).toEqual(0);
    expect(receipt.workers[0].daily_pay_rate).toEqual(150.00);

    expect(receipt.cost_summary.workers_cost).toEqual(0); // 0 * 150 = 0
    expect(receipt.cost_summary.total_cost).toEqual(0);
  });

  it('should throw error for non-existent project', async () => {
    const input: GenerateReceiptInput = {
      project_id: 99999 // Non-existent project ID
    };

    expect(generateProjectReceipt(input)).rejects.toThrow(/Project with ID 99999 not found/i);
  });

  it('should verify numeric field types are correct', async () => {
    // Create minimal project setup
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

    const project = projectResult[0];

    await db.insert(materialsTable)
      .values({
        project_id: project.id,
        name: 'Test Material',
        quantity: '5.25',
        unit: 'kg',
        price_per_unit: '12.75',
        purchase_date: null
      })
      .execute();

    await db.insert(workersTable)
      .values({
        project_id: project.id,
        name: 'Test Worker',
        daily_pay_rate: '175.50',
        days_worked: 3,
        start_date: null,
        end_date: null
      })
      .execute();

    await db.insert(otherExpensesTable)
      .values({
        project_id: project.id,
        name: 'Test Expense',
        description: null,
        price: '99.99',
        expense_date: null
      })
      .execute();

    const input: GenerateReceiptInput = {
      project_id: project.id
    };

    const receipt = await generateProjectReceipt(input);

    // Verify all numeric fields are actual numbers, not strings
    expect(typeof receipt.materials[0].quantity).toEqual('number');
    expect(typeof receipt.materials[0].price_per_unit).toEqual('number');
    expect(typeof receipt.workers[0].daily_pay_rate).toEqual('number');
    expect(typeof receipt.other_expenses[0].price).toEqual('number');

    expect(typeof receipt.cost_summary.materials_cost).toEqual('number');
    expect(typeof receipt.cost_summary.workers_cost).toEqual('number');
    expect(typeof receipt.cost_summary.other_expenses_cost).toEqual('number');
    expect(typeof receipt.cost_summary.total_cost).toEqual('number');

    // Verify calculations are correct
    expect(receipt.cost_summary.materials_cost).toEqual(5.25 * 12.75); // 66.9375
    expect(receipt.cost_summary.workers_cost).toEqual(3 * 175.50); // 526.5
    expect(receipt.cost_summary.other_expenses_cost).toEqual(99.99);
    expect(receipt.cost_summary.total_cost).toEqual(66.9375 + 526.5 + 99.99); // 693.4275
  });
});