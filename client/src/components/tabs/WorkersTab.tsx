import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PlusIcon, UsersIcon, EditIcon } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import type { Worker, CreateWorkerInput, UpdateWorkerInput } from '../../../../server/src/schema';

interface WorkersTabProps {
  projectId: number;
  workers: Worker[];
  onWorkersUpdated: (workers: Worker[]) => void;
}

export function WorkersTab({ projectId, workers, onWorkersUpdated }: WorkersTabProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateWorkerInput>({
    project_id: projectId,
    name: '',
    daily_pay_rate: 0,
    days_worked: 0,
    start_date: null,
    end_date: null
  });

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newWorker = await trpc.createWorker.mutate(formData);
      onWorkersUpdated([...workers, newWorker]);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create worker:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateWorkerInput = {
        id: editingWorker.id,
        name: formData.name,
        daily_pay_rate: formData.daily_pay_rate,
        days_worked: formData.days_worked,
        start_date: formData.start_date,
        end_date: formData.end_date
      };
      const updatedWorker = await trpc.updateWorker.mutate(updateData);
      onWorkersUpdated(workers.map(worker => worker.id === editingWorker.id ? updatedWorker : worker));
      setEditingWorker(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update worker:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: projectId,
      name: '',
      daily_pay_rate: 0,
      days_worked: 0,
      start_date: null,
      end_date: null
    });
  };

  const openEditDialog = (worker: Worker) => {
    setEditingWorker(worker);
    setFormData({
      project_id: projectId,
      name: worker.name,
      daily_pay_rate: worker.daily_pay_rate,
      days_worked: worker.days_worked,
      start_date: worker.start_date,
      end_date: worker.end_date
    });
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const totalWorkersCost = workers.reduce((sum, worker) => 
    sum + (worker.days_worked * worker.daily_pay_rate), 0
  );

  const totalDaysWorked = workers.reduce((sum, worker) => sum + worker.days_worked, 0);

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Workers</h2>
          <p className="text-gray-600 mt-1">
            {workers.length} workers • {totalDaysWorked} total days • ${totalWorkersCost.toFixed(2)} total cost
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-500 hover:bg-green-600">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Worker
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Worker</DialogTitle>
              <DialogDescription>
                Add a worker to track labor costs for this project.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateWorker} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Worker Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateWorkerInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., John Smith, Maria Garcia"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="daily_pay_rate">Daily Pay Rate ($) *</Label>
                  <Input
                    id="daily_pay_rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.daily_pay_rate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateWorkerInput) => ({ 
                        ...prev, 
                        daily_pay_rate: parseFloat(e.target.value) || 0 
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="days_worked">Days Worked</Label>
                  <Input
                    id="days_worked"
                    type="number"
                    min="0"
                    value={formData.days_worked}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateWorkerInput) => ({ 
                        ...prev, 
                        days_worked: parseInt(e.target.value) || 0 
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formatDateForInput(formData.start_date)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateWorkerInput) => ({
                        ...prev,
                        start_date: e.target.value ? new Date(e.target.value) : null
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formatDateForInput(formData.end_date)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateWorkerInput) => ({
                        ...prev,
                        end_date: e.target.value ? new Date(e.target.value) : null
                      }))
                    }
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Cost Preview:</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(formData.days_worked * formData.daily_pay_rate).toFixed(2)}
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Worker'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Worker Dialog */}
      <Dialog open={!!editingWorker} onOpenChange={(open) => !open && setEditingWorker(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Worker</DialogTitle>
            <DialogDescription>
              Update worker information and days worked.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateWorker} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Worker Name *</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateWorkerInput) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_daily_pay_rate">Daily Pay Rate ($) *</Label>
                <Input
                  id="edit_daily_pay_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.daily_pay_rate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateWorkerInput) => ({ 
                      ...prev, 
                      daily_pay_rate: parseFloat(e.target.value) || 0 
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_days_worked">Days Worked</Label>
                <Input
                  id="edit_days_worked"
                  type="number"
                  min="0"
                  value={formData.days_worked}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateWorkerInput) => ({ 
                      ...prev, 
                      days_worked: parseInt(e.target.value) || 0 
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_start_date">Start Date</Label>
                <Input
                  id="edit_start_date"
                  type="date"
                  value={formatDateForInput(formData.start_date)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateWorkerInput) => ({
                      ...prev,
                      start_date: e.target.value ? new Date(e.target.value) : null
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_end_date">End Date</Label>
                <Input
                  id="edit_end_date"
                  type="date"
                  value={formatDateForInput(formData.end_date)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateWorkerInput) => ({
                      ...prev,
                      end_date: e.target.value ? new Date(e.target.value) : null
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditingWorker(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Worker'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Workers List */}
      {workers.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="p-8 text-center">
            <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No workers yet</h3>
            <p className="text-gray-500 mb-4">Start by adding workers to track labor costs.</p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add First Worker</Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {workers.map((worker: Worker) => (
            <Card key={worker.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <UsersIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{worker.name}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>${worker.daily_pay_rate.toFixed(2)}/day</span>
                        <span>{worker.days_worked} days worked</span>
                        {worker.start_date && (
                          <span>Started: {worker.start_date.toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        ${(worker.days_worked * worker.daily_pay_rate).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Total Earned
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(worker)}>
                      <EditIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Workers Summary */}
      {workers.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-green-900 mb-3">Workers Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-800">{workers.length}</div>
                <div className="text-sm text-green-600">Total Workers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-800">{totalDaysWorked}</div>
                <div className="text-sm text-green-600">Total Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-800">${totalWorkersCost.toFixed(2)}</div>
                <div className="text-sm text-green-600">Total Cost</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}