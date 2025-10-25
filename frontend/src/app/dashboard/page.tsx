"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
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
  });
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjectData, setEditProjectData] = useState({ name: "", description: "" });
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);

  const handleStripeReturn = (success: string | null, canceled: string | null) => {
    console.log('URL params:', { success, canceled });
    
    if (success === 'true') {
      console.log('Payment successful! Showing success message...');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
      
      // Clean URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // Refresh user data after a delay
      setTimeout(async () => {
        try {
          console.log('Refreshing user data...');
          await refreshUser();
          console.log('User data refreshed successfully');
        } catch (error) {
          console.error("Failed to refresh user:", error);
        }
      }, 2000);
    } else if (canceled === 'true') {
      console.log('Payment canceled! Showing error message...');
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
      console.log('Stripe return detected but user not authenticated yet, waiting...');
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
      setNewProject({ name: "", description: "", aiSystemType: "" });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setEditProjectData({ name: project.name, description: project.description || "" });
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
    } catch (error) {
      console.error("Failed to update project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await apiService.deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const handleUpgradeToPremium = () => {
    setShowSubscriptionModal(true);
  };

  const handleManageBilling = async () => {
    try {
      const { url } = await apiService.createPortalSession();
      window.location.href = url;
    } catch (error) {
      console.error("Failed to create portal session:", error);
      alert("Failed to open billing portal. Please try again.");
    }
  };

  const handleSelectPlan = async (priceId: string, planName: string) => {
    try {
      setUpgradingPlan(planName);
      const { url } = await apiService.createCheckoutSession(priceId);
      window.location.href = url;
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      alert("Failed to start upgrade process. Please try again.");
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Choose Your Premium Plan
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Unlock advanced features and take your AI maturity assessment to the next level
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Basic Premium Plan */}
              <motion.div
                whileHover={{ y: -5 }}
                className="relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-400"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Premium Basic
                  </h3>
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    $29<span className="text-lg text-gray-500">/month</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    Perfect for small teams
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">Unlimited assessments</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">Advanced reporting</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">Priority support</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">Export to PDF</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">Team collaboration</span>
                  </li>
                </ul>

                <button
                  onClick={() => handleSelectPlan(BASIC_PRICE_ID, "basic")}
                  disabled={upgradingPlan === "basic"}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {upgradingPlan === "basic" ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Choose Basic Premium"
                  )}
                </button>
              </motion.div>

              {/* Pro Premium Plan */}
              <motion.div
                whileHover={{ y: -5 }}
                className="relative bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-400"
              >
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Premium Pro
                  </h3>
                  <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    $49<span className="text-lg text-gray-500">/month</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    Best for growing organizations
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">Everything in Basic</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">Custom assessment templates</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">API access</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">White-label options</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">Advanced analytics</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">24/7 phone support</span>
                  </li>
                </ul>

                <button
                  onClick={() => handleSelectPlan(PRO_PRICE_ID, "pro")}
                  disabled={upgradingPlan === "pro"}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {upgradingPlan === "pro" ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Choose Pro Premium"
                  )}
                </button>
              </motion.div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}