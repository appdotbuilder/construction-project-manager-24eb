import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, tasksTable } from '../db/schema';
import { type UpdateTaskInput, type CreateProjectInput, type CreateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Test project data
const testProject: CreateProjectInput = {
  name: 'Test Project',
  description: 'A project for testing',
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-12-31'),
  status: 'planning'
};

// Test task data
const testTask: CreateTaskInput = {
  project_id: 1, // Will be updated after project creation
  description: 'Original task description',
  duration_days: 5,
  status: 'pending'
};

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let projectId: number;
  let taskId: number;

  beforeEach(async () => {
    // Create a project first
    const projectResult = await db.insert(projectsTable)
      .values({
        name: testProject.name,
        description: testProject.description,
        start_date: testProject.start_date,
        end_date: testProject.end_date,
        status: testProject.status
      })
      .returning()
      .execute();

    projectId = projectResult[0].id;

    // Create a task for testing
    const taskResult = await db.insert(tasksTable)
      .values({
        project_id: projectId,
        description: testTask.description,
        duration_days: testTask.duration_days,
        status: testTask.status
      })
      .returning()
      .execute();

    taskId = taskResult[0].id;
  });

  it('should update all task fields', async () => {
    const updateInput: UpdateTaskInput = {
      id: taskId,
      description: 'Updated task description',
      duration_days: 10,
      status: 'in_progress'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(taskId);
    expect(result.project_id).toEqual(projectId);
    expect(result.description).toEqual('Updated task description');
    expect(result.duration_days).toEqual(10);
    expect(result.status).toEqual('in_progress');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(result.created_at.getTime());
  });

  it('should update only description', async () => {
    const updateInput: UpdateTaskInput = {
      id: taskId,
      description: 'Only description changed'
    };

    const result = await updateTask(updateInput);

    expect(result.description).toEqual('Only description changed');
    expect(result.duration_days).toEqual(5); // Should remain unchanged
    expect(result.status).toEqual('pending'); // Should remain unchanged
  });

  it('should update only duration_days', async () => {
    const updateInput: UpdateTaskInput = {
      id: taskId,
      duration_days: 15
    };

    const result = await updateTask(updateInput);

    expect(result.duration_days).toEqual(15);
    expect(result.description).toEqual('Original task description'); // Should remain unchanged
    expect(result.status).toEqual('pending'); // Should remain unchanged
  });

  it('should update only status', async () => {
    const updateInput: UpdateTaskInput = {
      id: taskId,
      status: 'completed'
    };

    const result = await updateTask(updateInput);

    expect(result.status).toEqual('completed');
    expect(result.description).toEqual('Original task description'); // Should remain unchanged
    expect(result.duration_days).toEqual(5); // Should remain unchanged
  });

  it('should save updated task to database', async () => {
    const updateInput: UpdateTaskInput = {
      id: taskId,
      description: 'Database test description',
      duration_days: 7,
      status: 'in_progress'
    };

    await updateTask(updateInput);

    // Query the database directly to verify the update
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].description).toEqual('Database test description');
    expect(tasks[0].duration_days).toEqual(7);
    expect(tasks[0].status).toEqual('in_progress');
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when task does not exist', async () => {
    const updateInput: UpdateTaskInput = {
      id: 99999, // Non-existent task ID
      description: 'This should fail'
    };

    await expect(updateTask(updateInput)).rejects.toThrow(/Task with id 99999 not found/i);
  });

  it('should update updated_at timestamp even with no field changes', async () => {
    // Get original timestamps
    const originalTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    const originalUpdatedAt = originalTasks[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateTaskInput = {
      id: taskId
      // No fields provided, only timestamp should change
    };

    const result = await updateTask(updateInput);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    expect(result.description).toEqual('Original task description'); // Should remain unchanged
    expect(result.duration_days).toEqual(5); // Should remain unchanged
    expect(result.status).toEqual('pending'); // Should remain unchanged
  });

  it('should handle mixed field updates correctly', async () => {
    const updateInput: UpdateTaskInput = {
      id: taskId,
      description: 'Partially updated task',
      status: 'completed'
      // duration_days not provided, should remain unchanged
    };

    const result = await updateTask(updateInput);

    expect(result.description).toEqual('Partially updated task');
    expect(result.status).toEqual('completed');
    expect(result.duration_days).toEqual(5); // Should remain unchanged from original
  });
});