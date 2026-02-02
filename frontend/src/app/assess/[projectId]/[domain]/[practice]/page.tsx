"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../../contexts/AuthContext";
import { useRequireAuth } from "../../../../../hooks/useRequireAuth";
import { apiService } from "../../../../../lib/api";
import { motion } from "framer-motion";
import { IconArrowLeft, IconDeviceFloppy, IconTarget } from "@tabler/icons-react";
import { AssessmentSkeleton } from "../../../../../components/Skeleton";
import { safeRenderHTML, stripHTML } from "../../../../../lib/htmlUtils";

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

export default function AssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { loading: authLoading } = useRequireAuth();
  const projectId = params.projectId as string;
  const domainId = params.domain as string;
  const practiceId = params.practice as string;

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

    const fetchPractice = async () => {
      try {
        const data = await apiService.getPracticeQuestions(
          domainId,
          practiceId,
        );
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
      } catch (error) {
        console.error("Failed to fetch practice:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPractice();
  }, [domainId, practiceId, isAuthenticated, authLoading, router]);

  const handleAnswerChange = async (questionIndex: number, value: number) => {
    const question = questions[questionIndex];
    const key = `${domainId}:${practiceId}:${question.level}:${question.stream}:${questionIndex}`;

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

  if (!practice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Practice not found
          </h1>
          <p className="text-muted-foreground">
            The requested practice could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-card rounded-2xl p-6 mb-8 border border-border shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <IconArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-foreground">
            {practice.title}
          </h1>
          <p className="text-muted-foreground mb-4 text-lg">{practice.description}</p>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Domain: {domainId} | Practice: {practiceId}
            </div>
            {saving && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <IconDeviceFloppy className="w-4 h-4 animate-spin" />
                Saving...
              </div>
            )}
          </div>
        </motion.div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, index) => {
            const key = `${domainId}:${practiceId}:${question.level}:${question.stream}:${index}`;
            const currentAnswer = answers[key] || 0;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 border border-border shadow-sm"
              >
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                      Level {question.level}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                      Stream {question.stream}
                    </span>
                  </div>
                  <p className="text-card-foreground font-medium text-lg leading-relaxed">
                    {question.question}
                  </p>
                  {question.description && (
                    <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/50 p-4 text-sm text-muted-foreground [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:mb-1 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_a]:text-primary [&_a]:underline [&_p]:mb-2 [&_p:last-child]:mb-0">
                      <div dangerouslySetInnerHTML={{ __html: safeRenderHTML(question.description) }} />
                    </div>
                  )}
                </div>

                <div className="flex gap-6">
                  {[0, 0.5, 1].map((value) => (
                    <label
                      key={value}
                      className="flex items-center cursor-pointer group"
                    >
                      <div className="relative flex items-center justify-center mr-3">
                        <input
                          type="radio"
                          name={`question-${index}`}
                          value={value}
                          checked={currentAnswer === value}
                          onChange={() => handleAnswerChange(index, value)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${currentAnswer === value
                          ? "border-primary bg-primary"
                          : "border-border bg-transparent group-hover:border-primary/50"
                          }`}>
                          {currentAnswer === value && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 rounded-full bg-white"
                            />
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        {value === 0
                          ? "No"
                          : value === 0.5
                            ? "Partially"
                            : "Yes"}
                      </span>
                    </label>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-8 bg-card rounded-2xl p-6 border border-border shadow-sm"
        >
          <h3 className="text-lg font-medium text-card-foreground mb-4 flex items-center gap-2">
            <IconTarget className="w-5 h-5" />
            Progress
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Questions answered</span>
              <span className="text-card-foreground font-medium">
                {Object.keys(answers).length} / {questions.length}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${(Object.keys(answers).length / questions.length) * 100
                    }%`,
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground text-center">
              {Math.round(
                (Object.keys(answers).length / questions.length) * 100,
              )}
              % Complete
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
