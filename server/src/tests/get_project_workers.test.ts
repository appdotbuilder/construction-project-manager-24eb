import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, workersTable } from '../db/schema';
import { type CreateProjectInput, type CreateWorkerInput } from '../schema';
import { getProjectWorkers } from '../handlers/get_project_workers';

// Test data
const testProject: CreateProjectInput = {
  name: 'Test Project',
  description: 'A project for testing workers',
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-12-31'),
  status: 'in_progress'
};

const testWorker1: CreateWorkerInput = {
  project_id: 1, // Will be set after project creation
  name: 'John Carpenter',
  daily_pay_rate: 150.50,
  days_worked: 5,
  start_date: new Date('2024-01-15'),
  end_date: new Date('2024-01-19')
};

const testWorker2: CreateWorkerInput = {
  project_id: 1, // Will be set after project creation
  name: 'Jane Builder',
  daily_pay_rate: 180.25,
  days_worked: 3,
  start_date: new Date('2024-01-20'),
  end_date: null
};

describe('getProjectWorkers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return workers for a specific project', async () => {
    // Create test project
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

    const projectId = projectResult[0].id;

    // Create test workers
    await db.insert(workersTable)
      .values([
        {
          project_id: projectId,
          name: testWorker1.name,
          daily_pay_rate: testWorker1.daily_pay_rate.toString(),
          days_worked: testWorker1.days_worked,
          start_date: testWorker1.start_date,
          end_date: testWorker1.end_date
        },
        {
          project_id: projectId,
          name: testWorker2.name,
          daily_pay_rate: testWorker2.daily_pay_rate.toString(),
          days_worked: testWorker2.days_worked,
          start_date: testWorker2.start_date,
          end_date: testWorker2.end_date
        }
      ])
      .execute();

    const result = await getProjectWorkers(projectId);

    // Verify results
    expect(result).toHaveLength(2);
    
    // Verify first worker
    const worker1 = result.find(w => w.name === 'John Carpenter');
    expect(worker1).toBeDefined();
    expect(worker1!.name).toEqual('John Carpenter');
    expect(worker1!.daily_pay_rate).toEqual(150.50);
    expect(typeof worker1!.daily_pay_rate).toBe('number');
    expect(worker1!.days_worked).toEqual(5);
    expect(worker1!.project_id).toEqual(projectId);
    expect(worker1!.start_date).toBeInstanceOf(Date);
    expect(worker1!.end_date).toBeInstanceOf(Date);

    // Verify second worker
    const worker2 = result.find(w => w.name === 'Jane Builder');
    expect(worker2).toBeDefined();
    expect(worker2!.name).toEqual('Jane Builder');
    expect(worker2!.daily_pay_rate).toEqual(180.25);
    expect(typeof worker2!.daily_pay_rate).toBe('number');
    expect(worker2!.days_worked).toEqual(3);
    expect(worker2!.project_id).toEqual(projectId);
    expect(worker2!.start_date).toBeInstanceOf(Date);
    expect(worker2!.end_date).toBeNull();
  });

  it('should return empty array for project with no workers', async () => {
    // Create test project without workers
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

    const projectId = projectResult[0].id;

    const result = await getProjectWorkers(projectId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent project', async () => {
    const result = await getProjectWorkers(99999);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return workers for the specified project', async () => {
    // Create two test projects
    const project1Result = await db.insert(projectsTable)
      .values({
        name: 'Project One',
        description: 'First project',
        start_date: new Date('2024-01-01'),
        end_date: null,
        status: 'in_progress'
      })
      .returning()
      .execute();

    const project2Result = await db.insert(projectsTable)
      .values({
        name: 'Project Two',
        description: 'Second project',
        start_date: new Date('2024-02-01'),
        end_date: null,
        status: 'planning'
      })
      .returning()
      .execute();

    const project1Id = project1Result[0].id;
    const project2Id = project2Result[0].id;

    // Create workers for both projects
    await db.insert(workersTable)
      .values([
        {
          project_id: project1Id,
          name: 'Worker Project 1A',
          daily_pay_rate: '120.00',
          days_worked: 2,
          start_date: new Date('2024-01-05'),
          end_date: null
        },
        {
          project_id: project1Id,
          name: 'Worker Project 1B',
          daily_pay_rate: '140.00',
          days_worked: 1,
          start_date: new Date('2024-01-06'),
          end_date: null
        },
        {
          project_id: project2Id,
          name: 'Worker Project 2',
          daily_pay_rate: '160.00',
          days_worked: 0,
          start_date: new Date('2024-02-01'),
          end_date: null
        }
      ])
      .execute();

    // Get workers for project 1
    const project1Workers = await getProjectWorkers(project1Id);
    
    expect(project1Workers).toHaveLength(2);
    expect(project1Workers.every(w => w.project_id === project1Id)).toBe(true);
    expect(project1Workers.some(w => w.name === 'Worker Project 1A')).toBe(true);
    expect(project1Workers.some(w => w.name === 'Worker Project 1B')).toBe(true);
    expect(project1Workers.some(w => w.name === 'Worker Project 2')).toBe(false);

    // Get workers for project 2
    const project2Workers = await getProjectWorkers(project2Id);
    
    expect(project2Workers).toHaveLength(1);
    expect(project2Workers[0].project_id).toEqual(project2Id);
    expect(project2Workers[0].name).toEqual('Worker Project 2');
    expect(project2Workers[0].daily_pay_rate).toEqual(160);
  });

  it('should handle workers with various numeric values correctly', async () => {
    // Create test project
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

    const projectId = projectResult[0].id;

    // Create workers with edge case numeric values
    await db.insert(workersTable)
      .values([
        {
          project_id: projectId,
          name: 'Worker High Rate',
          daily_pay_rate: '999.99',
          days_worked: 100,
          start_date: new Date('2024-01-01'),
          end_date: null
        },
        {
          project_id: projectId,
          name: 'Worker Low Rate',
          daily_pay_rate: '0.01',
          days_worked: 0,
          start_date: null,
          end_date: null
        }
      ])
      .execute();

    const result = await getProjectWorkers(projectId);

    expect(result).toHaveLength(2);
    
    const highRateWorker = result.find(w => w.name === 'Worker High Rate');
    expect(highRateWorker!.daily_pay_rate).toEqual(999.99);
    expect(typeof highRateWorker!.daily_pay_rate).toBe('number');
    expect(highRateWorker!.days_worked).toEqual(100);
    
    const lowRateWorker = result.find(w => w.name === 'Worker Low Rate');
    expect(lowRateWorker!.daily_pay_rate).toEqual(0.01);
    expect(typeof lowRateWorker!.daily_pay_rate).toBe('number');
    expect(lowRateWorker!.days_worked).toEqual(0);
  });
});