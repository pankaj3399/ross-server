"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAssessmentContext } from "@/contexts/AssessmentContext";
import { safeRenderHTML } from "@/lib/htmlUtils";
import { showToast } from "@/lib/toast";
import { motion } from "framer-motion";
import {
  IconArrowLeft,
  IconArrowRight,
  IconShieldCheck,
  IconAlertCircle,
  IconLoader2,
  IconChevronDown,
  IconChevronRight,
  IconCheck,
  IconLock,
  IconDownload,
  IconUpload,
  IconInfoCircle,
  IconFileText,
  IconMessage,
  IconX,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { SecureTextarea } from "@/components/shared/SecureTextarea";
import { AssessmentSkeleton } from "@/components/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { PREMIUM_STATUS } from "@/lib/constants";
import SubscriptionModal from "@/components/features/subscriptions/SubscriptionModal";
import CommentsPanel from "@/components/shared/CommentsPanel";
import { apiService } from "@/lib/api";
import { Breadcrumb } from "@/components/shared/Breadcrumb";

// --- Interfaces ---

interface Control {
  id: string;
  control_id: string;
  control_title: string;
  category_name: string;
  priority: string;
  status: string;
  version: number;
  applicable_to: string[];
  expected_timeline: string;
  control_statement: string;
  control_objective: string;
  risk_description: string;
  implementation: {
    requirements: string[];
    steps: string[];
  };
  evidence_requirements: string[];
  compliance_mapping: {
    eu_ai_act: Array<{ ref: string; context: string }>;
    nist_ai_rmf: Array<{ ref: string; context: string }>;
    iso_42001: Array<{ ref: string; context: string }>;
  };
  aima_mapping: {
    domain: string;
    area: string;
    maturity_enhancement: string;
  };
  existing_certification_relevance?: string;
  created_at: string;
  updated_at: string;
}

interface CRCResponse {
  value: number;
  notes: string;
  updatedAt: string;
}

// --- Constants ---

const PRIORITY_COLORS: Record<string, string> = {
  High: "bg-destructive/15 text-destructive border-destructive/30",
  Medium: "bg-warning/15 text-warning border-warning/30",
  Low: "bg-success/15 text-success border-success/30",
};

const ANSWER_OPTIONS = [
  { value: 0, label: "No", description: "Not implemented" },
  { value: 0.5, label: "Partially", description: "Partially implemented or in progress" },
  { value: 1, label: "Yes", description: "Fully implemented and operational" },
  { value: 2, label: "NA", description: "Not applicable to this AI system" },
  { value: 3, label: "Not Sure", description: "Implementation status unknown" },
];

const getCrcOptionColors = (value: number, isSelected: boolean) => {
  if (value === 0) { // No
    return {
      labelClass: isSelected
        ? "border-destructive bg-destructive/5 dark:bg-destructive/10"
        : "border-border hover:border-destructive/40 hover:bg-destructive/2 dark:hover:bg-destructive/2",
      radioClass: isSelected
        ? "border-destructive bg-destructive"
        : "border-border bg-transparent",
    };
  } else if (value === 0.5) { // Partially
    return {
      labelClass: isSelected
        ? "border-warning bg-warning/5 dark:bg-warning/10"
        : "border-border hover:border-warning/40 hover:bg-warning/2 dark:hover:bg-warning/2",
      radioClass: isSelected
        ? "border-warning bg-warning"
        : "border-border bg-transparent",
    };
  } else if (value === 1) { // Yes
    return {
      labelClass: isSelected
        ? "border-success bg-success/5 dark:bg-success/10"
        : "border-border hover:border-success/40 hover:bg-success/2 dark:hover:bg-success/2",
      radioClass: isSelected
        ? "border-success bg-success"
        : "border-border bg-transparent",
    };
  } else { // NA (2) and Not Sure (3) - neutral blue accent
    return {
      labelClass: isSelected
        ? "border-primary bg-primary/5 dark:bg-primary/10"
        : "border-border hover:border-primary/40 hover:bg-primary/2 dark:hover:bg-primary/2",
      radioClass: isSelected
        ? "border-primary bg-primary"
        : "border-border bg-transparent",
    };
  }
};

// --- Main Page Component ---

export default function CRCAssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const controlIdParam = searchParams.get("controlId");
  const categoryParam = searchParams.get("category");
  const { user, loading: authLoading } = useAuth();

  const {
    crcControls: controls,
    crcResponses: responses,
    crcControlFlags: controlFlags,
    updateControlMandate,
    handleCrcAnswerChange,
    handleCrcNoteSave,
    handleEvidenceStatusChange,
    uploadEvidenceFile,
    isPremium,
    projectName,
    loading: contextLoading,
    saving,
    isReadOnly,
    submitCrcProject,
    submitting,
  } = useAssessmentContext();

  const [uploadingFile, setUploadingFile] = useState(false);

  const projectBreadcrumbHref = isPremium
    ? `/assess/${projectId}/crc/dashboard`
    : `/assess/${projectId}`;

  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<"evidence" | "notes" | "comments">("evidence");
  const [dismissedNudges, setDismissedNudges] = useState<Set<string>>(new Set());

  const handleDismissNudge = (controlId: string) => {
    setDismissedNudges(prev => {
      const next = new Set(prev);
      next.add(controlId);
      return next;
    });
  };

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, tab: "evidence" | "notes" | "comments") => {
    const tabs: ("evidence" | "notes" | "comments")[] = ["evidence", "notes", "comments"];
    const currentIndex = tabs.indexOf(tab);
    let nextIndex = currentIndex;

    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else {
      return;
    }

    e.preventDefault();
    const nextTab = tabs[nextIndex];
    setActiveTab(nextTab);
    
    setTimeout(() => {
      const nextButton = document.getElementById(`tab-${nextTab}`);
      if (nextButton) {
        nextButton.focus();
      }
    }, 0);
  };

  // Derive current control from URL or category
  const currentIndex = useMemo(() => {
    if (controlIdParam) {
      const idx = controls.findIndex(c => c.id === controlIdParam);
      if (idx !== -1) return idx;
    }
    if (categoryParam) {
      const idx = controls.findIndex(c => c.category_name === categoryParam);
      if (idx !== -1) return idx;
    }
    return 0; // Default to first
  }, [controlIdParam, categoryParam, controls]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const mainElement = document.querySelector('main') || document.getElementById('main-content');
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentIndex]);

  const currentControl = controls[currentIndex];
  const currentResponse = responses[currentControl?.id];

  const [urlInput, setUrlInput] = useState("");

  useEffect(() => {
    setUrlInput(currentResponse?.evidenceUrl || "");
    setShowDetails(false);
  }, [currentControl?.id, currentResponse?.evidenceUrl]);


  // Navigation
  const handleNext = () => {
    if (currentIndex < controls.length - 1) {
      const nextControl = controls[currentIndex + 1];
      router.push(`/assess/${projectId}/crc?controlId=${nextControl.id}`);
      setShowDetails(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevControl = controls[currentIndex - 1];
      router.push(`/assess/${projectId}/crc?controlId=${prevControl.id}`);
      setShowDetails(false);
    }
  };

  // --- Premium Gate Conditional ---
  if (!authLoading && !contextLoading && user && !isPremium) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background h-screen">
        <SubscriptionModal
          isOpen={true}
          onClose={() => {
            router.push(`/assess/${projectId}`);
          }}
        />
        <div className="text-center">
          <IconLoader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to subscription...</p>
        </div>
      </div>
    );
  }

  // Progress
  const totalControls = controls.length;
  const answeredControls = controls.filter((ctrl) => {
    const r = responses[ctrl.id] || responses[ctrl.control_id];
    return r !== undefined && r.value !== null && r.value !== undefined;
  }).length;
  const progress = totalControls > 0 ? (answeredControls / totalControls) * 100 : 0;

  // Category-wise progress
  const currentCategoryControls = useMemo(() => {
    if (!currentControl) return [];
    return controls.filter(
      (c) => c.category_name === currentControl.category_name || c.category_id === currentControl.category_id
    );
  }, [controls, currentControl]);

  const currentCategoryAnswered = useMemo(() => {
    return currentCategoryControls.filter((c) => {
      const r = responses[c.id] || responses[c.control_id];
      return r !== undefined && r.value !== null && r.value !== undefined;
    }).length;
  }, [currentCategoryControls, responses]);

  const categoryProgress = currentCategoryControls.length > 0
    ? (currentCategoryAnswered / currentCategoryControls.length) * 100
    : 0;

  if (authLoading || contextLoading) {
    return <AssessmentSkeleton />;
  }

  if (controls.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background h-full">
        <div className="text-center max-w-md px-4">
          <IconAlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">No CRC Controls Available</h1>
          <p className="text-muted-foreground mb-6">
            There are currently no published compliance readiness controls. Please check back later.
          </p>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-border text-foreground hover:bg-muted rounded-xl transition-all duration-300"
          >
            <IconArrowLeft className="w-4 h-4 inline mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentAnswer = currentResponse?.value;
  const currentNote = localNotes[currentControl.id] ?? currentResponse?.notes ?? "";

  return (
    <div className="flex-1 flex flex-col w-full">
        {/* Header */}
        <div className="bg-sidebar border-b border-sidebar-border px-8 py-3 flex-none sticky top-0 z-20 shadow-xs w-full">
          <div className="w-full flex flex-col gap-2">
            {/* Top: Breadcrumb */}
            <div className="flex items-center justify-between text-xs">
              <Breadcrumb
                projectName={projectName || "Loading..."}
                projectHref={projectBreadcrumbHref}
                items={[{ label: "Compliance Readiness Controls (CRC)" }]}
              />

              {saving && (
                <div className="flex items-center gap-2 text-xs text-primary font-medium animate-pulse" style={{ color: "var(--section-premium)" }}>
                  <IconLoader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </div>
              )}
            </div>

            {/* Bottom: Main row */}
            <div className="flex items-center justify-between gap-4 mt-1">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => router.back()}
                  type="button"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-border/60 hover:bg-muted text-xs text-foreground/80 hover:text-foreground transition-all shadow-2xs shrink-0"
                >
                  <IconArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <div className="h-5 w-px bg-border shrink-0" />
                <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                  <IconShieldCheck className="w-4 h-4 text-primary shrink-0" style={{ color: "var(--section-premium)" }} />
                  <h1 className="text-sm font-bold text-foreground truncate">
                    {currentControl.category_name}
                  </h1>
                  <span className="text-muted-foreground/30 text-xs shrink-0">|</span>
                  <span className="text-xs text-muted-foreground font-medium truncate max-w-[120px] sm:max-w-xs">
                    {currentControl.control_title}
                  </span>
                  <span
                    className="inline-flex items-center text-[9px] py-0.5 px-2 rounded-full font-semibold border shrink-0"
                    style={{
                      backgroundColor: "rgba(252, 168, 0, 0.10)",
                      color: "var(--section-premium)",
                      borderColor: "rgba(252, 168, 0, 0.20)",
                    }}
                  >
                    Control {currentIndex + 1} of {totalControls}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isReadOnly && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground text-[10px] font-medium">
                    <IconLock size={10} />
                    View Only
                  </div>
                )}
                <Link
                  href={`/assess/${projectId}/crc/welcome`}
                  className="text-xs font-semibold px-3 py-1.5 border border-border/60 hover:bg-muted rounded-lg text-foreground/80 hover:text-foreground transition-all shadow-2xs shrink-0"
                >
                  About CRC
                </Link>
                {!isReadOnly && (
                  <Button
                    onClick={submitCrcProject}
                    type="button"
                    disabled={submitting || answeredControls < totalControls}
                    title={
                      answeredControls < totalControls
                        ? `Answer all controls (${answeredControls}/${totalControls}) before submitting`
                        : "Finalize this CRC assessment"
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold shadow-xs border-none"
                    style={{
                      backgroundColor: "var(--section-premium)",
                      color: "black",
                    }}
                  >
                    {submitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <IconShieldCheck className="w-3.5 h-3.5 text-black" />
                        <span>Submit Assessment</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Progress Bar & Category Markers */}
            <div className="mt-2 w-full space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Category Progress ({currentControl?.category_name}):
                  </span>
                  <span className="text-[10px] font-bold text-[var(--section-premium)] font-mono bg-[var(--section-premium)]/10 px-1.5 py-0.5 rounded border border-[var(--section-premium)]/20">
                    {currentCategoryAnswered}/{currentCategoryControls.length} Controls ({Math.round(categoryProgress)}%)
                  </span>
                </div>
                <span className="text-[10px] font-bold text-foreground">
                  Overall: {answeredControls}/{totalControls} Controls ({Math.round(progress)}%)
                </span>
              </div>
              <div className="w-full bg-secondary dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, backgroundColor: "var(--section-premium)" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 px-8 py-6 w-full">
          <div className="w-full space-y-6">
            
            {/* Control Card */}
            <motion.div
              key={currentControl.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-card rounded-2xl shadow-lg border border-border p-8"
            >
              {/* Control Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <Badge variant="outline" className="text-xs font-mono">
                    {currentControl.control_id}
                  </Badge>
                  <Badge className={PRIORITY_COLORS[currentControl.priority] || "bg-muted text-muted-foreground"}>
                    {currentControl.priority} Priority
                  </Badge>

                  {(() => {
                    const flagInfo = controlFlags?.[currentControl.control_id] || {
                      flag: (currentControl as any).flag || "OPTIONAL",
                      reason: "Optional control based on system profile.",
                    };
                    const currentFlag = flagInfo.flag || "OPTIONAL";
                    const isManualOverride = flagInfo.is_manual_override === true;

                    const getBadgeStyle = () => {
                      if (currentFlag === "MANDATORY") {
                        return "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/25";
                      }
                      if (currentFlag === "RECOMMENDED") {
                        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/25";
                      }
                      return "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30 hover:bg-slate-500/25";
                    };

                    const getLabel = () => {
                      if (currentFlag === "MANDATORY") return isManualOverride ? "Mandatory (Manual)" : "Mandatory";
                      if (currentFlag === "RECOMMENDED") return isManualOverride ? "Recommended (Manual)" : "Recommended";
                      return isManualOverride ? "Optional (Manual)" : "Optional";
                    };

                    if (isReadOnly) {
                      return (
                        <Badge className={`${getBadgeStyle()} text-xs font-semibold border`}>
                          {getLabel()}
                        </Badge>
                      );
                    }

                    return (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-md cursor-pointer disabled:opacity-50"
                            title="Click to change control mandate"
                          >
                            <Badge className={`${getBadgeStyle()} text-xs font-semibold border transition-all inline-flex items-center gap-1 py-1 px-2.5 shadow-xs`}>
                              <span>{getLabel()}</span>
                              <IconChevronDown className="w-3.5 h-3.5 opacity-75" />
                            </Badge>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48 z-50">
                          <DropdownMenuItem
                            disabled={saving}
                            onClick={() => updateControlMandate(currentControl.control_id, "MANDATORY")}
                            className="flex items-center justify-between text-xs font-semibold cursor-pointer text-red-600 dark:text-red-400"
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                              Mandatory
                            </span>
                            {currentFlag === "MANDATORY" && <IconCheck className="w-3.5 h-3.5" />}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            disabled={saving}
                            onClick={() => updateControlMandate(currentControl.control_id, "RECOMMENDED")}
                            className="flex items-center justify-between text-xs font-semibold cursor-pointer text-blue-600 dark:text-blue-400"
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              Recommended
                            </span>
                            {currentFlag === "RECOMMENDED" && <IconCheck className="w-3.5 h-3.5" />}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            disabled={saving}
                            onClick={() => updateControlMandate(currentControl.control_id, "OPTIONAL")}
                            className="flex items-center justify-between text-xs font-semibold cursor-pointer text-slate-600 dark:text-slate-400"
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-slate-500" />
                              Optional
                            </span>
                            {currentFlag === "OPTIONAL" && <IconCheck className="w-3.5 h-3.5" />}
                          </DropdownMenuItem>

                          {isManualOverride && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabled={saving}
                                onClick={() => updateControlMandate(currentControl.control_id, "RESET")}
                                className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer"
                              >
                                🔄 Revert to Profile Default
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  })()}

                  <Badge variant="outline" className="text-xs">
                    {currentControl.category_name}
                  </Badge>
                </div>

                {/* Control Title = The Question */}
                <h2 className="text-xl font-semibold text-foreground leading-relaxed">
                  {currentControl.control_title}
                </h2>

                {/* Control Statement (rendered as HTML) */}
                {currentControl.control_statement && (
                  <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/50 p-4 text-sm text-muted-foreground [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:mb-1 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_a]:text-primary [&_a]:underline [&_p]:mb-2 [&_p:last-child]:mb-0">
                    <div dangerouslySetInnerHTML={{ __html: safeRenderHTML(currentControl.control_statement) }} />
                  </div>
                )}

                {/* Control Objective */}
                {currentControl.control_objective && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Objective: </span>
                    <span dangerouslySetInnerHTML={{ __html: safeRenderHTML(currentControl.control_objective) }} />
                  </div>
                )}
              </div>

              {/* Compliance Template Download Block (Feature 6) */}
              <div className="mt-6 mb-6 p-4 rounded-xl border border-primary/25 bg-primary/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    📄 Compliance Document Template
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Download the pre-built Word template containing fillable fields, guidelines, and checklists for this control to quickly build your compliance evidence.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      showToast.success("Downloading compliance template...");
                      const { blob, filename } = isReadOnly
                        ? await apiService.downloadCRCTemplate(currentControl.id)
                        : await apiService.downloadCRCTemplate(currentControl.id, projectId);

                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = filename;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      window.URL.revokeObjectURL(url);

                      // Instantly autoflip evidence status from "No Evidence" to "Template Downloaded" without requiring page refresh
                      const currentStatus = currentResponse?.evidenceStatus || "No Evidence";
                      if (!isReadOnly && (currentStatus === "No Evidence" || !currentResponse?.evidenceStatus)) {
                        await handleEvidenceStatusChange(currentControl.id, "Template Downloaded");
                      }
                    } catch (err: any) {
                      showToast.error("Failed to download compliance template.");
                    }
                  }}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <IconDownload className="w-4 h-4" />
                  Download Template
                </button>
              </div>

              {/* Expandable Implementation Details */}
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 mb-4 transition-colors"
              >
                {showDetails ? (
                  <IconChevronDown className="w-4 h-4" />
                ) : (
                  <IconChevronRight className="w-4 h-4" />
                )}
                {showDetails ? "Hide" : "Show"} Implementation Details & Requirements
              </button>

              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 space-y-4 border-t border-border pt-4"
                >
                  {/* Risk Description */}
                  {currentControl.risk_description && (
                    <div>
                      <h4 className="font-semibold text-sm text-foreground mb-1">Risk Description</h4>
                      <div
                        className="text-sm text-muted-foreground [&_p]:mb-2 [&_p:last-child]:mb-0"
                        dangerouslySetInnerHTML={{ __html: safeRenderHTML(currentControl.risk_description) }}
                      />
                    </div>
                  )}

                  {/* Implementation */}
                  {currentControl.implementation && (currentControl.implementation.requirements?.filter(r => r).length > 0 || currentControl.implementation.steps?.filter(s => s).length > 0) && (
                    <div>
                      <h4 className="font-semibold text-sm text-foreground mb-2">Implementation</h4>
                      {currentControl.implementation.requirements?.filter(r => r).length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-foreground/70 mb-1">Requirements:</p>
                          <ul className="space-y-1 ml-4">
                            {currentControl.implementation.requirements.filter(r => r).map((req, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground list-disc">{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {currentControl.implementation.steps?.filter(s => s).length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-foreground/70 mb-1">Steps:</p>
                          <ol className="space-y-1 ml-4">
                            {currentControl.implementation.steps.filter(s => s).map((step, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground list-decimal">{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expected Timeline */}
                  {currentControl.expected_timeline && (
                    <div className={currentControl.implementation && (currentControl.implementation.requirements?.filter(r => r).length > 0 || currentControl.implementation.steps?.filter(s => s).length > 0) ? "mt-2" : ""}>
                      <h4 className="font-semibold text-sm text-foreground mb-1">Expected Timeline</h4>
                      <p className="text-sm text-muted-foreground">
                        {currentControl.expected_timeline}
                      </p>
                    </div>
                  )}

                  {/* Evidence Requirements */}
                  {currentControl.evidence_requirements?.filter(e => e).length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-foreground mb-1">Evidence Requirements</h4>
                      <ul className="space-y-1 ml-4">
                        {currentControl.evidence_requirements.filter(e => e).map((evidence, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground list-disc">{evidence}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Compliance Mapping */}
                  {currentControl.compliance_mapping && (
                    (() => {
                      const hasEU = currentControl.compliance_mapping.eu_ai_act?.length > 0;
                      const hasNIST = currentControl.compliance_mapping.nist_ai_rmf?.length > 0;
                      const hasISO = currentControl.compliance_mapping.iso_42001?.length > 0;
                      if (!hasEU && !hasNIST && !hasISO) return null;
                      return (
                        <div>
                          <h4 className="font-semibold text-sm text-foreground mb-2">Compliance Mapping</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {hasEU && (
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-xs font-bold text-foreground/70 mb-1">EU AI Act</p>
                                {currentControl.compliance_mapping.eu_ai_act.map((item, idx) => (
                                  <p key={idx} className="text-xs text-muted-foreground">
                                    <span className="font-medium">{item.ref}</span>
                                    {item.context && ` — ${item.context}`}
                                  </p>
                                ))}
                              </div>
                            )}
                            {hasNIST && (
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-xs font-bold text-foreground/70 mb-1">NIST AI RMF</p>
                                {currentControl.compliance_mapping.nist_ai_rmf.map((item, idx) => (
                                  <p key={idx} className="text-xs text-muted-foreground">
                                    <span className="font-medium">{item.ref}</span>
                                    {item.context && ` — ${item.context}`}
                                  </p>
                                ))}
                              </div>
                            )}
                            {hasISO && (
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-xs font-bold text-foreground/70 mb-1">ISO 42001</p>
                                {currentControl.compliance_mapping.iso_42001.map((item, idx) => (
                                  <p key={idx} className="text-xs text-muted-foreground">
                                    <span className="font-medium">{item.ref}</span>
                                    {item.context && ` — ${item.context}`}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  )}

                  {/* Existing Certification Relevance */}
                  {currentControl.existing_certification_relevance && (
                    <div className="mt-4 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10">
                      <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5 mb-1.5">
                        <IconInfoCircle className="w-4 h-4 shrink-0" />
                        Existing Certification Relevance
                      </h4>
                      <p className="text-xs text-blue-900/80 dark:text-blue-200/80 leading-relaxed whitespace-pre-wrap">
                        {currentControl.existing_certification_relevance}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Answer Radio Buttons — Yes / Partially / No / NA */}
              <div className="space-y-3">
                {ANSWER_OPTIONS.map((option) => {
                  const isSelected = currentAnswer === option.value;
                  const colors = getCrcOptionColors(option.value, isSelected);
                  return (
                    <label
                      key={option.value}
                      className={`flex items-start p-4 rounded-xl border-2 transition-all duration-200 ${colors.labelClass} ${
                        isReadOnly
                          ? "cursor-not-allowed opacity-80"
                          : "cursor-pointer hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.995]"
                      }`}
                    >
                      <div className="relative flex items-center justify-center mt-1">
                        <input
                          type="radio"
                          name={`answer-${currentControl.id}`}
                          value={option.value}
                          checked={isSelected}
                          disabled={isReadOnly}
                          onChange={() => handleCrcAnswerChange(currentControl.id, option.value)}
                          className="sr-only peer"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50 peer-focus-visible:ring-offset-1 ${colors.radioClass}`}>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 rounded-full bg-white"
                            />
                          )}
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="text-sm font-semibold text-foreground">
                          {option.label}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {option.description}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </motion.div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pb-4">
              <button
                onClick={handlePrevious}
                type="button"
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-border text-foreground hover:bg-muted"
              >
                <IconArrowLeft className="w-4 h-4" />
                Previous
              </button>

              {currentIndex < controls.length - 1 ? (
                <button
                  onClick={handleNext}
                  type="button"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Next
                  <IconArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => router.push(`/assess/${projectId}/crc/dashboard`)}
                  type="button"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  View CRC Dashboard
                  <IconArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Supporting Card (Evidence, Notes, Collaboration) */}
            <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
              {/* Tab Headers */}
              <div role="tablist" className="flex border-b border-border bg-muted/30">
                <button
                  type="button"
                  id="tab-evidence"
                  role="tab"
                  aria-selected={activeTab === "evidence"}
                  aria-controls="panel-evidence"
                  tabIndex={activeTab === "evidence" ? 0 : -1}
                  onKeyDown={(e) => handleTabKeyDown(e, "evidence")}
                  onClick={() => setActiveTab("evidence")}
                  className={`flex items-center gap-2 px-5 py-3.5 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === "evidence"
                      ? "border-primary text-primary bg-card"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20"
                  }`}
                  style={activeTab === "evidence" ? { borderBottomColor: "var(--section-premium)", color: "var(--section-premium)" } : {}}
                >
                  <IconShieldCheck className="w-4 h-4" />
                  Evidence Status
                </button>
                <button
                  type="button"
                  id="tab-notes"
                  role="tab"
                  aria-selected={activeTab === "notes"}
                  aria-controls="panel-notes"
                  tabIndex={activeTab === "notes" ? 0 : -1}
                  onKeyDown={(e) => handleTabKeyDown(e, "notes")}
                  onClick={() => setActiveTab("notes")}
                  className={`flex items-center gap-2 px-5 py-3.5 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === "notes"
                      ? "border-primary text-primary bg-card"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20"
                  }`}
                  style={activeTab === "notes" ? { borderBottomColor: "var(--section-premium)", color: "var(--section-premium)" } : {}}
                >
                  <IconFileText className="w-4 h-4" />
                  Notes
                </button>
                <button
                  type="button"
                  id="tab-comments"
                  role="tab"
                  aria-selected={activeTab === "comments"}
                  aria-controls="panel-comments"
                  tabIndex={activeTab === "comments" ? 0 : -1}
                  onKeyDown={(e) => handleTabKeyDown(e, "comments")}
                  onClick={() => setActiveTab("comments")}
                  className={`flex items-center gap-2 px-5 py-3.5 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === "comments"
                      ? "border-primary text-primary bg-card"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20"
                  }`}
                  style={activeTab === "comments" ? { borderBottomColor: "var(--section-premium)", color: "var(--section-premium)" } : {}}
                >
                  <IconMessage className="w-4 h-4" />
                  Comments & Collaboration
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "evidence" && (
                  <motion.div
                    id="panel-evidence"
                    role="tabpanel"
                    aria-labelledby="tab-evidence"
                    tabIndex={0}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4 focus:outline-none"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Status Dropdown */}
                      <div>
                        <label htmlFor="evidence-status-select" className="block text-xs text-muted-foreground mb-1.5 font-medium">
                          Select Status
                        </label>
                        <div className="relative">
                          <select
                            id="evidence-status-select"
                            disabled={isReadOnly || currentAnswer === undefined || currentAnswer === null || currentAnswer === 2}
                            value={currentAnswer === 2 ? "No Evidence" : (currentResponse?.evidenceStatus || "No Evidence")}
                            onChange={async (e) => {
                              if (currentAnswer === undefined || currentAnswer === null) {
                                showToast.error("Please answer the control question before managing evidence");
                                return;
                              }
                              const newStatus = e.target.value as any;
                              const trimmedUrl = (urlInput || "").trim();

                              try {
                                await handleEvidenceStatusChange(currentControl.id, newStatus, trimmedUrl || currentResponse?.evidenceUrl);
                                showToast.success(`Evidence status set to '${newStatus}'`);
                              } catch (err) {
                                // Handled in context
                              }
                            }}
                            className="w-full appearance-none px-3 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <option value="No Evidence">No Evidence</option>
                            <option value="Template Downloaded">Template Downloaded</option>
                            <option value="Evidence in Progress">Evidence in Progress</option>
                            <option value="Evidence Complete">Evidence Complete</option>
                          </select>
                          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground">
                            <IconChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      {/* Badge Display */}
                      <div className="flex items-end pb-2">
                        <span className="text-xs text-muted-foreground mr-2 font-medium">Current Status:</span>
                        {(() => {
                          if (currentAnswer === 2) {
                            return (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                                Not Required
                              </span>
                            );
                          }
                          const status = currentResponse?.evidenceStatus || "No Evidence";
                          let colorClass = "bg-secondary text-secondary-foreground";
                          if (status === "Template Downloaded") colorClass = "bg-blue-500/10 text-blue-500 border border-blue-500/20";
                          else if (status === "Evidence in Progress") colorClass = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
                          else if (status === "Evidence Complete") colorClass = "bg-green-500/10 text-green-500 border border-green-500/20";
                          return (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
                              {status}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Evidence Document Upload & URL Input - Shown for answered non-NA controls */}
                    {currentAnswer !== null && currentAnswer !== undefined && currentAnswer !== 2 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 w-full border-t border-border pt-4"
                      >
                        {/* Direct File Upload & Parse */}
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1.5 font-medium flex items-center justify-between">
                            <span>Upload Evidence Document (.docx, .pdf, .txt)</span>
                            <span className="text-[10px] text-muted-foreground">Auto-parsed & validated</span>
                          </label>
                          <div className="flex items-center gap-3">
                            <label
                              htmlFor={`evidence-file-input-${currentControl.id}`}
                              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border hover:border-primary/50 bg-muted/20 cursor-pointer transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${uploadingFile || isReadOnly ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <IconUpload className="w-4 h-4 text-primary" />
                              <span className="text-xs font-medium text-foreground">
                                {uploadingFile ? "Parsing document..." : "Choose & Parse Evidence File"}
                              </span>
                              <input
                                id={`evidence-file-input-${currentControl.id}`}
                                type="file"
                                accept=".docx,.doc,.pdf,.txt,.md"
                                disabled={isReadOnly || uploadingFile}
                                className="sr-only"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setUploadingFile(true);
                                  try {
                                    const res = await uploadEvidenceFile(currentControl.id, file);
                                    if (res.analysis && res.analysis.extractedTextLength > 0) {
                                      showToast.info(`Extracted ${res.analysis.extractedTextLength} chars from document`);
                                    }
                                  } catch (err: any) {
                                    showToast.error(err.message || "Failed to upload file");
                                  } finally {
                                    setUploadingFile(false);
                                    e.target.value = "";
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        {/* URL Input */}
                        <div>
                          <label htmlFor="evidence-url-input" className="block text-xs text-muted-foreground mb-1.5 flex items-center justify-between font-medium">
                            <span>Evidence URL (HTTPS required)</span>
                            {currentResponse?.evidenceStatus === "Evidence Complete" && (
                              <span className="text-red-500 text-[10px]">* Required</span>
                            )}
                          </label>
                          <input
                            id="evidence-url-input"
                            type="text"
                            disabled={isReadOnly}
                            value={urlInput}
                            placeholder="https://docs.google.com/document/d/... or other link"
                            onChange={(e) => setUrlInput(e.target.value)}
                            onBlur={async () => {
                              if (urlInput === (currentResponse?.evidenceUrl || "")) return;
                              const finalUrl = urlInput.trim() === "" ? null : urlInput.trim();
                              let targetStatus = currentResponse?.evidenceStatus || "No Evidence";
                              if (finalUrl && (targetStatus === "No Evidence" || targetStatus === "Template Downloaded")) {
                                targetStatus = "Evidence Complete";
                              } else if (!finalUrl && targetStatus === "Evidence Complete") {
                                targetStatus = "No Evidence";
                              }
                              try {
                                await handleEvidenceStatusChange(
                                  currentControl.id, 
                                  targetStatus, 
                                  finalUrl
                                );
                                showToast.success("Evidence URL saved & analyzed");
                              } catch (err) {
                                setUrlInput(currentResponse?.evidenceUrl || "");
                              }
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        {/* Parsed Evidence Analysis & Template Content Validation Card */}
                        {currentResponse?.evidenceAnalysis && (
                          <div className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all ${
                            currentResponse.evidenceAnalysis.isValidTemplate
                              ? "bg-green-500/10 border-green-500/20 text-foreground"
                              : "bg-red-500/10 border-red-500/20 text-foreground"
                          }`}>
                            <div className="flex items-center justify-between font-semibold">
                              <div className="flex items-center gap-1.5">
                                {currentResponse.evidenceAnalysis.isValidTemplate ? (
                                  <span className="text-green-500 font-bold">✅ Evidence Verified & Validated</span>
                                ) : (
                                  <span className="text-red-500 font-bold">⚠️ Unfilled Template / Parsing Issues</span>
                                )}
                              </div>
                              <span className="px-2 py-0.5 rounded bg-background border border-border font-mono">
                                Quality Score: {currentResponse.evidenceAnalysis.score}/100
                              </span>
                            </div>

                            {/* Validation Errors & Unfilled Placeholders */}
                            {currentResponse.evidenceAnalysis.validationErrors && currentResponse.evidenceAnalysis.validationErrors.length > 0 && (
                              <div className="p-2.5 rounded-lg bg-red-500/15 text-red-600 border border-red-500/30 space-y-1">
                                <p className="font-semibold">Template Validation Errors:</p>
                                <ul className="list-disc pl-4 space-y-1 text-xs">
                                  {currentResponse.evidenceAnalysis.validationErrors.map((err: string, i: number) => (
                                    <li key={i}>{err}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Unfilled Placeholders Badge List */}
                            {currentResponse.evidenceAnalysis.unfilledPlaceholders && currentResponse.evidenceAnalysis.unfilledPlaceholders.length > 0 && (
                              <div>
                                <p className="font-semibold text-muted-foreground mb-1">Unfilled Bracketed Placeholders:</p>
                                <div className="flex flex-wrap gap-1">
                                  {currentResponse.evidenceAnalysis.unfilledPlaceholders.map((ph: string, i: number) => (
                                    <span key={i} className="px-2 py-0.5 rounded bg-red-500/20 text-red-500 border border-red-500/30 font-mono text-[11px]">
                                      {ph}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Matched vs Missing Requirements */}
                            {currentResponse.evidenceAnalysis.missingRequirements && currentResponse.evidenceAnalysis.missingRequirements.length > 0 && (
                              <div className="text-amber-500 font-medium">
                                ⚡ Missing Evidence Items: {currentResponse.evidenceAnalysis.missingRequirements.join(", ")}
                              </div>
                            )}

                            {/* Extracted Text Snippet Preview */}
                            {currentResponse.evidenceAnalysis.extractedSnippet && (
                              <div className="pt-1 border-t border-border/40">
                                <p className="text-[11px] font-semibold text-muted-foreground mb-0.5">Parsed Evidence Snippet:</p>
                                <p className="font-mono text-[11px] text-muted-foreground bg-muted/30 p-2 rounded max-h-24 overflow-y-auto whitespace-pre-wrap">
                                  {currentResponse.evidenceAnalysis.extractedSnippet}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Audit-ready Checkbox */}
                        {currentResponse?.evidenceUrl && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-start pt-1"
                          >
                            <div className="flex items-center h-5">
                              <input
                                id="audit-ready-checkbox"
                                type="checkbox"
                                disabled={isReadOnly}
                                checked={currentResponse?.auditReady || false}
                                onChange={async (e) => {
                                  try {
                                    await handleEvidenceStatusChange(
                                      currentControl.id,
                                      currentResponse?.evidenceStatus || "No Evidence",
                                      currentResponse?.evidenceUrl,
                                      e.target.checked
                                    );
                                    showToast.success(e.target.checked ? "Marked as audit ready" : "Removed audit ready status");
                                  } catch (err) {
                                    // Handled in context
                                  }
                                }}
                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                              />
                            </div>
                            <div className="ml-3 text-xs">
                              <label htmlFor="audit-ready-checkbox" className="font-medium text-foreground">
                                🔒 Audit-ready confirmation
                              </label>
                              <p className="text-muted-foreground mt-0.5">
                                I confirm this evidence link is valid and meets requirements.
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {/* Gentle nudge message */}
                    {((currentAnswer === 1 || currentAnswer === 0.5) && (!currentResponse?.evidenceStatus || currentResponse?.evidenceStatus === "No Evidence") && !dismissedNudges.has(currentControl.id)) && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start justify-between gap-2 text-xs text-amber-600 dark:text-amber-500"
                      >
                        <div className="flex items-start gap-2 flex-1">
                          <IconAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">Gentle Nudge:</span> You indicated this control is implemented, but haven't provided evidence. Consider downloading the template above.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDismissNudge(currentControl.id)}
                          title="Dismiss nudge"
                          aria-label="Dismiss nudge"
                          className="text-amber-600/70 hover:text-amber-600 dark:text-amber-500/70 dark:hover:text-amber-400 p-1 rounded-lg hover:bg-amber-500/10 transition-colors shrink-0"
                        >
                          <IconX className="w-4 h-4" />
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {activeTab === "notes" && (
                  <motion.div
                    id="panel-notes"
                    role="tabpanel"
                    aria-labelledby="tab-notes"
                    tabIndex={0}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4 focus:outline-none"
                  >
                    <SecureTextarea
                      value={currentNote}
                      onChange={(note) =>
                        setLocalNotes(prev => ({ ...prev, [currentControl.id]: note }))
                      }
                      onBeforeSave={() => {
                        if (currentAnswer === undefined || currentAnswer === null) {
                          showToast.error("Please answer the control question before saving notes");
                          return false;
                        }
                        return true;
                      }}
                      onSave={(value) => handleCrcNoteSave(currentControl.id, value)}
                      placeholder="Add your notes about this control — evidence, gaps, action items..."
                      maxLength={5000}
                      className="w-full min-h-[150px]"
                      readOnly={isReadOnly}
                    />
                  </motion.div>
                )}

                {activeTab === "comments" && (
                  <motion.div
                    id="panel-comments"
                    role="tabpanel"
                    aria-labelledby="tab-comments"
                    tabIndex={0}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="focus:outline-none"
                  >
                    <CommentsPanel projectId={projectId} objectType="PROJECT" objectId={projectId} />
                  </motion.div>
                )}
              </div>
            </div>

          </div>
        </div>
    </div>
  );
}
