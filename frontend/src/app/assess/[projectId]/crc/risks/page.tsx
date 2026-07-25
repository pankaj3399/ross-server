"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconAlertCircle,
  IconLoader2,
  IconArrowLeft,
  IconDownload,
  IconPlus,
  IconSearch,
  IconFilter,
  IconTrash,
  IconChevronRight,
  IconX,
  IconCheck,
  IconLock,
  IconInfoCircle,
  IconCalendar,
  IconUser,
  IconShield,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAssessmentContext } from "@/contexts/AssessmentContext";
import { apiService, type CRCRisk } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AssessmentSkeleton } from "@/components/Skeleton";
import SubscriptionModal from "@/components/features/subscriptions/SubscriptionModal";
import { showToast } from "@/lib/toast";

const RATING_COLORS = {
  Critical: "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400",
  High: "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400",
  Medium: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
  Low: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
};

const CATEGORIES = [
  "Governance",
  "Risk Mgmt",
  "Dev Lifecycle",
  "Data Mgmt",
  "Verification",
  "Operations",
  "Transparency",
  "Fairness",
  "General",
];

export default function CRCRiskRegisterPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const { user, loading: authLoading } = useAuth();
  const { loading: requireAuthLoading } = useRequireAuth();
  const { isPremium, loading: contextLoading, projectName } = useAssessmentContext();

  const [risks, setRisks] = useState<CRCRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRating, setSelectedRating] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedSource, setSelectedSource] = useState<string>("All");

  // Selected Risk for Detail Drawer
  const [selectedRisk, setSelectedRisk] = useState<CRCRisk | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit fields for Drawer
  const [mitigationPlan, setMitigationPlan] = useState("");
  const [owner, setOwner] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [reviewFrequency, setReviewFrequency] = useState("Quarterly");
  const [status, setStatus] = useState<"Open" | "Closed">("Open");

  // Manual Risk Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualCategory, setManualCategory] = useState("Governance");
  const [manualRating, setManualRating] = useState<"Critical" | "High" | "Medium" | "Low">("Medium");
  const [manualDescription, setManualDescription] = useState("");
  const [isCreatingManual, setIsCreatingManual] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [riskToDeleteId, setRiskToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Risks
  const fetchRisks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getCRCRisks(projectId);
      setRisks(res.data);
    } catch (err: any) {
      console.error("Failed to load risks:", err);
      setError(err?.message || "Failed to load risks");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (requireAuthLoading || contextLoading) return;
    if (!isPremium) return;
    fetchRisks();
  }, [requireAuthLoading, contextLoading, isPremium, fetchRisks]);

  // Open Drawer and Populate fields
  const handleRowClick = (risk: CRCRisk) => {
    setSelectedRisk(risk);
    setMitigationPlan(risk.mitigation_plan || "");
    setOwner(risk.owner || "");
    setTargetDate(risk.target_date ? risk.target_date.substring(0, 10) : "");
    setReviewFrequency(risk.review_frequency || "Quarterly");
    setStatus(risk.status);
    setDrawerOpen(true);
  };

  // Save updates in Drawer
  const handleUpdateRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRisk) return;

    setIsUpdating(true);
    try {
      const updateData: Partial<CRCRisk> = {
        mitigation_plan: mitigationPlan,
        owner: owner,
        target_date: targetDate || null,
        review_frequency: reviewFrequency,
        status: status,
      };

      // Allow editing details for manual risks
      if (selectedRisk.source === "Manual") {
        updateData.title = selectedRisk.title;
        updateData.category = selectedRisk.category;
        updateData.rating = selectedRisk.rating;
        updateData.description = selectedRisk.description;
      }

      const res = await apiService.updateCRCRisk(projectId, selectedRisk.id, updateData);
      showToast.success("Risk updated successfully");
      
      // Update local state
      setRisks((prev) => prev.map((r) => (r.id === selectedRisk.id ? res.data : r)));
      setSelectedRisk(res.data);
      setDrawerOpen(false);
    } catch (err: any) {
      showToast.error(err?.message || "Failed to update risk");
    } finally {
      setIsUpdating(false);
    }
  };

  // Create Manual Risk
  const handleCreateManualRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) {
      showToast.error("Risk title is required");
      return;
    }

    setIsCreatingManual(true);
    try {
      const res = await apiService.createCRCRisk(projectId, {
        title: manualTitle,
        category: manualCategory,
        rating: manualRating,
        description: manualDescription,
      });

      showToast.success("Manual risk added successfully");
      setRisks((prev) => [res.data, ...prev]);
      setModalOpen(false);
      
      // Reset fields
      setManualTitle("");
      setManualCategory("Governance");
      setManualRating("Medium");
      setManualDescription("");
    } catch (err: any) {
      showToast.error(err?.message || "Failed to add manual risk");
    } finally {
      setIsCreatingManual(false);
    }
  };

  // Delete Manual Risk
  const handleDeleteRisk = (riskId: string) => {
    setRiskToDeleteId(riskId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRisk = async () => {
    if (!riskToDeleteId || isDeleting) return;

    setIsDeleting(true);
    try {
      await apiService.deleteCRCRisk(projectId, riskToDeleteId);
      showToast.success("Risk deleted successfully");
      setRisks((prev) => prev.filter((r) => r.id !== riskToDeleteId));
      setDrawerOpen(false);
    } catch (err: any) {
      showToast.error(err?.message || "Failed to delete risk");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setRiskToDeleteId(null);
    }
  };

  // Focus trap and Escape key listener for Delete Confirmation Modal
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const deleteModalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (showDeleteConfirm) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      // Focus the Cancel button initially
      const timer = setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setShowDeleteConfirm(false);
          setRiskToDeleteId(null);
        }

        if (e.key === "Tab" && deleteModalRef.current) {
          const focusableElements = deleteModalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length === 0) return;
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("keydown", handleKeyDown);
        previousActiveElement.current?.focus();
      };
    }
  }, [showDeleteConfirm]);

  // KPI Calculations
  const stats = useMemo(() => {
    const counts = { total: 0, critical: 0, high: 0, medium: 0, low: 0, open: 0, closed: 0 };
    risks.forEach((r) => {
      counts.total++;
      if (r.status === "Open") {
        counts.open++;
        const rating = r.rating.toLowerCase();
        if (rating === "critical") counts.critical++;
        else if (rating === "high") counts.high++;
        else if (rating === "medium") counts.medium++;
        else if (rating === "low") counts.low++;
      } else {
        counts.closed++;
      }
    });
    return counts;
  }, [risks]);

  const [showAllRisks, setShowAllRisks] = useState(false);

  // Filtered & Sorted Risks (Capped at 10 by severity Critical > High > Medium > Low)
  const sortedRisks = useMemo(() => {
    const severityScore: Record<string, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    return risks.filter((r) => {
      const matchesSearch =
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.risk_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.owner || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRating = selectedRating === "All" || r.rating === selectedRating;
      const matchesStatus = selectedStatus === "All" || r.status === selectedStatus;
      const matchesSource = selectedSource === "All" || r.source === selectedSource;

      return matchesSearch && matchesRating && matchesStatus && matchesSource;
    }).sort((a, b) => {
      const scoreA = severityScore[a.rating.toLowerCase()] || 0;
      const scoreB = severityScore[b.rating.toLowerCase()] || 0;
      return scoreB - scoreA;
    });
  }, [risks, searchTerm, selectedRating, selectedStatus, selectedSource]);

  const displayedRisks = useMemo(() => {
    if (showAllRisks || sortedRisks.length <= 10) return sortedRisks;
    return sortedRisks.slice(0, 10);
  }, [sortedRisks, showAllRisks]);

  const hiddenCount = sortedRisks.length > 10 && !showAllRisks ? sortedRisks.length - 10 : 0;

  // Premium Gate
  if (!authLoading && !contextLoading && user && !isPremium) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background h-screen">
        <SubscriptionModal
          isOpen={true}
          onClose={() => router.push(`/assess/${projectId}`)}
        />
        <div className="text-center">
          <IconLoader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to subscription...</p>
        </div>
      </div>
    );
  }

  if (authLoading || requireAuthLoading || contextLoading || loading) {
    return <AssessmentSkeleton />;
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <IconAlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Could not load Risk Register</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => window.location.reload()}>Retry</Button>
              <Button variant="outline" onClick={() => router.push(`/assess/${projectId}/crc/dashboard`)}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background overflow-y-auto h-screen pb-16">
      <div className="w-full px-4 sm:px-6 py-6 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              CRC Compliance Feature
            </p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              AI Risk Register
            </h1>
            {projectName && (
              <p className="text-sm text-muted-foreground mt-0.5">{projectName}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/assess/${projectId}/crc/dashboard`}>
                <IconArrowLeft className="w-4 h-4 mr-2" />
                Readiness Dashboard
              </Link>
            </Button>
            <Button size="sm" onClick={() => setModalOpen(true)} className="gap-1.5">
              <IconPlus className="w-4 h-4" />
              Add Manual Risk
            </Button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <span className="text-2xl font-bold tabular-nums text-foreground">{stats.open}</span>
              <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">Open Risks</p>
            </CardContent>
          </Card>
          {[
            { label: "Critical", count: stats.critical, color: "text-red-500 border-red-500/20 bg-red-500/5" },
            { label: "High", count: stats.high, color: "text-orange-500 border-orange-500/20 bg-orange-500/5" },
            { label: "Medium", count: stats.medium, color: "text-amber-500 border-amber-500/20 bg-amber-500/5" },
            { label: "Low", count: stats.low, color: "text-blue-500 border-blue-500/20 bg-blue-500/5" },
          ].map((item) => (
            <Card key={item.label} className={item.color}>
              <CardContent className="p-4 text-center">
                <span className="text-2xl font-bold tabular-nums">{item.count}</span>
                <p className="text-xs font-bold mt-1 uppercase tracking-wider">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters and Search */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-xs">
              <IconSearch className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search code, title, owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            
            <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
              {/* Rating Filter */}
              <div className="flex items-center gap-1.5 bg-muted/50 border border-border rounded-lg p-1 text-xs">
                <span className="text-muted-foreground px-1.5 font-medium">Rating:</span>
                {["All", "Critical", "High", "Medium", "Low"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedRating(r)}
                    className={`px-2 py-1 rounded font-medium transition-colors ${selectedRating === r ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-muted/50 border border-border rounded-lg p-1 text-xs">
                <span className="text-muted-foreground px-1.5 font-medium">Status:</span>
                {["All", "Open", "Closed"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedStatus(s)}
                    className={`px-2 py-1 rounded font-medium transition-colors ${selectedStatus === s ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Source Filter */}
              <div className="flex items-center gap-1.5 bg-muted/50 border border-border rounded-lg p-1 text-xs">
                <span className="text-muted-foreground px-1.5 font-medium">Source:</span>
                {["All", "Automated", "Manual"].map((src) => (
                  <button
                    key={src}
                    onClick={() => setSelectedSource(src)}
                    className={`px-2 py-1 rounded font-medium transition-colors ${selectedSource === src ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    {src}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Risk Register Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[12%]">Risk ID</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[15%]">Category</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[10%]">Rating</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[10%]">Status</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[15%]">Owner</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[12%]">Target Date</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[5%]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayedRisks.length > 0 ? (
                  displayedRisks.map((risk) => (
                    <motion.tr
                      key={risk.id}
                      onClick={() => handleRowClick(risk)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleRowClick(risk);
                        }
                      }}
                      tabIndex={0}
                      whileHover={{ backgroundColor: "rgba(var(--primary-rgb), 0.02)" }}
                      className="cursor-pointer hover:bg-muted/30 transition-colors focus:bg-muted/30 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    >
                      <td className="p-4 font-mono text-xs font-semibold text-primary">{risk.risk_code}</td>
                      <td className="p-4">
                        <div className="font-medium text-foreground text-sm line-clamp-1">{risk.title}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${risk.source === "Automated" ? "bg-emerald-500" : "bg-blue-500"}`} />
                          {risk.source} Risk {risk.source === "Automated" && risk.system_control_id && `(${risk.system_control_id})`}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground font-medium">{risk.category}</td>
                      <td className="p-4">
                        <Badge variant="outline" className={`text-xs px-2 py-0.5 border ${RATING_COLORS[risk.rating]}`}>
                          {risk.rating}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={`text-xs px-2 py-0.5 ${risk.status === "Open" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {risk.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm font-medium text-foreground">
                        {risk.owner ? (
                          <div className="flex items-center gap-1.5">
                            <IconUser className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{risk.owner}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/60 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-4 text-sm font-mono text-muted-foreground">
                        {risk.target_date ? (
                          <div className="flex items-center gap-1.5">
                            <IconCalendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span>{new Date(risk.target_date).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <IconChevronRight className="w-4 h-4 text-muted-foreground" />
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      <IconInfoCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                      No risks found matching your filter selections.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {hiddenCount > 0 && (
            <div className="p-3.5 mt-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
              <div className="flex items-center gap-2">
                <IconAlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>{hiddenCount} additional risks were not displayed</strong> (starter list capped at top 10 sorted Critical &gt; High &gt; Medium &gt; Low).
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAllRisks(true)}
                className="h-7 text-xs border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 shrink-0 font-semibold"
              >
                View All {sortedRisks.length} Risks
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* DETAIL PANEL DRAWER (Slide-out) */}
      <AnimatePresence>
        {drawerOpen && selectedRisk && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-card border-l border-border shadow-2xl z-50 overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
                <div>
                  <span className="font-mono text-xs font-bold text-primary">{selectedRisk.risk_code}</span>
                  <h3 className="text-lg font-bold text-foreground mt-0.5">Remediation Details</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                >
                  <IconX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateRisk} className="space-y-6">
                
                {/* Core Risk Properties (Read-Only or Edit depending on Source) */}
                <div className="space-y-4 p-4 rounded-xl bg-muted/40 border border-border">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Risk Title</span>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{selectedRisk.title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</span>
                      <p className="text-sm font-medium text-foreground mt-0.5">{selectedRisk.category}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Risk Rating</span>
                      <div className="mt-1">
                        <Badge variant="outline" className={`text-xs px-2 py-0.5 ${RATING_COLORS[selectedRisk.rating]}`}>
                          {selectedRisk.rating}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {selectedRisk.description && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Risk Description</span>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed whitespace-pre-wrap">{selectedRisk.description}</p>
                    </div>
                  )}
                </div>

                {/* Regulatory Mapping and Controls (Premium Visual Addition for Automated) */}
                {selectedRisk.source === "Automated" && (selectedRisk.compliance_mapping || selectedRisk.implementation) && (
                  <div className="space-y-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                      <IconShield className="w-4 h-4 text-primary" />
                      Compliance Guidance ({selectedRisk.system_control_id})
                    </h4>
                    
                    {selectedRisk.compliance_mapping && (
                      <div className="text-[11px] space-y-1.5">
                        <span className="font-semibold text-muted-foreground">Regulatory References:</span>
                        <div className="space-y-1">
                          {selectedRisk.compliance_mapping.eu_ai_act && selectedRisk.compliance_mapping.eu_ai_act.length > 0 && (
                            <p className="text-foreground"><b>🇪🇺 EU AI Act:</b> {selectedRisk.compliance_mapping.eu_ai_act.map(e => e.ref).join(", ")}</p>
                          )}
                          {selectedRisk.compliance_mapping.nist_ai_rmf && selectedRisk.compliance_mapping.nist_ai_rmf.length > 0 && (
                            <p className="text-foreground"><b>🏛️ NIST AI RMF:</b> {selectedRisk.compliance_mapping.nist_ai_rmf.map(e => e.ref).join(", ")}</p>
                          )}
                          {selectedRisk.compliance_mapping.iso_42001 && selectedRisk.compliance_mapping.iso_42001.length > 0 && (
                            <p className="text-foreground"><b>📋 ISO 42001:</b> {selectedRisk.compliance_mapping.iso_42001.map(e => e.ref).join(", ")}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedRisk.implementation?.requirements && selectedRisk.implementation.requirements.length > 0 && (
                      <div className="text-[11px] space-y-1">
                        <span className="font-semibold text-muted-foreground">Recommended Actions:</span>
                        <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                          {selectedRisk.implementation.requirements.slice(0, 3).map((req, idx) => (
                            <li key={idx} className="line-clamp-1">{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Editable Fields */}
                <div className="space-y-4">
                  {/* Status Toggle */}
                  <div>
                    <label className="text-xs font-semibold text-foreground">Remediation Status</label>
                    <div className="flex items-center gap-4 mt-2">
                      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <input
                          type="radio"
                          name="risk-status"
                          value="Open"
                          checked={status === "Open"}
                          onChange={() => setStatus("Open")}
                          className="w-4 h-4 text-primary bg-background border-border"
                        />
                        Open (Remediation Pending)
                      </label>
                      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <input
                          type="radio"
                          name="risk-status"
                          value="Closed"
                          checked={status === "Closed"}
                          onChange={() => setStatus("Closed")}
                          className="w-4 h-4 text-primary bg-background border-border"
                        />
                        Closed (Mitigated)
                      </label>
                    </div>
                  </div>

                  {/* Owner */}
                  <div>
                    <label className="text-xs font-semibold text-foreground">Risk Owner</label>
                    <input
                      type="text"
                      placeholder="e.g. Sarah Jenkins (Head of AI)"
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      className="w-full mt-1.5 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Target Date */}
                  <div>
                    <label className="text-xs font-semibold text-foreground">Target Date</label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full mt-1.5 px-3 py-2 text-sm rounded-lg border border-border bg-background font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Review Frequency */}
                  <div>
                    <label className="text-xs font-semibold text-foreground">Review Frequency</label>
                    <select
                      value={reviewFrequency}
                      onChange={(e) => setReviewFrequency(e.target.value)}
                      className="w-full mt-1.5 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="Weekly">Weekly</option>
                      <option value="Bi-Weekly">Bi-Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Annually">Annually</option>
                    </select>
                  </div>

                  {/* Mitigation Plan */}
                  <div>
                    <label className="text-xs font-semibold text-foreground">Mitigation Plan</label>
                    <textarea
                      placeholder="Detail the steps, policies, and evidence needed to address and close this risk..."
                      value={mitigationPlan}
                      onChange={(e) => setMitigationPlan(e.target.value)}
                      rows={5}
                      className="w-full mt-1.5 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
                  {selectedRisk.source === "Manual" ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDeleteRisk(selectedRisk.id)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 gap-1.5"
                    >
                      <IconTrash className="w-4 h-4" />
                      Delete Risk
                    </Button>
                  ) : (
                    <div className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                      <IconLock className="w-3 h-3" />
                      Locked Automated Risk
                    </div>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isUpdating} className="gap-1.5">
                      {isUpdating && <IconLoader2 className="w-4 h-4 animate-spin" />}
                      Save Updates
                    </Button>
                  </div>
                </div>

              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* "+ ADD MANUAL RISK" MODAL DIALOG */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-black"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-md relative z-10 overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <h3 className="text-lg font-bold text-foreground">Add Manual Compliance Risk</h3>
                <button type="button" onClick={() => setModalOpen(false)} className="p-1 hover:bg-muted rounded-lg text-muted-foreground transition-colors">
                  <IconX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateManualRisk} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-xs font-semibold text-foreground">Risk Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vendor API data leakage vulnerability"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="text-xs font-semibold text-foreground">Category</label>
                    <select
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value)}
                      className="w-full mt-1.5 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Rating */}
                  <div>
                    <label className="text-xs font-semibold text-foreground">Risk Rating</label>
                    <select
                      value={manualRating}
                      onChange={(e) => setManualRating(e.target.value as any)}
                      className="w-full mt-1.5 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-semibold text-foreground">Risk Description</label>
                  <textarea
                    placeholder="Provide details about the risk, how it occurs, and potential impacts on the AI system..."
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    rows={4}
                    className="w-full mt-1.5 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none leading-relaxed"
                  />
                </div>

                {/* Buttons */}
                <div className="pt-4 border-t border-border flex justify-end gap-3 mt-6">
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreatingManual} className="gap-1.5">
                    {isCreatingManual && <IconLoader2 className="w-4 h-4 animate-spin" />}
                    Add Risk
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowDeleteConfirm(false);
                setRiskToDeleteId(null);
              }}
              className="fixed inset-0 bg-black"
            />
            
            <motion.div
              ref={deleteModalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-risk-title"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm relative z-10 text-center space-y-4"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                <IconTrash className="w-6 h-6" />
              </div>
              <h3 id="delete-risk-title" className="text-lg font-bold text-foreground">Delete Manual Risk</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Are you sure you want to delete this manual risk? This action cannot be undone.
              </p>

              {/* Buttons */}
              <div className="pt-2 flex justify-center gap-3">
                <Button ref={cancelBtnRef} type="button" variant="outline" onClick={() => {
                  setShowDeleteConfirm(false);
                  setRiskToDeleteId(null);
                }}>
                  Cancel
                </Button>
                <Button type="button" variant="destructive" onClick={confirmDeleteRisk} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete Risk"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
