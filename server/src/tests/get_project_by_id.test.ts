import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type CreateProjectInput } from '../schema';
import { getProjectById } from '../handlers/get_project_by_id';

// Test project data
const testProjectInput: CreateProjectInput = {
  name: 'Test Construction Project',
  description: 'A test project for getting by ID',
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-06-30'),
  status: 'in_progress'
};

describe('getProjectById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return project when found', async () => {
    // Create test project
    const insertResult = await db.insert(projectsTable)
      .values({
        name: testProjectInput.name,
        description: testProjectInput.description,
        start_date: testProjectInput.start_date,
        end_date: testProjectInput.end_date,
        status: testProjectInput.status
      })
      .returning()
      .execute();

    const createdProject = insertResult[0];
    
    // Test the handler
    const result = await getProjectById(createdProject.id);

    // Verify project is returned correctly
    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdProject.id);
    expect(result!.name).toEqual('Test Construction Project');
    expect(result!.description).toEqual('A test project for getting by ID');
    expect(result!.start_date).toBeInstanceOf(Date);
    expect(result!.end_date).toBeInstanceOf(Date);
    expect(result!.status).toEqual('in_progress');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when project not found', async () => {
    const result = await getProjectById(9999);
    
    expect(result).toBeNull();
  });

  it('should return project with null fields correctly', async () => {
    // Create project with null description and end_date
    const insertResult = await db.insert(projectsTable)
      .values({
        name: 'Project with nulls',
        description: null,
        start_date: new Date('2024-01-01'),
        end_date: null,
        status: 'planning'
      })
      .returning()
      .execute();

    const createdProject = insertResult[0];
    
    const result = await getProjectById(createdProject.id);

    // Verify null fields are handled correctly
    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdProject.id);
    expect(result!.name).toEqual('Project with nulls');
    expect(result!.description).toBeNull();
    expect(result!.start_date).toBeInstanceOf(Date);
    expect(result!.end_date).toBeNull();
    expect(result!.status).toEqual('planning');
  });

  it('should handle different project statuses correctly', async () => {
    const statuses = ['planning', 'in_progress', 'completed', 'on_hold'] as const;
    
    for (const status of statuses) {
      const insertResult = await db.insert(projectsTable)
        .values({
          name: `Project ${status}`,
          description: `Test project with ${status} status`,
          start_date: new Date('2024-01-01'),
          end_date: new Date('2024-12-31'),
          status: status
        })
        .returning()
        .execute();

      const createdProject = insertResult[0];
      const result = await getProjectById(createdProject.id);

      expect(result).toBeDefined();
      expect(result!.status).toEqual(status);
      expect(result!.name).toEqual(`Project ${status}`);
    }
  });

  it('should return most recently created project when multiple exist', async () => {
    // Create multiple projects
    const firstProject = await db.insert(projectsTable)
      .values({
        name: 'First Project',
        description: 'First test project',
        start_date: new Date('2024-01-01'),
        end_date: null,
        status: 'planning'
      })
      .returning()
      .execute();

    const secondProject = await db.insert(projectsTable)
      .values({
        name: 'Second Project', 
        description: 'Second test project',
        start_date: new Date('2024-02-01'),
        end_date: null,
        status: 'in_progress'
      })
      .returning()
      .execute();

    // Test getting each project by their specific IDs
    const result1 = await getProjectById(firstProject[0].id);
    const result2 = await getProjectById(secondProject[0].id);

    expect(result1).toBeDefined();
    expect(result1!.name).toEqual('First Project');
    expect(result1!.id).toEqual(firstProject[0].id);

    expect(result2).toBeDefined();
    expect(result2!.name).toEqual('Second Project');
    expect(result2!.id).toEqual(secondProject[0].id);
  });
});