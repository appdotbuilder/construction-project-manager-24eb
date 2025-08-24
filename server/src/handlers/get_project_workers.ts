import { db } from '../db';
import { workersTable } from '../db/schema';
import { type Worker } from '../schema';
import { eq } from 'drizzle-orm';

export const getProjectWorkers = async (projectId: number): Promise<Worker[]> => {
  try {
    const results = await db.select()
      .from(workersTable)
      .where(eq(workersTable.project_id, projectId))
      .execute();

    // Convert numeric fields back to numbers for the Worker type
    return results.map(worker => ({
      ...worker,
      daily_pay_rate: parseFloat(worker.daily_pay_rate),
    }));
  } catch (error) {
    console.error('Get project workers failed:', error);
    throw error;
  }
};