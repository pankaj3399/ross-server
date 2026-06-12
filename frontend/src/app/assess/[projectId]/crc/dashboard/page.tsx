"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  IconShieldCheck,
  IconAlertCircle,
  IconLoader2,
  IconArrowRight,
  IconDownload,
  IconClock,
  IconCheck,
  IconX,
  IconQuestionMark,
  IconMinus,
  IconLock,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAssessmentContext } from "@/contexts/AssessmentContext";
import { apiService, type CRCResults, type CRCFrameworkResult } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AssessmentSkeleton } from "@/components/Skeleton";
import SubscriptionModal from "@/components/features/subscriptions/SubscriptionModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { showToast } from "@/lib/toast";
import { QuickWinsWidget } from "@/components/features/governance/QuickWinsWidget";

// --- Helpers ---

const formatPercent = (value: number | null): string =>
  value === null ? "—" : `${value.toFixed(1)}%`;

const getReadinessTier = (percent: number | null): { label: string; color: string; bg: string } => {
  if (percent === null) return { label: "Insufficient Data", color: "text-muted-foreground", bg: "bg-muted" };
  if (percent >= 60) return { label: "Ready", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" };
  if (percent >= 30) return { label: "Partially Ready", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" };
  return { label: "Not Ready", color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" };
};

const getCategoryColor = (percent: number | null): string => {
  if (percent === null) return "text-muted-foreground";
  if (percent >= 60) return "text-emerald-600 dark:text-emerald-400";
  if (percent >= 30) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

// Locale codes commonly associated with regions that use A4 paper sizing by default.
// This drives formatting/styling only (A4 vs. Letter size) and does not represent
// a formal EU membership or regulatory determination.
const pdfSizeLocaleCodes = [
  "be", "bg", "cz", "dk", "de", "ee", "ie", "el", "es", "fr", "hr", "it", "cy",
  "lv", "lt", "lu", "hu", "mt", "nl", "at", "pl", "pt", "ro", "si", "sk", "fi",
  "se", "no", "is", "ch", "uk", "gb"
];

/**
 * Heuristic to detect whether to apply A4 formatting to the PDF.
 * Returns true if the client timezone is in Europe or language matches pdfSizeLocaleCodes.
 * This is a layout-only sizing determination, not an EU regulatory or legal categorization.
 */
function detectIsEU(): boolean {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && tz.startsWith("Europe")) return true;
    const lang = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "";
    return pdfSizeLocaleCodes.some(code => lang.endsWith(`-${code}`) || lang === code);
  } catch (e) {
    return false;
  }
}

// EU AI Act deadline: August 2, 2026 (prohibition provisions fully apply)
const EU_AI_ACT_DEADLINE = new Date("2026-08-02T00:00:00Z");

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  const isPast = diff === 0;

  return { days, hours, minutes, seconds, isPast };
}

// --- Sub-Components ---

function CountdownTimer() {
  const { days, hours, minutes, seconds, isPast } = useCountdown(EU_AI_ACT_DEADLINE);

  if (isPast) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
        <IconAlertCircle className="w-4 h-4 text-red-500" />
        <span className="text-sm font-semibold text-red-600 dark:text-red-400">
          EU AI Act deadline has passed
        </span>
      </div>
    );
  }

  const units = [
    { value: days, label: "Days" },
    { value: hours, label: "Hrs" },
    { value: minutes, label: "Min" },
    { value: seconds, label: "Sec" },
  ];

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <IconClock className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wider">EU AI Act</span>
      </div>
      <div className="flex gap-1.5">
        {units.map((u) => (
          <div
            key={u.label}
            className="flex flex-col items-center min-w-[42px] px-2 py-1.5 rounded-lg bg-primary/5 border border-primary/10"
          >
            <span className="text-base font-bold tabular-nums text-foreground leading-none">
              {String(u.value).padStart(2, "0")}
            </span>
            <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mt-0.5">
              {u.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const getProgressColor = (percent: number | null): string => {
  if (percent === null) return "#94a3b8"; // slate-400
  if (percent >= 60) return "#059669"; // emerald-600
  if (percent >= 30) return "#d97706"; // amber-600
  return "#dc2626"; // red-600
};

function CircularProgress({ percentage, size = 160 }: { percentage: number | null; size?: number }) {
  const value = percentage ?? 0;
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  const tier = getReadinessTier(percentage);
  const progressColor = getProgressColor(percentage);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-muted/30"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={progressColor} />
            <stop offset="100%" stopColor={progressColor} stopOpacity={0.6} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground tabular-nums">
          {percentage !== null ? `${Math.round(value)}%` : "—"}
        </span>
        <span className={`text-xs font-semibold mt-0.5 ${tier.color}`}>{tier.label}</span>
      </div>
    </div>
  );
}

function FrameworkCard({
  title,
  data,
  icon,
  accentColor,
}: {
  title: string;
  data: CRCFrameworkResult;
  icon: string;
  accentColor: string;
}) {
  const tier = getReadinessTier(data.percentage);
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 ${accentColor}`} />
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          </div>
          <Badge variant="outline" className={`text-xs ${tier.color} border-current/20`}>
            {tier.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-bold tabular-nums text-foreground">
            {formatPercent(data.percentage)}
          </span>
          <span className="text-xs text-muted-foreground">
            {data.scoredControls} of {data.totalControls} scored
          </span>
        </div>
        <Progress value={data.percentage ?? 0} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {data.points.toFixed(1)} points earned from {data.scoredControls} answered controls
        </p>
      </CardContent>
    </Card>
  );
}

function BreakdownPill({ count, label, icon: Icon, color }: {
  count: number;
  label: string;
  icon: typeof IconCheck;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border">
      <Icon className={`w-4 h-4 ${color}`} />
      <div>
        <span className="text-lg font-bold tabular-nums text-foreground">{count}</span>
        <span className="text-xs text-muted-foreground ml-1.5">{label}</span>
      </div>
    </div>
  );
}

// --- Main Page Component ---

export default function CRCDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const { user, loading: authLoading } = useAuth();
  const { loading: requireAuthLoading } = useRequireAuth();
  const { isPremium, loading: contextLoading, projectName } = useAssessmentContext();

  const [results, setResults] = useState<CRCResults | null>(null);
  const [complete, setComplete] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExportingFull, setIsExportingFull] = useState(false);
  const [isExportingSummary, setIsExportingSummary] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (requireAuthLoading || contextLoading) return;
    if (!isPremium) return;
    if (!projectId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setResults(null);
    setError(null);

    let cancelled = false;

    const fetchResults = async () => {
      try {
        const response = await apiService.getCRCResults(projectId);
        if (cancelled) return;
        setResults(response.results);
        setComplete(response.complete);
      } catch (err: any) {
        if (cancelled) return;
        console.error("Failed to load CRC results:", err);
        setError(err?.message || "Failed to load CRC results");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchResults();
    return () => { cancelled = true; };
  }, [requireAuthLoading, contextLoading, projectId, isPremium]);

  const handleExportFullPdf = useCallback(async () => {
    if (isExportingFull || isExportingSummary) return;
    setIsExportingFull(true);
    setIsLocked(false);
    try {
      const response = await apiService.getFullPdfData(projectId);
      if (!response.success) {
        throw new Error("Failed to load PDF data");
      }

      if (response.anyFailed) {
        showToast.error("One or more narrative sections could not be generated. The PDF was produced with raw data in those sections.");
      }

      const React = await import("react");
      const { pdf } = await import("@react-pdf/renderer");
      const { CrcFullPdfDocument } = await import("@/lib/pdfExport/CrcFullPdfDocument");

      // Heuristic to set PDF page size: A4 vs Letter. This is a layout choice only, not a formal EU regulatory determination.
      const isEU = detectIsEU();

      const doc = React.createElement(CrcFullPdfDocument, {
        data: response.payload,
        isEU,
      }) as any;

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const sanitizedProjectName = (projectName || "Report").replace(/[^a-z0-9]/gi, "-");
      const formattedDate = new Date().toISOString().slice(0, 10);
      link.download = `CRC-Full-Report-${sanitizedProjectName}-${formattedDate}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Full PDF export failed:", err);
      if (err?.status === 409) {
        setIsLocked(true);
        showToast.info("Assessment updates are currently in progress. Export is temporarily locked. Please try again shortly.");
        setTimeout(() => setIsLocked(false), 5000);
      } else {
        showToast.error(err?.message || "Failed to generate Full PDF. Please try again.");
      }
    } finally {
      setIsExportingFull(false);
    }
  }, [projectName, isExportingFull, isExportingSummary, projectId]);

  const handleExportSummaryPdf = useCallback(async () => {
    if (isExportingFull || isExportingSummary) return;
    setIsExportingSummary(true);
    setIsLocked(false);
    try {
      const response = await apiService.getSummaryPdfData(projectId);
      if (!response.success) {
        throw new Error("Failed to load PDF data");
      }

      if (response.anyFailed) {
        showToast.error("One or more narrative sections could not be generated. The PDF was produced with raw data in those sections.");
      }

      const React = await import("react");
      const { pdf } = await import("@react-pdf/renderer");
      const { CrcSummaryPdfDocument } = await import("@/lib/pdfExport/CrcSummaryPdfDocument");

      // Heuristic to set PDF page size: A4 vs Letter. This is a layout choice only, not a formal EU regulatory determination.
      const isEU = detectIsEU();

      const doc = React.createElement(CrcSummaryPdfDocument, {
        data: response.payload,
        isEU,
      }) as any;

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const sanitizedProjectName = (projectName || "Report").replace(/[^a-z0-9]/gi, "-");
      const formattedDate = new Date().toISOString().slice(0, 10);
      link.download = `CRC-Summary-${sanitizedProjectName}-${formattedDate}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Summary PDF export failed:", err);
      if (err?.status === 409) {
        setIsLocked(true);
        showToast.info("Assessment updates are currently in progress. Export is temporarily locked. Please try again shortly.");
        setTimeout(() => setIsLocked(false), 5000);
      } else {
        showToast.error(err?.message || "Failed to generate Summary PDF. Please try again.");
      }
    } finally {
      setIsExportingSummary(false);
    }
  }, [projectName, isExportingFull, isExportingSummary, projectId]);

  // --- Premium Gate ---
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

  if (error || !results) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <IconAlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Could not load dashboard</h2>
            <p className="text-sm text-muted-foreground">{error ?? "No results returned."}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => window.location.reload()}>Retry</Button>
              <Button variant="outline" onClick={() => router.push(`/assess/${projectId}/crc`)}>
                Go to Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { overall, categories = [], breakdown, frameworks, evidenceProgress } = results;
  const defaultFramework: CRCFrameworkResult = { totalControls: 0, scoredControls: 0, naCount: 0, applicableControls: 0, points: 0, percentage: null };
  const fw = frameworks || {
    eu_ai_act: defaultFramework,
    nist_ai_rmf: defaultFramework,
    iso_42001: defaultFramework,
  };
  const tier = getReadinessTier(overall ? overall.percentage : null);
  const hasResponses = overall ? overall.answeredControls > 0 : false;

  const getEvidenceColor = (percent: number) => {
    if (percent < 30) return "bg-red-500 text-red-500";
    if (percent < 60) return "bg-amber-500 text-amber-500";
    return "bg-green-500 text-green-500";
  };
  const getEvidenceColorBorder = (percent: number) => {
    if (percent < 30) return "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400";
    if (percent < 60) return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400";
    return "border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400";
  };

  return (
    <div className="flex-1 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              CRC Dashboard
            </p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Compliance Readiness Dashboard
            </h1>
            {projectName && (
              <p className="text-sm text-muted-foreground mt-0.5">{projectName}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <CountdownTimer />
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportFullPdf}
                        disabled={isExportingFull || isExportingSummary || isLocked || !hasResponses}
                        className="gap-2"
                      >
                        {isExportingFull ? (
                          <IconLoader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <IconDownload className="w-4 h-4" />
                        )}
                        {isLocked
                          ? "Preparing..."
                          : isExportingFull
                          ? "Exporting..."
                          : "Download Full PDF"}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      {isLocked
                        ? "Preparing your dashboard data..."
                        : "Complete dashboard export with all categories, controls, and section narratives. Use for internal record-keeping or detailed audits. Typically 8 to 20 pages depending on project progress."}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportSummaryPdf}
                        disabled={isExportingFull || isExportingSummary || isLocked || !hasResponses}
                        className="gap-2"
                      >
                        {isExportingSummary ? (
                          <IconLoader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <IconDownload className="w-4 h-4" />
                        )}
                        {isLocked
                          ? "Preparing..."
                          : isExportingSummary
                          ? "Exporting..."
                          : "Download Summary PDF"}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      {isLocked
                        ? "Preparing your dashboard data..."
                        : "Two-page executive summary for board meetings, customer assurance, and high-level reviews. Use when you need a short, branded artifact."}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button size="sm" asChild className="gap-2">
                <Link href={`/assess/${projectId}/crc`}>
                  {hasResponses ? "Continue" : "Start"} Assessment
                  <IconArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Incomplete Warning */}
        {!complete && hasResponses && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl px-4 py-3 flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
          >
            <IconAlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                Partial assessment
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200 mt-0.5">
                {overall.answeredControls} of {overall.totalControls} controls answered. Scores
                reflect only answered controls.
              </p>
            </div>
          </motion.div>
        )}

        {/* Quick Wins Widget */}
        <QuickWinsWidget projectId={projectId} />

        {/* Empty State */}
        {!hasResponses && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-dashed">
              <CardContent className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <IconShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">No assessment data yet</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Start answering Compliance Readiness Controls (CRC) to see your readiness scores across
                  EU AI Act, NIST AI RMF, and ISO 42001.
                </p>
                <div className="flex gap-3 justify-center pt-2">
                  <Button asChild>
                    <Link href={`/assess/${projectId}/crc`}>
                      Start CRC Assessment
                      <IconArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/assess/${projectId}/crc/welcome`}>
                      <IconInfoCircle className="w-4 h-4 mr-2" />
                      About CRC
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Dashboard Content - Only show when we have responses */}
        {hasResponses && (
          <>
            {/* Overall Score + Breakdown Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Overall Score Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-1"
              >
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs uppercase tracking-wider">
                      Overall Readiness
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center py-4 space-y-3">
                    <CircularProgress percentage={overall.percentage} />
                    <div className="text-center space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {overall.scoredControls} scored · {overall.answeredControls} answered · {overall.totalControls} total
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Response Distribution Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="lg:col-span-2"
              >
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-xs uppercase tracking-wider">
                      Response Distribution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <BreakdownPill count={breakdown.yes} label="Yes" icon={IconCheck} color="text-emerald-500" />
                      <BreakdownPill count={breakdown.partial} label="Partial" icon={IconMinus} color="text-blue-500" />
                      <BreakdownPill count={breakdown.no} label="No" icon={IconX} color="text-red-500" />
                      <BreakdownPill count={breakdown.na} label="N/A" icon={IconMinus} color="text-muted-foreground" />
                      <BreakdownPill count={breakdown.notSure} label="Not Sure" icon={IconQuestionMark} color="text-muted-foreground" />
                    </div>

                    {/* Visual bar showing proportions */}
                    <div className="mt-4 flex rounded-full h-3 overflow-hidden bg-muted/30">
                      {[
                        { count: breakdown.yes, color: "bg-emerald-500" },
                        { count: breakdown.partial, color: "bg-blue-500" },
                        { count: breakdown.no, color: "bg-red-500" },
                        { count: breakdown.na, color: "bg-muted-foreground/30" },
                        { count: breakdown.notSure, color: "bg-muted-foreground/20" },
                      ]
                        .filter((s) => s.count > 0)
                        .map((s, i) => (
                          <motion.div
                            key={i}
                            className={`${s.color} first:rounded-l-full last:rounded-r-full`}
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(s.count / overall.answeredControls) * 100}%`,
                            }}
                            transition={{ duration: 0.8, delay: 0.3 + i * 0.05 }}
                          />
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Risk Summary Badges Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Risk Summary</h2>
                <p className="text-sm text-muted-foreground">Open risks from the Risk Register</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Critical", count: results.riskSummary?.critical ?? 0, bg: "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400" },
                  { label: "High", count: results.riskSummary?.high ?? 0, bg: "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400" },
                  { label: "Medium", count: results.riskSummary?.medium ?? 0, bg: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400" },
                  { label: "Low", count: results.riskSummary?.low ?? 0, bg: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400" },
                ].map((badge) => (
                  <Link key={badge.label} href={`/assess/${projectId}/crc/risks`}>
                    <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
                      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-bold tabular-nums text-foreground">
                          {badge.count}
                        </span>
                        <Badge variant="outline" className={`mt-2 text-xs font-semibold px-2 py-0.5 border ${badge.bg}`}>
                          {badge.label}
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* Evidence Progress Section (Feature I) */}
            {evidenceProgress && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Evidence Progress</h2>
                  <p className="text-sm text-muted-foreground">Audit readiness & evidence metrics</p>
                </div>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-foreground">
                            Overall Evidence Completion
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs font-semibold px-2 py-0.5 border ${getEvidenceColorBorder(evidenceProgress.percentage)}`}
                          >
                            {evidenceProgress.percentage}% Documented
                          </Badge>
                        </div>
                        
                        {/* Custom Animated Progress Bar */}
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden relative">
                          <motion.div
                            className={`h-full ${getEvidenceColor(evidenceProgress.percentage).split(" ")[0]} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: `${evidenceProgress.percentage}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Evidence complete for {evidenceProgress.complete} of {evidenceProgress.total} controls.
                        </p>
                      </div>

                      {/* Large Circular percentage or big number for visual impact */}
                      <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 shrink-0">
                        <div className="text-center">
                          <span className="text-4xl font-extrabold text-foreground tabular-nums">
                            {evidenceProgress.complete}
                          </span>
                          <span className="text-muted-foreground text-sm block">Complete Controls</span>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown section */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
                      <div className="p-3 bg-muted/20 border border-border/50 rounded-xl space-y-1">
                        <span className="text-xs text-muted-foreground block font-medium">No Evidence</span>
                        <span className="text-lg font-bold text-foreground tabular-nums">
                          {evidenceProgress.breakdown.noEvidence}
                        </span>
                      </div>
                      <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-1">
                        <span className="text-xs text-blue-500 block font-medium">Downloaded</span>
                        <span className="text-lg font-bold text-foreground tabular-nums">
                          {evidenceProgress.breakdown.templateDownloaded}
                        </span>
                      </div>
                      <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-1">
                        <span className="text-xs text-amber-500 block font-medium">In Progress</span>
                        <span className="text-lg font-bold text-foreground tabular-nums">
                          {evidenceProgress.breakdown.inProgress}
                        </span>
                      </div>
                      <div className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl space-y-1">
                        <span className="text-xs text-green-500 block font-medium">Complete</span>
                        <span className="text-lg font-bold text-foreground tabular-nums">
                          {evidenceProgress.breakdown.evidenceComplete}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Framework Readiness Cards */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Framework Readiness</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <FrameworkCard
                    title="EU AI Act"
                    data={fw.eu_ai_act || defaultFramework}
                    icon="🇪🇺"
                    accentColor="bg-blue-500"
                  />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                  <FrameworkCard
                    title="NIST AI RMF"
                    data={fw.nist_ai_rmf || defaultFramework}
                    icon="🏛️"
                    accentColor="bg-indigo-500"
                  />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <FrameworkCard
                    title="ISO 42001"
                    data={fw.iso_42001 || defaultFramework}
                    icon="📋"
                    accentColor="bg-emerald-500"
                  />
                </motion.div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Category Breakdown</h2>
                <p className="text-sm text-muted-foreground">{categories.length} categories</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {categories.map((cat, idx) => {
                  const catTier = getReadinessTier(cat.percentage);
                  return (
                    <motion.div
                      key={`${cat.categoryId ?? "null"}-${cat.categoryName}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + idx * 0.04 }}
                    >
                      <Card className="hover:shadow-md transition-shadow duration-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <IconShieldCheck className="w-4 h-4 text-primary shrink-0" />
                              <CardTitle className="text-sm truncate">{cat.categoryName}</CardTitle>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`text-xl font-bold tabular-nums ${getCategoryColor(cat.percentage)}`}>
                                {formatPercent(cat.percentage)}
                              </p>
                              <p className={`text-[10px] font-medium ${catTier.color}`}>
                                {catTier.label}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Progress value={cat.percentage ?? 0} className="h-1.5" />
                          <div className="flex items-center justify-between mt-2.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <IconCheck className="w-3 h-3" />
                              {cat.scoredControls} scored
                            </span>
                            <span>
                              {cat.answeredControls} of {cat.totalControls} answered
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* About CRC Link */}
            <div className="text-center pb-4">
              <Link
                href={`/assess/${projectId}/crc/welcome`}
                className="text-sm text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <IconInfoCircle className="w-4 h-4" />
                About Compliance Readiness Controls (CRC)
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
