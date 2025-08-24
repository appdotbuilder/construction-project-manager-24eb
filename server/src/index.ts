import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createProjectInputSchema,
  updateProjectInputSchema,
  createTaskInputSchema,
  updateTaskInputSchema,
  createMaterialInputSchema,
  updateMaterialInputSchema,
  createWorkerInputSchema,
  updateWorkerInputSchema,
  createOtherExpenseInputSchema,
  updateOtherExpenseInputSchema,
  createProjectPhotoInputSchema,
  getCostSummaryInputSchema,
  generateReceiptInputSchema
} from './schema';

// Import handlers
import { createProject } from './handlers/create_project';
import { getProjects } from './handlers/get_projects';
import { getProjectById } from './handlers/get_project_by_id';
import { updateProject } from './handlers/update_project';

import { createTask } from './handlers/create_task';
import { getProjectTasks } from './handlers/get_project_tasks';
import { updateTask } from './handlers/update_task';

import { createMaterial } from './handlers/create_material';
import { getProjectMaterials } from './handlers/get_project_materials';
import { updateMaterial } from './handlers/update_material';

import { createWorker } from './handlers/create_worker';
import { getProjectWorkers } from './handlers/get_project_workers';
import { updateWorker } from './handlers/update_worker';

import { createOtherExpense } from './handlers/create_other_expense';
import { getProjectOtherExpenses } from './handlers/get_project_other_expenses';
import { updateOtherExpense } from './handlers/update_other_expense';

import { createProjectPhoto } from './handlers/create_project_photo';
import { getProjectPhotos } from './handlers/get_project_photos';

import { getProjectCostSummary } from './handlers/get_project_cost_summary';
import { generateProjectReceipt } from './handlers/generate_project_receipt';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Project routes
  createProject: publicProcedure
    .input(createProjectInputSchema)
    .mutation(({ input }) => createProject(input)),

  getProjects: publicProcedure
    .query(() => getProjects()),

  getProjectById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getProjectById(input.id)),

  updateProject: publicProcedure
    .input(updateProjectInputSchema)
    .mutation(({ input }) => updateProject(input)),

  // Task routes
  createTask: publicProcedure
    .input(createTaskInputSchema)
    .mutation(({ input }) => createTask(input)),

  getProjectTasks: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => getProjectTasks(input.projectId)),

  updateTask: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input }) => updateTask(input)),

  // Material routes
  createMaterial: publicProcedure
    .input(createMaterialInputSchema)
    .mutation(({ input }) => createMaterial(input)),

  getProjectMaterials: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => getProjectMaterials(input.projectId)),

  updateMaterial: publicProcedure
    .input(updateMaterialInputSchema)
    .mutation(({ input }) => updateMaterial(input)),

  // Worker routes
  createWorker: publicProcedure
    .input(createWorkerInputSchema)
    .mutation(({ input }) => createWorker(input)),

  getProjectWorkers: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => getProjectWorkers(input.projectId)),

  updateWorker: publicProcedure
    .input(updateWorkerInputSchema)
    .mutation(({ input }) => updateWorker(input)),

  // Other expense routes
  createOtherExpense: publicProcedure
    .input(createOtherExpenseInputSchema)
    .mutation(({ input }) => createOtherExpense(input)),

  getProjectOtherExpenses: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => getProjectOtherExpenses(input.projectId)),

  updateOtherExpense: publicProcedure
    .input(updateOtherExpenseInputSchema)
    .mutation(({ input }) => updateOtherExpense(input)),

  // Photo routes
  createProjectPhoto: publicProcedure
    .input(createProjectPhotoInputSchema)
    .mutation(({ input }) => createProjectPhoto(input)),

  getProjectPhotos: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => getProjectPhotos(input.projectId)),

  // Cost tracking routes
  getProjectCostSummary: publicProcedure
    .input(getCostSummaryInputSchema)
    .query(({ input }) => getProjectCostSummary(input)),

  // Receipt generation route
  generateProjectReceipt: publicProcedure
    .input(generateReceiptInputSchema)
    .query(({ input }) => generateProjectReceipt(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();