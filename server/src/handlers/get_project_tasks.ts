import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const getProjectTasks = async (projectId: number): Promise<Task[]> => {
  try {
    const results = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.project_id, projectId))
      .execute();

    // Convert the results to match the schema type
    return results.map(task => ({
      id: task.id,
      project_id: task.project_id,
      description: task.description,
      duration_days: task.duration_days,
      status: task.status,
      created_at: task.created_at,
      updated_at: task.updated_at
    }));
  } catch (error) {
    console.error('Failed to get project tasks:', error);
    throw error;
  }
};