import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const projectStatusEnum = pgEnum('project_status', ['planning', 'in_progress', 'completed', 'on_hold']);
export const taskStatusEnum = pgEnum('task_status', ['pending', 'in_progress', 'completed']);
export const photoTypeEnum = pgEnum('photo_type', ['before', 'progress', 'after', 'other']);

// Projects table
export const projectsTable = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable
  start_date: timestamp('start_date').notNull(),
  end_date: timestamp('end_date'), // Nullable
  status: projectStatusEnum('status').notNull().default('planning'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Tasks table
export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').notNull().references(() => projectsTable.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  duration_days: integer('duration_days').notNull(),
  status: taskStatusEnum('status').notNull().default('pending'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Materials table
export const materialsTable = pgTable('materials', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').notNull().references(() => projectsTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  unit: text('unit').notNull(),
  price_per_unit: numeric('price_per_unit', { precision: 10, scale: 2 }).notNull(),
  purchase_date: timestamp('purchase_date'), // Nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Workers table
export const workersTable = pgTable('workers', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').notNull().references(() => projectsTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  daily_pay_rate: numeric('daily_pay_rate', { precision: 10, scale: 2 }).notNull(),
  days_worked: integer('days_worked').notNull().default(0),
  start_date: timestamp('start_date'), // Nullable
  end_date: timestamp('end_date'), // Nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Other expenses table
export const otherExpensesTable = pgTable('other_expenses', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').notNull().references(() => projectsTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'), // Nullable
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  expense_date: timestamp('expense_date'), // Nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Project photos table
export const projectPhotosTable = pgTable('project_photos', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').notNull().references(() => projectsTable.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  original_name: text('original_name').notNull(),
  file_path: text('file_path').notNull(),
  file_size: integer('file_size').notNull(),
  mime_type: text('mime_type').notNull(),
  description: text('description'), // Nullable
  photo_type: photoTypeEnum('photo_type').notNull().default('other'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const projectsRelations = relations(projectsTable, ({ many }) => ({
  tasks: many(tasksTable),
  materials: many(materialsTable),
  workers: many(workersTable),
  otherExpenses: many(otherExpensesTable),
  photos: many(projectPhotosTable),
}));

export const tasksRelations = relations(tasksTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [tasksTable.project_id],
    references: [projectsTable.id],
  }),
}));

export const materialsRelations = relations(materialsTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [materialsTable.project_id],
    references: [projectsTable.id],
  }),
}));

export const workersRelations = relations(workersTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [workersTable.project_id],
    references: [projectsTable.id],
  }),
}));

export const otherExpensesRelations = relations(otherExpensesTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [otherExpensesTable.project_id],
    references: [projectsTable.id],
  }),
}));

export const projectPhotosRelations = relations(projectPhotosTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [projectPhotosTable.project_id],
    references: [projectsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Project = typeof projectsTable.$inferSelect;
export type NewProject = typeof projectsTable.$inferInsert;

export type Task = typeof tasksTable.$inferSelect;
export type NewTask = typeof tasksTable.$inferInsert;

export type Material = typeof materialsTable.$inferSelect;
export type NewMaterial = typeof materialsTable.$inferInsert;

export type Worker = typeof workersTable.$inferSelect;
export type NewWorker = typeof workersTable.$inferInsert;

export type OtherExpense = typeof otherExpensesTable.$inferSelect;
export type NewOtherExpense = typeof otherExpensesTable.$inferInsert;

export type ProjectPhoto = typeof projectPhotosTable.$inferSelect;
export type NewProjectPhoto = typeof projectPhotosTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  projects: projectsTable,
  tasks: tasksTable,
  materials: materialsTable,
  workers: workersTable,
  otherExpenses: otherExpensesTable,
  projectPhotos: projectPhotosTable,
};