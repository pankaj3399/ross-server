"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import { apiService } from "../../../../lib/api";
import { sanitizeNoteInput, containsDangerousContent } from "../../../../lib/sanitize";
import { PREMIUM_STATUS } from "../../../../lib/constants";
import { showToast } from "../../../../lib/toast";
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
import UnlockPremium from "../../../../components/features/subscriptions/UnlockPremium";
import { FairnessTestSkeleton, SimplePageSkeleton } from "../../../../components/Skeleton";
import { Button } from "@/components/ui/button";
import { ManualTestHistory } from "./manual-history/components/ManualTestHistory";

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
  const [responses, setResponses] = useState<{ [key: string]: string }>({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showUnlockPremium, setShowUnlockPremium] = useState(false);
  const [hasShownDangerWarning, setHasShownDangerWarning] = useState<Set<string>>(new Set());

  const projectId = params.projectId as string;
  const currentQuestionRef = useRef<HTMLDivElement>(null);

  const isPremium = user?.subscription_status ? PREMIUM_STATUS.includes(user.subscription_status as typeof PREMIUM_STATUS[number]) : false;

  useEffect(() => {
    if (!loading && user) {
      setShowUnlockPremium(!isPremium);
    }
  }, [loading, user, isPremium]);

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

        if (questionsData.questions.length > 0) {
          setExpandedCategories(new Set(["cat-0"]));
        }

      } catch (error: any) {
        if (error.status === 403 || error.message?.includes('Access denied') || error.message?.includes('Premium subscription')) {
          console.log("Premium access required");
        }
      } finally {
        setQuestionsLoading(false);
      }
    };

    fetchData();
  }, [loading, user, projectId]);

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

  useEffect(() => {
    if (currentCategory) {
      setExpandedCategories(prev => {
        const newSet = new Set(prev);
        newSet.add(currentCategory.id);
        return newSet;
      });
    }
  }, [currentCategoryIndex]);

  if (loading || !user) {
    return <SimplePageSkeleton />;
  }

  if (questionsLoading) {
    return (
      <div className="min-h-screen flex bg-background relative">
        {!isPremium && (
          <>
            <div className="absolute inset-0 bg-overlay/20 backdrop-blur-sm z-40" />
            {showUnlockPremium && (
              <div className="absolute inset-0 flex items-center justify-center z-50">
                <UnlockPremium
                  featureName="Fairness & Bias Test"
                  onClose={() => setShowUnlockPremium(false)}
                />
              </div>
            )}
          </>
        )}
        <div className="flex-1">
          <FairnessTestSkeleton />
        </div>
      </div>
    );
  }

  if (fairnessQuestions.length === 0) {
    return (
      <div className="min-h-screen flex bg-background relative">
        {!isPremium && (
          <>
            <div className="absolute inset-0 bg-overlay/20 backdrop-blur-sm z-40" />
            {showUnlockPremium && (
              <div className="absolute inset-0 flex items-center justify-center z-50">
                <UnlockPremium
                  featureName="Fairness & Bias Test"
                  onClose={() => setShowUnlockPremium(false)}
                />
              </div>
            )}
          </>
        )}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">No fairness questions available.</p>
          </div>
        </div>
      </div>
    );
  }

  const totalQuestions = categories.reduce((sum, cat) => sum + cat.totalPrompts, 0);
  const answeredQuestions = Object.keys(responses).filter(
    key => responses[key] && responses[key].trim()
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

  async function handleEvaluateAssessment() {
    const responsesArray: Array<{ category: string; prompt: string; response: string }> = [];

    fairnessQuestions.forEach((category, catIdx) => {
      category.prompts.forEach((prompt, promptIdx) => {
        const key = `${catIdx}:${promptIdx}`;
        const response = responses[key];
        if (response && response.trim()) {
          responsesArray.push({
            category: category.label,
            prompt: prompt,
            response: response.trim(),
          });
        }
      });
    });

    if (responsesArray.length === 0) {
      showToast.warning("Please provide at least one response before evaluating.");
      return;
    }

    setIsEvaluating(true);

    try {
      const result = await apiService.evaluatePrompts({
        projectId,
        responses: responsesArray,
      });

      router.push(`/assess/${projectId}/fairness-bias/job/${result.jobId}`);
    } catch (error: any) {
      console.error("Failed to start evaluation:", error);
      showToast.error(error.message || "Failed to start evaluation. Please try again.");
    } finally {
      setIsEvaluating(false);
    }
  }

  const getQuestionStatus = (catIdx: number, promptIdx: number) => {
    const key = `${catIdx}:${promptIdx}`;
    return responses[key] && responses[key].trim() ? true : false;
  };

  return (
    <div className="min-h-screen flex bg-background relative">
      {!isPremium && showUnlockPremium && (
        <UnlockPremium
          featureName="Fairness & Bias Test"
          onClose={() => setShowUnlockPremium(false)}
        />
      )}

      <div className={`w-80 bg-card border-r border-border h-screen overflow-y-auto ${!isPremium ? 'blur-md pointer-events-none select-none' : ''}`}>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Fairness & Bias Test
            </h2>
          </div>

          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Progress
              </span>
              <span className="text-sm text-primary font-medium">
                {answeredQuestions}/{totalQuestions}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {Math.round(progress)}% Complete
            </div>
          </div>

          <div className="space-y-2">
            {categories.map((category, catIdx) => {
              const isCurrentCategory = currentCategoryIndex === catIdx;
              const isExpanded = expandedCategories.has(category.id);

              return (
                <div key={category.id} className="select-none">
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${isCurrentCategory
                      ? "bg-primary/20 border border-primary/30"
                      : "hover:bg-muted/50"
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
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-foreground truncate">
                          {category.label}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-secondary rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-300 ${category.prompts.every((_, idx) => getQuestionStatus(catIdx, idx))
                                ? "bg-success"
                                : category.prompts.some((_, idx) => getQuestionStatus(catIdx, idx))
                                  ? "bg-warning"
                                  : "bg-muted"
                                }`}
                              style={{
                                width: `${(category.prompts.filter((_, idx) => getQuestionStatus(catIdx, idx)).length /
                                  category.totalPrompts) *
                                  100
                                  }%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {category.prompts.filter((_, idx) => getQuestionStatus(catIdx, idx)).length}/
                            {category.totalPrompts}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

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
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 ${isCurrentQuestion
                                ? "bg-primary/10 border border-primary/20"
                                : "hover:bg-muted/50"
                                }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateToQuestion(catIdx, promptIdx);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                {getQuestionStatus(catIdx, promptIdx) ? (
                                  <CheckCircle className="w-3 h-3 text-success" />
                                ) : (
                                  <Circle className="w-3 h-3 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-muted-foreground line-clamp-2">
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

      <div className={`flex-1 flex flex-col ${!isPremium ? 'blur-md pointer-events-none select-none' : ''}`}>
        <div className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors pl-0 hover:bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {currentCategory?.label || "Loading..."}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Question {answeredQuestions} of {totalQuestions} • Prompt{" "}
                  {currentPromptIndex + 1} of {currentCategory?.totalPrompts || 0}
                </p>
              </div>
            </div>
            <Button
              onClick={handleEvaluateAssessment}
              isLoading={isEvaluating}
              disabled={answeredQuestions === 0}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-sm"
            >
              {isEvaluating ? (
                "Evaluating..."
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Evaluate Assessment
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  Question {answeredQuestions} of {totalQuestions}
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {currentPrompt && (
              <motion.div
                key={currentResKey}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-card rounded-2xl shadow-lg border border-border p-8 mb-8"
              >
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-foreground leading-relaxed">
                    {currentPrompt.text}
                  </h2>
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="responseTextarea"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Your Response
                  </label>
                  <textarea
                    id="responseTextarea"
                    rows={8}
                    className="w-full rounded-xl border border-input bg-background p-4 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    value={responses[currentResKey] || ""}
                    onChange={(e) => {
                      const originalValue = e.target.value;
                      try {
                        const sanitizedValue = sanitizeNoteInput(originalValue, true);

                        // Reset warning state if field is cleared
                        if (!originalValue.trim()) {
                          setHasShownDangerWarning(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(currentResKey);
                            return newSet;
                          });
                        }

                        // Check if dangerous content was removed - only show warning once per field
                        if (containsDangerousContent(originalValue) && !hasShownDangerWarning.has(currentResKey)) {
                          // Dangerous content was detected and removed - show warning toast once
                          showToast.warning(
                            "Potentially dangerous content was removed from your input for security."
                          );
                          // Mark that we've shown the warning for this field
                          setHasShownDangerWarning(prev => new Set(prev).add(currentResKey));
                        }

                        // Update state with the sanitized (cleaned) value
                        setResponses({ ...responses, [currentResKey]: sanitizedValue });
                      } catch (error) {
                        // If sanitization fails (shouldn't happen now, but safety check)
                        console.error("Error sanitizing note input:", error);
                        showToast.error(
                          "Unable to process input. Dangerous content was detected and rejected."
                        );
                        // Early return - don't update state
                        return;
                      }
                    }}
                    onBlur={() => {
                      // Reset warning state when field loses focus so warning can be shown again if needed
                      setHasShownDangerWarning(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(currentResKey);
                        return newSet;
                      });
                    }}
                    placeholder="Type or paste your response here..."
                  />
                  <div className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded-lg">
                    <strong>Security:</strong> Your notes are automatically sanitized to
                    prevent malicious content. HTML tags and scripts are not allowed.
                  </div>
                </div>

              </motion.div>
            )}

            <div className="flex items-center justify-between">
              <Button
                onClick={handlePrevious}
                disabled={!hasPrevious}
                variant="outline"
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 border border-input text-foreground hover:bg-muted bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <Button
                onClick={handleNext}
                disabled={!hasNext}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* History Section */}
          <div className="mt-12 pt-12 border-t border-border">
            <ManualTestHistory projectId={projectId} />
          </div>
        </div>
      </div>

    </div>
  );
}
