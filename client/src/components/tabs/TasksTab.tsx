import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { PlusIcon, ClockIcon, CheckCircleIcon, CircleIcon, PlayCircleIcon } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../../../server/src/schema';

interface TasksTabProps {
  projectId: number;
  tasks: Task[];
  onTasksUpdated: (tasks: Task[]) => void;
}

export function TasksTab({ projectId, tasks, onTasksUpdated }: TasksTabProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTaskInput>({
    project_id: projectId,
    description: '',
    duration_days: 1,
    status: 'pending'
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newTask = await trpc.createTask.mutate(formData);
      onTasksUpdated([...tasks, newTask]);
      setIsCreateDialogOpen(false);
      setFormData({
        project_id: projectId,
        description: '',
        duration_days: 1,
        status: 'pending'
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: 'pending' | 'in_progress' | 'completed') => {
    try {
      const updateData: UpdateTaskInput = { id: taskId, status: newStatus };
      const updatedTask = await trpc.updateTask.mutate(updateData);
      onTasksUpdated(tasks.map(task => task.id === taskId ? updatedTask : task));
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <PlayCircleIcon className="w-4 h-4 text-blue-600" />;
      default:
        return <CircleIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default' as const;
      case 'in_progress':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalDuration = tasks.reduce((sum, task) => sum + task.duration_days, 0);
  const completedDuration = tasks
    .filter(t => t.status === 'completed')
    .reduce((sum, task) => sum + task.duration_days, 0);

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Project Tasks</h2>
          <p className="text-gray-600 mt-1">
            {completedTasks}/{tasks.length} tasks completed • {completedDuration}/{totalDuration} days
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
              <DialogDescription>
                Create a new task for this project.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Task Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateTaskInput) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="e.g., Install electrical wiring, Paint walls"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (Days) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration_days}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateTaskInput) => ({ 
                      ...prev, 
                      duration_days: parseInt(e.target.value) || 1 
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Initial Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'pending' | 'in_progress' | 'completed') =>
                    setFormData((prev: CreateTaskInput) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">⏳ Pending</SelectItem>
                    <SelectItem value="in_progress">🚧 In Progress</SelectItem>
                    <SelectItem value="completed">✅ Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Task'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="p-8 text-center">
            <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No tasks yet</h3>
            <p className="text-gray-500 mb-4">Start by adding your first task to track project progress.</p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add First Task</Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task: Task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(task.status)}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{task.description}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {task.duration_days} day{task.duration_days !== 1 ? 's' : ''}
                        </span>
                        <span>Created: {task.created_at.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusBadgeVariant(task.status)} className={getStatusColor(task.status)}>
                      {task.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    
                    <Select
                      value={task.status}
                      onValueChange={(value: 'pending' | 'in_progress' | 'completed') =>
                        handleUpdateTaskStatus(task.id, value)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">⏳ Pending</SelectItem>
                        <SelectItem value="in_progress">🚧 In Progress</SelectItem>
                        <SelectItem value="completed">✅ Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Progress Summary */}
      {tasks.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Task Progress Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Pending: </span>
                <span className="font-medium">{tasks.filter(t => t.status === 'pending').length}</span>
              </div>
              <div>
                <span className="text-gray-600">In Progress: </span>
                <span className="font-medium">{tasks.filter(t => t.status === 'in_progress').length}</span>
              </div>
              <div>
                <span className="text-gray-600">Completed: </span>
                <span className="font-medium">{completedTasks}</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Progress</span>
                <span>{totalDuration > 0 ? ((completedDuration / totalDuration) * 100).toFixed(0) : 0}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: totalDuration > 0 ? `${(completedDuration / totalDuration) * 100}%` : '0%'
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}