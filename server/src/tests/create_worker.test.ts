import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { workersTable, projectsTable } from '../db/schema';
import { type CreateWorkerInput } from '../schema';
import { createWorker } from '../handlers/create_worker';
import { eq } from 'drizzle-orm';

describe('createWorker', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Create a test project first since workers need to reference an existing project
  const createTestProject = async () => {
    const result = await db.insert(projectsTable)
      .values({
        name: 'Test Project',
        description: 'A project for testing',
        start_date: new Date('2024-01-01'),
        end_date: null,
        status: 'planning'
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should create a worker with all fields', async () => {
    const project = await createTestProject();
    
    const testInput: CreateWorkerInput = {
      project_id: project.id,
      name: 'John Doe',
      daily_pay_rate: 150.50,
      days_worked: 5,
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-20')
    };

    const result = await createWorker(testInput);

    // Basic field validation
    expect(result.project_id).toEqual(project.id);
    expect(result.name).toEqual('John Doe');
    expect(result.daily_pay_rate).toEqual(150.50);
    expect(typeof result.daily_pay_rate).toEqual('number');
    expect(result.days_worked).toEqual(5);
    expect(result.start_date).toBeInstanceOf(Date);
    expect(result.start_date?.getTime()).toEqual(new Date('2024-01-15').getTime());
    expect(result.end_date).toBeInstanceOf(Date);
    expect(result.end_date?.getTime()).toEqual(new Date('2024-01-20').getTime());
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a worker with nullable fields as null', async () => {
    const project = await createTestProject();
    
    const testInput: CreateWorkerInput = {
      project_id: project.id,
      name: 'Jane Smith',
      daily_pay_rate: 125.75,
      days_worked: 0,
      start_date: null,
      end_date: null
    };

    const result = await createWorker(testInput);

    expect(result.name).toEqual('Jane Smith');
    expect(result.daily_pay_rate).toEqual(125.75);
    expect(result.days_worked).toEqual(0);
    expect(result.start_date).toBeNull();
    expect(result.end_date).toBeNull();
  });

  it('should apply Zod default for days_worked when not provided', async () => {
    const project = await createTestProject();
    
    const testInput = {
      project_id: project.id,
      name: 'Bob Wilson',
      daily_pay_rate: 100.00,
      start_date: null,
      end_date: null
    } as CreateWorkerInput; // Input without days_worked, Zod should apply default of 0

    const result = await createWorker(testInput);

    expect(result.days_worked).toEqual(0);
  });

  it('should save worker to database', async () => {
    const project = await createTestProject();
    
    const testInput: CreateWorkerInput = {
      project_id: project.id,
      name: 'Test Worker',
      daily_pay_rate: 200.25,
      days_worked: 3,
      start_date: new Date('2024-02-01'),
      end_date: null
    };

    const result = await createWorker(testInput);

    // Query using proper drizzle syntax
    const workers = await db.select()
      .from(workersTable)
      .where(eq(workersTable.id, result.id))
      .execute();

    expect(workers).toHaveLength(1);
    expect(workers[0].name).toEqual('Test Worker');
    expect(parseFloat(workers[0].daily_pay_rate)).toEqual(200.25);
    expect(workers[0].days_worked).toEqual(3);
    expect(workers[0].project_id).toEqual(project.id);
    expect(workers[0].created_at).toBeInstanceOf(Date);
    expect(workers[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle high precision decimal values correctly', async () => {
    const project = await createTestProject();
    
    const testInput: CreateWorkerInput = {
      project_id: project.id,
      name: 'Precision Worker',
      daily_pay_rate: 99.99,
      days_worked: 1,
      start_date: null,
      end_date: null
    };

    const result = await createWorker(testInput);

    expect(result.daily_pay_rate).toEqual(99.99);
    expect(typeof result.daily_pay_rate).toEqual('number');

    // Verify in database
    const workers = await db.select()
      .from(workersTable)
      .where(eq(workersTable.id, result.id))
      .execute();

    expect(parseFloat(workers[0].daily_pay_rate)).toEqual(99.99);
  });

  it('should throw error when project does not exist', async () => {
    const testInput: CreateWorkerInput = {
      project_id: 99999, // Non-existent project ID
      name: 'Worker Without Project',
      daily_pay_rate: 100.00,
      days_worked: 0,
      start_date: null,
      end_date: null
    };

    await expect(createWorker(testInput)).rejects.toThrow(/project with id 99999 does not exist/i);
  });

  it('should create multiple workers for the same project', async () => {
    const project = await createTestProject();
    
    const worker1Input: CreateWorkerInput = {
      project_id: project.id,
      name: 'Worker One',
      daily_pay_rate: 150.00,
      days_worked: 2,
      start_date: null,
      end_date: null
    };

    const worker2Input: CreateWorkerInput = {
      project_id: project.id,
      name: 'Worker Two',
      daily_pay_rate: 175.50,
      days_worked: 4,
      start_date: null,
      end_date: null
    };

    const result1 = await createWorker(worker1Input);
    const result2 = await createWorker(worker2Input);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.project_id).toEqual(project.id);
    expect(result2.project_id).toEqual(project.id);
    expect(result1.name).toEqual('Worker One');
    expect(result2.name).toEqual('Worker Two');

    // Verify both workers exist in database
    const allWorkers = await db.select()
      .from(workersTable)
      .where(eq(workersTable.project_id, project.id))
      .execute();

    expect(allWorkers).toHaveLength(2);
  });
});