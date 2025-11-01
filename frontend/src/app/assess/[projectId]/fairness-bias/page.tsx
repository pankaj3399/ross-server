"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import { apiService } from "../../../../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  Circle,
  FileText,
  BarChart3,
} from "lucide-react";

interface FairnessQuestion {
  label: string;
  prompts: string[];
}

interface CategoryNode {
  id: string;
  label: string;
  prompts: { id: string; text: string; index: number }[];
  totalPrompts: number;
}

export default function FairnessBiasTest() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [fairnessQuestions, setFairnessQuestions] = useState<FairnessQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [responses, setResponses] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({});
  const [evaluations, setEvaluations] = useState<{ [key: string]: any }>({});
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const projectId = params.projectId as string;
  const currentQuestionRef = useRef<HTMLDivElement>(null);

  const categories: CategoryNode[] = fairnessQuestions.map((category, catIdx) => ({
    id: `cat-${catIdx}`,
    label: category.label,
    prompts: category.prompts.map((prompt, promptIdx) => ({
      id: `prompt-${catIdx}-${promptIdx}`,
      text: prompt,
      index: promptIdx,
    })),
    totalPrompts: category.prompts.length,
  }));

  const currentCategory = categories[currentCategoryIndex];
  const currentPrompt = currentCategory?.prompts[currentPromptIndex];
  const currentResKey = currentCategory && currentPrompt
    ? `${currentCategoryIndex}:${currentPromptIndex}`
    : "";

  useEffect(() => {
    if (loading || !user || !projectId) {
      return;
    }

    const fetchData = async () => {
      try {
        const questionsData = await apiService.getFairnessQuestions();
        setFairnessQuestions(questionsData.questions);
        setAccessDenied(false);
        
        if (questionsData.questions.length > 0) {
          setExpandedCategories(new Set(["cat-0"]));
        }

        try {
          const evaluationsData = await apiService.getFairnessEvaluations(projectId);
          
          const responsesMap: { [key: string]: string } = {};
          const evaluationsMap: { [key: string]: any } = {};

          evaluationsData.evaluations.forEach((evaluation) => {
            const categoryIdx = questionsData.questions.findIndex(
              cat => cat.label === evaluation.category
            );
            
            if (categoryIdx !== -1) {
              const category = questionsData.questions[categoryIdx];
              const promptIdx = category.prompts.findIndex(
                prompt => prompt === evaluation.questionText
              );
              
              if (promptIdx !== -1) {
                const key = `${categoryIdx}:${promptIdx}`;
                responsesMap[key] = evaluation.userResponse;
                evaluationsMap[key] = {
                  id: evaluation.id,
                  biasScore: evaluation.biasScore,
                  toxicityScore: evaluation.toxicityScore,
                  relevancyScore: evaluation.relevancyScore,
                  faithfulnessScore: evaluation.faithfulnessScore,
                  overallScore: evaluation.overallScore,
                  verdicts: evaluation.verdicts,
                  reasoning: evaluation.reasoning,
                  createdAt: evaluation.createdAt,
                };
              }
            }
          });

          setResponses(responsesMap);
          setEvaluations(evaluationsMap);
        } catch (error: any) {
          if (error.status === 403 || error.message?.includes('Access denied') || error.message?.includes('Premium subscription')) {
            setAccessDenied(true);
          }
        }
      } catch (error: any) {
        if (error.status === 403 || error.message?.includes('Access denied') || error.message?.includes('Premium subscription')) {
          setAccessDenied(true);
        }
      } finally {
        setQuestionsLoading(false);
      }
    };

    fetchData();
  }, [loading, user, projectId]);

  // Scroll to current question when it changes
  useEffect(() => {
    if (currentQuestionRef.current) {
      setTimeout(() => {
        currentQuestionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 300);
    }
  }, [currentCategoryIndex, currentPromptIndex]);

  // Auto-expand current category
  useEffect(() => {
    if (currentCategory) {
      setExpandedCategories(prev => {
        const newSet = new Set(prev);
        newSet.add(currentCategory.id);
        return newSet;
      });
    }
  }, [currentCategoryIndex]);

  // Show loading while checking auth or fetching data
  if (loading || questionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show locked message if backend returned 403 (access denied)
  if (accessDenied || (!user && !loading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-xl p-10 bg-white dark:bg-gray-900 border text-center max-w-lg shadow-lg">
          <div className="text-6xl mb-4">🔒</div>
          <div className="text-xl font-bold mb-2">Access Denied</div>
          <div className="text-gray-500 mb-4">
            This feature is available only for premium users. Please upgrade your subscription to access fairness and bias testing.
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

  if (fairnessQuestions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-400">No fairness questions available.</p>
        </div>
      </div>
    );
  }

  const totalQuestions = categories.reduce((sum, cat) => sum + cat.totalPrompts, 0);
  const answeredQuestions = Object.keys(evaluations).filter(
    key => evaluations[key] && !evaluations[key].error
  ).length;
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const navigateToQuestion = (catIdx: number, promptIdx: number) => {
    setCurrentCategoryIndex(catIdx);
    setCurrentPromptIndex(promptIdx);
  };

  const handlePrevious = () => {
    if (currentPromptIndex > 0) {
      setCurrentPromptIndex(currentPromptIndex - 1);
    } else if (currentCategoryIndex > 0) {
      const prevCategory = categories[currentCategoryIndex - 1];
      setCurrentCategoryIndex(currentCategoryIndex - 1);
      setCurrentPromptIndex(prevCategory.prompts.length - 1);
    }
  };

  const handleNext = () => {
    // Navigate to next question without evaluating
    if (currentCategory && currentPromptIndex < currentCategory.prompts.length - 1) {
      setCurrentPromptIndex(currentPromptIndex + 1);
    } else if (currentCategoryIndex < categories.length - 1) {
      setCurrentCategoryIndex(currentCategoryIndex + 1);
      setCurrentPromptIndex(0);
    }
  };

  const hasPrevious = currentCategoryIndex > 0 || (currentCategoryIndex === 0 && currentPromptIndex > 0);
  const hasNext = currentCategoryIndex < categories.length - 1 ||
    (currentCategoryIndex === categories.length - 1 &&
      currentPromptIndex < categories[currentCategoryIndex].prompts.length - 1);

  // Called when a user clicks submit for a prompt
  async function handleSubmit() {
    if (!currentResKey || !responses[currentResKey]?.trim()) return;

    const category = fairnessQuestions[currentCategoryIndex];
    const prompt = category.prompts[currentPromptIndex];

    setSubmitting((prev) => ({ ...prev, [currentResKey]: true }));

    try {
      const result = await apiService.evaluateFairnessResponse({
        projectId,
        category: category.label,
        questionText: prompt,
        userResponse: responses[currentResKey],
      });

      setEvaluations((prev) => ({
        ...prev,
        [currentResKey]: result.evaluation,
      }));
    } catch (error) {
      console.error("Failed to evaluate response:", error);
      setEvaluations((prev) => ({
        ...prev,
        [currentResKey]: { error: "Evaluation failed. Please try again." },
      }));
    } finally {
      setSubmitting((prev) => ({ ...prev, [currentResKey]: false }));
    }
  }

  const getQuestionStatus = (catIdx: number, promptIdx: number) => {
    const key = `${catIdx}:${promptIdx}`;
    const evaluation = evaluations[key];
    if (!evaluation || evaluation.error) return null;
    return evaluation;
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Left Sidebar - Tree Navigation */}
      <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Fairness & Bias Test
            </h2>
          </div>

          {/* Progress Summary */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progress
              </span>
              <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                {answeredQuestions}/{totalQuestions}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-600 to-violet-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {Math.round(progress)}% Complete
            </div>
          </div>

          {/* Categories Tree */}
          <div className="space-y-2">
            {categories.map((category, catIdx) => {
              const isCurrentCategory = currentCategoryIndex === catIdx;
              const isExpanded = expandedCategories.has(category.id);

              return (
                <div key={category.id} className="select-none">
                  {/* Category Header */}
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      isCurrentCategory
                        ? "bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => {
                      toggleCategory(category.id);
                      if (!isCurrentCategory) {
                        navigateToQuestion(catIdx, 0);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                        <FileText className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {category.label}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                category.prompts.every((_, idx) => getQuestionStatus(catIdx, idx))
                                  ? "bg-green-500"
                                  : category.prompts.some((_, idx) => getQuestionStatus(catIdx, idx))
                                  ? "bg-yellow-500"
                                  : "bg-gray-300 dark:bg-gray-600"
                              }`}
                              style={{
                                width: `${
                                  (category.prompts.filter((_, idx) => getQuestionStatus(catIdx, idx)).length /
                                    category.totalPrompts) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {category.prompts.filter((_, idx) => getQuestionStatus(catIdx, idx)).length}/
                            {category.totalPrompts}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Prompts */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-6 mt-2 space-y-1"
                      >
                        {category.prompts.map((prompt, promptIdx) => {
                          const isCurrentQuestion =
                            isCurrentCategory && currentPromptIndex === promptIdx;
                          const evaluation = getQuestionStatus(catIdx, promptIdx);

                          return (
                            <div
                              key={prompt.id}
                              ref={isCurrentQuestion ? currentQuestionRef : null}
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                isCurrentQuestion
                                  ? "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700"
                                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateToQuestion(catIdx, promptIdx);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                {evaluation ? (
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                ) : (
                                  <Circle className="w-3 h-3 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-2">
                                  {prompt.text.substring(0, 60)}
                                  {prompt.text.length > 60 ? "..." : ""}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentCategory?.label || "Loading..."}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Question {answeredQuestions} of {totalQuestions} • Prompt{" "}
                  {currentPromptIndex + 1} of {currentCategory?.totalPrompts || 0}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/assess/${projectId}/fairness-bias/report`)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-700 hover:to-violet-700 transition-all duration-200"
            >
              <BarChart3 className="w-4 h-4" />
              View Full Report
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Question {answeredQuestions} of {totalQuestions}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-600 to-violet-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            {currentPrompt && (
              <motion.div
                key={currentResKey}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 mb-8"
              >
                <div className="mb-6">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white leading-relaxed flex-1">
                      {currentPrompt.text}
                    </h2>
                    {/* Evaluate/Re-evaluate Button */}
                    {currentResKey && responses[currentResKey] && responses[currentResKey].trim() && (
                      <button
                        onClick={handleSubmit}
                        disabled={submitting[currentResKey]}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      >
                        {submitting[currentResKey] ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            {evaluations[currentResKey] && !evaluations[currentResKey].error ? "Re-evaluating..." : "Evaluating..."}
                          </>
                        ) : (
                          <>
                            {evaluations[currentResKey] && !evaluations[currentResKey].error ? "Re-evaluate" : "Evaluate"}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Textarea for Response */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Response
                  </label>
                  <textarea
                    rows={8}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-4 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    value={responses[currentResKey] || ""}
                    onChange={(e) =>
                      setResponses({ ...responses, [currentResKey]: e.target.value })
                    }
                    placeholder="Type or paste your response here..."
                  />
                </div>

              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={!hasPrevious}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                onClick={handleNext}
                disabled={!hasNext}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
