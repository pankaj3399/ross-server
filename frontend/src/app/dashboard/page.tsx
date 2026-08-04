"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { showToast } from "../../lib/toast";
import { useRouter } from "next/navigation";
import { apiService, Project } from "../../lib/api";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { useNotificationStore, Invitation } from "../../store/notificationStore";
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
  IconFolders,
  IconBriefcase,
  IconLayoutDashboard,
  IconDotsVertical,
  IconPencil,
  IconCalendar,
  IconInbox,
  IconUser,
  IconShield,
  IconChartBar,
  IconPlayerPlay,
  IconCpu,
  IconUserCheck,
  IconFilter,
  IconRefresh,
} from "@tabler/icons-react";

function RollbackBanner({ projects }: { projects: Project[] }) {
  const [rollbackInfo, setRollbackInfo] = useState<{ projectId: string; timestamp: number; projectName: string } | null>(null);

  useEffect(() => {
    if (!projects || projects.length === 0) return;
    try {
      for (const p of projects) {
        const saved = localStorage.getItem(`wizard_rollback_snapshot_${p.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          const elapsedHours = (Date.now() - parsed.timestamp) / (1000 * 3600);
          if (elapsedHours < 48) {
            setRollbackInfo({ projectId: p.id, timestamp: parsed.timestamp, projectName: p.name });
            break;
          } else {
            localStorage.removeItem(`wizard_rollback_snapshot_${p.id}`);
          }
        }
      }
    } catch (e) {
      console.error("Failed to check rollback snapshots:", e);
    }
  }, [projects]);

  const handleRollback = async () => {
    if (!rollbackInfo) return;
    try {
      const snapshotKey = `wizard_rollback_snapshot_${rollbackInfo.projectId}`;
      const savedRaw = localStorage.getItem(snapshotKey);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (parsed?.answers) {
          await apiService.saveWizardAnswers(rollbackInfo.projectId, parsed.answers);
        }
      }
      localStorage.removeItem(snapshotKey);
      setRollbackInfo(null);
      showToast.success("Wizard profile reverted. Reverted project state.");
      window.location.reload();
    } catch (err) {
      showToast.error("Failed to restore previous state.");
    }
  };

  if (!rollbackInfo) return null;

  return (
    <div className="mb-6 p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-foreground">
      <div className="flex items-center gap-3">
        <IconRefresh className="w-5 h-5 text-indigo-400 shrink-0" />
        <div>
          <span className="font-bold text-indigo-300 block">Wizard Profile Applied — Undo Available for "{rollbackInfo.projectName}" (48-hour rollback)</span>
          <span className="text-muted-foreground">You applied a compliance profile to a pre-populated project. You can restore your previous project state anytime within 48 hours.</span>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleRollback}
        className="border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/20 shrink-0 font-bold gap-1.5"
      >
        <IconRefresh className="w-3.5 h-3.5" />
        Undo Profile &amp; Restore Previous State
      </Button>
    </div>
  );
}
import { CardSkeleton, DashboardSkeleton } from "../../components/Skeleton";
import SubscriptionModal from "../../components/features/subscriptions/SubscriptionModal";
import PathSelectionModal from "../../components/features/subscriptions/PathSelectionModal";
import PremiumReEngagementPopup from "../../components/features/subscriptions/PremiumReEngagementPopup";
import TrialExpiredBanner from "../../components/features/trial/TrialExpiredBanner";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import ProjectEditForm from "@/components/features/projects/ProjectEditForm";
import { INDUSTRY_OPTIONS, AI_SYSTEM_TYPES, isPremiumStatus, CARD_THEMES, MAX_DESCRIPTION_LENGTH } from "@/lib/constants";
import { getReportRoute } from "@/lib/reportRoute";

const POST_CHECKOUT_RETURN_URL_KEY = "postCheckoutReturnUrl";
const SKELETON_COUNT = 5;


export default function DashboardPage() {
  const { user, isAuthenticated, logout, refreshUser } = useAuth();
  const { loading: authLoading } = useRequireAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'name_asc' | 'name_desc'>('created_desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const filteredProjects = useMemo(() => {
    let result = [...projects];
    if (filterStatus !== 'all') {
      result = result.filter(p => p.status === filterStatus);
    }
    
    result.sort((a, b) => {
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name);
      } else if (sortBy === 'created_asc') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      } else { // created_desc
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }
    });
    return result;
  }, [projects, sortBy, filterStatus]);
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
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [isProjectLimitReached, setIsProjectLimitReached] = useState(false);
  const [showPathSelection, setShowPathSelection] = useState(false);
  const [pathSelectionProjectId, setPathSelectionProjectId] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const decliningTokensRef = useRef<Set<string>>(new Set());

  const getProjectReportHref = (projId: string) => {
    const project = projects.find(p => p.id === projId);
    const savedChoice = project?.path_choice || localStorage.getItem(`path_choice_${user?.id}_${projId}`);
    if (savedChoice === "premium") {
      return getReportRoute(projId, "CRC");
    } else if (savedChoice === "aima") {
      return getReportRoute(projId, "AIMA");
    }
    return isPremiumStatus(user?.subscription_status) ? getReportRoute(projId, "CRC") : getReportRoute(projId, "AIMA");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const getProjectEditHref = (projId: string) => {
    const project = projects.find(p => p.id === projId);
    const savedChoice = project?.path_choice || localStorage.getItem(`path_choice_${user?.id}_${projId}`);
    if (savedChoice === "premium") {
      return `/assess/${projId}/crc`;
    } else if (savedChoice === "aima") {
      return `/assess/${projId}`;
    }
    return isPremiumStatus(user?.subscription_status) ? `/assess/${projId}/crc` : `/assess/${projId}`;
  };

  // Pending Invitations State from Store
  const { invitations: myInvitations, fetchInvitations, removeInvitation, clearInvitations } = useNotificationStore();
  const [decliningTokens, setDecliningTokens] = useState<Set<string>>(new Set());

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

      // Clear any existing interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }

      pollIntervalRef.current = setInterval(async () => {
        pollCount++;
        if (pollCount > MAX_POLLS) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          return;
        }

        try {
          // Fetch fresh status directly from API to avoid closure staleness
          const status = await apiService.getSubscriptionStatus();

          // If we detect a premium status, we can assume success (since we started at free/unknown)
          if (status.subscription_status !== 'free') {
            console.log("Subscription status matches premium, refreshing user context...");
            await refreshUser();
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
        } catch (error) {
          console.error("Polling refresh failed:", error);
        }
      }, 3000);

    } else if (canceled === 'true') {
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 5000);

      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup interval on unmount
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  // Fix Radix UI Dialog pointer-events lock bug when modal states change
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!deletingProjectId && !editingProject && !showCreateForm && !showPathSelection && !showSubscriptionModal && !showFilterModal) {
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = "";
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [deletingProjectId, editingProject, showCreateForm, showPathSelection, showSubscriptionModal, showFilterModal]);

  const loadProjects = useCallback(async () => {
    try {
      // Fetch both projects and pending invitations concurrently
      const [projectsData] = await Promise.all([
        apiService.getProjects(),
        fetchInvitations()
      ]);

      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error) {
      console.error("Failed to load projects:", error);
      showToast.error("Failed to load dashboard data. Please try again.");
      setProjects([]);
      clearInvitations();
    } finally {
      setLoading(false);
    }
  }, [fetchInvitations, clearInvitations]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');

    loadProjects();
    handleStripeReturn(success, canceled);

    const handleProjectsUpdated = () => {
      loadProjects();
    };

    window.addEventListener("projects-updated", handleProjectsUpdated);
    return () => {
      window.removeEventListener("projects-updated", handleProjectsUpdated);
    };
  }, [isAuthenticated, authLoading, router, refreshUser, loadProjects]);

  const handleDeclineInvitation = async (token: string) => {
    if (decliningTokensRef.current.has(token)) return;

    decliningTokensRef.current.add(token);
    setDecliningTokens(prev => new Set(prev).add(token));

    try {
      await apiService.declineInvitation(token);
      showToast.success("Invitation declined");
      removeInvitation(token);
    } catch (error: any) {
      showToast.error(error.message || "Failed to decline invitation");
    } finally {
      decliningTokensRef.current.delete(token);
      setDecliningTokens(prev => {
        const next = new Set(prev);
        next.delete(token);
        return next;
      });
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const ERROR_PROJECT_LIMIT_REACHED = "PROJECT_LIMIT_REACHED";
    setIsCreating(true);
    try {
      const response = await apiService.createProject(newProject);
      setProjects([...projects, response.project]);
      setNewProject({ name: "", description: "", aiSystemType: "", industry: "" });
      setShowCreateForm(false);
      showToast.success("Project created successfully!");
    } catch (error: any) {
      console.error("Failed to create project:", error);
      if (error.message === ERROR_PROJECT_LIMIT_REACHED) {
        setShowCreateForm(false);
        setIsProjectLimitReached(true);
        setShowSubscriptionModal(true);
      } else {
        showToast.error(error.message || "Failed to create project. Please try again.");
      }
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

  const handleEditSubmit = async (data: { name: string; description: string; aiSystemType: string; industry: string }) => {
    if (!editingProject) return;
    setIsLoading(true);

    try {
      const response = await apiService.updateProject(editingProject.id, data);
      const updatedProject: Project = response.project;
      setProjects(prev => prev.map(p => (p.id === editingProject.id ? updatedProject : p)));
      setEditingProject(null);
      showToast.success("Project updated successfully!");
    } catch (error: any) {
      console.error("Failed to update project:", error);
      showToast.error(error.message || "Failed to update project. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    setIsLoading(true);
    try {
      await apiService.deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
      showToast.success("Project moved to trash. You can recover it from Settings for up to 30 days.");
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
      {/* Page Header inside a sticky header bar */}
      <header className="sticky top-0 z-30 w-full bg-white dark:bg-card border-b border-border shadow-xs backdrop-blur-md">
        <div className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center gap-2">
            <IconLayoutDashboard className="w-6 h-6 text-primary shrink-0" />
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary h-9 px-4 flex items-center gap-1.5 text-xs font-bold"
          >
            <IconPlus className="w-4 h-4" />
            <IconFolder className="w-4 h-4" />
            <span>New Project</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 w-full py-6">
        <div className="py-2">
          {/* Welcome User Section */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <p className="text-muted-foreground font-medium flex items-center gap-1.5 flex-wrap">
              <IconUserCheck className="w-4.5 h-4.5 text-primary/70 shrink-0" />
              <span>Welcome back, <span className="text-primary font-bold">{[user?.name, user?.lastName].filter(Boolean).join(" ")}</span>! Manage your AI maturity assessments</span>
            </p>
          </motion.div>

          {/* Trial Expired Banner */}
          <TrialExpiredBanner />

          {/* 48-Hour Rollback Banner */}
          <RollbackBanner projects={projects} />

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

          {/* Pending Invitations Section */}
          {!loading && myInvitations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2.5">
                <IconInbox className="w-6 h-6 text-primary shrink-0" />
                <span>Pending Invitations</span>
                <Badge variant="secondary" className="bg-primary/10 text-primary font-bold">
                  {myInvitations.length}
                </Badge>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {myInvitations.map((invitation: Invitation) => (
                  <Card key={invitation.id} className="border-primary/20 bg-primary/5 shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <IconFolder className="w-5 h-5 text-primary shrink-0" />
                            <span>{invitation.project.name}</span>
                          </CardTitle>
                          <CardDescription className="mt-1.5 flex items-center gap-1.5 text-muted-foreground/80">
                            <IconUser className="w-3.5 h-3.5" />
                            <span>Invited by <span className="font-semibold text-foreground">{invitation.inviter?.name || "Someone"}</span></span>
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-muted flex items-center gap-1">
                          <IconShield className="w-3 h-3 text-muted-foreground" />
                          <span>{invitation.role}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardFooter className="flex gap-3 pt-2 pb-4">
                      <Button
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-1.5"
                        onClick={() => router.push(`/invite/accept?token=${encodeURIComponent(invitation.token)}`)}
                      >
                        <IconCircleCheck className="w-4 h-4" />
                        <span>Accept</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-destructive/20 text-destructive hover:bg-destructive/10 flex items-center justify-center gap-1.5"
                        onClick={() => handleDeclineInvitation(invitation.token)}
                        disabled={decliningTokens.has(invitation.token)}
                      >
                        {decliningTokens.has(invitation.token) ? (
                          <IconLoader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <IconTrash className="w-4 h-4" />
                        )}
                        <span>Decline</span>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              <Separator className="mt-8 mb-2 opacity-50" />
            </motion.div>
          )}

          {/* Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
                <IconFolders className="w-6 h-6 text-primary shrink-0" />
                <span>Your Projects</span>
              </h2>
              {projects.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilterModal(true)}
                  className="h-9 px-3 flex items-center gap-1.5 text-xs font-semibold bg-white dark:bg-zinc-900 border-border/60 hover:bg-muted/50 rounded-lg shadow-2xs transition-all duration-200"
                >
                  <IconFilter className="w-4 h-4 text-muted-foreground" />
                  <span>Filter & Sort</span>
                  {(filterStatus !== 'all' || sortBy !== 'created_desc') && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary ml-0.5" />
                  )}
                </Button>
              )}
            </div>
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
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border/60 rounded-xl bg-muted/10">
                <IconFilter className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
                <h3 className="text-sm font-semibold mb-1">No matching projects</h3>
                <p className="text-xs text-muted-foreground mb-4">No projects match the selected status filter.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterStatus('all');
                    setSortBy('created_desc');
                  }}
                  className="h-8 px-3 text-xs font-semibold"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProjects.map((project, index) => {
                  const theme = CARD_THEMES[index % CARD_THEMES.length];
                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -5 }}
                    >
                      {(() => {
                        const handleProjectClick = () => {
                          if (project.status === 'completed') {
                            router.push(getProjectReportHref(project.id));
                          } else if (project.status === "not_started") {
                            setPathSelectionProjectId(project.id);
                            setShowPathSelection(true);
                          } else {
                            router.push(getProjectEditHref(project.id));
                          }
                        };
                        return (
                          <Card
                            role="button"
                            tabIndex={0}
                            className={`h-full flex flex-col justify-between hover:shadow-xl transition-all duration-300 cursor-pointer border ${theme.border} ${theme.shadow} ${
                              ["card-google-blue", "card-google-red", "card-google-yellow", "card-google-green", "card-google-purple"][index % 5]
                            }`}
                            onClick={handleProjectClick}
                            onKeyDown={(e) => {
                              const target = e.target as HTMLElement;
                              if (target && target.closest('button, a, input, select, textarea, [role="button"], [role="menuitem"]') !== e.currentTarget) {
                                return;
                              }
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleProjectClick();
                              }
                            }}
                          >
                        <CardHeader className="pb-3 flex-none">
                          <div className="flex justify-between items-start w-full min-w-0">
                            <div className="flex-1 mr-2 min-w-0">
                              <CardTitle className="text-lg mb-1.5 flex items-center justify-between w-full min-w-0">
                                <span className="flex items-center gap-2 min-w-0 font-bold pr-2 text-foreground">
                                  <IconFolder className="w-5 h-5 shrink-0 text-foreground/80" />
                                  <span className="truncate">{project.name}</span>
                                </span>
                                {project.user_id && user?.id && project.user_id !== user.id && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${theme.badge}`}>
                                    Shared
                                  </span>
                                )}
                              </CardTitle>
                              <div className="flex items-center gap-1.5 mt-1.5 w-full min-w-0 flex-nowrap">
                                <span className={`text-[10px] py-1 px-2.5 rounded-full font-semibold flex items-center gap-1 shrink min-w-0 ${theme.badge}`}>
                                  <IconCpu className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">{project.ai_system_type || "General AI System"}</span>
                                </span>
                                {project.created_at && (
                                  <span className={`text-[10px] py-1 px-2.5 rounded-full font-semibold flex items-center gap-1.5 shrink-0 ${theme.badge}`}>
                                    <IconCalendar className="w-3.5 h-3.5 shrink-0" />
                                    <span>Created: {formatDate(project.created_at)}</span>
                                  </span>
                                )}
                                {project.role && project.role !== 'OWNER' && (
                                  <span className={`text-[10px] py-1 px-2.5 rounded-full uppercase font-bold tracking-wider flex items-center gap-1 shrink-0 ${theme.badgeRole}`}>
                                    <IconShield className="w-3 h-3 shrink-0" />
                                    <span>{project.role}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  <span className="sr-only">Open menu</span>
                                  <IconDotsVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {(project.role === 'OWNER' || project.role === 'EDITOR' || project.user_id === user?.id) && (
                                  <DropdownMenuItem onClick={() => handleEditProject(project)}>
                                    <IconPencil className="mr-2 h-4 w-4" />
                                    <span>Edit</span>
                                  </DropdownMenuItem>
                                )}

                                {project.role === 'OWNER' && project.user_id === user?.id && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setDeletingProjectId(project.id);
                                      }}
                                      className="text-destructive focus:text-destructive cursor-pointer"
                                    >
                                      <IconTrash className="mr-2 h-4 w-4" />
                                      <span>Delete</span>
                                    </DropdownMenuItem>
                                  </>
                                )}

                                {(!project.role || project.role === 'VIEWER') && project.user_id !== user?.id && (
                                  <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
                                    Read-only access
                                  </div>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <CardDescription className="mt-3 text-sm line-clamp-3 min-h-[48px] text-muted-foreground/90">
                            {project.description || "No description provided"}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="py-2 flex-1 flex flex-col justify-end" />

                        <CardFooter className="pt-3 pb-5 flex justify-end gap-2 border-t border-border/55 flex-none bg-muted/5">
                          {project.status === 'completed' ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(getProjectEditHref(project.id));
                                }}
                                className="h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 bg-transparent hover:bg-transparent shadow-none border-0 text-foreground/80 hover:text-foreground"
                              >
                                <IconPencil className="w-3.5 h-3.5" />
                                <span>Edit Details</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(getProjectReportHref(project.id));
                                }}
                                className={`h-8 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs ${theme.btnSecondary}`}
                              >
                                <IconChartBar className="w-3.5 h-3.5" />
                                <span>View Report</span>
                                <IconArrowRight className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (project.status === "not_started") {
                                  setPathSelectionProjectId(project.id);
                                  setShowPathSelection(true);
                                } else {
                                  router.push(getProjectEditHref(project.id));
                                }
                              }}
                              className={`h-8 px-4 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs ${theme.btnSecondary}`}
                            >
                              <IconPlayerPlay className="w-3 h-3" />
                              <span>
                                {project.status === 'in_progress' ? 'Continue Assessment' : 'Start Assessment'}
                              </span>
                              <IconArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                      );
                      })()}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Unlock Premium Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => {
          setShowSubscriptionModal(false);
          setIsProjectLimitReached(false);
        }}
        isLimitReached={isProjectLimitReached}
        title="Unlock Premium to Access Multiple Projects"
        description="Upgrade to premium to create unlimited projects and unlock many more advanced capabilities."
      />

      {/* Filter & Sort Modal */}
      <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconFilter className="w-5 h-5 text-primary shrink-0" />
              <span>Filter & Sort Projects</span>
            </DialogTitle>
            <DialogDescription>
              Refine the list of projects displayed on your dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 py-4">
            {/* Sort Section */}
            <div className="flex flex-col gap-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sort By</h4>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: 'created_desc', label: 'Newest First' },
                  { id: 'created_asc', label: 'Oldest First' },
                  { id: 'name_asc', label: 'Name (A-Z)' },
                  { id: 'name_desc', label: 'Name (Z-A)' },
                ] satisfies { id: typeof sortBy; label: string }[]).map((opt) => (
                  <Button
                    key={opt.id}
                    variant={sortBy === opt.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy(opt.id)}
                    className={`h-9 px-3 rounded-lg text-xs font-semibold justify-start transition-all duration-200 ${
                      sortBy === opt.id ? "bg-primary text-primary-foreground shadow-sm" : "border-border/60 hover:bg-muted/50"
                    }`}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Filter Section */}
            <div className="flex flex-col gap-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Filter By Status</h4>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: 'all', label: 'All Statuses' },
                  { id: 'not_started', label: 'Not Started' },
                  { id: 'in_progress', label: 'In Progress' },
                  { id: 'completed', label: 'Completed' },
                ] satisfies { id: typeof filterStatus; label: string }[]).map((opt) => (
                  <Button
                    key={opt.id}
                    variant={filterStatus === opt.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus(opt.id)}
                    className={`h-9 px-3 rounded-lg text-xs font-semibold justify-start transition-all duration-200 ${
                      filterStatus === opt.id ? "bg-primary text-primary-foreground shadow-sm" : "border-border/60 hover:bg-muted/50"
                    }`}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-border/20 pt-4 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSortBy('created_desc');
                setFilterStatus('all');
              }}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground h-9 px-3"
            >
              Reset Defaults
            </Button>
            <Button
              size="sm"
              onClick={() => setShowFilterModal(false)}
              className="bg-primary text-primary-foreground font-bold h-9 px-4 rounded-lg shadow-sm"
            >
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Path Selection Modal — shown when user clicks Start on a new project */}
      {pathSelectionProjectId && (
        <PathSelectionModal
          isOpen={showPathSelection}
          projectId={pathSelectionProjectId}
          onSelectAima={() => {
            // Store choice in localStorage for re-engagement popup tracking and server
            if (user?.id && pathSelectionProjectId) {
              localStorage.setItem(`path_choice_${user.id}_${pathSelectionProjectId}`, "aima");
              apiService.updateProject(pathSelectionProjectId, { pathChoice: "aima" })
                .then(() => loadProjects())
                .catch(err => console.error("Failed to save path choice to server:", err));
            }
            setShowPathSelection(false);
            router.push(`/assess/${pathSelectionProjectId}`);
          }}
          onSelectPremium={() => {
            if (user?.id && pathSelectionProjectId) {
              localStorage.setItem(`path_choice_${user.id}_${pathSelectionProjectId}`, "premium");
              apiService.updateProject(pathSelectionProjectId, { pathChoice: "premium" })
                .then(() => loadProjects())
                .catch(err => console.error("Failed to save path choice to server:", err));
            }
            setShowPathSelection(false);
            router.push(`/assess/${pathSelectionProjectId}/crc/welcome`);
          }}
          onUpgradeClick={() => {
            setShowPathSelection(false);
            setShowSubscriptionModal(true);
          }}
          onClose={() => {
            setShowPathSelection(false);
          }}
          onDeleteProject={(id) => {
            setShowPathSelection(false);
            setDeletingProjectId(id);
          }}
        />
      )}

      {/* Re-engagement popup for returning free users */}
      <PremiumReEngagementPopup />

      {/* Create Project Modal */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconFolder className="w-5 h-5 text-primary" />
              <span>Create New Project</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">
                Project Name <span className="text-destructive">*</span>
              </Label>
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
                  maxLength={50}
                />
              </div>
              <div className="flex justify-end pt-1">
                <span className={`text-[10px] ${newProject.name.length >= 50 ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                  {newProject.name.length}/50
                </span>
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
                maxLength={MAX_DESCRIPTION_LENGTH}
              />
              <div className="flex justify-end pt-1">
                <span className={`text-[10px] ${(newProject.description || '').length >= MAX_DESCRIPTION_LENGTH ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                  {(newProject.description || '').length}/{MAX_DESCRIPTION_LENGTH}
                </span>
              </div>
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
                    <IconCpu className="h-4 w-4 text-muted-foreground" />
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
          <ProjectEditForm
            initialData={editProjectData}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditingProject(null)}
            isLoading={isLoading}
          />
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
              Are you sure you want to delete this project? It will be moved to the <strong>Deleted Projects</strong> section in Settings, where you can recover it for up to 30 days before it is permanently deleted.
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