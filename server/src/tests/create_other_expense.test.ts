import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { otherExpensesTable, projectsTable } from '../db/schema';
import { type CreateOtherExpenseInput } from '../schema';
import { createOtherExpense } from '../handlers/create_other_expense';
import { eq } from 'drizzle-orm';

describe('createOtherExpense', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test project
  const createTestProject = async () => {
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A project for testing',
        start_date: new Date(),
        status: 'planning'
      })
      .returning()
      .execute();
    return projectResult[0];
  };

  it('should create an other expense with all fields', async () => {
    const project = await createTestProject();
    
    const testInput: CreateOtherExpenseInput = {
      project_id: project.id,
      name: 'Transportation Costs',
      description: 'Fuel and vehicle expenses',
      price: 150.75,
      expense_date: new Date('2024-01-15')
    };

    const result = await createOtherExpense(testInput);

    // Basic field validation
    expect(result.name).toEqual('Transportation Costs');
    expect(result.description).toEqual('Fuel and vehicle expenses');
    expect(result.price).toEqual(150.75);
    expect(typeof result.price).toBe('number');
    expect(result.expense_date).toEqual(new Date('2024-01-15'));
    expect(result.project_id).toEqual(project.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an other expense with minimal fields', async () => {
    const project = await createTestProject();
    
    const testInput: CreateOtherExpenseInput = {
      project_id: project.id,
      name: 'Permits',
      description: null,
      price: 50.00,
      expense_date: null
    };

    const result = await createOtherExpense(testInput);

    expect(result.name).toEqual('Permits');
    expect(result.description).toBeNull();
    expect(result.price).toEqual(50.00);
    expect(result.expense_date).toBeNull();
    expect(result.project_id).toEqual(project.id);
    expect(result.id).toBeDefined();
  });

  it('should save other expense to database', async () => {
    const project = await createTestProject();
    
    const testInput: CreateOtherExpenseInput = {
      project_id: project.id,
      name: 'Equipment Rental',
      description: 'Crane rental for 3 days',
      price: 450.00,
      expense_date: new Date('2024-01-10')
    };

    const result = await createOtherExpense(testInput);

    // Query using proper drizzle syntax
    const expenses = await db.select()
      .from(otherExpensesTable)
      .where(eq(otherExpensesTable.id, result.id))
      .execute();

    expect(expenses).toHaveLength(1);
    expect(expenses[0].name).toEqual('Equipment Rental');
    expect(expenses[0].description).toEqual('Crane rental for 3 days');
    expect(parseFloat(expenses[0].price)).toEqual(450.00);
    expect(expenses[0].project_id).toEqual(project.id);
    expect(expenses[0].created_at).toBeInstanceOf(Date);
    expect(expenses[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when project does not exist', async () => {
    const testInput: CreateOtherExpenseInput = {
      project_id: 99999, // Non-existent project ID
      name: 'Invalid Expense',
      description: 'This should fail',
      price: 100.00,
      expense_date: null
    };

    await expect(createOtherExpense(testInput)).rejects.toThrow(/project with id 99999 does not exist/i);
  });

  it('should handle decimal precision correctly', async () => {
    const project = await createTestProject();
    
    const testInput: CreateOtherExpenseInput = {
      project_id: project.id,
      name: 'Small Tools',
      description: null,
      price: 25.99,
      expense_date: null
    };

    const result = await createOtherExpense(testInput);

    expect(result.price).toEqual(25.99);
    expect(typeof result.price).toBe('number');

    // Verify in database
    const expenses = await db.select()
      .from(otherExpensesTable)
      .where(eq(otherExpensesTable.id, result.id))
      .execute();

    expect(parseFloat(expenses[0].price)).toEqual(25.99);
  });

  it('should handle large price values', async () => {
    const project = await createTestProject();
    
    const testInput: CreateOtherExpenseInput = {
      project_id: project.id,
      name: 'Major Equipment Purchase',
      description: 'Excavator purchase',
      price: 75000.00,
      expense_date: new Date()
    };

    const result = await createOtherExpense(testInput);

    expect(result.price).toEqual(75000.00);
    expect(typeof result.price).toBe('number');

    // Verify in database
    const expenses = await db.select()
      .from(otherExpensesTable)
      .where(eq(otherExpensesTable.id, result.id))
      .execute();

    expect(parseFloat(expenses[0].price)).toEqual(75000.00);
  });
});