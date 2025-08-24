import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type CreateProjectInput } from '../schema';
import { getProjects } from '../handlers/get_projects';

// Test project inputs
const testProject1: CreateProjectInput = {
  name: 'Kitchen Renovation',
  description: 'Complete kitchen renovation project',
  start_date: new Date('2024-01-15'),
  end_date: new Date('2024-03-15'),
  status: 'in_progress'
};

const testProject2: CreateProjectInput = {
  name: 'Bathroom Remodel',
  description: 'Master bathroom remodeling',
  start_date: new Date('2024-02-01'),
  end_date: null,
  status: 'planning'
};

const testProject3: CreateProjectInput = {
  name: 'Deck Construction',
  description: null,
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-01-30'),
  status: 'completed'
};

describe('getProjects', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no projects exist', async () => {
    const result = await getProjects();
    expect(result).toEqual([]);
  });

  it('should return all projects from database', async () => {
    // Create test projects
    await db.insert(projectsTable)
      .values([
        {
          name: testProject1.name,
          description: testProject1.description,
          start_date: testProject1.start_date,
          end_date: testProject1.end_date,
          status: testProject1.status
        },
        {
          name: testProject2.name,
          description: testProject2.description,
          start_date: testProject2.start_date,
          end_date: testProject2.end_date,
          status: testProject2.status
        },
        {
          name: testProject3.name,
          description: testProject3.description,
          start_date: testProject3.start_date,
          end_date: testProject3.end_date,
          status: testProject3.status
        }
      ])
      .execute();

    const result = await getProjects();

    expect(result).toHaveLength(3);
    
    // Verify all projects are returned
    const projectNames = result.map(p => p.name).sort();
    expect(projectNames).toEqual(['Bathroom Remodel', 'Deck Construction', 'Kitchen Renovation']);
  });

  it('should return projects with all required fields', async () => {
    // Create single test project
    await db.insert(projectsTable)
      .values({
        name: testProject1.name,
        description: testProject1.description,
        start_date: testProject1.start_date,
        end_date: testProject1.end_date,
        status: testProject1.status
      })
      .execute();

    const result = await getProjects();

    expect(result).toHaveLength(1);
    const project = result[0];

    // Verify all fields are present
    expect(project.id).toBeDefined();
    expect(typeof project.id).toBe('number');
    expect(project.name).toEqual('Kitchen Renovation');
    expect(project.description).toEqual('Complete kitchen renovation project');
    expect(project.start_date).toBeInstanceOf(Date);
    expect(project.end_date).toBeInstanceOf(Date);
    expect(project.status).toEqual('in_progress');
    expect(project.created_at).toBeInstanceOf(Date);
    expect(project.updated_at).toBeInstanceOf(Date);
  });

  it('should handle projects with nullable fields correctly', async () => {
    // Create project with null description and end_date
    await db.insert(projectsTable)
      .values({
        name: testProject3.name,
        description: testProject3.description,
        start_date: testProject3.start_date,
        end_date: testProject3.end_date,
        status: testProject3.status
      })
      .execute();

    const result = await getProjects();

    expect(result).toHaveLength(1);
    const project = result[0];

    expect(project.name).toEqual('Deck Construction');
    expect(project.description).toBeNull();
    expect(project.start_date).toBeInstanceOf(Date);
    expect(project.end_date).toBeInstanceOf(Date);
    expect(project.status).toEqual('completed');
  });

  it('should return projects with different statuses', async () => {
    // Create projects with all possible statuses
    const projectsData = [
      { ...testProject1, status: 'planning' as const },
      { ...testProject2, status: 'in_progress' as const },
      { ...testProject3, status: 'completed' as const },
      { 
        name: 'On Hold Project', 
        description: 'Temporarily paused project',
        start_date: new Date('2024-01-10'),
        end_date: null,
        status: 'on_hold' as const
      }
    ];

    await db.insert(projectsTable)
      .values(projectsData)
      .execute();

    const result = await getProjects();

    expect(result).toHaveLength(4);
    
    const statuses = result.map(p => p.status).sort();
    expect(statuses).toEqual(['completed', 'in_progress', 'on_hold', 'planning']);
  });

  it('should maintain chronological order of creation', async () => {
    // Create projects at different times by inserting sequentially
    await db.insert(projectsTable)
      .values({
        name: 'First Project',
        description: 'Created first',
        start_date: new Date('2024-01-01'),
        end_date: null,
        status: 'planning'
      })
      .execute();

    await db.insert(projectsTable)
      .values({
        name: 'Second Project',
        description: 'Created second',
        start_date: new Date('2024-01-02'),
        end_date: null,
        status: 'planning'
      })
      .execute();

    const result = await getProjects();

    expect(result).toHaveLength(2);
    
    // Verify that projects maintain their insertion order
    expect(result[0].name).toEqual('First Project');
    expect(result[1].name).toEqual('Second Project');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});