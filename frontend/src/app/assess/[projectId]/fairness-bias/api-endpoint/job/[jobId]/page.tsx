"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";

type JobStatus = Awaited<ReturnType<typeof apiService.getFairnessJob>>;

const statusColors: Record<string, string> = {
  queued: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
  processing: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400",
  running: "text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400",
  completed: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
  failed: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
  COLLECTING_RESPONSES: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
  EVALUATING: "text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400",
  SUCCESS: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
  PARTIAL_SUCCESS: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400",
  FAILED: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
};

const FINAL_STATUSES = ["completed", "failed", "SUCCESS", "PARTIAL_SUCCESS", "FAILED"];

export default function FairnessJobPage() {
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
    if (jobStatus?.status && FINAL_STATUSES.includes(jobStatus.status)) {
      return;
    }
    const interval = setInterval(() => {
      fetchStatus();
    }, 20000);
    return () => clearInterval(interval);
  }, [jobId, jobStatus?.status]);

  // Hard refresh every 20 seconds while job is active
  useEffect(() => {
    if (jobStatus?.status && FINAL_STATUSES.includes(jobStatus.status)) {
      return;
    }
    const refreshInterval = setInterval(() => {
      router.refresh();
    }, 20000);
    return () => clearInterval(refreshInterval);
  }, [jobStatus?.status, router]);

  // Auto redirect when completed
  useEffect(() => {
    const completedStatuses = ["completed", "SUCCESS", "PARTIAL_SUCCESS"];
    if (jobStatus?.status && completedStatuses.includes(jobStatus.status) && !redirectScheduled) {
      setRedirectScheduled(true);
      const timeout = setTimeout(() => {
        router.push(`/assess/${projectId}/fairness-bias/report`);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [jobStatus, projectId, redirectScheduled, router]);

  const progressLabel = useMemo(() => {
    if (!jobStatus) return "Fetching job…";
    if (jobStatus.status === "queued") return "Job is queued. Waiting for a worker…";
    if (jobStatus.status === "processing") return "Job is being processed. Starting soon…";
    if (jobStatus.status === "running") {
      return `Running: ${jobStatus.progress || "0/0"} prompts evaluated`;
    }
    if (jobStatus.status === "COLLECTING_RESPONSES") {
      return `Collecting responses: ${jobStatus.progress || "0/0"}`;
    }
    if (jobStatus.status === "EVALUATING") {
      return `Evaluating: ${jobStatus.progress || "0/0"} prompts evaluated`;
    }
    if (jobStatus.status === "completed" || jobStatus.status === "SUCCESS") {
      return "Completed. You can check report now.";
    }
    if (jobStatus.status === "PARTIAL_SUCCESS") {
      return "Completed with some failures. You can check report now.";
    }
    if (jobStatus.status === "failed" || jobStatus.status === "FAILED") {
      return "Job failed";
    }
    return "Processing job…";
  }, [jobStatus]);

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-lg text-gray-500 dark:text-gray-400">Checking job status…</p>
        </div>
      </div>
    );
  }

  if (error || !jobStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Unable to load this job
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => fetchStatus(true)}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
            >
              Retry
            </button>
            <button
              onClick={() => router.push(`/assess/${projectId}/fairness-bias/api-endpoint`)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const summary = jobStatus.summary;
  const hasResults = jobStatus.results.length > 0;
  const hasErrors = jobStatus.errors.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push(`/assess/${projectId}/fairness-bias/api-endpoint`)}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Job ID</p>
            <p className="font-mono text-sm text-gray-900 dark:text-white break-all">{jobStatus.jobId}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6"
        >
          <div className="flex flex-wrap items-center gap-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[jobStatus.status]}`}
            >
              {jobStatus.status.toUpperCase()}
            </span>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Auto refresh every 20s · Live poll every 20s
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-4">{progressLabel}</h2>

          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span>
                {jobStatus.progress} ({jobStatus.percent}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full ${
                  jobStatus.status === "completed" || jobStatus.status === "SUCCESS"
                    ? "bg-green-500"
                    : jobStatus.status === "PARTIAL_SUCCESS"
                    ? "bg-yellow-500"
                    : jobStatus.status === "failed" || jobStatus.status === "FAILED"
                    ? "bg-red-500"
                    : jobStatus.status === "processing"
                    ? "bg-yellow-500"
                    : "bg-gradient-to-r from-purple-600 to-violet-600"
                }`}
                style={{ width: `${Math.min(jobStatus.percent, 100)}%` }}
              />
            </div>
            {jobStatus.lastProcessedPrompt && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                Last processed prompt:{" "}
                <span className="text-gray-800 dark:text-gray-200">{jobStatus.lastProcessedPrompt}</span>
              </p>
            )}
          </div>

          {(jobStatus.status === "failed" || jobStatus.status === "FAILED") && jobStatus.errorMessage && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
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
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Prompts</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{summary.total}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Successful</p>
              <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{summary.successful}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Failed</p>
              <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{summary.failed}</p>
            </div>
          </motion.div>
        )}

        {hasResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Completed prompts</h3>
            </div>
            <div className="space-y-4">
              {jobStatus.results.slice(0, 5).map((result) => (
                <div
                  key={`${result.category}-${result.prompt}`}
                  className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-gray-50 dark:bg-gray-900/40"
                >
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{result.category}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{result.prompt}</p>
                  {result.evaluation && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Overall score: {(result.evaluation.overallScore * 100).toFixed(1)}%
                    </div>
                  )}
                  {result.message && (
                    <p className="text-xs text-green-600 dark:text-green-300 mt-2">{result.message}</p>
                  )}
                </div>
              ))}

              {jobStatus.results.length > 5 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
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
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Prompts that need attention
              </h3>
            </div>
            <div className="space-y-4">
              {jobStatus.errors.slice(0, 5).map((item) => (
                <div
                  key={`${item.category}-${item.prompt}`}
                  className="border border-red-200 dark:border-red-900 rounded-xl p-4 bg-red-50 dark:bg-red-950/40"
                >
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300">{item.category}</p>
                  <p className="text-sm text-red-600 dark:text-red-200 mt-1 line-clamp-2">{item.prompt}</p>
                  <p className="text-xs text-red-500 dark:text-red-200 mt-2">
                    {item.message ?? item.error ?? "Unknown error"}
                  </p>
                </div>
              ))}
              {jobStatus.errors.length > 5 && (
                <p className="text-xs text-red-500 dark:text-red-300">
                  Showing 5 of {jobStatus.errors.length} errors. See the full report for details.
                </p>
              )}
            </div>
          </motion.div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => fetchStatus(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition"
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh now
          </button>
          <button
            onClick={() => router.push(`/assess/${projectId}/fairness-bias/report`)}
            disabled={!["completed", "SUCCESS", "PARTIAL_SUCCESS"].includes(jobStatus.status)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            View report
          </button>
        </div>
      </div>
    </div>
  );
}

