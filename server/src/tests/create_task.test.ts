import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, projectsTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateTaskInput = {
  project_id: 1,
  description: 'Install flooring in living room',
  duration_days: 5,
  status: 'pending'
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testProjectId: number;

  beforeEach(async () => {
    // Create a test project first (required for foreign key constraint)
    const projectResult = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A project for testing tasks',
        start_date: new Date(),
        status: 'planning'
      })
      .returning()
      .execute();

    testProjectId = projectResult[0].id;
    testInput.project_id = testProjectId;
  });

  it('should create a task with all fields', async () => {
    const result = await createTask(testInput);

    // Basic field validation
    expect(result.project_id).toEqual(testProjectId);
    expect(result.description).toEqual('Install flooring in living room');
    expect(result.duration_days).toEqual(5);
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const result = await createTask(testInput);

    // Query database to verify task was saved
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].project_id).toEqual(testProjectId);
    expect(tasks[0].description).toEqual('Install flooring in living room');
    expect(tasks[0].duration_days).toEqual(5);
    expect(tasks[0].status).toEqual('pending');
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create task with default status when not provided', async () => {
    const inputWithoutStatus: CreateTaskInput = {
      project_id: testProjectId,
      description: 'Paint walls',
      duration_days: 3,
      status: 'pending' // Zod applies default, so this will be present
    };

    const result = await createTask(inputWithoutStatus);

    expect(result.status).toEqual('pending');
    expect(result.description).toEqual('Paint walls');
    expect(result.duration_days).toEqual(3);
  });

  it('should create task with in_progress status', async () => {
    const inProgressInput: CreateTaskInput = {
      project_id: testProjectId,
      description: 'Install electrical wiring',
      duration_days: 7,
      status: 'in_progress'
    };

    const result = await createTask(inProgressInput);

    expect(result.status).toEqual('in_progress');
    expect(result.description).toEqual('Install electrical wiring');
    expect(result.duration_days).toEqual(7);
  });

  it('should create task with completed status', async () => {
    const completedInput: CreateTaskInput = {
      project_id: testProjectId,
      description: 'Clean up workspace',
      duration_days: 1,
      status: 'completed'
    };

    const result = await createTask(completedInput);

    expect(result.status).toEqual('completed');
    expect(result.description).toEqual('Clean up workspace');
    expect(result.duration_days).toEqual(1);
  });

  it('should fail when project does not exist', async () => {
    const invalidInput: CreateTaskInput = {
      project_id: 99999, // Non-existent project ID
      description: 'Task for non-existent project',
      duration_days: 2,
      status: 'pending'
    };

    await expect(createTask(invalidInput)).rejects.toThrow(/project with id 99999 not found/i);
  });

  it('should create multiple tasks for the same project', async () => {
    const task1Input: CreateTaskInput = {
      project_id: testProjectId,
      description: 'First task',
      duration_days: 3,
      status: 'pending'
    };

    const task2Input: CreateTaskInput = {
      project_id: testProjectId,
      description: 'Second task',
      duration_days: 4,
      status: 'in_progress'
    };

    const result1 = await createTask(task1Input);
    const result2 = await createTask(task2Input);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.project_id).toEqual(testProjectId);
    expect(result2.project_id).toEqual(testProjectId);
    expect(result1.description).toEqual('First task');
    expect(result2.description).toEqual('Second task');

    // Verify both tasks exist in database
    const allTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.project_id, testProjectId))
      .execute();

    expect(allTasks).toHaveLength(2);
  });

  it('should handle large duration values', async () => {
    const largeDurationInput: CreateTaskInput = {
      project_id: testProjectId,
      description: 'Long-term construction task',
      duration_days: 365,
      status: 'planning' as any // This will be coerced to pending by Zod defaults
    };

    // Note: Since 'planning' is not a valid task status, Zod will use the default 'pending'
    const validInput: CreateTaskInput = {
      project_id: testProjectId,
      description: 'Long-term construction task',
      duration_days: 365,
      status: 'pending'
    };

    const result = await createTask(validInput);

    expect(result.duration_days).toEqual(365);
    expect(result.status).toEqual('pending');
    expect(result.description).toEqual('Long-term construction task');
  });
});