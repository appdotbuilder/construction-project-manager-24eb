import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PlusIcon, CreditCardIcon } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import type { OtherExpense, CreateOtherExpenseInput } from '../../../../server/src/schema';

interface ExpensesTabProps {
  projectId: number;
  expenses: OtherExpense[];
  onExpensesUpdated: (expenses: OtherExpense[]) => void;
}

export function ExpensesTab({ projectId, expenses, onExpensesUpdated }: ExpensesTabProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateOtherExpenseInput>({
    project_id: projectId,
    name: '',
    description: null,
    price: 0,
    expense_date: null
  });

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newExpense = await trpc.createOtherExpense.mutate(formData);
      onExpensesUpdated([...expenses, newExpense]);
      setIsCreateDialogOpen(false);
      setFormData({
        project_id: projectId,
        name: '',
        description: null,
        price: 0,
        expense_date: null
      });
    } catch (error) {
      console.error('Failed to create expense:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const totalExpensesCost = expenses.reduce((sum, expense) => sum + expense.price, 0);

  const getExpenseIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('fuel') || lowerName.includes('gas')) return '⛽';
    if (lowerName.includes('tool') || lowerName.includes('equipment')) return '🔨';
    if (lowerName.includes('permit') || lowerName.includes('license')) return '📋';
    if (lowerName.includes('transport') || lowerName.includes('delivery')) return '🚚';
    if (lowerName.includes('food') || lowerName.includes('meal')) return '🍽️';
    return '💰';
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Other Expenses</h2>
          <p className="text-gray-600 mt-1">
            {expenses.length} expenses • Total cost: ${totalExpensesCost.toFixed(2)}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-500 hover:bg-indigo-600">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>
                Add a miscellaneous expense to track additional project costs.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Expense Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateOtherExpenseInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Fuel, Equipment Rental, Permits, Transportation"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateOtherExpenseInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  placeholder="Additional details about this expense..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateOtherExpenseInput) => ({ 
                        ...prev, 
                        price: parseFloat(e.target.value) || 0 
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expense_date">Expense Date</Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={formatDateForInput(formData.expense_date)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateOtherExpenseInput) => ({
                        ...prev,
                        expense_date: e.target.value ? new Date(e.target.value) : null
                      }))
                    }
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Expense Amount:</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${formData.price.toFixed(2)}
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Expense'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="p-8 text-center">
            <CreditCardIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No expenses yet</h3>
            <p className="text-gray-500 mb-4">Track additional project costs like fuel, permits, and equipment rental.</p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add First Expense</Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense: OtherExpense) => (
            <Card key={expense.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">{getExpenseIcon(expense.name)}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{expense.name}</h4>
                      {expense.description && (
                        <p className="text-sm text-gray-600 mt-1">{expense.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        {expense.expense_date && (
                          <span>Date: {expense.expense_date.toLocaleDateString()}</span>
                        )}
                        <span>Added: {expense.created_at.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      ${expense.price.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Cost
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Expenses Summary */}
      {expenses.length > 0 && (
        <Card className="bg-indigo-50 border-indigo-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-indigo-900 mb-3">Expenses Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-800">{expenses.length}</div>
                <div className="text-sm text-indigo-600">Total Expenses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-800">${totalExpensesCost.toFixed(2)}</div>
                <div className="text-sm text-indigo-600">Total Cost</div>
              </div>
            </div>

            {/* Top expenses */}
            {expenses.length > 1 && (
              <div className="mt-4 pt-4 border-t border-indigo-200">
                <h4 className="font-medium text-indigo-900 mb-2">Largest Expenses</h4>
                <div className="space-y-1">
                  {expenses
                    .sort((a, b) => b.price - a.price)
                    .slice(0, 3)
                    .map((expense, index) => (
                      <div key={expense.id} className="flex justify-between text-sm">
                        <span>{expense.name}</span>
                        <span className="font-medium">${expense.price.toFixed(2)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}