import { db } from '../db';
import { tasksTable, projectsTable } from '../db/schema';
import { type CreateTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  try {
    // Validate that the project exists first
    const existingProject = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, input.project_id))
      .limit(1)
      .execute();

    if (existingProject.length === 0) {
      throw new Error(`Project with ID ${input.project_id} not found`);
    }

    // Insert task record
    const result = await db.insert(tasksTable)
      .values({
        project_id: input.project_id,
        description: input.description,
        duration_days: input.duration_days,
        status: input.status // Zod has already applied the default 'pending'
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
};