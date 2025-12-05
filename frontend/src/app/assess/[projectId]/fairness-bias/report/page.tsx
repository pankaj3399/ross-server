"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../../contexts/AuthContext";
import { apiService } from "../../../../../lib/api";
import { motion } from "framer-motion";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { ReportSkeleton } from "../../../../../components/Skeleton";

interface FairnessQuestion {
  label: string;
  prompts: string[];
}

interface Evaluation {
  id: string;
  category: string;
  questionText: string;
  userResponse: string;
  biasScore: number;
  toxicityScore: number;
  relevancyScore: number;
  faithfulnessScore: number;
  overallScore: number;
  verdicts: {
    bias: { score: number; verdict: string };
    toxicity: { score: number; verdict: string };
    relevancy: { score: number; verdict: string };
    faithfulness: { score: number; verdict: string };
  };
  reasoning: string;
  createdAt: string;
}

export default function FairnessBiasReport() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [fairnessQuestions, setFairnessQuestions] = useState<FairnessQuestion[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [evaluationsLoading, setEvaluationsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const projectId = params.projectId as string;

  const evaluationMap = new Map<string, Evaluation>();
  evaluations.forEach((evaluation) => {
    const key = `${evaluation.category}:${evaluation.questionText}`;
    evaluationMap.set(key, evaluation);
  });

  useEffect(() => {
    if (loading || !user || !projectId) {
      return;
    }

    const fetchData = async () => {
      try {
        const questionsData = await apiService.getFairnessQuestions();
        setFairnessQuestions(questionsData.questions);
        setQuestionsLoading(false);
        setAccessDenied(false);

        const evaluationsData = await apiService.getFairnessEvaluations(projectId);
        setEvaluations(evaluationsData.evaluations);
        setEvaluationsLoading(false);
      } catch (error: any) {
        if (error.status === 403 || error.message?.includes('Access denied') || error.message?.includes('Premium subscription')) {
          setAccessDenied(true);
        }
        setQuestionsLoading(false);
        setEvaluationsLoading(false);
      }
    };

    fetchData();
  }, [loading, user, projectId]);

  if (loading || questionsLoading || evaluationsLoading) {
    return <ReportSkeleton />;
  }

  if (accessDenied || (!user && !loading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-xl p-10 bg-white dark:bg-gray-900 border text-center max-w-lg shadow-lg">
          <div className="text-6xl mb-4">🔒</div>
          <div className="text-xl font-bold mb-2">Access Denied</div>
          <div className="text-gray-500 mb-4">
            This report is available only for premium users. Please upgrade your subscription to access fairness and bias reports.
          </div>
          <button
            onClick={() => router.push(`/assess/${projectId}`)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Back to Assessment
          </button>
        </div>
      </div>
    );
  }

  const totalQuestions = fairnessQuestions.reduce(
    (sum, cat) => sum + cat.prompts.length,
    0
  );
  const evaluatedCount = evaluations.length;
  const progress = totalQuestions > 0 ? (evaluatedCount / totalQuestions) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <button
                onClick={() => router.push(`/assess/${projectId}/fairness-bias`)}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Test</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="hidden sm:block h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  Fairness & Bias Evaluation Report
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {evaluatedCount} of {totalQuestions} questions evaluated
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-1 sm:gap-0">
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                Overall Progress
              </span>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {Math.round(progress)}% Complete
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {fairnessQuestions.map((category, catIdx) => (
            <motion.div
              key={category.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: catIdx * 0.1 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">{category.label}</h2>
              </div>
              <div className="p-6 space-y-4">
                {category.prompts.map((prompt, promptIdx) => {
                  const key = `${category.label}:${prompt}`;
                  const evaluation = evaluationMap.get(key);

                  return (
                    <div
                      key={promptIdx}
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        {prompt}
                      </div>
                      {evaluation && evaluation.verdicts ? (
                        <div className="space-y-3">
                          {/* Scores Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Overall Score
                              </div>
                              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                {((evaluation.overallScore || 0) * 100).toFixed(1)}%
                              </div>
                            </div>
                            {evaluation.verdicts.bias && (
                              <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  Bias
                                </div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {evaluation.verdicts.bias.verdict || "N/A"}
                                </div>
                                <div className="text-xs text-gray-400 dark:text-gray-500">
                                  Score: {((evaluation.verdicts.bias.score || 0) * 100).toFixed(0)}%
                                </div>
                              </div>
                            )}
                            {evaluation.verdicts.toxicity && (
                              <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  Toxicity
                                </div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {evaluation.verdicts.toxicity.verdict || "N/A"}
                                </div>
                                <div className="text-xs text-gray-400 dark:text-gray-500">
                                  Score: {((evaluation.verdicts.toxicity.score || 0) * 100).toFixed(0)}%
                                </div>
                              </div>
                            )}
                            {evaluation.verdicts.relevancy && (
                              <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  Relevancy
                                </div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {evaluation.verdicts.relevancy.verdict || "N/A"}
                                </div>
                                <div className="text-xs text-gray-400 dark:text-gray-500">
                                  Score: {((evaluation.verdicts.relevancy.score || 0) * 100).toFixed(0)}%
                                </div>
                              </div>
                            )}
                            {evaluation.verdicts.faithfulness && (
                              <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  Faithfulness
                                </div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {evaluation.verdicts.faithfulness.verdict || "N/A"}
                                </div>
                                <div className="text-xs text-gray-400 dark:text-gray-500">
                                  Score: {((evaluation.verdicts.faithfulness.score || 0) * 100).toFixed(0)}%
                                </div>
                              </div>
                            )}
                          </div>

                          {/* User Response */}
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">
                              Your Response
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              {evaluation.userResponse}
                            </div>
                          </div>

                          {/* Reasoning */}
                          {evaluation.reasoning && (
                            <details className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                              <summary className="cursor-pointer text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline">
                                View Detailed Reasoning
                              </summary>
                              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                {evaluation.reasoning}
                              </div>
                            </details>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 dark:text-gray-500 italic">
                          Not evaluated yet
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

