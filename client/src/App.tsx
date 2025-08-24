import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { ProjectForm } from '@/components/ProjectForm';
import { ProjectDetails } from '@/components/ProjectDetails';
import { ConstructionIcon, PlusIcon, HammerIcon, DollarSignIcon } from 'lucide-react';
import './App.css';

// Using type-only import for better TypeScript compliance
import type { Project } from '../../server/src/schema';

function App() {
  // Explicit typing with Project interface
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);

  // useCallback to memoize function used in useEffect
  const loadProjects = useCallback(async () => {
    try {
      const result = await trpc.getProjects.query();
      setProjects(result);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }, []); // Empty deps since trpc is stable

  // useEffect with proper dependencies
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateProject = async (projectData: any) => {
    setIsLoading(true);
    try {
      const newProject = await trpc.createProject.mutate(projectData);
      // Update projects list with explicit typing in setState callback
      setProjects((prev: Project[]) => [...prev, newProject]);
      setIsProjectFormOpen(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (selectedProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <ProjectDetails
          project={selectedProject}
          onBack={() => setSelectedProject(null)}
          onProjectUpdated={(updatedProject) => {
            setSelectedProject(updatedProject);
            setProjects(prev => 
              prev.map(p => p.id === updatedProject.id ? updatedProject : p)
            );
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2 rounded-lg">
              <HammerIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🏗️ Construction Manager</h1>
              <p className="text-gray-600">Track projects, costs, and progress</p>
            </div>
          </div>
          <Dialog open={isProjectFormOpen} onOpenChange={setIsProjectFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <PlusIcon className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Start a new construction project and begin tracking progress.
                </DialogDescription>
              </DialogHeader>
              <ProjectForm onSubmit={handleCreateProject} isLoading={isLoading} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                </div>
                <ConstructionIcon className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {projects.filter(p => p.status === 'completed').length}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  ✅
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {projects.filter(p => p.status === 'in_progress').length}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  🚧
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Planning</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {projects.filter(p => p.status === 'planning').length}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  📋
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects List */}
        {projects.length === 0 ? (
          <Card className="bg-white border-2 border-dashed border-orange-200">
            <CardContent className="p-8 text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <HammerIcon className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first construction project!</p>
              <Dialog open={isProjectFormOpen} onOpenChange={setIsProjectFormOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Create First Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                      Start your first construction project and begin tracking progress.
                    </DialogDescription>
                  </DialogHeader>
                  <ProjectForm onSubmit={handleCreateProject} isLoading={isLoading} />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {projects.map((project: Project) => (
              <Card key={project.id} className="bg-white border-gray-200 hover:border-orange-200 transition-colors cursor-pointer" onClick={() => setSelectedProject(project)}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
                        <Badge variant={getStatusBadgeVariant(project.status)} className={getStatusColor(project.status)}>
                          {project.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      {project.description && (
                        <p className="text-gray-600 mb-3">{project.description}</p>
                      )}
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span>📅 Started: {project.start_date.toLocaleDateString()}</span>
                        {project.end_date && (
                          <span>🏁 Ends: {project.end_date.toLocaleDateString()}</span>
                        )}
                        <span>🕐 Created: {project.created_at.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button variant="outline" className="ml-4">
                      View Details →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;