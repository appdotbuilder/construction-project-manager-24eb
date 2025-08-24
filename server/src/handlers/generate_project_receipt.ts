import { db } from '../db';
import { projectsTable, materialsTable, workersTable, otherExpensesTable } from '../db/schema';
import { type GenerateReceiptInput, type Receipt } from '../schema';
import { eq } from 'drizzle-orm';

export const generateProjectReceipt = async (input: GenerateReceiptInput): Promise<Receipt> => {
  try {
    // Fetch project details
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, input.project_id))
      .execute();

    if (projects.length === 0) {
      throw new Error(`Project with ID ${input.project_id} not found`);
    }

    const project = projects[0];

    // Fetch all materials for the project
    const materialsResult = await db.select()
      .from(materialsTable)
      .where(eq(materialsTable.project_id, input.project_id))
      .execute();

    // Convert numeric fields for materials
    const materials = materialsResult.map(material => ({
      ...material,
      quantity: parseFloat(material.quantity),
      price_per_unit: parseFloat(material.price_per_unit)
    }));

    // Fetch all workers for the project
    const workersResult = await db.select()
      .from(workersTable)
      .where(eq(workersTable.project_id, input.project_id))
      .execute();

    // Convert numeric fields for workers
    const workers = workersResult.map(worker => ({
      ...worker,
      daily_pay_rate: parseFloat(worker.daily_pay_rate)
    }));

    // Fetch all other expenses for the project
    const otherExpensesResult = await db.select()
      .from(otherExpensesTable)
      .where(eq(otherExpensesTable.project_id, input.project_id))
      .execute();

    // Convert numeric fields for other expenses
    const otherExpenses = otherExpensesResult.map(expense => ({
      ...expense,
      price: parseFloat(expense.price)
    }));

    // Calculate cost summary
    const materials_cost = materials.reduce((sum, material) => {
      return sum + (material.quantity * material.price_per_unit);
    }, 0);

    const workers_cost = workers.reduce((sum, worker) => {
      return sum + (worker.days_worked * worker.daily_pay_rate);
    }, 0);

    const other_expenses_cost = otherExpenses.reduce((sum, expense) => {
      return sum + expense.price;
    }, 0);

    const total_cost = materials_cost + workers_cost + other_expenses_cost;

    const cost_summary = {
      project_id: input.project_id,
      materials_cost,
      workers_cost,
      other_expenses_cost,
      total_cost,
      as_of_date: null
    };

    return {
      project,
      cost_summary,
      materials,
      workers,
      other_expenses: otherExpenses,
      generated_at: new Date()
    };
  } catch (error) {
    console.error('Receipt generation failed:', error);
    throw error;
  }
};