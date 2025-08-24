import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, projectPhotosTable } from '../db/schema';
import { type CreateProjectPhotoInput, createProjectPhotoInputSchema } from '../schema';
import { createProjectPhoto } from '../handlers/create_project_photo';
import { eq } from 'drizzle-orm';

// Create a test project first to satisfy foreign key constraint
const createTestProject = async () => {
  const result = await db.insert(projectsTable)
    .values({
      name: 'Test Project',
      description: 'A project for photo testing',
      start_date: new Date(),
      status: 'planning'
    })
    .returning()
    .execute();
  return result[0];
};

const testPhotoInput: CreateProjectPhotoInput = {
  project_id: 1, // Will be updated with actual project ID
  filename: 'test-photo.jpg',
  original_name: 'Original Test Photo.jpg',
  file_path: '/uploads/photos/test-photo.jpg',
  file_size: 1024000,
  mime_type: 'image/jpeg',
  description: 'A test photo for the project',
  photo_type: 'progress'
};

describe('createProjectPhoto', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a project photo', async () => {
    // Create prerequisite project
    const project = await createTestProject();
    const input = { ...testPhotoInput, project_id: project.id };

    const result = await createProjectPhoto(input);

    // Basic field validation
    expect(result.project_id).toEqual(project.id);
    expect(result.filename).toEqual('test-photo.jpg');
    expect(result.original_name).toEqual('Original Test Photo.jpg');
    expect(result.file_path).toEqual('/uploads/photos/test-photo.jpg');
    expect(result.file_size).toEqual(1024000);
    expect(result.mime_type).toEqual('image/jpeg');
    expect(result.description).toEqual('A test photo for the project');
    expect(result.photo_type).toEqual('progress');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save project photo to database', async () => {
    // Create prerequisite project
    const project = await createTestProject();
    const input = { ...testPhotoInput, project_id: project.id };

    const result = await createProjectPhoto(input);

    // Query database to verify persistence
    const photos = await db.select()
      .from(projectPhotosTable)
      .where(eq(projectPhotosTable.id, result.id))
      .execute();

    expect(photos).toHaveLength(1);
    expect(photos[0].project_id).toEqual(project.id);
    expect(photos[0].filename).toEqual('test-photo.jpg');
    expect(photos[0].original_name).toEqual('Original Test Photo.jpg');
    expect(photos[0].file_path).toEqual('/uploads/photos/test-photo.jpg');
    expect(photos[0].file_size).toEqual(1024000);
    expect(photos[0].mime_type).toEqual('image/jpeg');
    expect(photos[0].description).toEqual('A test photo for the project');
    expect(photos[0].photo_type).toEqual('progress');
    expect(photos[0].created_at).toBeInstanceOf(Date);
  });

  it('should create project photo with nullable description', async () => {
    // Create prerequisite project
    const project = await createTestProject();
    const input = {
      ...testPhotoInput,
      project_id: project.id,
      description: null
    };

    const result = await createProjectPhoto(input);

    expect(result.description).toBeNull();
    expect(result.project_id).toEqual(project.id);
    expect(result.filename).toEqual('test-photo.jpg');
  });

  it('should use default photo_type when not specified via Zod parsing', async () => {
    // Create prerequisite project
    const project = await createTestProject();
    
    // Raw input without photo_type to test Zod default
    const rawInput = {
      project_id: project.id,
      filename: 'default-photo.jpg',
      original_name: 'Default Photo.jpg',
      file_path: '/uploads/photos/default-photo.jpg',
      file_size: 512000,
      mime_type: 'image/jpeg',
      description: null
    };

    // Parse with Zod schema to apply defaults
    const parsedInput = createProjectPhotoInputSchema.parse(rawInput);
    
    const result = await createProjectPhoto(parsedInput);

    // Should use Zod default value 'other'
    expect(result.photo_type).toEqual('other');
  });

  it('should handle different photo types correctly', async () => {
    // Create prerequisite project
    const project = await createTestProject();
    
    const photoTypes = ['before', 'progress', 'after', 'other'] as const;
    
    for (const photoType of photoTypes) {
      const input = {
        ...testPhotoInput,
        project_id: project.id,
        filename: `${photoType}-photo.jpg`,
        photo_type: photoType
      };

      const result = await createProjectPhoto(input);
      expect(result.photo_type).toEqual(photoType);
    }
  });

  it('should throw error when project does not exist', async () => {
    const input = {
      ...testPhotoInput,
      project_id: 999 // Non-existent project ID
    };

    await expect(createProjectPhoto(input)).rejects.toThrow(/Project with id 999 not found/i);
  });

  it('should handle large file sizes correctly', async () => {
    // Create prerequisite project
    const project = await createTestProject();
    const input = {
      ...testPhotoInput,
      project_id: project.id,
      file_size: 10485760 // 10MB
    };

    const result = await createProjectPhoto(input);

    expect(result.file_size).toEqual(10485760);
    expect(typeof result.file_size).toEqual('number');
  });

  it('should handle various mime types', async () => {
    // Create prerequisite project
    const project = await createTestProject();
    
    const mimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    for (const mimeType of mimeTypes) {
      const input = {
        ...testPhotoInput,
        project_id: project.id,
        filename: `photo.${mimeType.split('/')[1]}`,
        mime_type: mimeType
      };

      const result = await createProjectPhoto(input);
      expect(result.mime_type).toEqual(mimeType);
    }
  });
});