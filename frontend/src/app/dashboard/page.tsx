"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { showToast } from "../../lib/toast";
import { useRouter } from "next/navigation";
import { apiService, Project } from "../../lib/api";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  IconPlus,
  IconTrash,
  IconArrowRight,
  IconCircleCheck,
  IconAlertCircle,
  IconLoader2,
  IconFolder,
  IconRobot,
  IconBriefcase
} from "@tabler/icons-react";
import { CardSkeleton } from "../../components/Skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const POST_CHECKOUT_RETURN_URL_KEY = "postCheckoutReturnUrl";
const SKELETON_COUNT = 5;
const INDUSTRY_OPTIONS = [
  "Healthcare & Life Sciences",
  "Finance & Banking",
  "Insurance",
  "Retail & E-commerce",
  "Manufacturing",
  "Transportation & Logistics",
  "Energy & Utilities",
  "Telecommunications",
  "Technology & Software",
  "Government & Public Sector",
  "Education",
  "Legal & Compliance",
  "Marketing & Advertising",
  "HR & Workforce Tech",
  "Media & Entertainment",
  "Real Estate & Property Tech",
  "Nonprofit",
  "Research & Development",
  "Others",
];

const AI_SYSTEM_TYPES = [
  "Machine Learning Model",
  "Deep Learning System",
  "NLP System",
  "Computer Vision",
  "Recommendation System",
  "Autonomous System",
  "Other",
];

