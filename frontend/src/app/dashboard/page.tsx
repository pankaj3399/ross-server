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
  Plus,
  Trash2,
  ArrowRight,
  User,
  Building,
  Crown,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import { CardSkeleton } from "../../components/Skeleton";

const BASIC_PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ID_BASIC || "";
const PRO_PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ID_PRO || "";
const POST_CHECKOUT_RETURN_URL_KEY = "postCheckoutReturnUrl";
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
        // Use push instead of replace to preserve history
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
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // Only proceed if authenticated
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
                <p className="text-gray-600 dark:text-gray-300 font-medium">
                  Welcome back, <span className="text-purple-600 dark:text-purple-400 font-bold">{user?.name}</span>! Manage your AI maturity assessments
                </p>
              </div>
            </motion.div>
            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex justify-between items-center mb-8"
            >
              <div>
                {/* Spacer to keep layout if needed, or just empty div */}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 pulse-glow"
              >
                <Plus className="w-5 h-5" />
                New Project
              </motion.button>
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
                <CheckCircle className="w-6 h-6" />
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
                <AlertCircle className="w-6 h-6" />
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
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              Your Projects
            </h2>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No projects yet
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Create your first AI maturity assessment project to get
                  started.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  Create Your First Project
                </motion.button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
                  >
                    {/* Title and Status */}
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {project.name}
                      </h3>
                      <Link
                        href={`/assess/${project.id}`}
                        className="flex items-center gap-2 text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 transition-colors text-sm font-medium"
                      >
                        {project.status === 'completed' ? (
                          <>
                            <span>Completed</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        ) : project.status === 'in_progress' ? (
                          <>
                            <span>In Progress</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            <span>Start</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Link>
                    </div>

                    {/* Description */}
                    <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
                      {project.description || "No description provided"}
                    </p>

                    {/* Tag */}
                    <div className="mb-4">
                      <span className="inline-block text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-md">
                        {project.ai_system_type || "General AI System"}
                      </span>
                    </div>

                    {/* Separator */}
                    <div className="border-t border-gray-200 dark:border-gray-700 mb-4"></div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditProject(project)}
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(project.id)}
                        className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Create New Project
            </h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Describe your AI system"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI System Type
                </label>
                <select
                  value={newProject.aiSystemType}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      aiSystemType: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select AI System Type</option>
                  <option value="Machine Learning Model">
                    Machine Learning Model
                  </option>
                  <option value="Deep Learning System">
                    Deep Learning System
                  </option>
                  <option value="NLP System">NLP System</option>
                  <option value="Computer Vision">Computer Vision</option>
                  <option value="Recommendation System">
                    Recommendation System
                  </option>
                  <option value="Autonomous System">Autonomous System</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Industry
                </label>
                <select
                  value={newProject.industry}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      industry: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Industry</option>
                  {INDUSTRY_OPTIONS.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-xl transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  Create Project
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md z-10"
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Edit Project
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={editProjectData.name}
                  onChange={(e) =>
                    setEditProjectData({ ...editProjectData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editProjectData.description}
                  onChange={(e) =>
                    setEditProjectData({ ...editProjectData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Describe your AI system"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI System Type
                </label>
                <select
                  value={editProjectData.aiSystemType}
                  onChange={(e) =>
                    setEditProjectData({
                      ...editProjectData,
                      aiSystemType: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select AI System Type</option>
                  <option value="Machine Learning Model">
                    Machine Learning Model
                  </option>
                  <option value="Deep Learning System">
                    Deep Learning System
                  </option>
                  <option value="NLP System">NLP System</option>
                  <option value="Computer Vision">Computer Vision</option>
                  <option value="Recommendation System">
                    Recommendation System
                  </option>
                  <option value="Autonomous System">Autonomous System</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Industry
                </label>
                <select
                  value={editProjectData.industry}
                  onChange={(e) =>
                    setEditProjectData({
                      ...editProjectData,
                      industry: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Industry</option>
                  {INDUSTRY_OPTIONS.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-xl transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex justify-center items-center w-40 h-12 px-6 py-3 ${isLoading ? "opacity-70" : ""} bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105`}
                >
                  {isLoading ? <Loader className="animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}