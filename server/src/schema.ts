import { z } from 'zod';

// Project schemas
export const projectSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().nullable(),
  status: z.enum(['planning', 'in_progress', 'completed', 'on_hold']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Project = z.infer<typeof projectSchema>;

export const createProjectInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().nullable(),
  status: z.enum(['planning', 'in_progress', 'completed', 'on_hold']).default('planning')
});

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

export const updateProjectInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().nullable().optional(),
  status: z.enum(['planning', 'in_progress', 'completed', 'on_hold']).optional()
});

export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;

// Task schemas
export const taskSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  description: z.string(),
  duration_days: z.number().int().positive(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

export const createTaskInputSchema = z.object({
  project_id: z.number(),
  description: z.string().min(1),
  duration_days: z.number().int().positive(),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending')
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

export const updateTaskInputSchema = z.object({
  id: z.number(),
  description: z.string().min(1).optional(),
  duration_days: z.number().int().positive().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Material schemas
export const materialSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  name: z.string(),
  quantity: z.number().positive(),
  unit: z.string(),
  price_per_unit: z.number().positive(),
  purchase_date: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Material = z.infer<typeof materialSchema>;

export const createMaterialInputSchema = z.object({
  project_id: z.number(),
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  price_per_unit: z.number().positive(),
  purchase_date: z.coerce.date().nullable()
});

export type CreateMaterialInput = z.infer<typeof createMaterialInputSchema>;

export const updateMaterialInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().min(1).optional(),
  price_per_unit: z.number().positive().optional(),
  purchase_date: z.coerce.date().nullable().optional()
});

export type UpdateMaterialInput = z.infer<typeof updateMaterialInputSchema>;

// Worker schemas
export const workerSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  name: z.string(),
  daily_pay_rate: z.number().positive(),
  days_worked: z.number().int().nonnegative(),
  start_date: z.coerce.date().nullable(),
  end_date: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Worker = z.infer<typeof workerSchema>;

export const createWorkerInputSchema = z.object({
  project_id: z.number(),
  name: z.string().min(1),
  daily_pay_rate: z.number().positive(),
  days_worked: z.number().int().nonnegative().default(0),
  start_date: z.coerce.date().nullable(),
  end_date: z.coerce.date().nullable()
});

export type CreateWorkerInput = z.infer<typeof createWorkerInputSchema>;

export const updateWorkerInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  daily_pay_rate: z.number().positive().optional(),
  days_worked: z.number().int().nonnegative().optional(),
  start_date: z.coerce.date().nullable().optional(),
  end_date: z.coerce.date().nullable().optional()
});

export type UpdateWorkerInput = z.infer<typeof updateWorkerInputSchema>;

// Other Expense schemas
export const otherExpenseSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number().positive(),
  expense_date: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type OtherExpense = z.infer<typeof otherExpenseSchema>;

export const createOtherExpenseInputSchema = z.object({
  project_id: z.number(),
  name: z.string().min(1),
  description: z.string().nullable(),
  price: z.number().positive(),
  expense_date: z.coerce.date().nullable()
});

export type CreateOtherExpenseInput = z.infer<typeof createOtherExpenseInputSchema>;

export const updateOtherExpenseInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive().optional(),
  expense_date: z.coerce.date().nullable().optional()
});

export type UpdateOtherExpenseInput = z.infer<typeof updateOtherExpenseInputSchema>;

// Project Photo schemas
export const projectPhotoSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  filename: z.string(),
  original_name: z.string(),
  file_path: z.string(),
  file_size: z.number().int().positive(),
  mime_type: z.string(),
  description: z.string().nullable(),
  photo_type: z.enum(['before', 'progress', 'after', 'other']),
  created_at: z.coerce.date()
});

export type ProjectPhoto = z.infer<typeof projectPhotoSchema>;

export const createProjectPhotoInputSchema = z.object({
  project_id: z.number(),
  filename: z.string().min(1),
  original_name: z.string().min(1),
  file_path: z.string().min(1),
  file_size: z.number().int().positive(),
  mime_type: z.string().min(1),
  description: z.string().nullable(),
  photo_type: z.enum(['before', 'progress', 'after', 'other']).default('other')
});

export type CreateProjectPhotoInput = z.infer<typeof createProjectPhotoInputSchema>;

// Cost calculation schemas
export const projectCostSummarySchema = z.object({
  project_id: z.number(),
  materials_cost: z.number(),
  workers_cost: z.number(),
  other_expenses_cost: z.number(),
  total_cost: z.number(),
  as_of_date: z.coerce.date().nullable()
});

export type ProjectCostSummary = z.infer<typeof projectCostSummarySchema>;

export const getCostSummaryInputSchema = z.object({
  project_id: z.number(),
  as_of_date: z.coerce.date().nullable()
});

export type GetCostSummaryInput = z.infer<typeof getCostSummaryInputSchema>;

// Receipt schema
export const receiptSchema = z.object({
  project: projectSchema,
  cost_summary: projectCostSummarySchema,
  materials: z.array(materialSchema),
  workers: z.array(workerSchema),
  other_expenses: z.array(otherExpenseSchema),
  generated_at: z.coerce.date()
});

export type Receipt = z.infer<typeof receiptSchema>;

export const generateReceiptInputSchema = z.object({
  project_id: z.number()
});

export type GenerateReceiptInput = z.infer<typeof generateReceiptInputSchema>;