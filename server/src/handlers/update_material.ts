import { db } from '../db';
import { materialsTable } from '../db/schema';
import { type UpdateMaterialInput, type Material } from '../schema';
import { eq } from 'drizzle-orm';

export const updateMaterial = async (input: UpdateMaterialInput): Promise<Material> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.name !== undefined) {
      updateData['name'] = input.name;
    }
    if (input.quantity !== undefined) {
      updateData['quantity'] = input.quantity.toString();
    }
    if (input.unit !== undefined) {
      updateData['unit'] = input.unit;
    }
    if (input.price_per_unit !== undefined) {
      updateData['price_per_unit'] = input.price_per_unit.toString();
    }
    if (input.purchase_date !== undefined) {
      updateData['purchase_date'] = input.purchase_date;
    }

    // Only add updated_at if we have fields to update
    if (Object.keys(updateData).length > 0) {
      updateData['updated_at'] = new Date();
    }

    // Update material record
    const result = await db.update(materialsTable)
      .set(updateData)
      .where(eq(materialsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Material with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const material = result[0];
    return {
      ...material,
      quantity: parseFloat(material.quantity),
      price_per_unit: parseFloat(material.price_per_unit)
    };
  } catch (error) {
    console.error('Material update failed:', error);
    throw error;
  }
};