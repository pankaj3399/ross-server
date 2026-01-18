"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiService } from "../../../../../../lib/api";
import { useAuth } from "../../../../../../contexts/AuthContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  RefreshCcw,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type JobStatus = Awaited<ReturnType<typeof apiService.getFairnessJob>>;

const statusColors: Record<string, string> = {
  queued: "text-info bg-info/10",
  processing: "text-warning bg-warning/10",
  running: "text-primary bg-primary/10",
  completed: "text-success bg-success/10",
  failed: "text-destructive bg-destructive/10",
  collecting_responses: "text-info bg-info/10",
  evaluating: "text-primary bg-primary/10",
  success: "text-success bg-success/10",
  partial_success: "text-warning bg-warning/10",
};

export default function ManualPromptJobPage() {
  const params = useParams();
  const router = useRouter();
  const { loading: authLoading } = useAuth();
  const projectId = params.projectId as string;
  const jobId = params.jobId as string;

  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirectScheduled, setRedirectScheduled] = useState(false);

  const fetchStatus = async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }
    try {
      const status = await apiService.getFairnessJob(jobId);
      setJobStatus(status);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Unable to fetch job status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && jobId) {
      fetchStatus(true);
    }
  }, [authLoading, jobId]);

  // Poll every 20 seconds until job finishes
  useEffect(() => {
    if (!jobId) return;
    const finalStatuses = ["completed", "failed", "success", "partial_success"];
    if (jobStatus?.status && finalStatuses.includes(jobStatus.status)) {
      return;
    }
    const interval = setInterval(() => {
      fetchStatus();
    }, 20000);
    return () => clearInterval(interval);
  }, [jobId, jobStatus?.status]);

  // Hard refresh every 20 seconds while job is active
  useEffect(() => {
    const finalStatuses = ["completed", "failed", "success", "partial_success"];
    if (jobStatus?.status && finalStatuses.includes(jobStatus.status)) {
      return;
    }
    const refreshInterval = setInterval(() => {
      router.refresh();
    }, 20000);
    return () => clearInterval(refreshInterval);
  }, [jobStatus?.status, router]);

  // Auto redirect when completed
  useEffect(() => {
    const completedStatuses = ["completed", "success", "partial_success"];
    if (jobStatus?.status && completedStatuses.includes(jobStatus.status) && !redirectScheduled) {
      setRedirectScheduled(true);
      const timeout = setTimeout(() => {
        router.push(`/assess/${projectId}/fairness-bias/report?jobId=${jobId}`);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [jobStatus, projectId, jobId, redirectScheduled, router]);

  const progressLabel = useMemo(() => {
    if (!jobStatus) return "Fetching job…";
    if (jobStatus.status === "queued") return "Job is queued. Waiting for a worker…";
    if (jobStatus.status === "processing") return "Job is being processed. Starting soon…";
    if (jobStatus.status === "running") {
      return `Running: ${jobStatus.progress || "0/0"} prompts evaluated`;
    }
    if (jobStatus.status === "collecting_responses") {
      return `Collecting responses: ${jobStatus.progress || "0/0"}`;
    }
    if (jobStatus.status === "evaluating") {
      return `Evaluating: ${jobStatus.progress || "0/0"} prompts evaluated`;
    }
    if (jobStatus.status === "completed" || jobStatus.status === "success") {
      return "Completed. You can check report now.";
    }
    if (jobStatus.status === "partial_success") {
      return "Completed with some failures. You can check report now.";
    }
    if (jobStatus.status === "failed") {
      return "Job failed";
    }
    return "Processing job…";
  }, [jobStatus]);

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Checking job status…</p>
        </div>
      </div>
    );
  }

  if (error || !jobStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-lg w-full text-center">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Unable to load this job
          </h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => fetchStatus(true)}
              isLoading={loading}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm"
            >
              {loading ? "Retrying..." : "Retry"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/assess/${projectId}/fairness-bias`)}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const summary = jobStatus.summary;
  const hasResults = jobStatus.results.length > 0;
  const hasErrors = jobStatus.errors.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/assess/${projectId}/fairness-bias`)}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition pl-0 hover:bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <p className="text-sm text-muted-foreground">Job ID</p>
            <p className="font-mono text-sm text-foreground break-all">{jobStatus.jobId}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex flex-wrap items-center gap-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[jobStatus.status]}`}
            >
              {jobStatus.status.toUpperCase()}
            </span>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Auto refresh every 20s · Live poll every 20s
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-foreground mt-4">{progressLabel}</h2>

          <div className="mt-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>
                {jobStatus.progress} ({jobStatus.percent}%)
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
              <div
                className={`h-full ${jobStatus.status === "completed" || jobStatus.status === "success"
                  ? "bg-success"
                  : jobStatus.status === "partial_success"
                    ? "bg-warning"
                    : jobStatus.status === "failed"
                      ? "bg-destructive"
                      : jobStatus.status === "processing"
                        ? "bg-warning"
                        : "bg-primary"
                  }`}
                style={{ width: `${Math.min(jobStatus.percent, 100)}%` }}
              />
            </div>
            {jobStatus.lastProcessedPrompt && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                Last processed prompt:{" "}
                <span className="text-foreground">{jobStatus.lastProcessedPrompt}</span>
              </p>
            )}
          </div>

          {jobStatus.status === "failed" && jobStatus.errorMessage && (
            <div className="mt-4 bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-destructive">
              {jobStatus.errorMessage}
            </div>
          )}
        </motion.div>

        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Prompts</p>
              <p className="text-2xl font-semibold text-foreground">{summary.total}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Successful</p>
              <p className="text-2xl font-semibold text-success">{summary.successful}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Failed</p>
              <p className="text-2xl font-semibold text-destructive">{summary.failed}</p>
            </div>
          </motion.div>
        )}

        {hasResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <h3 className="text-lg font-semibold text-foreground">Completed prompts</h3>
            </div>
            <div className="space-y-4">
              {jobStatus.results.slice(0, 5).map((result) => (
                <div
                  key={`${result.category}-${result.prompt}`}
                  className="border border-border rounded-xl p-4 bg-muted/30"
                >
                  <p className="text-sm font-semibold text-foreground">{result.category}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{result.prompt}</p>
                  {result.evaluation && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Overall score: {(result.evaluation.overallScore * 100).toFixed(1)}%
                    </div>
                  )}
                  {result.message && (
                    <p className="text-xs text-success mt-2">{result.message}</p>
                  )}
                </div>
              ))}

              {jobStatus.results.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  Showing 5 of {jobStatus.results.length} results.
                </p>
              )}
            </div>
          </motion.div>
        )}

        {hasErrors && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h3 className="text-lg font-semibold text-foreground">
                Prompts that need attention
              </h3>
            </div>
            <div className="space-y-4">
              {jobStatus.errors.slice(0, 5).map((item) => (
                <div
                  key={`${item.category}-${item.prompt}`}
                  className="border border-destructive/20 rounded-xl p-4 bg-destructive/5"
                >
                  <p className="text-sm font-semibold text-destructive">{item.category}</p>
                  <p className="text-sm text-foreground mt-1 line-clamp-2">{item.prompt}</p>
                  <p className="text-xs text-destructive mt-2">
                    {item.message ?? item.error ?? "Unknown error"}
                  </p>
                </div>
              ))}
              {jobStatus.errors.length > 5 && (
                <p className="text-xs text-destructive">
                  Showing 5 of {jobStatus.errors.length} errors. See the full report for details.
                </p>
              )}
            </div>
          </motion.div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => fetchStatus(true)}
            isLoading={loading}
            variant="secondary"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition"
          >
            {loading ? (
              "Refreshing..."
            ) : (
              <>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Refresh now
              </>
            )}
          </Button>
          <Button
            onClick={() => router.push(`/assess/${projectId}/fairness-bias/report?jobId=${jobId}`)}
            disabled={!["completed", "success", "partial_success"].includes(jobStatus.status)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm"
          >
            View report
          </Button>
        </div>
      </div>
    </div>
  );
}