export default function DashboardPage() {
  const { user, isAuthenticated, logout, refreshUser } = useAuth();
  const { loading: authLoading } = useRequireAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    aiSystemType: "",
    industry: "",
  });
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjectData, setEditProjectData] = useState({ name: "", description: "", aiSystemType: "", industry: "" });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);

  const saveReturnUrlForCheckout = () => {
    if (typeof window === "undefined") return;
    try {
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      localStorage.setItem(POST_CHECKOUT_RETURN_URL_KEY, currentUrl);
    } catch (error) {
      console.error("Failed to save return URL:", error);
    }
  };

  const consumeReturnUrlForCheckout = () => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(POST_CHECKOUT_RETURN_URL_KEY);
      if (saved) {
        localStorage.removeItem(POST_CHECKOUT_RETURN_URL_KEY);
        if (saved.startsWith("/")) {
          return saved;
        }
      }
    } catch (error) {
      console.error("Failed to consume return URL:", error);
    }
    return null;
  };

  const handleStripeReturn = (success: string | null, canceled: string | null) => {
    const hasStripeParams = success === 'true' || canceled === 'true';
    const savedReturnUrl = hasStripeParams ? consumeReturnUrlForCheckout() : null;

    if (success === 'true') {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);

      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      if (savedReturnUrl) {
        (async () => {
          try {
            await refreshUser();
          } catch (error) {
            console.error("Failed to refresh user before redirect:", error);
          }
        })();
        router.push(savedReturnUrl);
        return;
      }

      setTimeout(async () => {
        try {
          await refreshUser();
        } catch (error) {
          console.error("Failed to refresh user:", error);
        }
      }, 2000);
    } else if (canceled === 'true') {
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 5000);

      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');

    loadProjects();
    handleStripeReturn(success, canceled);
  }, [isAuthenticated, authLoading, router, refreshUser]);

  const loadProjects = async () => {
    try {
      const data = await apiService.getProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load projects:", error);
      showToast.error("Failed to load projects. Please try again.");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiService.createProject(newProject);
      setProjects([...projects, response.project]);
      setNewProject({ name: "", description: "", aiSystemType: "", industry: "" });
      setShowCreateForm(false);
      showToast.success("Project created successfully!");
    } catch (error) {
      console.error("Failed to create project:", error);
      showToast.error("Failed to create project. Please try again.");
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setEditProjectData({
      name: project.name,
      description: project.description || "",
      aiSystemType: project.ai_system_type || "",
      industry: project.industry || "",
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setIsLoading(true);

    try {
      const response = await apiService.updateProject(editingProject.id, editProjectData);
      const updatedProject: Project = response.project;
      setProjects(prev => prev.map(p => (p.id === editingProject.id ? updatedProject : p)));
      setEditingProject(null);
      showToast.success("Project updated successfully!");
    } catch (error) {
      console.error("Failed to update project:", error);
      showToast.error("Failed to update project. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await apiService.deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
      showToast.success("Project deleted successfully!");
    } catch (error) {
      console.error("Failed to delete project:", error);
      showToast.error("Failed to delete project. Please try again.");
    }
  };


  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1"
            >
              <h1 className="text-4xl font-bold mb-2">
                <span className="gradient-text">Dashboard</span>
              </h1>
              <div>
                <p className="text-muted-foreground font-medium">
                  Welcome back, <span className="text-primary font-bold">{user?.name}</span>! Manage your AI maturity assessments
                </p>
              </div>
            </motion.div>
            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex justify-end items-center"
            >
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 h-12 px-6"
              >
                <IconPlus className="w-5 h-5 mr-2" />
                New Project
              </Button>
            </motion.div>
          </div>

          {/* Success Message */}
          {showSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="mb-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-xl shadow-lg"
            >
              <div className="flex items-center gap-3">
                <IconCircleCheck className="w-6 h-6" />
                <div>
                  <h3 className="font-semibold text-lg">🎉 Payment Successful!</h3>
                  <p className="text-green-100">Your subscription has been upgraded. Welcome to premium!</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {showErrorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="mb-6 bg-gradient-to-r from-red-500 to-pink-500 text-white p-4 rounded-xl shadow-lg"
            >
              <div className="flex items-center gap-3">
                <IconAlertCircle className="w-6 h-6" />
                <div>
                  <h3 className="font-semibold text-lg">Payment Canceled</h3>
                  <p className="text-red-100">You can try upgrading again anytime.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-foreground">
              Your Projects
            </h2>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconPlus className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  No projects yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Create your first AI maturity assessment project to get
                  started.
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                >
                  Create Your First Project
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                  >
                    <Card className="h-full hover:shadow-xl transition-all duration-300">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <Link
                            href={`/assess/${project.id}`}
                            className="flex items-center gap-2 text-success hover:text-success/80 transition-colors text-sm font-medium"
                          >
                            <span>
                              {project.status === 'completed' ? 'Completed' :
                                project.status === 'in_progress' ? 'In Progress' :
                                  'Start'}
                            </span>
                            <IconArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                        <CardDescription>
                          {project.description || "No description provided"}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="pb-3">
                        <Badge variant="secondary">
                          {project.ai_system_type || "General AI System"}
                        </Badge>
                      </CardContent>

                      <Separator />

                      <CardFooter className="pt-4 justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProject(project)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive/40 hover:bg-destructive/10"
                          onClick={() => handleDeleteProject(project.id)}
                        >
                          <IconTrash className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Create Project Modal */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <div className="relative">
                <IconFolder className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="project-name"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                  placeholder="Enter project name"
                  required
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({
                    ...newProject,
                    description: e.target.value,
                  })
                }
                placeholder="Describe your AI system"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>AI System Type</Label>
              <Select
                value={newProject.aiSystemType}
                onValueChange={(value) =>
                  setNewProject({ ...newProject, aiSystemType: value })
                }
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <IconRobot className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select AI System Type" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {AI_SYSTEM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select
                value={newProject.industry}
                onValueChange={(value) =>
                  setNewProject({ ...newProject, industry: value })
                }
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <IconBriefcase className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select Industry" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
              >
                Create Project
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Project Modal */}
      <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-project-name">Project Name</Label>
              <div className="relative">
                <IconFolder className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-project-name"
                  value={editProjectData.name}
                  onChange={(e) =>
                    setEditProjectData({ ...editProjectData, name: e.target.value })
                  }
                  placeholder="Enter project name"
                  required
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-project-description">Description</Label>
              <Textarea
                id="edit-project-description"
                value={editProjectData.description}
                onChange={(e) =>
                  setEditProjectData({ ...editProjectData, description: e.target.value })
                }
                placeholder="Describe your AI system"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>AI System Type</Label>
              <Select
                value={editProjectData.aiSystemType}
                onValueChange={(value) =>
                  setEditProjectData({ ...editProjectData, aiSystemType: value })
                }
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <IconRobot className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select AI System Type" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {AI_SYSTEM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select
                value={editProjectData.industry}
                onValueChange={(value) =>
                  setEditProjectData({ ...editProjectData, industry: value })
                }
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <IconBriefcase className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select Industry" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingProject(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
              >
                {isLoading ? (
                  <>
                    <IconLoader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}