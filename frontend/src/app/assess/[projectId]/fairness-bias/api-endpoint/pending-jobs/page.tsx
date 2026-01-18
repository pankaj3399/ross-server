"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/lib/api";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  RefreshCcw,
  Clock,
  Play,
  CheckCircle2,
} from "lucide-react";

type PendingJob = {
  jobId: string;
  status: "queued" | "running" | "completed" | "collecting_responses" | "evaluating" | "success" | "partial_success" | "failed";
  progress: string;
  percent: number;
  lastProcessedPrompt: string | null;
  totalPrompts: number;
  createdAt: string;
  updatedAt: string;
};

const statusColors: Record<string, string> = {
  queued: "text-info bg-info/10",
  running: "text-primary bg-primary/10",
  completed: "text-success bg-success/10",
  collecting_responses: "text-info bg-info/10",
  evaluating: "text-primary bg-primary/10",
  success: "text-success bg-success/10",
  partial_success: "text-warning bg-warning/10",
  failed: "text-destructive bg-destructive/10",
};

export default function PendingJobsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const projectId = params.projectId as string;

  const [jobs, setJobs] = useState<PendingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }
    try {
      const response = await apiService.getJobs(projectId);
      setJobs(response.jobs);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Unable to fetch pending jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && projectId) {
      fetchJobs(true);
    }
  }, [authLoading, projectId]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!projectId) return;
    const interval = setInterval(() => {
      fetchJobs();
    }, 5000);
    return () => clearInterval(interval);
  }, [projectId]);

  const completedStatuses = ["completed", "success", "partial_success", "failed"];
  const activeJobs = jobs.filter((job) => !completedStatuses.includes(job.status));
  const completedJobs = jobs.filter((job) => completedStatuses.includes(job.status));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading pending jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => router.push(`/assess/${projectId}/fairness-bias/api-endpoint`)}
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Pending Jobs
                </h1>
                <p className="text-sm text-muted-foreground">
                  All queued and running evaluation jobs for this project
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fetchJobs(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6 text-sm text-destructive">
            {error}
          </div>
        )}

        {jobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-12 text-center"
          >
            <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No jobs yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Start a new evaluation to see your jobs appear here.
            </p>
            <button
              type="button"
              onClick={() => router.push(`/assess/${projectId}/fairness-bias/api-endpoint`)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Play className="w-4 h-4" />
              Start New Evaluation
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Auto-refreshing every 5 seconds
              </div>
              <div className="text-sm text-muted-foreground">
                Active: {activeJobs.length} · Completed: {completedJobs.length}
              </div>
            </div>

            {activeJobs.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-foreground">Active jobs</h3>
                {activeJobs.map((job, index) => (
                  <motion.div
                    key={job.jobId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="transform bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer hover:scale-[1.01]"
                    onClick={() => router.push(`/assess/${projectId}/fairness-bias/api-endpoint/job/${job.jobId}`)}
                  >
                    <div className="flex items-start justify-between mb-4" title="Click to view job details">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[job.status]}`}
                          >
                            {job.status.toUpperCase()}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {job.jobId}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          {job.status === "queued" ? "Waiting in queue" : "Processing evaluation"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                        </p>
                        {job.lastProcessedPrompt && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            Last processed: {job.lastProcessedPrompt}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>
                          {job.progress} ({job.percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${job.status === "running" || job.status === "collecting_responses" || job.status === "evaluating"
                            ? "bg-primary"
                            : ["completed", "success"].includes(job.status)
                              ? "bg-success"
                              : job.status === "partial_success"
                                ? "bg-warning"
                                : job.status === "failed"
                                  ? "bg-destructive"
                                  : "bg-info"
                            }`}
                          style={{ width: `${Math.min(job.percent, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Total prompts: {job.totalPrompts}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {completedJobs.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-foreground">Completed jobs</h3>
                {completedJobs.map((job, index) => (
                  <motion.div
                    key={job.jobId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="transform bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer hover:scale-[1.01]"
                    onClick={() => router.push(`/assess/${projectId}/fairness-bias/api-endpoint/job/${job.jobId}`)}
                  >
                    <div className="flex items-start justify-between mb-4" title="Click to view job details">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[job.status]}`}
                          >
                            {job.status.toUpperCase()}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {job.jobId}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          {["completed", "success", "partial_success"].includes(job.status)
                            ? "Completed evaluation"
                            : job.status === "queued"
                              ? "Waiting in queue"
                              : job.status === "collecting_responses"
                                ? "Collecting responses"
                                : job.status === "evaluating"
                                  ? "Evaluating responses"
                                  : "Processing evaluation"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                        </p>
                        {job.lastProcessedPrompt && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            Last processed: {job.lastProcessedPrompt}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>
                          {job.progress} ({job.percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${job.status === "running" || job.status === "collecting_responses" || job.status === "evaluating"
                            ? "bg-primary"
                            : ["completed", "success"].includes(job.status)
                              ? "bg-success"
                              : job.status === "partial_success"
                                ? "bg-warning"
                                : job.status === "failed"
                                  ? "bg-destructive"
                                  : "bg-info"
                            }`}
                          style={{ width: `${Math.min(job.percent, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Total prompts: {job.totalPrompts}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

