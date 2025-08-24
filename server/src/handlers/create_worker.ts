import { db } from '../db';
import { workersTable, projectsTable } from '../db/schema';
import { type CreateWorkerInput, type Worker } from '../schema';
import { eq } from 'drizzle-orm';

export const createWorker = async (input: CreateWorkerInput): Promise<Worker> => {
  try {
    // Validate that the project exists before creating the worker
    const existingProject = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, input.project_id))
      .execute();

    if (existingProject.length === 0) {
      throw new Error(`Project with id ${input.project_id} does not exist`);
    }

    // Insert worker record
    const result = await db.insert(workersTable)
      .values({
        project_id: input.project_id,
        name: input.name,
        daily_pay_rate: input.daily_pay_rate.toString(), // Convert number to string for numeric column
        days_worked: input.days_worked, // Integer column - no conversion needed
        start_date: input.start_date,
        end_date: input.end_date
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const worker = result[0];
    return {
      ...worker,
      daily_pay_rate: parseFloat(worker.daily_pay_rate) // Convert string back to number
    };
  } catch (error) {
    console.error('Worker creation failed:', error);
    throw error;
  }
};