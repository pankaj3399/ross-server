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
import { CardSkeleton, DashboardSkeleton } from "../../components/Skeleton";
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
  const [isCreating, setIsCreating] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

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

      // Initial refresh
      refreshUser().catch(console.error);

      // Start polling for up to 30 seconds to catch async payment confirmation
      let pollCount = 0;
      const MAX_POLLS = 10; // 10 * 3s = 30s

      const pollInterval = setInterval(async () => {
        pollCount++;
        if (pollCount > MAX_POLLS) {
          clearInterval(pollInterval);
          return;
        }

        try {
          // Fetch fresh status directly from API to avoid closure staleness
          const status = await apiService.getSubscriptionStatus();

          // If we detect a premium status, we can assume success (since we started at free/unknown)
          // Or we can just check if it's different from what we had initially if we captured it, 
          // but simpler is to check for non-free if we expect an upgrade.
          if (status.subscription_status !== 'free') {
            console.log("Subscription status matches premium, refreshing user context...");
            await refreshUser();
            clearInterval(pollInterval);
          }
        } catch (error) {
          console.error("Polling refresh failed:", error);
        }
      }, 3000);

      // Cleanup on unmount handled by implicit useEffect dependency
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
    setIsCreating(true);
    try {
      const response = await apiService.createProject(newProject);
      setProjects([...projects, response.project]);
      setNewProject({ name: "", description: "", aiSystemType: "", industry: "" });
      setShowCreateForm(false);
      showToast.success("Project created successfully!");
    } catch (error) {
      console.error("Failed to create project:", error);
      showToast.error("Failed to create project. Please try again.");
    } finally {
      setIsCreating(false);
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
    setIsLoading(true);
    try {
      await apiService.deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
      showToast.success("Project deleted successfully!");
      setDeletingProjectId(null);
    } catch (error) {
      console.error("Failed to delete project:", error);
      showToast.error("Failed to delete project. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  if (authLoading || !isAuthenticated) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-full flex flex-col bg-background">
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="py-6">
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
                className="btn-primary h-12 px-6"
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
              className="mb-6 bg-success/15 border border-success/30 text-foreground p-4 rounded-xl shadow-sm"
            >
              <div className="flex items-center gap-3">
                <IconCircleCheck className="w-6 h-6 text-success" />
                <div>
                  <h3 className="font-semibold text-lg">🎉 Payment Successful!</h3>
                  <p className="text-muted-foreground">Your subscription has been upgraded. Welcome to premium!</p>
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
              className="mb-6 bg-destructive/15 border border-destructive/30 text-foreground p-4 rounded-xl shadow-sm"
            >
              <div className="flex items-center gap-3">
                <IconAlertCircle className="w-6 h-6 text-destructive" />
                <div>
                  <h3 className="font-semibold text-lg">Payment Canceled</h3>
                  <p className="text-muted-foreground">You can try upgrading again anytime.</p>
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
                  className="btn-primary"
                >
                  Create Your First Project
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                  >
                    <Card className={`h-full hover:shadow-xl transition-all duration-300 ${["bg-chart-1/10", "bg-chart-2/10", "bg-chart-3/10", "bg-chart-4/10", "bg-chart-5/10"][index % 5]}`}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <Link
                            href={`/assess/${project.id}`}
                            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
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
                          onClick={() => setDeletingProjectId(project.id)}
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
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="btn-primary"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Project"
                )}
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
                className="btn-primary"
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
      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletingProjectId} onOpenChange={(open) => !open && setDeletingProjectId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this project? This action cannot be undone and all associated data will be permanently removed.
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setDeletingProjectId(null)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingProjectId && handleDeleteProject(deletingProjectId)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}