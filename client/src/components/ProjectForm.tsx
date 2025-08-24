import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import type { CreateProjectInput } from '../../../server/src/schema';

interface ProjectFormProps {
  onSubmit: (data: CreateProjectInput) => Promise<void>;
  isLoading?: boolean;
}

export function ProjectForm({ onSubmit, isLoading = false }: ProjectFormProps) {
  const [formData, setFormData] = useState<CreateProjectInput>({
    name: '',
    description: null,
    start_date: new Date(),
    end_date: null,
    status: 'planning'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // Reset form after successful submission
    setFormData({
      name: '',
      description: null,
      start_date: new Date(),
      end_date: null,
      status: 'planning'
    });
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Project Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateProjectInput) => ({ ...prev, name: e.target.value }))
          }
          placeholder="e.g., Kitchen Renovation, Office Building Construction"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateProjectInput) => ({
              ...prev,
              description: e.target.value || null
            }))
          }
          placeholder="Brief description of the construction project..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Start Date *</Label>
          <Input
            id="start_date"
            type="date"
            value={formatDateForInput(formData.start_date)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateProjectInput) => ({
                ...prev,
                start_date: new Date(e.target.value)
              }))
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">End Date (Expected)</Label>
          <Input
            id="end_date"
            type="date"
            value={formatDateForInput(formData.end_date)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateProjectInput) => ({
                ...prev,
                end_date: e.target.value ? new Date(e.target.value) : null
              }))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Project Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value: 'planning' | 'in_progress' | 'completed' | 'on_hold') =>
            setFormData((prev: CreateProjectInput) => ({ ...prev, status: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select project status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="planning">📋 Planning</SelectItem>
            <SelectItem value="in_progress">🚧 In Progress</SelectItem>
            <SelectItem value="completed">✅ Completed</SelectItem>
            <SelectItem value="on_hold">⏸️ On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={isLoading} className="bg-orange-500 hover:bg-orange-600">
          {isLoading ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}