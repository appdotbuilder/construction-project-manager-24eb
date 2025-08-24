import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { materialsTable, projectsTable } from '../db/schema';
import { type UpdateMaterialInput, type CreateProjectInput, type CreateMaterialInput } from '../schema';
import { updateMaterial } from '../handlers/update_material';
import { eq } from 'drizzle-orm';

describe('updateMaterial', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let projectId: number;
  let materialId: number;

  beforeEach(async () => {
    // Create a test project first
    const testProject: CreateProjectInput = {
      name: 'Test Project',
      description: 'A project for testing materials',
      start_date: new Date(),
      end_date: null,
      status: 'planning'
    };

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

    // Create a test material
    const testMaterial: CreateMaterialInput = {
      project_id: projectId,
      name: 'Test Material',
      quantity: 10.5,
      unit: 'kg',
      price_per_unit: 25.99,
      purchase_date: new Date('2023-01-15')
    };

    const materialResult = await db.insert(materialsTable)
      .values({
        project_id: testMaterial.project_id,
        name: testMaterial.name,
        quantity: testMaterial.quantity.toString(),
        unit: testMaterial.unit,
        price_per_unit: testMaterial.price_per_unit.toString(),
        purchase_date: testMaterial.purchase_date
      })
      .returning()
      .execute();

    materialId = materialResult[0].id;
  });

  it('should update a material with all fields', async () => {
    const updateInput: UpdateMaterialInput = {
      id: materialId,
      name: 'Updated Material',
      quantity: 15.75,
      unit: 'lbs',
      price_per_unit: 30.50,
      purchase_date: new Date('2023-02-20')
    };

    const result = await updateMaterial(updateInput);

    expect(result.id).toEqual(materialId);
    expect(result.project_id).toEqual(projectId);
    expect(result.name).toEqual('Updated Material');
    expect(result.quantity).toEqual(15.75);
    expect(typeof result.quantity).toBe('number');
    expect(result.unit).toEqual('lbs');
    expect(result.price_per_unit).toEqual(30.50);
    expect(typeof result.price_per_unit).toBe('number');
    expect(result.purchase_date).toEqual(new Date('2023-02-20'));
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const updateInput: UpdateMaterialInput = {
      id: materialId,
      name: 'Partially Updated Material',
      quantity: 20.25
    };

    const result = await updateMaterial(updateInput);

    expect(result.id).toEqual(materialId);
    expect(result.name).toEqual('Partially Updated Material');
    expect(result.quantity).toEqual(20.25);
    expect(typeof result.quantity).toBe('number');
    expect(result.unit).toEqual('kg'); // Should remain unchanged
    expect(result.price_per_unit).toEqual(25.99); // Should remain unchanged
    expect(typeof result.price_per_unit).toBe('number');
  });

  it('should update purchase_date to null', async () => {
    const updateInput: UpdateMaterialInput = {
      id: materialId,
      purchase_date: null
    };

    const result = await updateMaterial(updateInput);

    expect(result.id).toEqual(materialId);
    expect(result.purchase_date).toBeNull();
    expect(result.name).toEqual('Test Material'); // Should remain unchanged
  });

  it('should save updates to database', async () => {
    const updateInput: UpdateMaterialInput = {
      id: materialId,
      name: 'Database Updated Material',
      quantity: 99.99,
      price_per_unit: 100.00
    };

    await updateMaterial(updateInput);

    // Query database directly to verify changes
    const materials = await db.select()
      .from(materialsTable)
      .where(eq(materialsTable.id, materialId))
      .execute();

    expect(materials).toHaveLength(1);
    expect(materials[0].name).toEqual('Database Updated Material');
    expect(parseFloat(materials[0].quantity)).toEqual(99.99);
    expect(parseFloat(materials[0].price_per_unit)).toEqual(100.00);
    expect(materials[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when material not found', async () => {
    const updateInput: UpdateMaterialInput = {
      id: 99999, // Non-existent ID
      name: 'Updated Material'
    };

    expect(updateMaterial(updateInput)).rejects.toThrow(/material with id 99999 not found/i);
  });

  it('should handle numeric precision correctly', async () => {
    const updateInput: UpdateMaterialInput = {
      id: materialId,
      quantity: 123.45,
      price_per_unit: 987.65
    };

    const result = await updateMaterial(updateInput);

    expect(result.quantity).toEqual(123.45);
    expect(result.price_per_unit).toEqual(987.65);
    expect(typeof result.quantity).toBe('number');
    expect(typeof result.price_per_unit).toBe('number');
  });

  it('should update with minimal input', async () => {
    const updateInput: UpdateMaterialInput = {
      id: materialId,
      unit: 'tons'
    };

    const result = await updateMaterial(updateInput);

    expect(result.id).toEqual(materialId);
    expect(result.unit).toEqual('tons');
    // Other fields should remain unchanged
    expect(result.name).toEqual('Test Material');
    expect(result.quantity).toEqual(10.5);
    expect(result.price_per_unit).toEqual(25.99);
  });

  it('should update updated_at timestamp', async () => {
    const originalMaterial = await db.select()
      .from(materialsTable)
      .where(eq(materialsTable.id, materialId))
      .execute();

    const originalUpdatedAt = originalMaterial[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateMaterialInput = {
      id: materialId,
      name: 'Timestamp Test Material'
    };

    const result = await updateMaterial(updateInput);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});