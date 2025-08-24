import { db } from '../db';
import { otherExpensesTable, projectsTable } from '../db/schema';
import { type CreateOtherExpenseInput, type OtherExpense } from '../schema';
import { eq } from 'drizzle-orm';

export const createOtherExpense = async (input: CreateOtherExpenseInput): Promise<OtherExpense> => {
  try {
    // Validate that the project exists before creating the expense entry
    const project = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, input.project_id))
      .limit(1)
      .execute();

    if (project.length === 0) {
      throw new Error(`Project with ID ${input.project_id} does not exist`);
    }

    // Insert other expense record
    const result = await db.insert(otherExpensesTable)
      .values({
        project_id: input.project_id,
        name: input.name,
        description: input.description,
        price: input.price.toString(), // Convert number to string for numeric column
        expense_date: input.expense_date
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const otherExpense = result[0];
    return {
      ...otherExpense,
      price: parseFloat(otherExpense.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Other expense creation failed:', error);
    throw error;
  }
};