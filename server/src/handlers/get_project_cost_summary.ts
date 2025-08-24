import { db } from '../db';
import { materialsTable, workersTable, otherExpensesTable } from '../db/schema';
import { type GetCostSummaryInput, type ProjectCostSummary } from '../schema';
import { eq, lte, and, sql, sum } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const getProjectCostSummary = async (input: GetCostSummaryInput): Promise<ProjectCostSummary> => {
  try {
    const { project_id, as_of_date } = input;

    // Calculate materials cost
    const materialConditions: SQL<unknown>[] = [eq(materialsTable.project_id, project_id)];
    
    if (as_of_date) {
      materialConditions.push(lte(materialsTable.purchase_date, as_of_date));
    }

    const materialsQuery = db
      .select({ 
        total: sql<string>`sum(${materialsTable.quantity}::numeric * ${materialsTable.price_per_unit}::numeric)` 
      })
      .from(materialsTable)
      .where(materialConditions.length === 1 ? materialConditions[0] : and(...materialConditions));
    
    const materialsResult = await materialsQuery.execute();
    const materials_cost = parseFloat(materialsResult[0]?.total || '0');

    // Calculate workers cost
    const workerConditions: SQL<unknown>[] = [eq(workersTable.project_id, project_id)];
    
    if (as_of_date) {
      workerConditions.push(lte(workersTable.start_date, as_of_date));
    }

    const workersQuery = db
      .select({ 
        total: sql<string>`sum(${workersTable.days_worked}::numeric * ${workersTable.daily_pay_rate}::numeric)` 
      })
      .from(workersTable)
      .where(workerConditions.length === 1 ? workerConditions[0] : and(...workerConditions));
    
    const workersResult = await workersQuery.execute();
    const workers_cost = parseFloat(workersResult[0]?.total || '0');

    // Calculate other expenses cost
    const expenseConditions: SQL<unknown>[] = [eq(otherExpensesTable.project_id, project_id)];
    
    if (as_of_date) {
      expenseConditions.push(lte(otherExpensesTable.expense_date, as_of_date));
    }

    const expensesQuery = db
      .select({ total: sql<string>`sum(${otherExpensesTable.price}::numeric)` })
      .from(otherExpensesTable)
      .where(expenseConditions.length === 1 ? expenseConditions[0] : and(...expenseConditions));
    
    const expensesResult = await expensesQuery.execute();
    const other_expenses_cost = parseFloat(expensesResult[0]?.total || '0');

    // Calculate total cost
    const total_cost = materials_cost + workers_cost + other_expenses_cost;

    return {
      project_id,
      materials_cost,
      workers_cost,
      other_expenses_cost,
      total_cost,
      as_of_date: as_of_date || null
    };
  } catch (error) {
    console.error('Cost summary calculation failed:', error);
    throw error;
  }
};