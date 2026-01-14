"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Scale,
  ClipboardCheck,
  Bug,
  X,
  ArrowRight,
  FolderOpen,
} from "lucide-react";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { apiService, Project } from "../../lib/api";

type FeatureType = "vulnerability" | "bias-fairness" | "governance" | null;

interface FeatureConfig {
  title: string;
  description: string;
  getPath: (projectId: string) => string;
  requiresPremiumDomains: boolean;
}

interface ProjectWithAccess extends Project {
  hasPremiumDomains?: boolean;
}

const FEATURE_CONFIGS: Record<Exclude<FeatureType, null>, FeatureConfig> = {
  "vulnerability": {
    title: "AI Vulnerability Assessment",
    description: "Select a project to run vulnerability assessment",
    getPath: (projectId: string) => `/assess/${projectId}/premium-domains`,
    requiresPremiumDomains: true,
  },
  "bias-fairness": {
    title: "Automated Bias & Fairness Testing",
    description: "Select a project to run bias and fairness testing",
    getPath: (projectId: string) => `/assess/${projectId}/fairness-bias/options`,
    requiresPremiumDomains: false,
  },
  "governance": {
    title: "Actionable Governance Controls",
    description: "Select a project to view governance controls",
    getPath: (projectId: string) => `/assess/${projectId}/premium-domains`,
    requiresPremiumDomains: true,
  },
};

export default function PremiumFeaturesPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { loading: authLoading } = useRequireAuth();

  const [selectedFeature, setSelectedFeature] = useState<FeatureType>(null);
  const [projects, setProjects] = useState<ProjectWithAccess[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectWithAccess[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(false);

  const isPremium = user?.subscription_status === "basic_premium" || user?.subscription_status === "pro_premium";

  useEffect(() => {
    if (isAuthenticated && isPremium) {
      loadProjectsWithAccess();
    }
  }, [isAuthenticated, isPremium]);

  // Filter projects when feature is selected
  useEffect(() => {
    if (selectedFeature) {
      const config = FEATURE_CONFIGS[selectedFeature];
      if (config.requiresPremiumDomains) {
        // Filter to only show projects with premium domains
        setFilteredProjects(projects.filter(p => p.hasPremiumDomains === true));
      } else {
        // Show all projects for features that don't require premium domains
        setFilteredProjects(projects);
      }
    }
  }, [selectedFeature, projects]);

  const loadProjectsWithAccess = async () => {
    try {
      setLoadingProjects(true);
      const data = await apiService.getProjects();
      const projectList = Array.isArray(data) ? data : [];

      // Check each project for premium domain access
      setLoadingAccess(true);
      const projectsWithAccess: ProjectWithAccess[] = await Promise.all(
        projectList.map(async (project) => {
          try {
            const domainsData = await apiService.getDomainsFull(project.id);
            const hasPremiumDomains = domainsData.domains.some(
              (domain) => domain.is_premium === true
            );
            return { ...project, hasPremiumDomains };
          } catch (error) {
            console.error(`Failed to check premium access for project ${project.id}:`, error);
            return { ...project, hasPremiumDomains: false };
          }
        })
      );

      setProjects(projectsWithAccess);
    } catch (error) {
      console.error("Failed to load projects:", error);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
      setLoadingAccess(false);
    }
  };

  const handleCardClick = (featureType: FeatureType) => {
    if (!isPremium) {
      router.push("/manage-subscription");
      return;
    }
    setSelectedFeature(featureType);
  };

  const handleProjectClick = (projectId: string) => {
    if (selectedFeature && FEATURE_CONFIGS[selectedFeature]) {
      const path = FEATURE_CONFIGS[selectedFeature].getPath(projectId);
      router.push(path);
    }
  };

  const closeModal = () => {
    setSelectedFeature(null);
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 my-8">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 flex flex-col justify-center items-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-purple-950 dark:text-purple-300 mb-3">
              Unlock advanced AI governance tools.
            </h1>
            <p className="text-lg text-gray-800 dark:text-gray-300 mb-6">
              Take your AI maturity to the next level with automated testing and actionable insights.
            </p>
          </motion.div>

          {/* Premium Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-8">
            {/* Card 1: AI Vulnerability Assessment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => handleCardClick("vulnerability")}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl transition-shadow border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-600"
            >
              <div className="rounded-2xl flex items-center justify-center mb-6 mx-auto relative">
                <Shield className="w-28 h-28 text-purple-600 dark:text-purple-400 relative z-10 fill-purple-600 dark:fill-purple-400" />
                <Bug className="w-14 h-14 text-white dark:text-purple-400 absolute z-50 fill-white dark:fill-gray-900" style={{ transform: 'translate(-50%, -50%)', top: '50%', left: '50%' }} />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
                AI Vulnerability Assessment
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed text-center">
                Automated scanning for security risks in models.
              </p>
            </motion.div>

            {/* Card 2: Automated Bias & Fairness Testing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => handleCardClick("bias-fairness")}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl transition-shadow border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-600"
            >
              <div className="rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Scale className="w-28 h-28 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
                Automated Bias & Fairness Testing
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed text-center">
                Detect and mitigate algorithmic bias across datasets.
              </p>
            </motion.div>

            {/* Card 3: Actionable Governance Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => handleCardClick("governance")}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl transition-shadow border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-600"
            >
              <div className="rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <ClipboardCheck className="w-28 h-28 text-white dark:text-purple-400 fill-purple-600 dark:fill-purple-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
                Actionable Governance Controls
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed text-center">
                Get concrete steps to improve maturity scores.
              </p>
            </motion.div>
          </div>

          {/* Manage Subscription Button - Only show for free plan users */}
          {!isPremium && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center"
            >
              <Link
                href="/manage-subscription"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl shadow-lg hover:from-purple-700 hover:to-violet-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Manage Subscription
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {/* Project Selection Modal */}
      <AnimatePresence>
        {selectedFeature && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {FEATURE_CONFIGS[selectedFeature].title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {FEATURE_CONFIGS[selectedFeature].description}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Project List */}
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {loadingProjects || loadingAccess ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-3"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {loadingAccess ? "Checking project access..." : "Loading projects..."}
                    </p>
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {FEATURE_CONFIGS[selectedFeature].requiresPremiumDomains
                        ? "No projects with premium domains found"
                        : "No projects found"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                      {FEATURE_CONFIGS[selectedFeature].requiresPremiumDomains
                        ? "Create a project with premium domains to use this feature"
                        : "Create a project to get started"}
                    </p>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredProjects.map((project) => (
                      <motion.button
                        key={project.id}
                        onClick={() => handleProjectClick(project.id)}
                        whileHover={{ x: 4 }}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors text-left group"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {project.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {project.description || "No description"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                              {project.ai_system_type || "General AI System"}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${project.status === 'completed'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : project.status === 'in_progress'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                              }`}>
                              {project.status === 'completed' ? 'Completed' :
                                project.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex-shrink-0 ml-4" />
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
