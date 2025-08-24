import { db } from '../db';
import { workersTable } from '../db/schema';
import { type UpdateWorkerInput, type Worker } from '../schema';
import { eq, sql } from 'drizzle-orm';

export const updateWorker = async (input: UpdateWorkerInput): Promise<Worker> => {
  try {
    // Check if worker exists first
    const existingWorker = await db.select()
      .from(workersTable)
      .where(eq(workersTable.id, input.id))
      .execute();

    if (existingWorker.length === 0) {
      throw new Error(`Worker with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: sql`now()` // Always update the timestamp
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.daily_pay_rate !== undefined) {
      updateData.daily_pay_rate = input.daily_pay_rate.toString();
    }
    if (input.days_worked !== undefined) {
      updateData.days_worked = input.days_worked;
    }
    if (input.start_date !== undefined) {
      updateData.start_date = input.start_date;
    }
    if (input.end_date !== undefined) {
      updateData.end_date = input.end_date;
    }

    // Update worker record
    const result = await db.update(workersTable)
      .set(updateData)
      .where(eq(workersTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const worker = result[0];
    return {
      ...worker,
      daily_pay_rate: parseFloat(worker.daily_pay_rate)
    };
  } catch (error) {
    console.error('Worker update failed:', error);
    throw error;
  }
};