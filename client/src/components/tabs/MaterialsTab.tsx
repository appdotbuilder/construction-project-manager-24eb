import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PlusIcon, PackageIcon } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import type { Material, CreateMaterialInput } from '../../../../server/src/schema';

interface MaterialsTabProps {
  projectId: number;
  materials: Material[];
  onMaterialsUpdated: (materials: Material[]) => void;
}

export function MaterialsTab({ projectId, materials, onMaterialsUpdated }: MaterialsTabProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateMaterialInput>({
    project_id: projectId,
    name: '',
    quantity: 1,
    unit: '',
    price_per_unit: 0,
    purchase_date: null
  });

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newMaterial = await trpc.createMaterial.mutate(formData);
      onMaterialsUpdated([...materials, newMaterial]);
      setIsCreateDialogOpen(false);
      setFormData({
        project_id: projectId,
        name: '',
        quantity: 1,
        unit: '',
        price_per_unit: 0,
        purchase_date: null
      });
    } catch (error) {
      console.error('Failed to create material:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const totalMaterialsCost = materials.reduce((sum, material) => 
    sum + (material.quantity * material.price_per_unit), 0
  );

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Materials</h2>
          <p className="text-gray-600 mt-1">
            {materials.length} items • Total cost: ${totalMaterialsCost.toFixed(2)}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-500 hover:bg-purple-600">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Material</DialogTitle>
              <DialogDescription>
                Add a material item to track costs for this project.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateMaterial} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Material Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateMaterialInput) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g., Concrete, Steel bars, Paint"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateMaterialInput) => ({ ...prev, unit: e.target.value }))
                    }
                    placeholder="e.g., kg, meter, piece, gallon"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateMaterialInput) => ({ 
                        ...prev, 
                        quantity: parseFloat(e.target.value) || 0 
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price_per_unit">Price per Unit ($) *</Label>
                  <Input
                    id="price_per_unit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_per_unit}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateMaterialInput) => ({ 
                        ...prev, 
                        price_per_unit: parseFloat(e.target.value) || 0 
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formatDateForInput(formData.purchase_date)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateMaterialInput) => ({
                      ...prev,
                      purchase_date: e.target.value ? new Date(e.target.value) : null
                    }))
                  }
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Cost Preview:</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(formData.quantity * formData.price_per_unit).toFixed(2)}
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Material'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Materials List */}
      {materials.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="p-8 text-center">
            <PackageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No materials yet</h3>
            <p className="text-gray-500 mb-4">Start by adding materials needed for this project.</p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add First Material</Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {materials.map((material: Material) => (
            <Card key={material.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <PackageIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{material.name}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{material.quantity} {material.unit}</span>
                        <span>${material.price_per_unit.toFixed(2)} per {material.unit}</span>
                        {material.purchase_date && (
                          <span>Purchased: {material.purchase_date.toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      ${(material.quantity * material.price_per_unit).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Total Cost
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Materials Summary */}
      {materials.length > 0 && (
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-purple-900 mb-3">Materials Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-800">{materials.length}</div>
                <div className="text-sm text-purple-600">Total Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-800">
                  {materials.reduce((sum, material) => sum + material.quantity, 0).toFixed(2)}
                </div>
                <div className="text-sm text-purple-600">Total Quantity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-800">${totalMaterialsCost.toFixed(2)}</div>
                <div className="text-sm text-purple-600">Total Cost</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}