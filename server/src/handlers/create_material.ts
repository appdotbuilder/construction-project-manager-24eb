import { db } from '../db';
import { materialsTable, projectsTable } from '../db/schema';
import { type CreateMaterialInput, type Material } from '../schema';
import { eq } from 'drizzle-orm';

export const createMaterial = async (input: CreateMaterialInput): Promise<Material> => {
  try {
    // Validate that the project exists
    const project = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, input.project_id))
      .execute();

    if (project.length === 0) {
      throw new Error(`Project with id ${input.project_id} does not exist`);
    }

    // Insert material record
    const result = await db.insert(materialsTable)
      .values({
        project_id: input.project_id,
        name: input.name,
        quantity: input.quantity.toString(), // Convert number to string for numeric column
        unit: input.unit,
        price_per_unit: input.price_per_unit.toString(), // Convert number to string for numeric column
        purchase_date: input.purchase_date
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const material = result[0];
    return {
      ...material,
      quantity: parseFloat(material.quantity), // Convert string back to number
      price_per_unit: parseFloat(material.price_per_unit) // Convert string back to number
    };
  } catch (error) {
    console.error('Material creation failed:', error);
    throw error;
  }
};