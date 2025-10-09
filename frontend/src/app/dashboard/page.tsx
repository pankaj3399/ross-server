"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { apiService, Project } from "@/lib/api";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  ArrowRight,
  User,
  Building,
  Crown,
  LogOut,
} from "lucide-react";

export default function DashboardPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    aiSystemType: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    loadProjects();
  }, [isAuthenticated, router]);

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

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await apiService.deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex justify-between items-center mb-8"
          >
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="gradient-text">MaturAIze Dashboard</span>
              </h1>
              <p className="text-gray-300">Welcome back, {user?.name}!</p>
            </div>
            <div className="flex space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 pulse-glow"
              >
                <Plus className="w-5 h-5" />
                New Project
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 border border-white/20"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </motion.button>
            </div>
          </motion.div>

          {/* User Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass-effect rounded-2xl p-6 mb-8"
          >
            <h2 className="text-xl font-semibold mb-6 text-white">
              Account Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-purple-400" />
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Name
                  </label>
                  <p className="text-white">{user?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-purple-400" />
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Email
                  </label>
                  <p className="text-white">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-purple-400" />
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Organization
                  </label>
                  <p className="text-white">
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
                  <p className="text-white capitalize">
                    {user?.subscription_status}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="glass-effect rounded-2xl"
          >
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">
                Your Projects
              </h2>
            </div>

            {loading ? (
              <div className="p-6 text-center text-gray-300">
                Loading projects...
              </div>
            ) : !Array.isArray(projects) || projects.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <p>
                  No projects yet. Create your first project to get started!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {Array.isArray(projects) &&
                  projects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="p-6 hover:bg-white/5 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-white mb-2">
                            {project.name}
                          </h3>
                          {project.description && (
                            <p className="text-gray-300 mb-3">
                              {project.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                            <span>
                              Type: {project.ai_system_type || "Not specified"}
                            </span>
                            <span>Status: {project.status}</span>
                            <span>
                              Created:{" "}
                              {new Date(
                                project.created_at,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <Link
                            href={`/assess/${project.id}`}
                            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105"
                          >
                            Continue Assessment
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
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
            transition={{ duration: 0.3 }}
            className="glass-effect rounded-2xl shadow-xl max-w-md w-full"
          >
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-xl font-semibold text-white">
                Create New Project
              </h3>
            </div>
            <form onSubmit={handleCreateProject} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProject.name}
                    onChange={(e) =>
                      setNewProject({ ...newProject, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
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
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
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
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  >
                    <option value="">Select AI System Type</option>
                    <option value="Machine Learning">Machine Learning</option>
                    <option value="Deep Learning">Deep Learning</option>
                    <option value="Natural Language Processing">
                      Natural Language Processing
                    </option>
                    <option value="Computer Vision">Computer Vision</option>
                    <option value="Robotics">Robotics</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 text-gray-300 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300"
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
    </div>
  );
}
