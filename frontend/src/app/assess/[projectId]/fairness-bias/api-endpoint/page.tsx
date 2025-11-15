"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/lib/api";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Globe,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface TestProgress {
  total: number;
  completed: number;
  current: string;
  status: "idle" | "testing" | "completed" | "error";
  error?: string;
}

interface EvaluationSummary {
  total: number;
  successful: number;
  failed: number;
  averageOverallScore: number;
  averageBiasScore: number;
  averageToxicityScore: number;
}

export default function ApiEndpointPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const projectId = params.projectId as string;

  const [apiEndpoint, setApiEndpoint] = useState("");
  const [responseKey, setResponseKey] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [testProgress, setTestProgress] = useState<TestProgress>({
    total: 0,
    completed: 0,
    current: "",
    status: "idle",
  });
  const [testResults, setTestResults] = useState<any[]>([]);
  const [evaluationSummary, setEvaluationSummary] = useState<EvaluationSummary | null>(null);

  useEffect(() => {
    if (apiEndpoint) {
      try {
        new URL(apiEndpoint);
        setIsValidUrl(true);
      } catch {
        setIsValidUrl(false);
      }
    } else {
      setIsValidUrl(true);
    }
  }, [apiEndpoint]);

  const handleTestModel = async () => {
    if (!apiEndpoint || !isValidUrl || !responseKey.trim()) return;

    setTestProgress({
      total: 0,
      completed: 0,
      current: "Starting evaluation...",
      status: "testing",
    });
    setTestResults([]);

    try {
      // Call the batch evaluation endpoint
      const result = await apiService.evaluateApiEndpoint({
        projectId,
        apiUrl: apiEndpoint,
        responseKey: responseKey.trim(),
      });

      // Update progress
      setTestProgress((prev) => ({
        ...prev,
        total: result.summary.total,
        completed: result.summary.total,
        current: "Evaluation completed!",
        status: "completed",
      }));

      // Combine results and errors for display
      const allResults = [
        ...result.results.map((r) => ({
          category: r.category,
          prompt: r.prompt,
          userResponse: "",
          evaluation: r.evaluation || null,
          success: r.success,
        })),
        ...result.errors.map((e) => ({
          category: e.category,
          prompt: e.prompt,
          userResponse: "",
          evaluation: null,
          success: false,
          error: e.error,
        })),
      ];

      setTestResults(allResults);
      setEvaluationSummary(result.summary);
    } catch (error: any) {
      setTestProgress((prev) => ({
        ...prev,
        status: "error",
        error: error.message || "Failed to test model",
      }));
      setEvaluationSummary(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const successCount = testResults.filter((r) => r.success).length;
  const failureCount = testResults.filter((r) => !r.success).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/assess/${projectId}/fairness-bias/options`)}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                API Automated Testing
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Test your model's API endpoint for fairness and bias
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* API Endpoint Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                API Endpoint URL
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter your model's API endpoint URL
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="api-endpoint"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Endpoint URL
              </label>
              <input
                id="api-endpoint"
                type="url"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder="https://api.example.com/v1/chat"
                disabled={testProgress.status === "testing"}
                className={`
                  w-full px-4 py-3 rounded-xl border transition-colors
                  bg-white dark:bg-gray-900
                  ${
                    isValidUrl
                      ? "border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400"
                      : "border-red-500 dark:border-red-500 focus:border-red-600 dark:focus:border-red-600"
                  }
                  text-gray-900 dark:text-white
                  placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              />
              {!isValidUrl && apiEndpoint && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Please enter a valid URL
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="response-key"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Response Key <span className="text-red-500">*</span>
              </label>
              <input
                id="response-key"
                type="text"
                value={responseKey}
                onChange={(e) => setResponseKey(e.target.value)}
                placeholder="e.g., response, data.result.text, results[0].content"
                disabled={testProgress.status === "testing"}
                className={`
                  w-full px-4 py-3 rounded-xl border transition-colors
                  bg-white dark:bg-gray-900
                  border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400
                  text-gray-900 dark:text-white
                  placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Enter the full path to the response data in your API response JSON. Supports nested paths and arrays:
                <br />• Simple: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">response</code>
                <br />• Nested: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">data.result.text</code>
                <br />• Array: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">results[0].content</code> or <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">results.0.content</code>
              </p>
              {!responseKey.trim() && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Response key is required
                </p>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Your API should accept POST requests with a JSON body containing
                a <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">prompt</code>, <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">message</code>, or <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">input</code> field.
                Enter the full path to where your model's output is located in the response JSON (supports nested objects and arrays).
              </p>
            </div>

            <motion.button
              onClick={handleTestModel}
              disabled={!apiEndpoint || !isValidUrl || !responseKey.trim() || testProgress.status === "testing"}
              className={`
                w-full py-3 rounded-xl font-semibold text-lg transition-all duration-200
                flex items-center justify-center gap-2
                ${
                  apiEndpoint && isValidUrl && responseKey.trim() && testProgress.status !== "testing"
                    ? "bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl"
                    : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                }
              `}
              whileHover={
                apiEndpoint && isValidUrl && responseKey.trim() && testProgress.status !== "testing"
                  ? { scale: 1.02 }
                  : {}
              }
              whileTap={
                apiEndpoint && isValidUrl && responseKey.trim() && testProgress.status !== "testing"
                  ? { scale: 0.98 }
                  : {}
              }
            >
              {testProgress.status === "testing" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Test Your Model
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Progress */}
        {testProgress.status === "testing" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Testing Progress
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>{testProgress.current}</span>
                  <span>
                    {testProgress.completed} / {testProgress.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-600 to-violet-600"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${
                        testProgress.total > 0
                          ? (testProgress.completed / testProgress.total) * 100
                          : 0
                      }%`,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {testProgress.status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">
                  Testing Failed
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {testProgress.error}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Summary */}
        {testProgress.status === "completed" && testResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Test Results Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-900 dark:text-green-200">
                    Successful
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {successCount}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-900 dark:text-red-200">
                    Failed
                  </span>
                </div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {failureCount}
                </p>
              </div>
            </div>
            {evaluationSummary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                  <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">
                    Average Overall Score
                  </div>
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {(evaluationSummary.averageOverallScore * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                  <div className="text-xs text-orange-600 dark:text-orange-400 mb-1">
                    Average Bias Score
                  </div>
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    {(evaluationSummary.averageBiasScore * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-xl p-4">
                  <div className="text-xs text-pink-600 dark:text-pink-400 mb-1">
                    Average Toxicity Score
                  </div>
                  <div className="text-2xl font-bold text-pink-700 dark:text-pink-300">
                    {(evaluationSummary.averageToxicityScore * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            )}
            <div className="mt-6">
              <button
                onClick={() => router.push(`/assess/${projectId}/fairness-bias/report`)}
                className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                View Detailed Report
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

