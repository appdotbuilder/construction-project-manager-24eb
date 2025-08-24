import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftIcon, DollarSignIcon, ClockIcon, UsersIcon, PackageIcon, ReceiptIcon } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';

import { TasksTab } from '@/components/tabs/TasksTab';
import { MaterialsTab } from '@/components/tabs/MaterialsTab';
import { WorkersTab } from '@/components/tabs/WorkersTab';
import { ExpensesTab } from '@/components/tabs/ExpensesTab';
import { PhotosTab } from '@/components/tabs/PhotosTab';
import { CostSummary } from '@/components/CostSummary';
import { ProjectReceipt } from '@/components/ProjectReceipt';

import type { Project, Task, Material, Worker, OtherExpense, ProjectPhoto, ProjectCostSummary } from '../../../server/src/schema';

interface ProjectDetailsProps {
  project: Project;
  onBack: () => void;
  onProjectUpdated: (project: Project) => void;
}

export function ProjectDetails({ project, onBack, onProjectUpdated }: ProjectDetailsProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [expenses, setExpenses] = useState<OtherExpense[]>([]);
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [costSummary, setCostSummary] = useState<ProjectCostSummary | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Load all project data
  const loadProjectData = useCallback(async () => {
    try {
      const [tasksData, materialsData, workersData, expensesData, photosData, costData] = await Promise.all([
        trpc.getProjectTasks.query({ projectId: project.id }),
        trpc.getProjectMaterials.query({ projectId: project.id }),
        trpc.getProjectWorkers.query({ projectId: project.id }),
        trpc.getProjectOtherExpenses.query({ projectId: project.id }),
        trpc.getProjectPhotos.query({ projectId: project.id }),
        trpc.getProjectCostSummary.query({ project_id: project.id, as_of_date: null })
      ]);

      setTasks(tasksData);
      setMaterials(materialsData);
      setWorkers(workersData);
      setExpenses(expensesData);
      setPhotos(photosData);
      setCostSummary(costData);
    } catch (error) {
      console.error('Failed to load project data:', error);
    }
  }, [project.id]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default' as const;
      case 'in_progress':
        return 'destructive' as const;
      case 'on_hold':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      case 'on_hold':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalDuration = tasks.reduce((sum, task) => sum + task.duration_days, 0);
  const completedDuration = tasks
    .filter(t => t.status === 'completed')
    .reduce((sum, task) => sum + task.duration_days, 0);
  const progressPercentage = totalDuration > 0 ? (completedDuration / totalDuration) * 100 : 0;

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <Badge variant={getStatusBadgeVariant(project.status)} className={getStatusColor(project.status)}>
                {project.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            {project.description && (
              <p className="text-gray-600">{project.description}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 mb-1">
            📅 {project.start_date.toLocaleDateString()} - {project.end_date ? project.end_date.toLocaleDateString() : 'Ongoing'}
          </div>
          <div className="text-sm text-gray-500">
            🕐 Created {project.created_at.toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Tasks Progress</p>
                <p className="text-2xl font-bold text-blue-800">{completedTasks}/{tasks.length}</p>
                <p className="text-xs text-blue-600">{progressPercentage.toFixed(0)}% Complete</p>
              </div>
              <ClockIcon className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Total Cost</p>
                <p className="text-2xl font-bold text-green-800">
                  ${costSummary ? costSummary.total_cost.toFixed(2) : '0.00'}
                </p>
              </div>
              <DollarSignIcon className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Materials</p>
                <p className="text-2xl font-bold text-purple-800">{materials.length}</p>
              </div>
              <PackageIcon className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">Workers</p>
                <p className="text-2xl font-bold text-orange-800">{workers.length}</p>
              </div>
              <UsersIcon className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="receipt">Receipt</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <CostSummary costSummary={costSummary} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <TasksTab
            projectId={project.id}
            tasks={tasks}
            onTasksUpdated={setTasks}
          />
        </TabsContent>

        <TabsContent value="materials" className="mt-6">
          <MaterialsTab
            projectId={project.id}
            materials={materials}
            onMaterialsUpdated={(updatedMaterials) => {
              setMaterials(updatedMaterials);
              loadProjectData(); // Refresh cost summary
            }}
          />
        </TabsContent>

        <TabsContent value="workers" className="mt-6">
          <WorkersTab
            projectId={project.id}
            workers={workers}
            onWorkersUpdated={(updatedWorkers) => {
              setWorkers(updatedWorkers);
              loadProjectData(); // Refresh cost summary
            }}
          />
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <ExpensesTab
            projectId={project.id}
            expenses={expenses}
            onExpensesUpdated={(updatedExpenses) => {
              setExpenses(updatedExpenses);
              loadProjectData(); // Refresh cost summary
            }}
          />
        </TabsContent>

        <TabsContent value="photos" className="mt-6">
          <PhotosTab
            projectId={project.id}
            photos={photos}
            onPhotosUpdated={setPhotos}
          />
        </TabsContent>

        <TabsContent value="receipt" className="mt-6">
          <ProjectReceipt projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}