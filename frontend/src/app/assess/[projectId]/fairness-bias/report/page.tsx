"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../../contexts/AuthContext";
import { apiService } from "../../../../../lib/api";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, TrendingUp, Clock } from "lucide-react";
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

const ScoreBadge = ({ label, score, verdict }: { label: string; score: number; verdict?: string }) => {
  const percentage = (score * 100).toFixed(0);
  const isGood = score >= 0.7;
  const isMedium = score >= 0.4 && score < 0.7;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 min-w-[120px]">
      {isGood ? (
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      ) : isMedium ? (
        <AlertCircle className="w-4 h-4 text-yellow-500" />
      ) : (
        <XCircle className="w-4 h-4 text-red-500" />
      )}
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{percentage}%</span>
      </div>
    </div>
  );
};

const ResponseSection = ({ response }: { response: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongResponse = response.length > 200; // Consider responses over 200 chars as long

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border-l-4 border-blue-500">
      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        Your Response
      </div>
      <div className={`text-sm text-gray-700 dark:text-gray-300 leading-relaxed ${!isExpanded && isLongResponse ? 'line-clamp-3' : ''}`}>
        {response}
      </div>
      {isLongResponse && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              <span>Show less</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </>
          ) : (
            <>
              <span>Show more</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>
      )}
    </div>
  );
};


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
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Premium Feature</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Fairness & Bias reports are available for premium subscribers only.
          </p>
          <button
            onClick={() => router.push(`/assess/${projectId}`)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Return to Assessment
          </button>
        </motion.div>
      </div>
    );
  }

  const totalQuestions = fairnessQuestions.reduce((sum, cat) => sum + cat.prompts.length, 0);
  const evaluatedCount = evaluations.length;
  const progress = totalQuestions > 0 ? (evaluatedCount / totalQuestions) * 100 : 0;

  // Calculate average scores
  const avgOverall = evaluations.length > 0
    ? evaluations.reduce((sum, e) => sum + e.overallScore, 0) / evaluations.length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Compact Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/assess/${projectId}/fairness-bias`)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Fairness & Bias Report</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Evaluation Results</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {evaluatedCount}/{totalQuestions}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400">Avg Score</div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {(avgOverall * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-purple-600 to-violet-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {fairnessQuestions.map((category, catIdx) => {
          let questionNumber = 0;

          return (
            <div key={category.label} className="mb-12">
              {/* Category Title */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {category.label}
                </h2>
                <div className="h-1 w-20 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full" />
              </div>

              {/* Questions Grid */}
              <div className="space-y-6">
                {category.prompts.map((prompt, promptIdx) => {
                  questionNumber++;
                  const key = `${category.label}:${prompt}`;
                  const evaluation = evaluationMap.get(key);

                  return (
                    <motion.div
                      key={promptIdx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: promptIdx * 0.05 }}
                      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {/* Question */}
                      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                              {questionNumber}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-relaxed">
                              {prompt}
                            </h3>
                          </div>
                        </div>
                      </div>

                      {/* Results */}
                      {evaluation && evaluation.verdicts ? (
                        <div className="p-6 space-y-6">
                          {/* Scores Row */}
                          <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              <div>
                                <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">Overall</div>
                                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                                  {((evaluation.overallScore || 0) * 100).toFixed(0)}%
                                </div>
                              </div>
                            </div>

                            {evaluation.verdicts.bias && (
                              <ScoreBadge
                                label="Bias"
                                score={evaluation.verdicts.bias.score}
                                verdict={evaluation.verdicts.bias.verdict}
                              />
                            )}
                            {evaluation.verdicts.toxicity && (
                              <ScoreBadge
                                label="Toxicity"
                                score={evaluation.verdicts.toxicity.score}
                                verdict={evaluation.verdicts.toxicity.verdict}
                              />
                            )}
                            {evaluation.verdicts.relevancy && (
                              <ScoreBadge
                                label="Relevancy"
                                score={evaluation.verdicts.relevancy.score}
                                verdict={evaluation.verdicts.relevancy.verdict}
                              />
                            )}
                            {evaluation.verdicts.faithfulness && (
                              <ScoreBadge
                                label="Faithfulness"
                                score={evaluation.verdicts.faithfulness.score}
                                verdict={evaluation.verdicts.faithfulness.verdict}
                              />
                            )}
                          </div>

                          {/* Response */}
                          <ResponseSection response={evaluation.userResponse} />

                          {/* Reasoning */}
                          {evaluation.reasoning && (
                            <details className="group">
                              <summary className="cursor-pointer text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-2">
                                <span>View AI Analysis</span>
                                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </summary>
                              <div className="mt-3 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                  {evaluation.reasoning}
                                </p>
                              </div>
                            </details>
                          )}
                        </div>
                      ) : (
                        <div className="p-6">
                          <div className="flex items-center gap-3 text-gray-400 dark:text-gray-600">
                            <Clock className="w-5 h-5" />
                            <span className="text-sm">Awaiting evaluation</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
