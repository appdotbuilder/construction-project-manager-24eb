import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlusIcon, CameraIcon, InfoIcon } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import type { ProjectPhoto, CreateProjectPhotoInput } from '../../../../server/src/schema';

interface PhotosTabProps {
  projectId: number;
  photos: ProjectPhoto[];
  onPhotosUpdated: (photos: ProjectPhoto[]) => void;
}

export function PhotosTab({ projectId, photos, onPhotosUpdated }: PhotosTabProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateProjectPhotoInput>({
    project_id: projectId,
    filename: '',
    original_name: '',
    file_path: '',
    file_size: 0,
    mime_type: '',
    description: null,
    photo_type: 'other'
  });

  // STUB: File upload functionality
  // In a real implementation, this would handle actual file uploads
  const handleCreatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // STUB: Mock photo data - in real implementation, this would come from file upload
      const stubPhotoData: CreateProjectPhotoInput = {
        ...formData,
        filename: `photo_${Date.now()}.jpg`,
        original_name: formData.original_name || 'uploaded_photo.jpg',
        file_path: `/uploads/project_${projectId}/photo_${Date.now()}.jpg`,
        file_size: 2048000, // Mock 2MB file size
        mime_type: 'image/jpeg'
      };
      
      const newPhoto = await trpc.createProjectPhoto.mutate(stubPhotoData);
      onPhotosUpdated([...photos, newPhoto]);
      setIsCreateDialogOpen(false);
      setFormData({
        project_id: projectId,
        filename: '',
        original_name: '',
        file_path: '',
        file_size: 0,
        mime_type: '',
        description: null,
        photo_type: 'other'
      });
    } catch (error) {
      console.error('Failed to create photo record:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPhotoTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'before':
        return 'secondary' as const;
      case 'progress':
        return 'destructive' as const;
      case 'after':
        return 'default' as const;
      default:
        return 'outline' as const;
    }
  };

  const getPhotoTypeColor = (type: string) => {
    switch (type) {
      case 'before':
        return 'text-gray-600';
      case 'progress':
        return 'text-blue-600';
      case 'after':
        return 'text-green-600';
      default:
        return 'text-purple-600';
    }
  };

  const getPhotoTypeEmoji = (type: string) => {
    switch (type) {
      case 'before':
        return '📸';
      case 'progress':
        return '🚧';
      case 'after':
        return '✨';
      default:
        return '📷';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const groupedPhotos = {
    before: photos.filter(p => p.photo_type === 'before'),
    progress: photos.filter(p => p.photo_type === 'progress'),
    after: photos.filter(p => p.photo_type === 'after'),
    other: photos.filter(p => p.photo_type === 'other')
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Project Photos</h2>
          <p className="text-gray-600 mt-1">
            {photos.length} photos • Document project progress and results
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-pink-500 hover:bg-pink-600">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Photo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Project Photo</DialogTitle>
              <DialogDescription>
                Upload and categorize a photo for this project.
              </DialogDescription>
            </DialogHeader>

            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                📸 <strong>Note:</strong> This is a demo version. Actual file upload functionality would be implemented in a production environment.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleCreatePhoto} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="original_name">Photo Name *</Label>
                <Input
                  id="original_name"
                  value={formData.original_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateProjectPhotoInput) => ({ 
                      ...prev, 
                      original_name: e.target.value 
                    }))
                  }
                  placeholder="e.g., Kitchen Before Renovation.jpg"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo_type">Photo Type *</Label>
                <Select
                  value={formData.photo_type}
                  onValueChange={(value: 'before' | 'progress' | 'after' | 'other') =>
                    setFormData((prev: CreateProjectPhotoInput) => ({ ...prev, photo_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before">📸 Before - Initial state</SelectItem>
                    <SelectItem value="progress">🚧 Progress - Work in progress</SelectItem>
                    <SelectItem value="after">✨ After - Final result</SelectItem>
                    <SelectItem value="other">📷 Other - General photo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateProjectPhotoInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  placeholder="Describe what this photo shows..."
                  rows={3}
                />
              </div>

              {/* STUB: File upload placeholder */}
              <div className="space-y-2">
                <Label>File Upload (Demo)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                  <CameraIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    In a real application, you would drag and drop or click to upload photos here.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    For this demo, a mock photo will be created when you submit.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Photo'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Photos Display */}
      {photos.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="p-8 text-center">
            <CameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No photos yet</h3>
            <p className="text-gray-500 mb-4">Add photos to document project progress and results.</p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add First Photo</Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Photo Categories */}
          {Object.entries(groupedPhotos).map(([type, typePhotos]) => {
            if (typePhotos.length === 0) return null;
            
            return (
              <div key={type}>
                <h3 className="text-lg font-semibold mb-3 capitalize flex items-center gap-2">
                  <span>{getPhotoTypeEmoji(type)}</span>
                  {type} Photos ({typePhotos.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typePhotos.map((photo: ProjectPhoto) => (
                    <Card key={photo.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* STUB: Photo placeholder */}
                          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                            <div className="text-center">
                              <CameraIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">Photo Preview</p>
                              <p className="text-xs text-gray-400">{photo.original_name}</p>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900 text-sm truncate">
                                {photo.original_name}
                              </h4>
                              <Badge variant={getPhotoTypeBadgeVariant(photo.photo_type)} className={getPhotoTypeColor(photo.photo_type)}>
                                {photo.photo_type.toUpperCase()}
                              </Badge>
                            </div>
                            
                            {photo.description && (
                              <p className="text-sm text-gray-600 mb-2">{photo.description}</p>
                            )}
                            
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>Size: {formatFileSize(photo.file_size)}</div>
                              <div>Added: {photo.created_at.toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Photos Summary */}
      {photos.length > 0 && (
        <Card className="bg-pink-50 border-pink-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-pink-900 mb-3">Photos Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-pink-800">{groupedPhotos.before.length}</div>
                <div className="text-xs text-pink-600">📸 Before</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-pink-800">{groupedPhotos.progress.length}</div>
                <div className="text-xs text-pink-600">🚧 Progress</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-pink-800">{groupedPhotos.after.length}</div>
                <div className="text-xs text-pink-600">✨ After</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-pink-800">{groupedPhotos.other.length}</div>
                <div className="text-xs text-pink-600">📷 Other</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-pink-200 text-center">
              <div className="text-sm text-pink-700">
                Total Storage: {formatFileSize(photos.reduce((sum, photo) => sum + photo.file_size, 0))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}