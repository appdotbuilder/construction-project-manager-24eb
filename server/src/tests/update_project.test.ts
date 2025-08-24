import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type UpdateProjectInput } from '../schema';
import { updateProject } from '../handlers/update_project';
import { eq } from 'drizzle-orm';

describe('updateProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testProjectId: number;

  beforeEach(async () => {
    // Create a test project for each test
    const result = await db.insert(projectsTable)
      .values({
        name: 'Original Project',
        description: 'Original description',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        status: 'planning'
      })
      .returning()
      .execute();
    
    testProjectId = result[0].id;
  });

  it('should update all project fields', async () => {
    const updateInput: UpdateProjectInput = {
      id: testProjectId,
      name: 'Updated Project Name',
      description: 'Updated description',
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-11-30'),
      status: 'in_progress'
    };

    const result = await updateProject(updateInput);

    expect(result.id).toEqual(testProjectId);
    expect(result.name).toEqual('Updated Project Name');
    expect(result.description).toEqual('Updated description');
    expect(result.start_date).toEqual(new Date('2024-02-01'));
    expect(result.end_date).toEqual(new Date('2024-11-30'));
    expect(result.status).toEqual('in_progress');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const updateInput: UpdateProjectInput = {
      id: testProjectId,
      name: 'Partially Updated Name',
      status: 'completed'
    };

    const result = await updateProject(updateInput);

    expect(result.name).toEqual('Partially Updated Name');
    expect(result.status).toEqual('completed');
    // Original values should remain unchanged
    expect(result.description).toEqual('Original description');
    expect(result.start_date).toEqual(new Date('2024-01-01'));
    expect(result.end_date).toEqual(new Date('2024-12-31'));
  });

  it('should handle nullable fields correctly', async () => {
    const updateInput: UpdateProjectInput = {
      id: testProjectId,
      description: null,
      end_date: null
    };

    const result = await updateProject(updateInput);

    expect(result.description).toBeNull();
    expect(result.end_date).toBeNull();
    // Other fields should remain unchanged
    expect(result.name).toEqual('Original Project');
    expect(result.status).toEqual('planning');
  });

  it('should update the updated_at timestamp', async () => {
    // Get original updated_at
    const originalProject = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, testProjectId))
      .execute();

    const originalUpdatedAt = originalProject[0].updated_at;

    // Small delay to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateProjectInput = {
      id: testProjectId,
      name: 'Name with new timestamp'
    };

    const result = await updateProject(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should persist changes to database', async () => {
    const updateInput: UpdateProjectInput = {
      id: testProjectId,
      name: 'Database Persisted Name',
      status: 'on_hold'
    };

    await updateProject(updateInput);

    // Verify changes were persisted
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, testProjectId))
      .execute();

    expect(projects).toHaveLength(1);
    expect(projects[0].name).toEqual('Database Persisted Name');
    expect(projects[0].status).toEqual('on_hold');
  });

  it('should throw error when project does not exist', async () => {
    const updateInput: UpdateProjectInput = {
      id: 99999, // Non-existent ID
      name: 'This should fail'
    };

    await expect(updateProject(updateInput)).rejects.toThrow(/Project with id 99999 not found/);
  });

  it('should handle all valid status values', async () => {
    const statuses = ['planning', 'in_progress', 'completed', 'on_hold'] as const;

    for (const status of statuses) {
      const updateInput: UpdateProjectInput = {
        id: testProjectId,
        status: status
      };

      const result = await updateProject(updateInput);
      expect(result.status).toEqual(status);
    }
  });

  it('should handle date edge cases', async () => {
    const updateInput: UpdateProjectInput = {
      id: testProjectId,
      start_date: new Date('2024-06-15T14:30:00Z'),
      end_date: new Date('2024-12-25T23:59:59Z')
    };

    const result = await updateProject(updateInput);

    expect(result.start_date).toEqual(new Date('2024-06-15T14:30:00Z'));
    expect(result.end_date).toEqual(new Date('2024-12-25T23:59:59Z'));
  });
});