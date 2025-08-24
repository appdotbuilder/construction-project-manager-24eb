import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { workersTable, projectsTable } from '../db/schema';
import { type UpdateWorkerInput, type CreateProjectInput } from '../schema';
import { updateWorker } from '../handlers/update_worker';
import { eq } from 'drizzle-orm';

// Test project for foreign key constraint
const testProject: CreateProjectInput = {
  name: 'Test Construction Project',
  description: 'A project for testing workers',
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-06-01'),
  status: 'planning'
};

describe('updateWorker', () => {
  let projectId: number;
  let workerId: number;

  beforeEach(async () => {
    await createDB();

    // Create test project first
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

    // Create test worker
    const workerResult = await db.insert(workersTable)
      .values({
        project_id: projectId,
        name: 'John Smith',
        daily_pay_rate: '150.00',
        days_worked: 5,
        start_date: new Date('2024-01-15'),
        end_date: null
      })
      .returning()
      .execute();

    workerId = workerResult[0].id;
  });

  afterEach(resetDB);

  it('should update worker name', async () => {
    const input: UpdateWorkerInput = {
      id: workerId,
      name: 'Jane Doe'
    };

    const result = await updateWorker(input);

    expect(result.id).toEqual(workerId);
    expect(result.name).toEqual('Jane Doe');
    expect(result.daily_pay_rate).toEqual(150.00);
    expect(result.days_worked).toEqual(5);
    expect(result.project_id).toEqual(projectId);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.start_date).toBeInstanceOf(Date);
    expect(result.end_date).toBeNull();
  });

  it('should update daily pay rate', async () => {
    const input: UpdateWorkerInput = {
      id: workerId,
      daily_pay_rate: 200.50
    };

    const result = await updateWorker(input);

    expect(result.daily_pay_rate).toEqual(200.50);
    expect(typeof result.daily_pay_rate).toEqual('number');
    expect(result.name).toEqual('John Smith'); // Should remain unchanged
  });

  it('should update days worked', async () => {
    const input: UpdateWorkerInput = {
      id: workerId,
      days_worked: 10
    };

    const result = await updateWorker(input);

    expect(result.days_worked).toEqual(10);
    expect(result.name).toEqual('John Smith'); // Should remain unchanged
  });

  it('should update start and end dates', async () => {
    const newStartDate = new Date('2024-02-01');
    const newEndDate = new Date('2024-02-28');

    const input: UpdateWorkerInput = {
      id: workerId,
      start_date: newStartDate,
      end_date: newEndDate
    };

    const result = await updateWorker(input);

    expect(result.start_date).toEqual(newStartDate);
    expect(result.end_date).toEqual(newEndDate);
    expect(result.name).toEqual('John Smith'); // Should remain unchanged
  });

  it('should update multiple fields simultaneously', async () => {
    const newStartDate = new Date('2024-03-01');
    const newEndDate = new Date('2024-03-31');

    const input: UpdateWorkerInput = {
      id: workerId,
      name: 'Bob Wilson',
      daily_pay_rate: 175.75,
      days_worked: 20,
      start_date: newStartDate,
      end_date: newEndDate
    };

    const result = await updateWorker(input);

    expect(result.id).toEqual(workerId);
    expect(result.name).toEqual('Bob Wilson');
    expect(result.daily_pay_rate).toEqual(175.75);
    expect(result.days_worked).toEqual(20);
    expect(result.start_date).toEqual(newStartDate);
    expect(result.end_date).toEqual(newEndDate);
    expect(result.project_id).toEqual(projectId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set dates to null when explicitly provided', async () => {
    const input: UpdateWorkerInput = {
      id: workerId,
      start_date: null,
      end_date: null
    };

    const result = await updateWorker(input);

    expect(result.start_date).toBeNull();
    expect(result.end_date).toBeNull();
  });

  it('should save updates to database', async () => {
    const input: UpdateWorkerInput = {
      id: workerId,
      name: 'Database Test Worker',
      daily_pay_rate: 225.25
    };

    await updateWorker(input);

    // Query database directly to verify changes
    const workers = await db.select()
      .from(workersTable)
      .where(eq(workersTable.id, workerId))
      .execute();

    expect(workers).toHaveLength(1);
    expect(workers[0].name).toEqual('Database Test Worker');
    expect(parseFloat(workers[0].daily_pay_rate)).toEqual(225.25);
    expect(workers[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when worker does not exist', async () => {
    const input: UpdateWorkerInput = {
      id: 99999, // Non-existent worker ID
      name: 'Non-existent Worker'
    };

    await expect(updateWorker(input)).rejects.toThrow(/Worker with id 99999 not found/i);
  });

  it('should handle zero days worked', async () => {
    const input: UpdateWorkerInput = {
      id: workerId,
      days_worked: 0
    };

    const result = await updateWorker(input);

    expect(result.days_worked).toEqual(0);
  });

  it('should preserve unchanged fields', async () => {
    // Update only one field
    const input: UpdateWorkerInput = {
      id: workerId,
      name: 'Only Name Changed'
    };

    const result = await updateWorker(input);

    // Verify other fields remain unchanged
    expect(result.name).toEqual('Only Name Changed');
    expect(result.daily_pay_rate).toEqual(150.00);
    expect(result.days_worked).toEqual(5);
    expect(result.project_id).toEqual(projectId);
    expect(result.start_date).toBeInstanceOf(Date);
    expect(result.end_date).toBeNull();
  });
});