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
  queued: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
  running: "text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400",
  completed: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
  collecting_responses: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
  evaluating: "text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400",
  success: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
  partial_success: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400",
  failed: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-lg text-gray-500 dark:text-gray-400">Loading pending jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/assess/${projectId}/fairness-bias/api-endpoint`)}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Pending Jobs
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All queued and running evaluation jobs for this project
                </p>
              </div>
            </div>
            <button
              onClick={() => fetchJobs(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
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
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {jobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center"
          >
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No jobs yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start a new evaluation to see your jobs appear here.
            </p>
            <button
              onClick={() => router.push(`/assess/${projectId}/fairness-bias/api-endpoint`)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-700 hover:to-violet-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              Start New Evaluation
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                Auto-refreshing every 5 seconds
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Active: {activeJobs.length} · Completed: {completedJobs.length}
              </div>
            </div>

            {activeJobs.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Active jobs</h3>
                {activeJobs.map((job, index) => (
                  <motion.div
                    key={job.jobId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="transform bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer hover:scale-105"
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
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {job.jobId}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {job.status === "queued" ? "Waiting in queue" : "Processing evaluation"}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                        </p>
                        {job.lastProcessedPrompt && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                            Last processed: {job.lastProcessedPrompt}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>
                          {job.progress} ({job.percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div
                            className={`h-full ${
                              job.status === "running" || job.status === "collecting_responses" || job.status === "evaluating"
                              ? "bg-gradient-to-r from-purple-600 to-violet-600"
                              : ["completed", "success"].includes(job.status)
                              ? "bg-green-500"
                              : job.status === "partial_success"
                              ? "bg-yellow-500"
                              : job.status === "failed"
                              ? "bg-red-500"
                              : "bg-blue-500"
                            }`}
                          style={{ width: `${Math.min(job.percent, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>Total prompts: {job.totalPrompts}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {completedJobs.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Completed jobs</h3>
                {completedJobs.map((job, index) => (
              <motion.div
                key={job.jobId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="transform bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer hover:scale-105"
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
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {job.jobId}
                      </span>
                    </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                    </p>
                    {job.lastProcessedPrompt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                        Last processed: {job.lastProcessedPrompt}
                      </p>
                    )}
                  </div>
                </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>
                          {job.progress} ({job.percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${
                            job.status === "running" || job.status === "collecting_responses" || job.status === "evaluating"
                              ? "bg-gradient-to-r from-purple-600 to-violet-600"
                              : ["completed", "success"].includes(job.status)
                              ? "bg-green-500"
                              : job.status === "partial_success"
                              ? "bg-yellow-500"
                              : job.status === "failed"
                              ? "bg-red-500"
                              : "bg-blue-500"
                          }`}
                          style={{ width: `${Math.min(job.percent, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
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

