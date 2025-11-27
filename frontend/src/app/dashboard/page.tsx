"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { showToast } from "../../lib/toast";
import { useRouter } from "next/navigation";
import { apiService, Project } from "../../lib/api";
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
  Star,
} from "lucide-react";

const BASIC_PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ID_BASIC || "";
const PRO_PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ID_PRO || "";
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
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [prices, setPrices] = useState<{basic: number | null, pro: number | null}>({basic: null, pro: null});
  const [loadingPrices, setLoadingPrices] = useState(false);

  const handleStripeReturn = (success: string | null, canceled: string | null) => {
    if (success === 'true') {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
      
      // Clean URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // Refresh user data after a delay
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
      
      // Clean URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  };

  useEffect(() => {
    // Check for Stripe return parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    
    // If we have Stripe parameters but user is not authenticated, 
    // wait a bit for auth to initialize
    if ((success || canceled) && !isAuthenticated) {
      const checkAuth = setInterval(() => {
        if (isAuthenticated) {
          clearInterval(checkAuth);
          // Re-run the effect with authentication
          loadProjects();
          handleStripeReturn(success, canceled);
        }
      }, 100);
      
      // Clear interval after 5 seconds
      setTimeout(() => clearInterval(checkAuth), 5000);
      return;
    }
    
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    loadProjects();
    
    // Handle Stripe return if user is authenticated
    handleStripeReturn(success, canceled);
  }, [isAuthenticated, router, refreshUser]);

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

  const fetchPrices = async () => {
    if (!BASIC_PRICE_ID || !PRO_PRICE_ID) {
      console.error('Price IDs not configured');
      return;
    }

    const token = typeof window !== "undefined"
      ? localStorage.getItem("auth_token")
      : null;

    if (!token) {
      console.error("Auth token missing; cannot fetch subscription prices.");
      showToast.error("Please sign in again to load subscription pricing.");
      return;
    }

    setLoadingPrices(true);
    try {
      // Fetch prices from your backend API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/subscriptions/prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          priceIds: [BASIC_PRICE_ID, PRO_PRICE_ID]
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPrices({
          basic: data.prices[BASIC_PRICE_ID] || null,
          pro: data.prices[PRO_PRICE_ID] || null
        });
      } else {
        console.error('Failed to fetch prices');
        // Fallback to hardcoded values if API fails
        setPrices({basic: 29, pro: 49});
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
      // Fallback to hardcoded values if API fails
      setPrices({basic: 29, pro: 49});
    } finally {
      setLoadingPrices(false);
    }
  };

  const handleUpgradeToPremium = () => {
    setShowSubscriptionModal(true);
    fetchPrices();
  };

  const handleSelectPlan = async (priceId: string, planName: string) => {
    try {
      setUpgradingPlan(planName);
      const { url } = await apiService.createCheckoutSession(priceId);
      window.location.href = url;
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      showToast.error("Failed to start upgrade process. Please try again.");
    } finally {
      setUpgradingPlan(null);
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
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold mb-2">
              <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Welcome back, {user?.name}! Manage your AI maturity assessments.
            </p>
          </motion.div>

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

          {/* User Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass-effect rounded-2xl p-6 mb-8"
          >
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
              Account Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-purple-400" />
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Name
                  </label>
                  <p className="text-gray-900 dark:text-white">{user?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-purple-400" />
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Email
                  </label>
                  <p className="text-gray-900 dark:text-white">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-purple-400" />
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Organization
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {user?.organization || "Not specified"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-purple-400" />
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Subscription
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <p className="text-gray-900 dark:text-white capitalize">
                        {user?.subscription_status === 'basic_premium' ? 'Basic Premium' : 
                         user?.subscription_status === 'pro_premium' ? 'Pro Premium' : 
                         user?.subscription_status}
                      </p>
                      {(user?.subscription_status === 'basic_premium' || user?.subscription_status === 'pro_premium') && (
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-1 rounded-full text-xs font-semibold">
                          ⭐ PREMIUM
                        </span>
                      )}
                    </div>
                    {user?.subscription_status === 'free' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleUpgradeToPremium}
                        className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300"
                      >
                        <Star className="w-4 h-4" />
                        Upgrade to Premium
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-purple-400" />
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Two-Factor Authentication
                  </label>
                  <div className="flex items-center gap-2">
                    {user?.mfa_enabled ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Enabled</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-amber-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Disabled</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex justify-end mb-8"
          >
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
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                    className="glass-effect rounded-2xl p-6 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {project.name}
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditProject(project)}
                          className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>

                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                      {project.description || "No description provided"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                        {project.ai_system_type || "General AI System"}
                      </span>
                      <Link
                        href={`/assess/${project.id}`}
                        className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors text-sm font-medium"
                      >
                        {project.status === 'in_progress' ? 'Continue Assessment' : project.status === 'completed' ? 'Completed' : 'Start Assessment'}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
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

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="text-center mb-6 flex-shrink-0">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-3"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-3">
                  <Crown className="w-6 h-6 text-white" />
                </div>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
              >
                Choose Your Premium Plan
              </motion.h2>
              {/* <motion.p
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-base text-gray-600 dark:text-gray-300 max-w-xl mx-auto"
              >
                Unlock advanced features and take your AI maturity assessment to the next level.
              </motion.p> */}
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 flex-1 min-h-0">
              {/* Basic Premium Plan */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="relative group h-full flex flex-col"
              >
                <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-400 hover:border-blue-300 dark:hover:border-blue-300 transition-all duration-300 h-full flex flex-col">
                  {/* Plan Badge */}
                  <div className="absolute -top-3 left-6">
                    <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                      Small Teams
                    </span>
                  </div>

                  <div className="text-center mb-6 flex-shrink-0">
                    <div className="flex items-center justify-center mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <Building className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Premium Basic
                    </h3>
                    <div className="mb-3">
                      {loadingPrices ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader className="w-6 h-6 animate-spin text-blue-500" />
                          <span className="text-sm text-gray-500">Loading...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                            ${prices.basic || 29}
                          </span>
                          <div className="text-left">
                            <div className="text-sm text-gray-500 dark:text-gray-400">/month</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Everything you need to get started
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6 flex-1 overflow-y-auto">
                    {[
                      "Unlimited AI assessments",
                      "Advanced reporting & analytics",
                      "Priority email support",
                      "PDF export capabilities",
                      "Team collaboration tools",
                      "Custom assessment templates",
                      "Data backup & security"
                    ].map((feature, index) => (
                      <motion.div
                        key={feature}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.05 }}
                        className="flex items-center gap-2"
                      >
                        <div className="w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">{feature}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectPlan(BASIC_PRICE_ID, "basic")}
                    disabled={upgradingPlan === "basic"}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-xl font-semibold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl flex-shrink-0"
                  >
                    {upgradingPlan === "basic" ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4" />
                        Choose Basic Premium
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>

              {/* Pro Premium Plan */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="relative group h-full flex flex-col"
              >
                {/* Popular Badge */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg"
                  >
                    ⭐ Most Popular
                  </motion.div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-400 hover:border-purple-300 dark:hover:border-purple-300 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full -translate-y-12 translate-x-12"></div>
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-pink-400 to-purple-400 rounded-full translate-y-10 -translate-x-10"></div>
                  </div>

                  <div className="relative flex flex-col h-full">
                    <div className="text-center mb-6 flex-shrink-0">
                      <div className="flex items-center justify-center mb-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <Crown className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Premium Pro
                      </h3>
                      <div className="mb-3">
                        {loadingPrices ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader className="w-6 h-6 animate-spin text-purple-500" />
                            <span className="text-sm text-gray-500">Loading...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                              ${prices.pro || 49}
                            </span>
                            <div className="text-left">
                              <div className="text-sm text-gray-500 dark:text-gray-400">/month</div>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        For growing organizations
                      </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-6 flex-1 overflow-y-auto">
                      {[
                        "Everything in Basic Premium",
                        "Custom assessment templates",
                        "Advanced API access",
                        "White-label options",
                        "Advanced analytics dashboard",
                        "24/7 phone & chat support",
                        "Dedicated account manager",
                        "Custom integrations",
                        "Priority feature requests"
                      ].map((feature, index) => (
                        <motion.div
                          key={feature}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + index * 0.05 }}
                          className="flex items-center gap-2"
                        >
                          <div className="w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">{feature}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectPlan(PRO_PRICE_ID, "pro")}
                      disabled={upgradingPlan === "pro"}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-4 rounded-xl font-semibold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl flex-shrink-0"
                    >
                      {upgradingPlan === "pro" ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Crown className="w-4 h-4" />
                          Choose Pro Premium
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center space-y-3 flex-shrink-0"
            >  
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors text-sm font-medium"
              >
                Maybe later
              </button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </div>
  );
}