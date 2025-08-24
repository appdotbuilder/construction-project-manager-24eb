import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, otherExpensesTable } from '../db/schema';
import { type UpdateOtherExpenseInput } from '../schema';
import { updateOtherExpense } from '../handlers/update_other_expense';
import { eq } from 'drizzle-orm';

describe('updateOtherExpense', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test project
  const createTestProject = async () => {
    const projects = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A project for testing',
        start_date: new Date(),
        status: 'planning'
      })
      .returning()
      .execute();
    return projects[0];
  };

  // Helper function to create a test other expense
  const createTestOtherExpense = async (projectId: number) => {
    const expenses = await db.insert(otherExpensesTable)
      .values({
        project_id: projectId,
        name: 'Original Expense',
        description: 'Original description',
        price: '100.50', // Store as string for numeric column
        expense_date: new Date('2024-01-15')
      })
      .returning()
      .execute();
    return expenses[0];
  };

  it('should update expense with all fields', async () => {
    const project = await createTestProject();
    const expense = await createTestOtherExpense(project.id);

    const updateInput: UpdateOtherExpenseInput = {
      id: expense.id,
      name: 'Updated Expense',
      description: 'Updated description',
      price: 200.75,
      expense_date: new Date('2024-02-20')
    };

    const result = await updateOtherExpense(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(expense.id);
    expect(result.project_id).toEqual(project.id);
    expect(result.name).toEqual('Updated Expense');
    expect(result.description).toEqual('Updated description');
    expect(result.price).toEqual(200.75);
    expect(typeof result.price).toBe('number');
    expect(result.expense_date).toBeInstanceOf(Date);
    expect(result.expense_date?.toISOString()).toEqual(new Date('2024-02-20').toISOString());
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update expense with partial fields', async () => {
    const project = await createTestProject();
    const expense = await createTestOtherExpense(project.id);

    const updateInput: UpdateOtherExpenseInput = {
      id: expense.id,
      name: 'Partially Updated Expense',
      price: 150.25
    };

    const result = await updateOtherExpense(updateInput);

    // Verify updated fields
    expect(result.name).toEqual('Partially Updated Expense');
    expect(result.price).toEqual(150.25);
    
    // Verify unchanged fields remain the same
    expect(result.description).toEqual('Original description');
    expect(result.expense_date?.toISOString()).toEqual(new Date('2024-01-15').toISOString());
    expect(result.project_id).toEqual(project.id);
  });

  it('should update expense with nullable fields set to null', async () => {
    const project = await createTestProject();
    const expense = await createTestOtherExpense(project.id);

    const updateInput: UpdateOtherExpenseInput = {
      id: expense.id,
      description: null,
      expense_date: null
    };

    const result = await updateOtherExpense(updateInput);

    // Verify nullable fields are set to null
    expect(result.description).toBeNull();
    expect(result.expense_date).toBeNull();
    
    // Verify other fields remain unchanged
    expect(result.name).toEqual('Original Expense');
    expect(result.price).toEqual(100.50);
  });

  it('should save updated expense to database', async () => {
    const project = await createTestProject();
    const expense = await createTestOtherExpense(project.id);

    const updateInput: UpdateOtherExpenseInput = {
      id: expense.id,
      name: 'Database Test Expense',
      price: 99.99
    };

    await updateOtherExpense(updateInput);

    // Verify changes are persisted in database
    const expenses = await db.select()
      .from(otherExpensesTable)
      .where(eq(otherExpensesTable.id, expense.id))
      .execute();

    expect(expenses).toHaveLength(1);
    expect(expenses[0].name).toEqual('Database Test Expense');
    expect(parseFloat(expenses[0].price)).toEqual(99.99);
    expect(expenses[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update updated_at timestamp', async () => {
    const project = await createTestProject();
    const expense = await createTestOtherExpense(project.id);
    
    const originalUpdatedAt = expense.updated_at;
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateOtherExpenseInput = {
      id: expense.id,
      name: 'Timestamp Test Expense'
    };

    const result = await updateOtherExpense(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should handle numeric precision correctly', async () => {
    const project = await createTestProject();
    const expense = await createTestOtherExpense(project.id);

    const updateInput: UpdateOtherExpenseInput = {
      id: expense.id,
      price: 123.456 // Test decimal precision - will be rounded to 2 decimal places
    };

    const result = await updateOtherExpense(updateInput);

    // PostgreSQL numeric(10,2) rounds to 2 decimal places
    expect(result.price).toEqual(123.46);
    expect(typeof result.price).toBe('number');

    // Verify in database
    const expenses = await db.select()
      .from(otherExpensesTable)
      .where(eq(otherExpensesTable.id, expense.id))
      .execute();

    expect(parseFloat(expenses[0].price)).toEqual(123.46);
  });

  it('should throw error when expense not found', async () => {
    const updateInput: UpdateOtherExpenseInput = {
      id: 999999,
      name: 'Non-existent Expense'
    };

    await expect(updateOtherExpense(updateInput)).rejects.toThrow(/Other expense with id 999999 not found/i);
  });

  it('should preserve project_id and created_at', async () => {
    const project = await createTestProject();
    const expense = await createTestOtherExpense(project.id);
    const originalCreatedAt = expense.created_at;

    const updateInput: UpdateOtherExpenseInput = {
      id: expense.id,
      name: 'Preserve Test Expense'
    };

    const result = await updateOtherExpense(updateInput);

    expect(result.project_id).toEqual(project.id);
    expect(result.created_at.toISOString()).toEqual(originalCreatedAt.toISOString());
    expect(result.id).toEqual(expense.id);
  });
});