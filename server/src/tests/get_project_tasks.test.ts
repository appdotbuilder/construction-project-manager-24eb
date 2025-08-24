import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, tasksTable } from '../db/schema';
import { getProjectTasks } from '../handlers/get_project_tasks';

describe('getProjectTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when project has no tasks', async () => {
    // Create a project first
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Empty Project',
        description: 'A project with no tasks',
        start_date: new Date(),
        status: 'planning'
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;
    
    const result = await getProjectTasks(projectId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return tasks for a specific project', async () => {
    // Create a project first
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A project for testing',
        start_date: new Date(),
        status: 'in_progress'
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    // Create tasks for this project
    await db.insert(tasksTable)
      .values([
        {
          project_id: projectId,
          description: 'First task',
          duration_days: 5,
          status: 'pending'
        },
        {
          project_id: projectId,
          description: 'Second task',
          duration_days: 3,
          status: 'in_progress'
        },
        {
          project_id: projectId,
          description: 'Third task',
          duration_days: 7,
          status: 'completed'
        }
      ])
      .execute();

    const result = await getProjectTasks(projectId);

    expect(result).toHaveLength(3);
    expect(result[0].project_id).toEqual(projectId);
    expect(result[0].description).toEqual('First task');
    expect(result[0].duration_days).toEqual(5);
    expect(result[0].status).toEqual('pending');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].description).toEqual('Second task');
    expect(result[1].duration_days).toEqual(3);
    expect(result[1].status).toEqual('in_progress');

    expect(result[2].description).toEqual('Third task');
    expect(result[2].duration_days).toEqual(7);
    expect(result[2].status).toEqual('completed');
  });

  it('should only return tasks for the specified project', async () => {
    // Create two projects
    const project1Result = await db.insert(projectsTable)
      .values({
        name: 'Project 1',
        description: 'First project',
        start_date: new Date(),
        status: 'planning'
      })
      .returning()
      .execute();

    const project2Result = await db.insert(projectsTable)
      .values({
        name: 'Project 2',
        description: 'Second project',
        start_date: new Date(),
        status: 'in_progress'
      })
      .returning()
      .execute();

    const project1Id = project1Result[0].id;
    const project2Id = project2Result[0].id;

    // Create tasks for both projects
    await db.insert(tasksTable)
      .values([
        {
          project_id: project1Id,
          description: 'Project 1 Task',
          duration_days: 2,
          status: 'pending'
        },
        {
          project_id: project2Id,
          description: 'Project 2 Task 1',
          duration_days: 4,
          status: 'in_progress'
        },
        {
          project_id: project2Id,
          description: 'Project 2 Task 2',
          duration_days: 6,
          status: 'completed'
        }
      ])
      .execute();

    // Get tasks for project 1
    const project1Tasks = await getProjectTasks(project1Id);
    expect(project1Tasks).toHaveLength(1);
    expect(project1Tasks[0].description).toEqual('Project 1 Task');
    expect(project1Tasks[0].project_id).toEqual(project1Id);

    // Get tasks for project 2
    const project2Tasks = await getProjectTasks(project2Id);
    expect(project2Tasks).toHaveLength(2);
    expect(project2Tasks[0].project_id).toEqual(project2Id);
    expect(project2Tasks[1].project_id).toEqual(project2Id);
    
    // Verify task descriptions
    const descriptions = project2Tasks.map(task => task.description).sort();
    expect(descriptions).toEqual(['Project 2 Task 1', 'Project 2 Task 2']);
  });

  it('should handle non-existent project gracefully', async () => {
    const nonExistentProjectId = 999999;
    
    const result = await getProjectTasks(nonExistentProjectId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return tasks with correct data types', async () => {
    // Create a project first
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Type Test Project',
        description: 'Testing data types',
        start_date: new Date(),
        status: 'planning'
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    // Create a task
    await db.insert(tasksTable)
      .values({
        project_id: projectId,
        description: 'Type test task',
        duration_days: 10,
        status: 'pending'
      })
      .execute();

    const result = await getProjectTasks(projectId);

    expect(result).toHaveLength(1);
    const task = result[0];
    
    // Verify data types
    expect(typeof task.id).toBe('number');
    expect(typeof task.project_id).toBe('number');
    expect(typeof task.description).toBe('string');
    expect(typeof task.duration_days).toBe('number');
    expect(typeof task.status).toBe('string');
    expect(task.created_at).toBeInstanceOf(Date);
    expect(task.updated_at).toBeInstanceOf(Date);
    
    // Verify enum values are valid
    expect(['pending', 'in_progress', 'completed']).toContain(task.status);
  });
});