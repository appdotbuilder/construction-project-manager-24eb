import { db } from '../db';
import { materialsTable } from '../db/schema';
import { type Material } from '../schema';
import { eq } from 'drizzle-orm';

export const getProjectMaterials = async (projectId: number): Promise<Material[]> => {
  try {
    // Query materials for the specific project
    const results = await db.select()
      .from(materialsTable)
      .where(eq(materialsTable.project_id, projectId))
      .execute();

    // Convert numeric fields to numbers before returning
    return results.map(material => ({
      ...material,
      quantity: parseFloat(material.quantity),
      price_per_unit: parseFloat(material.price_per_unit)
    }));
  } catch (error) {
    console.error('Failed to fetch project materials:', error);
    throw error;
  }
};