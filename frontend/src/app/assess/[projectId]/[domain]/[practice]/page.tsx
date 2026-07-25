"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../../contexts/AuthContext";
import { useRequireAuth } from "../../../../../hooks/useRequireAuth";
import { apiService } from "../../../../../lib/api";
import { motion } from "framer-motion";
import {
  IconArrowLeft,
  IconTarget,
  IconCpu,
  IconDatabase,
  IconShieldLock,
  IconFolder,
  IconInfoCircle,
  IconLoader2,
  IconLock,
  IconAlertTriangle,
  IconLayoutDashboard,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { AssessmentSkeleton } from "../../../../../components/Skeleton";
import { safeRenderHTML, stripHTML } from "../../../../../lib/htmlUtils";
import { buildAssessmentAnswerKey } from "../../../../../lib/assessmentValidation";
import { useOptionalAssessmentContext } from "../../../../../contexts/AssessmentContext";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { isPremiumStatus } from "@/lib/constants";
import { getDomainIcon } from "@/lib/utils";

const getLevelColor = (level: string | number) => {
    const lvl = String(level);
    if (lvl === "1") {
        return "bg-blue-50/50 text-blue-700 border-blue-200/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/30";
    }
    if (lvl === "2") {
        return "bg-purple-50/50 text-purple-700 border-purple-200/50 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800/30";
    }
    return "bg-amber-50/50 text-amber-700 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/30";
};

const getStreamColor = (stream: string) => {
    if (stream === "A") {
        return "bg-teal-50/50 text-teal-700 border-teal-200/50 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-800/30";
    }
    return "bg-rose-50/50 text-rose-700 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800/30";
};

const getOptionColors = (value: number, isSelected: boolean) => {
    if (value === 0) { // No Maturity
        return {
            labelClass: isSelected
                ? "border-destructive bg-destructive/5 dark:bg-destructive/10"
                : "border-border hover:border-destructive/40 hover:bg-destructive/2 dark:hover:bg-destructive/2",
            radioClass: isSelected
                ? "border-destructive bg-destructive"
                : "border-border bg-transparent",
        };
    } else if (value === 1 || value === 2) { // Initial / Developing
        return {
            labelClass: isSelected
                ? "border-warning bg-warning/5 dark:bg-warning/10"
                : "border-border hover:border-warning/40 hover:bg-warning/2 dark:hover:bg-warning/2",
            radioClass: isSelected
                ? "border-warning bg-warning"
                : "border-border bg-transparent",
        };
    } else { // Mature
        return {
            labelClass: isSelected
                ? "border-success bg-success/5 dark:bg-success/10"
                : "border-border hover:border-success/40 hover:bg-success/2 dark:hover:bg-success/2",
            radioClass: isSelected
                ? "border-success bg-success"
                : "border-border bg-transparent",
        };
    }
};

interface Question {
  level: string;
  stream: string;
  question: string;
  description?: string | null;
}

type LevelQuestionEntry =
  | string
  | {
    question_text: string;
    description?: string | null;
  };

interface Practice {
  title: string;
  description: string;
  levels: {
    [level: string]: {
      [stream: string]: LevelQuestionEntry[];
    };
  };
}

const normalizeQuestionEntry = (
  entry: LevelQuestionEntry | undefined,
): { question: string; description?: string | null } | null => {
  if (!entry) return null;
  if (typeof entry === "string") {
    return { question: stripHTML(entry), description: null };
  }
  if (!entry.question_text) {
    return null;
  }
  return {
    question: stripHTML(entry.question_text),
    description: entry.description ?? null,
  };
};

const maturityLabels: Record<number, string> = {
  0: "No Maturity (0)",
  1: "Initial (1)",
  2: "Developing (2)",
  3: "Mature (3)",
};

export default function AssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { loading: authLoading } = useRequireAuth();
  const projectId = params.projectId as string;
  const domainId = params.domain as string;
  const practiceId = params.practice as string;

  const assessmentContext = useOptionalAssessmentContext();
  const isReadOnly = assessmentContext?.isReadOnly || false;
  const premiumStatus = isPremiumStatus(user?.subscription_status);

  const [practice, setPractice] = useState<Practice | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading || !isAuthenticated) {
      return;
    }

    const fetchData = async () => {
      try {
        // 1. Fetch practice questions (required)
        const data = await apiService.getPracticeQuestions(domainId, practiceId);
        setPractice(data);

        // Flatten questions from levels
        const questionsList: Question[] = [];
        Object.entries(data.levels).forEach(([level, streams]) => {
          Object.entries(
            streams as Record<string, LevelQuestionEntry[]>,
          ).forEach(([stream, questionEntries]) => {
            questionEntries.forEach((questionEntry) => {
              const normalized = normalizeQuestionEntry(questionEntry);
              if (!normalized) {
                return;
              }
              questionsList.push({
                level,
                stream,
                question: normalized.question,
                description: normalized.description ?? undefined,
              });
            });
          });
        });
        setQuestions(questionsList);

        // 2. Fetch answers (resilient)
        try {
          const answersData = await apiService.getAnswers(projectId);
          if (answersData?.answers) {
            setAnswers(answersData.answers);
          }
        } catch (ansErr) {
          console.error("Failed to fetch answers, continuing without them:", ansErr);
        }
      } catch (error) {
        console.error("Failed to fetch practice:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [domainId, practiceId, projectId, isAuthenticated, authLoading]);

  const handleAnswerChange = async (questionIndex: number, value: number) => {
    if (isReadOnly) return;
    const question = questions[questionIndex];
    const key = buildAssessmentAnswerKey(domainId, practiceId, question.level, question.stream, questionIndex);

    setAnswers((prev) => ({ ...prev, [key]: value }));

    // Save to backend
    setSaving(true);
    try {
      await apiService.saveAnswers(projectId, [
        {
          domainId,
          practiceId,
          level: question.level,
          stream: question.stream,
          questionIndex,
          value,
        },
      ]);
    } catch (error) {
      console.error("Failed to save answer:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <AssessmentSkeleton />;
  }

  const projectBreadcrumbHref = premiumStatus
    ? `/assess/${projectId}/crc/dashboard`
    : `/assess/${projectId}`;

  if (!practice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
        {/* Decorative gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
          className="w-full max-w-lg z-10"
        >
          <div className="bg-card/50 backdrop-blur-xl border border-border/80 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="flex justify-center mb-6">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary/80 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                MATUR.ai
              </span>
            </div>

            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6 border border-destructive/20">
              <IconAlertTriangle className="w-8 h-8 text-destructive" />
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-primary-light to-primary bg-clip-text text-transparent mb-4">
              Practice Not Found
            </h1>

            <p className="text-muted-foreground mb-8 text-sm sm:text-base leading-relaxed">
              The requested assessment practice could not be found. It may have been moved, deleted, or does not exist.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => router.push(projectBreadcrumbHref)}
                className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 transition-all font-bold rounded-xl py-6 px-6 shadow-md shadow-primary/20 cursor-pointer"
              >
                <IconLayoutDashboard className="w-4 h-4" />
                Go to Project
              </Button>
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="flex items-center gap-2 border-border text-foreground hover:bg-muted transition-all font-bold rounded-xl py-6 px-6 cursor-pointer"
              >
                <IconArrowLeft className="w-4 h-4" />
                Go Back
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Calculate practice-specific progress
  const answeredCount = questions.reduce((count, question, idx) => {
    const key = buildAssessmentAnswerKey(domainId, practiceId, question.level, question.stream, idx);
    return answers[key] !== undefined ? count + 1 : count;
  }, 0);
  const progressPercent = questions.length > 0 ? Math.min(100, (answeredCount / questions.length) * 100) : 0;

  const projectName = assessmentContext?.projectName;

  const DomainIcon = getDomainIcon(domainId);

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <div className="bg-background border-b border-border px-8 py-3 flex-none sticky top-0 z-20 shadow-xs w-full mb-8">
        <div className="w-full flex flex-col gap-2">
          {/* Top: Breadcrumb */}
          <div className="flex items-center justify-between text-xs">
            <Breadcrumb projectName={projectName || "Loading..."} projectHref={projectBreadcrumbHref} items={[{ label: "AI Maturity Assessment (AIMA)" }]} />
            
            {saving && (
              <div className="flex items-center gap-2 text-xs text-primary font-medium animate-pulse">
                <IconLoader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </div>
            )}
          </div>

          {/* Bottom: Main row */}
          <div className="flex items-center justify-between gap-4 mt-1">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.back()}
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-border/60 hover:bg-muted text-xs text-foreground/80 hover:text-foreground transition-all shadow-2xs shrink-0"
              >
                <IconArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <div className="h-5 w-px bg-border shrink-0" />
              <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                <DomainIcon className="w-4 h-4 text-primary shrink-0" />
                <h1 className="text-sm font-bold text-foreground truncate">
                  {practice.title}
                </h1>
                <span className="text-muted-foreground/30 text-xs shrink-0">|</span>
                <span className="text-xs text-muted-foreground font-medium truncate max-w-[120px] sm:max-w-xs">
                  Domain: {domainId}
                </span>
                <span className="text-xs text-muted-foreground font-medium truncate max-w-[120px] sm:max-w-xs">
                  Practice: {practiceId}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {isReadOnly && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground text-[10px] font-medium">
                  <IconLock size={10} />
                  View Only
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-8 pb-8">

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, index) => {
            const key = buildAssessmentAnswerKey(domainId, practiceId, question.level, question.stream, index);
            const currentAnswer = answers[key] ?? undefined;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                className="bg-card rounded-2xl p-8 border border-border/80 shadow-md hover:shadow-lg transition-all"
              >
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] py-1 px-2.5 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20 flex items-center">
                      Question {index + 1} of {questions.length}
                    </span>
                    <span className={`text-[10px] py-1 px-2.5 rounded-full font-semibold border flex items-center gap-1.5 ${getLevelColor(question.level)}`}>
                      <IconCpu className="w-3.5 h-3.5 shrink-0" />
                      <span>Level {question.level}</span>
                    </span>
                    <span className={`text-[10px] py-1 px-2.5 rounded-full font-semibold border flex items-center gap-1.5 ${getStreamColor(question.stream)}`}>
                      <IconInfoCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Stream {question.stream}</span>
                    </span>
                  </div>
                  <p className="text-foreground font-semibold text-lg leading-relaxed">
                    {question.question}
                  </p>
                  {question.description && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 rounded-md bg-primary/10">
                          <IconInfoCircle size={14} className="text-primary" />
                        </div>
                        <span className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Description (Guide Text)</span>
                      </div>
                      <div className="rounded-xl border-l-4 border-l-primary/60 border-y border-r border-border bg-muted/20 p-5 text-sm text-foreground/90 font-normal [&_strong]:text-foreground [&_strong]:font-bold [&_b]:text-foreground [&_b]:font-bold [&_ul]:mt-3 [&_ul]:space-y-2 [&_li]:relative [&_li]:pl-5 [&_li:before]:content-['•'] [&_li:before]:absolute [&_li:before]:left-0 [&_li:before]:text-primary [&_p]:mb-3 [&_p:last-child]:mb-0 shadow-2xs">
                        <div dangerouslySetInnerHTML={{ __html: safeRenderHTML(question.description) }} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {[0, 1, 2, 3].map((value) => {
                    const isSelected = currentAnswer === value;
                    const colors = getOptionColors(value, isSelected);
                    return (
                      <label
                        key={value}
                        className={`flex items-start p-4 rounded-xl border-2 transition-all duration-200 ${colors.labelClass} ${isReadOnly ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.995]"}`}
                      >
                        <div className="relative flex items-center justify-center mt-1">
                          <input
                            type="radio"
                            name={`question-${index}`}
                            value={value}
                            checked={isSelected}
                            disabled={isReadOnly}
                            onChange={() => !isReadOnly && handleAnswerChange(index, value)}
                            className="sr-only peer"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 peer-focus-visible:ring peer-focus-visible:ring-primary/50 peer-focus-visible:ring-offset-1 ${colors.radioClass}`}>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-2 h-2 rounded-full bg-white"
                              />
                            )}
                          </div>
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="text-sm font-semibold text-foreground">
                            {maturityLabels[value] || `Unknown (${value})`}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -3 }}
          transition={{ duration: 0.8 }}
          className="mt-8 bg-card rounded-2xl p-6 border border-border/80 shadow-sm hover:shadow-md transition-all"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <IconTarget className="w-4 h-4 text-primary" />
            <span>Progress</span>
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Questions answered</span>
              <span className="text-foreground font-semibold">
                {answeredCount} / {questions.length}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-primary to-indigo-500 h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${progressPercent}%`,
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground text-center font-medium">
              {Math.round(progressPercent)}% Complete
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
