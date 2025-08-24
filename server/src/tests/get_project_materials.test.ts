import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, materialsTable } from '../db/schema';
import { type CreateProjectInput, type CreateMaterialInput } from '../schema';
import { getProjectMaterials } from '../handlers/get_project_materials';
import { eq } from 'drizzle-orm';

// Test data
const testProject: CreateProjectInput = {
  name: 'Test Project',
  description: 'A project for testing materials',
  start_date: new Date('2023-01-01'),
  end_date: new Date('2023-12-31'),
  status: 'planning'
};

const testMaterials: CreateMaterialInput[] = [
  {
    project_id: 1,
    name: 'Cement',
    quantity: 50.5,
    unit: 'bags',
    price_per_unit: 12.99,
    purchase_date: new Date('2023-01-15')
  },
  {
    project_id: 1,
    name: 'Steel Rebar',
    quantity: 100.0,
    unit: 'kg',
    price_per_unit: 2.50,
    purchase_date: null
  },
  {
    project_id: 1,
    name: 'Bricks',
    quantity: 1000,
    unit: 'pieces',
    price_per_unit: 0.75,
    purchase_date: new Date('2023-01-20')
  }
];

const testMaterialFromDifferentProject: CreateMaterialInput = {
  project_id: 2,
  name: 'Paint',
  quantity: 10,
  unit: 'liters',
  price_per_unit: 25.00,
  purchase_date: new Date('2023-02-01')
};

describe('getProjectMaterials', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch all materials for a project', async () => {
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

    // Create test materials with correct project_id
    const materialsToInsert = testMaterials.map(material => ({
      ...material,
      project_id: projectId,
      quantity: material.quantity.toString(),
      price_per_unit: material.price_per_unit.toString()
    }));

    await db.insert(materialsTable)
      .values(materialsToInsert)
      .execute();

    // Fetch materials
    const result = await getProjectMaterials(projectId);

    // Validate results
    expect(result).toHaveLength(3);
    
    // Check first material
    const cement = result.find(m => m.name === 'Cement');
    expect(cement).toBeDefined();
    expect(cement?.quantity).toEqual(50.5);
    expect(cement?.unit).toEqual('bags');
    expect(cement?.price_per_unit).toEqual(12.99);
    expect(cement?.purchase_date).toBeInstanceOf(Date);
    expect(cement?.project_id).toEqual(projectId);

    // Check second material
    const rebar = result.find(m => m.name === 'Steel Rebar');
    expect(rebar).toBeDefined();
    expect(rebar?.quantity).toEqual(100.0);
    expect(rebar?.unit).toEqual('kg');
    expect(rebar?.price_per_unit).toEqual(2.50);
    expect(rebar?.purchase_date).toBeNull();

    // Check third material
    const bricks = result.find(m => m.name === 'Bricks');
    expect(bricks).toBeDefined();
    expect(bricks?.quantity).toEqual(1000);
    expect(bricks?.unit).toEqual('pieces');
    expect(bricks?.price_per_unit).toEqual(0.75);
    expect(bricks?.purchase_date).toBeInstanceOf(Date);

    // Verify all materials have required fields
    result.forEach(material => {
      expect(material.id).toBeDefined();
      expect(material.project_id).toEqual(projectId);
      expect(material.name).toBeDefined();
      expect(typeof material.quantity).toBe('number');
      expect(typeof material.price_per_unit).toBe('number');
      expect(material.unit).toBeDefined();
      expect(material.created_at).toBeInstanceOf(Date);
      expect(material.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array for project with no materials', async () => {
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

    // Fetch materials for project with no materials
    const result = await getProjectMaterials(projectId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return materials for specified project', async () => {
    // Create two test projects
    const project1DbResult = await db.insert(projectsTable)
      .values({
        name: 'Project 1',
        description: 'First project',
        start_date: new Date('2023-01-01'),
        end_date: new Date('2023-12-31'),
        status: 'planning'
      })
      .returning()
      .execute();

    const project2DbResult = await db.insert(projectsTable)
      .values({
        name: 'Project 2',
        description: 'Second project',
        start_date: new Date('2023-01-01'),
        end_date: new Date('2023-12-31'),
        status: 'planning'
      })
      .returning()
      .execute();

    const project1Id = project1DbResult[0].id;
    const project2Id = project2DbResult[0].id;

    // Create materials for project 1
    const project1Materials = testMaterials.map(material => ({
      ...material,
      project_id: project1Id,
      quantity: material.quantity.toString(),
      price_per_unit: material.price_per_unit.toString()
    }));

    await db.insert(materialsTable)
      .values(project1Materials)
      .execute();

    // Create material for project 2
    await db.insert(materialsTable)
      .values({
        project_id: project2Id,
        name: testMaterialFromDifferentProject.name,
        quantity: testMaterialFromDifferentProject.quantity.toString(),
        unit: testMaterialFromDifferentProject.unit,
        price_per_unit: testMaterialFromDifferentProject.price_per_unit.toString(),
        purchase_date: testMaterialFromDifferentProject.purchase_date
      })
      .execute();

    // Fetch materials for project 1
    const project1Materials_result = await getProjectMaterials(project1Id);
    expect(project1Materials_result).toHaveLength(3);
    project1Materials_result.forEach(material => {
      expect(material.project_id).toEqual(project1Id);
    });

    // Fetch materials for project 2
    const project2Materials_result = await getProjectMaterials(project2Id);
    expect(project2Materials_result).toHaveLength(1);
    expect(project2Materials_result[0].name).toEqual('Paint');
    expect(project2Materials_result[0].project_id).toEqual(project2Id);
  });

  it('should return empty array for non-existent project', async () => {
    const result = await getProjectMaterials(999999);
    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should properly convert numeric fields to numbers', async () => {
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

    // Create test material with specific numeric values
    await db.insert(materialsTable)
      .values({
        project_id: projectId,
        name: 'Test Material',
        quantity: '123.45',
        unit: 'kg',
        price_per_unit: '67.89',
        purchase_date: new Date('2023-01-15')
      })
      .execute();

    // Fetch materials
    const result = await getProjectMaterials(projectId);

    expect(result).toHaveLength(1);
    expect(typeof result[0].quantity).toBe('number');
    expect(result[0].quantity).toEqual(123.45);
    expect(typeof result[0].price_per_unit).toBe('number');
    expect(result[0].price_per_unit).toEqual(67.89);
  });

  it('should verify materials are saved correctly in database', async () => {
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

    // Create test material
    const materialResult = await db.insert(materialsTable)
      .values({
        project_id: projectId,
        name: 'Database Test Material',
        quantity: '99.99',
        unit: 'units',
        price_per_unit: '11.11',
        purchase_date: new Date('2023-01-10')
      })
      .returning()
      .execute();

    const createdMaterialId = materialResult[0].id;

    // Fetch via handler
    const handlerResult = await getProjectMaterials(projectId);

    // Verify via direct database query
    const dbResult = await db.select()
      .from(materialsTable)
      .where(eq(materialsTable.id, createdMaterialId))
      .execute();

    expect(handlerResult).toHaveLength(1);
    expect(dbResult).toHaveLength(1);
    expect(handlerResult[0].id).toEqual(dbResult[0].id);
    expect(handlerResult[0].name).toEqual(dbResult[0].name);
    expect(handlerResult[0].project_id).toEqual(projectId);
    expect(handlerResult[0].quantity).toEqual(99.99);
    expect(handlerResult[0].price_per_unit).toEqual(11.11);
  });
});