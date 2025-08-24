import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { materialsTable, projectsTable } from '../db/schema';
import { type CreateMaterialInput } from '../schema';
import { createMaterial } from '../handlers/create_material';
import { eq } from 'drizzle-orm';

// Test project setup
const createTestProject = async () => {
  const result = await db.insert(projectsTable)
    .values({
      name: 'Test Project',
      description: 'A project for testing',
      start_date: new Date(),
      status: 'planning'
    })
    .returning()
    .execute();
  return result[0];
};

// Simple test input
const testInput: CreateMaterialInput = {
  project_id: 1, // Will be set dynamically in tests
  name: 'Test Material',
  quantity: 10.5,
  unit: 'kg',
  price_per_unit: 25.99,
  purchase_date: new Date('2024-01-15')
};

describe('createMaterial', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a material', async () => {
    // Create prerequisite project
    const project = await createTestProject();
    const input = { ...testInput, project_id: project.id };

    const result = await createMaterial(input);

    // Basic field validation
    expect(result.name).toEqual('Test Material');
    expect(result.project_id).toEqual(project.id);
    expect(result.quantity).toEqual(10.5);
    expect(typeof result.quantity).toEqual('number');
    expect(result.unit).toEqual('kg');
    expect(result.price_per_unit).toEqual(25.99);
    expect(typeof result.price_per_unit).toEqual('number');
    expect(result.purchase_date).toEqual(new Date('2024-01-15'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save material to database', async () => {
    // Create prerequisite project
    const project = await createTestProject();
    const input = { ...testInput, project_id: project.id };

    const result = await createMaterial(input);

    // Query using proper drizzle syntax
    const materials = await db.select()
      .from(materialsTable)
      .where(eq(materialsTable.id, result.id))
      .execute();

    expect(materials).toHaveLength(1);
    expect(materials[0].name).toEqual('Test Material');
    expect(materials[0].project_id).toEqual(project.id);
    expect(parseFloat(materials[0].quantity)).toEqual(10.5);
    expect(parseFloat(materials[0].price_per_unit)).toEqual(25.99);
    expect(materials[0].unit).toEqual('kg');
    expect(materials[0].purchase_date).toEqual(new Date('2024-01-15'));
    expect(materials[0].created_at).toBeInstanceOf(Date);
    expect(materials[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null purchase_date', async () => {
    // Create prerequisite project
    const project = await createTestProject();
    const input = { ...testInput, project_id: project.id, purchase_date: null };

    const result = await createMaterial(input);

    expect(result.purchase_date).toBeNull();
    
    // Verify in database
    const materials = await db.select()
      .from(materialsTable)
      .where(eq(materialsTable.id, result.id))
      .execute();

    expect(materials[0].purchase_date).toBeNull();
  });

  it('should validate project exists before creating material', async () => {
    const input = { ...testInput, project_id: 999 }; // Non-existent project

    await expect(createMaterial(input)).rejects.toThrow(/project with id 999 does not exist/i);
  });

  it('should handle decimal quantities and prices correctly', async () => {
    // Create prerequisite project
    const project = await createTestProject();
    const input = { 
      ...testInput, 
      project_id: project.id,
      quantity: 15.75,
      price_per_unit: 3.50
    };

    const result = await createMaterial(input);

    // Verify numeric conversion is correct
    expect(result.quantity).toEqual(15.75);
    expect(result.price_per_unit).toEqual(3.50);
    expect(typeof result.quantity).toEqual('number');
    expect(typeof result.price_per_unit).toEqual('number');

    // Verify stored values in database
    const materials = await db.select()
      .from(materialsTable)
      .where(eq(materialsTable.id, result.id))
      .execute();

    expect(parseFloat(materials[0].quantity)).toEqual(15.75);
    expect(parseFloat(materials[0].price_per_unit)).toEqual(3.50);
  });

  it('should handle large quantities and prices', async () => {
    // Create prerequisite project
    const project = await createTestProject();
    const input = { 
      ...testInput, 
      project_id: project.id,
      quantity: 1000.99,
      price_per_unit: 999.99
    };

    const result = await createMaterial(input);

    expect(result.quantity).toEqual(1000.99);
    expect(result.price_per_unit).toEqual(999.99);
  });
});