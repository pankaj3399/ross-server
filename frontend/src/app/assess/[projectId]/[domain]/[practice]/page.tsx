"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../../contexts/AuthContext";
import { apiService } from "../../../../../lib/api";
import { motion } from "framer-motion";
import { ArrowLeft, Save, CheckCircle, Clock, Target } from "lucide-react";
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
  const projectId = params.projectId as string;
  const domainId = params.domain as string;
  const practiceId = params.practice as string;

  const [practice, setPractice] = useState<Practice | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
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
  }, [domainId, practiceId, isAuthenticated, router]);

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
          <h1 className="text-2xl font-bold text-white mb-4">
            Practice not found
          </h1>
          <p className="text-gray-300">
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
          className="glass-effect rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-text">{practice.title}</span>
          </h1>
          <p className="text-gray-300 mb-4 text-lg">{practice.description}</p>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Domain: {domainId} | Practice: {practiceId}
            </div>
            {saving && (
              <div className="flex items-center gap-2 text-sm text-purple-400">
                <Save className="w-4 h-4 animate-spin" />
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
                className="glass-effect rounded-2xl p-6"
              >
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-600 to-violet-600 text-white">
                      Level {question.level}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-gray-300">
                      Stream {question.stream}
                    </span>
                  </div>
                  <p className="text-white font-medium text-lg leading-relaxed">
                    {question.question}
                  </p>
                  {question.description && (
                    <div className="mt-3 rounded-xl border border-dashed border-white/20 bg-white/10 p-4 text-sm text-gray-200 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:mb-1 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_a]:text-purple-300 [&_a]:underline [&_p]:mb-2 [&_p:last-child]:mb-0">
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
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={value}
                        checked={currentAnswer === value}
                        onChange={() => handleAnswerChange(index, value)}
                        className="mr-3 w-4 h-4 text-purple-600 bg-white/10 border-white/20 focus:ring-purple-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
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
          className="mt-8 glass-effect rounded-2xl p-6"
        >
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Progress
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Questions answered</span>
              <span className="text-white font-medium">
                {Object.keys(answers).length} / {questions.length}
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-600 to-violet-600 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    (Object.keys(answers).length / questions.length) * 100
                  }%`,
                }}
              />
            </div>
            <div className="text-xs text-gray-400 text-center">
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
