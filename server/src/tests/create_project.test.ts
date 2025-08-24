import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type CreateProjectInput } from '../schema';
import { createProject } from '../handlers/create_project';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateProjectInput = {
  name: 'Test Construction Project',
  description: 'A project for testing construction management',
  start_date: new Date('2024-01-15'),
  end_date: new Date('2024-06-15'),
  status: 'planning'
};

// Test input with minimal required fields (using defaults)
const minimalInput: CreateProjectInput = {
  name: 'Minimal Project',
  description: null,
  start_date: new Date('2024-02-01'),
  end_date: null,
  status: 'planning' // This will use the default from Zod
};

describe('createProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a project with all fields', async () => {
    const result = await createProject(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Construction Project');
    expect(result.description).toEqual('A project for testing construction management');
    expect(result.start_date).toEqual(new Date('2024-01-15'));
    expect(result.end_date).toEqual(new Date('2024-06-15'));
    expect(result.status).toEqual('planning');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a project with minimal fields', async () => {
    const result = await createProject(minimalInput);

    expect(result.name).toEqual('Minimal Project');
    expect(result.description).toBeNull();
    expect(result.start_date).toEqual(new Date('2024-02-01'));
    expect(result.end_date).toBeNull();
    expect(result.status).toEqual('planning');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save project to database', async () => {
    const result = await createProject(testInput);

    // Query the database to verify the project was saved
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(projects).toHaveLength(1);
    const savedProject = projects[0];
    expect(savedProject.name).toEqual('Test Construction Project');
    expect(savedProject.description).toEqual('A project for testing construction management');
    expect(savedProject.start_date).toEqual(new Date('2024-01-15'));
    expect(savedProject.end_date).toEqual(new Date('2024-06-15'));
    expect(savedProject.status).toEqual('planning');
    expect(savedProject.created_at).toBeInstanceOf(Date);
    expect(savedProject.updated_at).toBeInstanceOf(Date);
  });

  it('should create projects with different statuses', async () => {
    const statuses = ['planning', 'in_progress', 'completed', 'on_hold'] as const;

    for (const status of statuses) {
      const input: CreateProjectInput = {
        ...testInput,
        name: `Project ${status}`,
        status
      };

      const result = await createProject(input);
      expect(result.status).toEqual(status);
      expect(result.name).toEqual(`Project ${status}`);
    }
  });

  it('should handle projects with different date configurations', async () => {
    // Project with both start and end dates
    const projectWithBothDates = await createProject({
      name: 'Project with both dates',
      description: null,
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      status: 'planning'
    });

    expect(projectWithBothDates.start_date).toEqual(new Date('2024-01-01'));
    expect(projectWithBothDates.end_date).toEqual(new Date('2024-12-31'));

    // Project with only start date
    const projectWithStartOnly = await createProject({
      name: 'Project with start only',
      description: null,
      start_date: new Date('2024-06-01'),
      end_date: null,
      status: 'planning'
    });

    expect(projectWithStartOnly.start_date).toEqual(new Date('2024-06-01'));
    expect(projectWithStartOnly.end_date).toBeNull();
  });

  it('should auto-generate timestamps', async () => {
    const beforeCreation = new Date();
    const result = await createProject(testInput);
    const afterCreation = new Date();

    // Verify timestamps are within reasonable bounds
    expect(result.created_at).toBeTruthy();
    expect(result.updated_at).toBeTruthy();
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it('should create multiple projects independently', async () => {
    const project1 = await createProject({
      name: 'First Project',
      description: 'First test project',
      start_date: new Date('2024-01-01'),
      end_date: null,
      status: 'planning'
    });

    const project2 = await createProject({
      name: 'Second Project',
      description: 'Second test project',
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-08-01'),
      status: 'in_progress'
    });

    // Verify both projects exist and have different IDs
    expect(project1.id).not.toEqual(project2.id);
    expect(project1.name).toEqual('First Project');
    expect(project2.name).toEqual('Second Project');
    expect(project1.status).toEqual('planning');
    expect(project2.status).toEqual('in_progress');

    // Verify both are in database
    const allProjects = await db.select().from(projectsTable).execute();
    expect(allProjects).toHaveLength(2);
  });
});