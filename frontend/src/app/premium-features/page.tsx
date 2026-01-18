"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconShield,
  IconScale,
  IconClipboardCheck,
  IconBug,
  IconX,
  IconArrowRight,
  IconFolderOpen,
  IconLoader2,
} from "@tabler/icons-react";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { apiService, Project } from "../../lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 my-8">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 flex flex-col justify-center items-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
              Unlock advanced AI governance tools.
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
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
            >
              <Card className="cursor-pointer hover:shadow-2xl hover:border-primary/50 transition-all h-full">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="rounded-2xl flex items-center justify-center mb-6 mx-auto relative">
                    <IconShield className="w-28 h-28 text-primary relative z-10 fill-primary" />
                    <IconBug className="w-14 h-14 text-primary-foreground absolute z-50 fill-primary-foreground dark:fill-background" style={{ transform: 'translate(-50%, -50%)', top: '50%', left: '50%' }} />
                  </div>
                  <CardTitle className="text-2xl mb-3">
                    AI Vulnerability Assessment
                  </CardTitle>
                  <CardDescription className="text-base">
                    Automated scanning for security risks in models.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            {/* Card 2: Automated Bias & Fairness Testing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => handleCardClick("bias-fairness")}
            >
              <Card className="cursor-pointer hover:shadow-2xl hover:border-primary/50 transition-all h-full">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="rounded-2xl flex items-center justify-center mb-6 mx-auto">
                    <IconScale className="w-28 h-28 text-primary" />
                  </div>
                  <CardTitle className="text-2xl mb-3">
                    Automated Bias & Fairness Testing
                  </CardTitle>
                  <CardDescription className="text-base">
                    Detect and mitigate algorithmic bias across datasets.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            {/* Card 3: Actionable Governance Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => handleCardClick("governance")}
            >
              <Card className="cursor-pointer hover:shadow-2xl hover:border-primary/50 transition-all h-full">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="rounded-2xl flex items-center justify-center mb-6 mx-auto">
                    <IconClipboardCheck className="w-28 h-28 text-primary-foreground fill-primary" />
                  </div>
                  <CardTitle className="text-2xl mb-3">
                    Actionable Governance Controls
                  </CardTitle>
                  <CardDescription className="text-base">
                    Get concrete steps to improve maturity scores.
                  </CardDescription>
                </CardContent>
              </Card>
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
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 h-14 px-8">
                <Link href="/manage-subscription">
                  Manage Subscription
                </Link>
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Project Selection Modal */}
      <Dialog open={!!selectedFeature} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedFeature && FEATURE_CONFIGS[selectedFeature].title}
            </DialogTitle>
            <DialogDescription>
              {selectedFeature && FEATURE_CONFIGS[selectedFeature].description}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            {loadingProjects || loadingAccess ? (
              <div className="flex flex-col items-center justify-center py-8">
                <IconLoader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">
                  {loadingAccess ? "Checking project access..." : "Loading projects..."}
                </p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-8">
                <IconFolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">
                  {selectedFeature && FEATURE_CONFIGS[selectedFeature].requiresPremiumDomains
                    ? "No projects with premium domains found"
                    : "No projects found"}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedFeature && FEATURE_CONFIGS[selectedFeature].requiresPremiumDomains
                    ? "Create a project with premium domains to use this feature"
                    : "Create a project to get started"}
                </p>
                <Button asChild>
                  <Link href="/dashboard">
                    <span className="inline-flex items-center gap-2">
                      Go to Dashboard
                      <IconArrowRight className="w-4 h-4" />
                    </span>
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    whileHover={{ x: 4 }}
                  >
                    <Button
                      variant="ghost"
                      onClick={() => handleProjectClick(project.id)}
                      className="w-full justify-start h-auto py-4 px-4 hover:bg-primary/5"
                    >
                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="font-medium truncate">
                          {project.name}
                        </h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {project.description || "No description"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">
                            {project.ai_system_type || "General AI System"}
                          </Badge>
                          <Badge variant={
                            project.status === 'completed'
                              ? 'default'
                              : project.status === 'in_progress'
                                ? 'outline'
                                : 'secondary'
                          }>
                            {project.status === 'completed' ? 'Completed' :
                              project.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                          </Badge>
                        </div>
                      </div>
                      <IconArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
