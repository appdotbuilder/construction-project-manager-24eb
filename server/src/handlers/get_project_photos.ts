import { db } from '../db';
import { projectPhotosTable } from '../db/schema';
import { type ProjectPhoto } from '../schema';
import { eq } from 'drizzle-orm';

export const getProjectPhotos = async (projectId: number): Promise<ProjectPhoto[]> => {
  try {
    const results = await db.select()
      .from(projectPhotosTable)
      .where(eq(projectPhotosTable.project_id, projectId))
      .execute();

    return results;
  } catch (error) {
    console.error('Get project photos failed:', error);
    throw error;
  }
};