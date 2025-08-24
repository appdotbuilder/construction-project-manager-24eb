import { db } from '../db';
import { otherExpensesTable } from '../db/schema';
import { type UpdateOtherExpenseInput, type OtherExpense } from '../schema';
import { eq } from 'drizzle-orm';

export const updateOtherExpense = async (input: UpdateOtherExpenseInput): Promise<OtherExpense> => {
  try {
    // First check if the expense exists
    const existing = await db.select()
      .from(otherExpensesTable)
      .where(eq(otherExpensesTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      throw new Error(`Other expense with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.price !== undefined) {
      updateData.price = input.price.toString(); // Convert number to string for numeric column
    }
    
    if (input.expense_date !== undefined) {
      updateData.expense_date = input.expense_date;
    }

    // Update the expense record
    const result = await db.update(otherExpensesTable)
      .set(updateData)
      .where(eq(otherExpensesTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const expense = result[0];
    return {
      ...expense,
      price: parseFloat(expense.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Other expense update failed:', error);
    throw error;
  }
};