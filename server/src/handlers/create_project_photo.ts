import { db } from '../db';
import { projectPhotosTable, projectsTable } from '../db/schema';
import { type CreateProjectPhotoInput, type ProjectPhoto } from '../schema';
import { eq } from 'drizzle-orm';

export const createProjectPhoto = async (input: CreateProjectPhotoInput): Promise<ProjectPhoto> => {
  try {
    // Validate that the project exists
    const existingProject = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, input.project_id))
      .execute();

    if (existingProject.length === 0) {
      throw new Error(`Project with id ${input.project_id} not found`);
    }

    // Insert project photo record
    const result = await db.insert(projectPhotosTable)
      .values({
        project_id: input.project_id,
        filename: input.filename,
        original_name: input.original_name,
        file_path: input.file_path,
        file_size: input.file_size,
        mime_type: input.mime_type,
        description: input.description,
        photo_type: input.photo_type
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Project photo creation failed:', error);
    throw error;
  }
};