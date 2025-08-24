import { db } from '../db';
import { otherExpensesTable } from '../db/schema';
import { type OtherExpense } from '../schema';
import { eq } from 'drizzle-orm';

export const getProjectOtherExpenses = async (projectId: number): Promise<OtherExpense[]> => {
  try {
    // Fetch other expenses for the specific project
    const results = await db.select()
      .from(otherExpensesTable)
      .where(eq(otherExpensesTable.project_id, projectId))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(expense => ({
      ...expense,
      price: parseFloat(expense.price) // Convert string to number
    }));
  } catch (error) {
    console.error('Get project other expenses failed:', error);
    throw error;
  }
};