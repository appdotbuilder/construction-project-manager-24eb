import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type Project } from '../schema';
import { eq } from 'drizzle-orm';

export const getProjectById = async (id: number): Promise<Project | null> => {
  try {
    const results = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const project = results[0];
    return {
      ...project,
      // No numeric conversions needed - all fields are already in correct types
    };
  } catch (error) {
    console.error('Failed to get project by id:', error);
    throw error;
  }
};