import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, projectPhotosTable } from '../db/schema';
import { type CreateProjectInput, type CreateProjectPhotoInput } from '../schema';
import { getProjectPhotos } from '../handlers/get_project_photos';

// Test project input
const testProject: CreateProjectInput = {
  name: 'Test Project',
  description: 'A project for testing',
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-12-31'),
  status: 'planning'
};

// Test project photo inputs
const testPhoto1: CreateProjectPhotoInput = {
  project_id: 1, // Will be set after project creation
  filename: 'photo1.jpg',
  original_name: 'Original Photo 1.jpg',
  file_path: '/uploads/photo1.jpg',
  file_size: 1024000,
  mime_type: 'image/jpeg',
  description: 'First test photo',
  photo_type: 'before'
};

const testPhoto2: CreateProjectPhotoInput = {
  project_id: 1, // Will be set after project creation
  filename: 'photo2.png',
  original_name: 'Original Photo 2.png',
  file_path: '/uploads/photo2.png',
  file_size: 2048000,
  mime_type: 'image/png',
  description: null,
  photo_type: 'progress'
};

describe('getProjectPhotos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no photos exist', async () => {
    // Create a project first
    const [project] = await db.insert(projectsTable)
      .values({
        name: testProject.name,
        description: testProject.description,
        start_date: testProject.start_date,
        end_date: testProject.end_date,
        status: testProject.status
      })
      .returning()
      .execute();

    const result = await getProjectPhotos(project.id);

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all photos for a specific project', async () => {
    // Create a project first
    const [project] = await db.insert(projectsTable)
      .values({
        name: testProject.name,
        description: testProject.description,
        start_date: testProject.start_date,
        end_date: testProject.end_date,
        status: testProject.status
      })
      .returning()
      .execute();

    // Create photos for the project
    await db.insert(projectPhotosTable)
      .values([
        {
          ...testPhoto1,
          project_id: project.id
        },
        {
          ...testPhoto2,
          project_id: project.id
        }
      ])
      .execute();

    const result = await getProjectPhotos(project.id);

    expect(result).toHaveLength(2);
    
    // Check first photo
    const photo1 = result.find(p => p.filename === 'photo1.jpg');
    expect(photo1).toBeDefined();
    expect(photo1?.project_id).toEqual(project.id);
    expect(photo1?.original_name).toEqual('Original Photo 1.jpg');
    expect(photo1?.file_path).toEqual('/uploads/photo1.jpg');
    expect(photo1?.file_size).toEqual(1024000);
    expect(photo1?.mime_type).toEqual('image/jpeg');
    expect(photo1?.description).toEqual('First test photo');
    expect(photo1?.photo_type).toEqual('before');
    expect(photo1?.created_at).toBeInstanceOf(Date);

    // Check second photo
    const photo2 = result.find(p => p.filename === 'photo2.png');
    expect(photo2).toBeDefined();
    expect(photo2?.project_id).toEqual(project.id);
    expect(photo2?.original_name).toEqual('Original Photo 2.png');
    expect(photo2?.file_path).toEqual('/uploads/photo2.png');
    expect(photo2?.file_size).toEqual(2048000);
    expect(photo2?.mime_type).toEqual('image/png');
    expect(photo2?.description).toBeNull();
    expect(photo2?.photo_type).toEqual('progress');
    expect(photo2?.created_at).toBeInstanceOf(Date);
  });

  it('should only return photos for the specified project', async () => {
    // Create two projects
    const [project1] = await db.insert(projectsTable)
      .values({
        name: 'Project 1',
        description: 'First project',
        start_date: new Date('2024-01-01'),
        end_date: null,
        status: 'planning'
      })
      .returning()
      .execute();

    const [project2] = await db.insert(projectsTable)
      .values({
        name: 'Project 2',
        description: 'Second project',
        start_date: new Date('2024-02-01'),
        end_date: null,
        status: 'in_progress'
      })
      .returning()
      .execute();

    // Create photos for both projects
    await db.insert(projectPhotosTable)
      .values([
        {
          ...testPhoto1,
          project_id: project1.id,
          filename: 'project1_photo.jpg'
        },
        {
          ...testPhoto2,
          project_id: project2.id,
          filename: 'project2_photo.png'
        }
      ])
      .execute();

    // Get photos for project1 only
    const result = await getProjectPhotos(project1.id);

    expect(result).toHaveLength(1);
    expect(result[0].project_id).toEqual(project1.id);
    expect(result[0].filename).toEqual('project1_photo.jpg');
    
    // Verify it doesn't contain project2's photos
    expect(result.find(p => p.filename === 'project2_photo.png')).toBeUndefined();
  });

  it('should return photos with all photo types', async () => {
    // Create a project
    const [project] = await db.insert(projectsTable)
      .values({
        name: testProject.name,
        description: testProject.description,
        start_date: testProject.start_date,
        end_date: testProject.end_date,
        status: testProject.status
      })
      .returning()
      .execute();

    // Create photos with different types
    await db.insert(projectPhotosTable)
      .values([
        {
          project_id: project.id,
          filename: 'before.jpg',
          original_name: 'Before.jpg',
          file_path: '/uploads/before.jpg',
          file_size: 1000000,
          mime_type: 'image/jpeg',
          description: 'Before photo',
          photo_type: 'before'
        },
        {
          project_id: project.id,
          filename: 'progress.jpg',
          original_name: 'Progress.jpg',
          file_path: '/uploads/progress.jpg',
          file_size: 1500000,
          mime_type: 'image/jpeg',
          description: 'Progress photo',
          photo_type: 'progress'
        },
        {
          project_id: project.id,
          filename: 'after.jpg',
          original_name: 'After.jpg',
          file_path: '/uploads/after.jpg',
          file_size: 2000000,
          mime_type: 'image/jpeg',
          description: 'After photo',
          photo_type: 'after'
        },
        {
          project_id: project.id,
          filename: 'other.jpg',
          original_name: 'Other.jpg',
          file_path: '/uploads/other.jpg',
          file_size: 1200000,
          mime_type: 'image/jpeg',
          description: 'Other photo',
          photo_type: 'other'
        }
      ])
      .execute();

    const result = await getProjectPhotos(project.id);

    expect(result).toHaveLength(4);
    
    const photoTypes = result.map(p => p.photo_type).sort();
    expect(photoTypes).toEqual(['after', 'before', 'other', 'progress']);
    
    // Verify each type exists
    expect(result.find(p => p.photo_type === 'before')).toBeDefined();
    expect(result.find(p => p.photo_type === 'progress')).toBeDefined();
    expect(result.find(p => p.photo_type === 'after')).toBeDefined();
    expect(result.find(p => p.photo_type === 'other')).toBeDefined();
  });

  it('should return empty array for non-existent project', async () => {
    const result = await getProjectPhotos(999);

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });
});