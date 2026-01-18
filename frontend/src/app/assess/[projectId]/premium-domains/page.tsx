"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import { useRequireAuth } from "../../../../hooks/useRequireAuth";
import {
  apiService,
  Domain as ApiDomain,
  Practice as ApiPractice,
  PracticeQuestionLevels,
  PracticeQuestionDetail,
} from "../../../../lib/api";
import { showToast } from "../../../../lib/toast";
import { motion } from "framer-motion";
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconArrowRight,
  IconArrowLeft as IconArrowLeftIcon,
  IconInfoCircle,
  IconCrown,
  IconScale,
} from "@tabler/icons-react";
import AssessmentTreeNavigation from "../../../../components/shared/AssessmentTreeNavigation";
import { SecureTextarea } from "../../../../components/shared/SecureTextarea";
import { useAssessmentNavigation } from "../../../../hooks/useAssessmentNavigation";
import { sanitizeNoteInput } from "../../../../lib/sanitize";
import { AssessmentSkeleton, Skeleton } from "../../../../components/Skeleton";
import { stripHTML } from "../../../../lib/htmlUtils";
import { safeRenderHTML } from "../../../../lib/htmlUtils";
import { useAssessmentResultsStore } from "../../../../store/assessmentResultsStore";
import { PREMIUM_STATUS } from "../../../../lib/constants";

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

interface PracticeWithLevels extends ApiPractice {
  levels: PracticeQuestionLevels;
}

const normalizeQuestionEntry = (
  entry: PracticeQuestionDetail | LevelQuestionEntry | undefined,
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

interface DomainWithLevels extends Omit<ApiDomain, "practices"> {
  practices: { [key: string]: PracticeWithLevels };
}

export default function PremiumDomainsPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user, loading: userLoading } = useAuth();
  const { loading: authLoading } = useRequireAuth();
  const projectId = params.projectId as string;

  const [domains, setDomains] = useState<DomainWithLevels[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentDomainId, setCurrentDomainId] = useState<string>("");
  const [currentPracticeId, setCurrentPracticeId] = useState<string>("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [currentPractice, setCurrentPractice] = useState<{ title: string; description: string } | null>(null);
  const [noPremiumDomains, setNoPremiumDomains] = useState(false);
  const [fetchSucceeded, setFetchSucceeded] = useState(false);

  const { setProjectResults } = useAssessmentResultsStore();

  const isPremium = user?.subscription_status ? PREMIUM_STATUS.includes(user.subscription_status as typeof PREMIUM_STATUS[number]) : false;

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      return;
    }

    if (!isPremium) {
      // Redirect to premium features page to purchase subscription
      router.push(`/assess/${projectId}/premium-features`);
      return;
    }

    const fetchData = async () => {
      try {
        setNoPremiumDomains(false);
        setFetchSucceeded(false);
        const domainsData = await apiService.getDomainsFull(projectId);

        const premiumDomains = domainsData.domains.filter(
          (domain) => domain.is_premium === true
        );

        if (premiumDomains.length === 0) {
          // Show message if no premium domains available
          setNoPremiumDomains(true);
          setFetchSucceeded(true);
          setLoading(false);
          return;
        }

        // Transform domains - questions are now included in the response
        const transformedDomains = premiumDomains.map((domain) => {
          const practicesWithLevels: { [key: string]: PracticeWithLevels } = {};

          Object.entries(domain.practices).forEach(([practiceId, practice]) => {
            practicesWithLevels[practiceId] = {
              ...practice,
              levels: practice.levels || {},
            };
          });

          return {
            id: domain.id,
            title: domain.title,
            description: domain.description,
            practices: practicesWithLevels,
          };
        });

        setDomains(transformedDomains);
        setFetchSucceeded(true);

        if (transformedDomains.length > 0) {
          const firstDomain = transformedDomains[0];
          const firstPracticeId = Object.keys(firstDomain.practices)[0];
          if (firstPracticeId) {
            const firstPractice = firstDomain.practices[firstPracticeId];
            setCurrentDomainId(firstDomain.id);
            setCurrentPracticeId(firstPracticeId);
            setCurrentQuestionIndex(0);

            if (firstPractice.levels && Object.keys(firstPractice.levels).length > 0) {
              const questionsList: Question[] = [];
              Object.entries(firstPractice.levels).forEach(([level, streams]) => {
                Object.entries(
                  streams as Record<string, PracticeQuestionDetail[]>,
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
              setCurrentPractice({
                title: firstPractice.title,
                description: firstPractice.description,
              });
            }
          }
        }

        Promise.all([
          apiService.getAnswers(projectId).catch(() => ({ answers: {} })),
          apiService.getQuestionNotes(projectId).catch(() => []),
        ]).then(([answersData, notesData]) => {
          const answersMap: Record<string, number> = {};
          if (answersData && answersData.answers) {
            Object.entries(answersData.answers).forEach(([key, value]) => {
              answersMap[key] = value as number;
            });
          }
          setAnswers(answersMap);

          const notesMap: Record<string, string> = {};
          notesData.forEach((note: any) => {
            const key = `${note.domain_id}:${note.practice_id}:${note.level}:${note.stream}:${note.question_index}`;
            notesMap[key] = note.note;
          });
          setNotes(notesMap);
        }).catch((error) => {
          console.error("Failed to load answers or notes:", error);
        });
      } catch (error) {
        console.error("Failed to fetch data:", error);
        showToast.error("Failed to load premium domains. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, isAuthenticated, authLoading, router, isPremium]);

  const {
    progressData,
    navigateToDomain,
    navigateToPractice,
    getNextQuestion,
    getPreviousQuestion,
    getFirstUnansweredQuestion,
  } = useAssessmentNavigation({
    domains: domains as any, // Temporary type assertion
    assessmentData: answers as any, // Temporary type assertion
    currentDomainId,
    currentPracticeId,
    currentQuestionIndex,
  });

  useEffect(() => {
    if (!loading && domains.length > 0 && currentDomainId && currentPracticeId) {
      const domain = domains.find(d => d.id === currentDomainId);
      if (domain && domain.practices[currentPracticeId]) {
        const practice = domain.practices[currentPracticeId];

        if (practice.levels && Object.keys(practice.levels).length > 0) {
          const questionsList: Question[] = [];
          Object.entries(practice.levels).forEach(([level, streams]) => {
            Object.entries(
              streams as Record<string, PracticeQuestionDetail[]>,
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
          setCurrentPractice({
            title: practice.title,
            description: practice.description,
          });

          if (questionsList.length > 0) {
            const validIndex = Math.min(currentQuestionIndex, questionsList.length - 1);
            if (validIndex !== currentQuestionIndex) {
              setCurrentQuestionIndex(validIndex);
            }
          } else {
            setCurrentQuestionIndex(0);
          }
        } else {
          // No questions available
          setQuestions([]);
          setCurrentPractice({
            title: practice.title,
            description: practice.description,
          });
          setCurrentQuestionIndex(0);
        }
      }
    }
  }, [loading, domains, currentDomainId, currentPracticeId, currentQuestionIndex]);

  const handleAnswerChange = async (questionIndex: number, value: number) => {
    const question = questions[questionIndex];
    if (!question) {
      console.error(`Question at index ${questionIndex} not found`);
      return;
    }
    const key = `${currentDomainId}:${currentPracticeId}:${question.level}:${question.stream}:${questionIndex}`;

    setAnswers((prev) => ({ ...prev, [key]: value }));

    setSaving(true);
    try {
      await apiService.saveAnswers(projectId, [
        {
          domainId: currentDomainId,
          practiceId: currentPracticeId,
          level: question.level,
          stream: question.stream,
          questionIndex,
          value,
        },
      ]);

      await apiService.updateProject(projectId, { status: "in_progress" });
    } catch (error) {
      console.error("Failed to save answer:", JSON.stringify(error));
    } finally {
      setSaving(false);
    }
  };

  const handleNoteChange = (questionIndex: number, note: string) => {
    const question = questions[questionIndex];
    if (!question) {
      console.error(`Question at index ${questionIndex} not found`);
      return;
    }
    const key = `${currentDomainId}:${currentPracticeId}:${question.level}:${question.stream}:${questionIndex}`;

    setNotes((prev) => ({ ...prev, [key]: note }));
  };

  const handleNoteSave = async (questionIndex: number, note: string) => {
    const question = questions[questionIndex];
    if (!question) {
      console.error(`Question at index ${questionIndex} not found`);
      return;
    }

    if (!note.trim()) return;

    setSavingNote(true);
    try {
      const sanitizedNote = sanitizeNoteInput(note);

      await apiService.saveQuestionNote(projectId, {
        domainId: currentDomainId,
        practiceId: currentPracticeId,
        level: question.level,
        stream: question.stream,
        questionIndex,
        note: sanitizedNote,
      });
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setSavingNote(false);
    }
  };

  // Save all notes silently in the background
  const saveAllNotes = async (): Promise<void> => {
    const noteEntries = Object.entries(notes).filter(([_, note]) => note.trim());

    if (noteEntries.length === 0) {
      return;
    }

    // Save all notes in parallel
    const savePromises = noteEntries.map(async ([key, note]) => {
      try {
        const [domainId, practiceId, level, stream, questionIndexStr] = key.split(":");
        const questionIndex = parseInt(questionIndexStr, 10);

        if (!domainId || !practiceId || !level || !stream || isNaN(questionIndex)) {
          console.warn(`Invalid note key format: ${key}`);
          return;
        }

        const sanitizedNote = sanitizeNoteInput(note.trim());

        await apiService.saveQuestionNote(projectId, {
          domainId,
          practiceId,
          level,
          stream,
          questionIndex,
          note: sanitizedNote,
        });
      } catch (error) {
        // Log error but don't throw - we don't want to block submission
        console.error(`Failed to save note for key ${key}:`, error);
      }
    });

    // Wait for all saves to complete (or fail silently)
    await Promise.allSettled(savePromises);
  };

  const handleSubmitProject = async () => {
    setSubmitting(true);
    try {
      // Save all notes silently in the background before submitting
      await saveAllNotes();

      const response = await apiService.submitProject(projectId);

      setProjectResults(projectId, response.project, response.results);
      router.push(`/score-report-premium?projectId=${projectId}`);
    } catch (error) {
      console.error("Failed to submit project:", error);
      showToast.error("Failed to submit assessment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDomainClick = (domainId: string) => {
    const domain = domains.find((d) => d.id === domainId);
    if (domain) {
      const firstPracticeId = Object.keys(domain.practices)[0];
      if (firstPracticeId) {
        setCurrentDomainId(domainId);
        setCurrentPracticeId(firstPracticeId);
        setCurrentQuestionIndex(0);
      }
    }
    navigateToDomain(domainId);
  };

  const handlePracticeClick = (domainId: string, practiceId: string) => {
    setCurrentDomainId(domainId);
    setCurrentPracticeId(practiceId);
    setCurrentQuestionIndex(0);
    navigateToPractice(domainId, practiceId);
  };

  const handleQuestionClick = (domainId: string, practiceId: string, questionIndex: number) => {
    setCurrentDomainId(domainId);
    setCurrentPracticeId(practiceId);
    setCurrentQuestionIndex(questionIndex);
  };

  const loadQuestionsFromPractice = (domainId: string, practiceId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (domain && domain.practices[practiceId]) {
      const selectedPractice = domain.practices[practiceId];

      if (selectedPractice.levels && Object.keys(selectedPractice.levels).length > 0) {
        const questionsList: Question[] = [];
        Object.entries(selectedPractice.levels).forEach(([level, streams]) => {
          Object.entries(
            streams as Record<string, PracticeQuestionDetail[]>,
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
        setCurrentPractice({
          title: selectedPractice.title,
          description: selectedPractice.description,
        });
      } else {
        setQuestions([]);
        setCurrentPractice(null);
      }
    }
  };

  const handleNextQuestion = () => {
    const next = getNextQuestion();
    if (next) {
      const isMovingToDifferentDomain = next.domainId !== currentDomainId;
      const isMovingToDifferentPractice = next.practiceId !== currentPracticeId;

      if (isMovingToDifferentDomain || isMovingToDifferentPractice) {
        loadQuestionsFromPractice(next.domainId, next.practiceId);
        setTimeout(() => {
          setCurrentDomainId(next.domainId);
          setCurrentPracticeId(next.practiceId);
          setCurrentQuestionIndex(next.questionIndex);
        }, 100);
      } else {
        setCurrentDomainId(next.domainId);
        setCurrentPracticeId(next.practiceId);
        setCurrentQuestionIndex(next.questionIndex);
      }
    }
  };

  const handlePreviousQuestion = () => {
    const prev = getPreviousQuestion();
    if (prev) {
      const isMovingToDifferentDomain = prev.domainId !== currentDomainId;
      const isMovingToDifferentPractice = prev.practiceId !== currentPracticeId;

      if (isMovingToDifferentDomain || isMovingToDifferentPractice) {
        loadQuestionsFromPractice(prev.domainId, prev.practiceId);
        setTimeout(() => {
          setCurrentDomainId(prev.domainId);
          setCurrentPracticeId(prev.practiceId);
          setCurrentQuestionIndex(prev.questionIndex);
        }, 100);
      } else {
        setCurrentDomainId(prev.domainId);
        setCurrentPracticeId(prev.practiceId);
        setCurrentQuestionIndex(prev.questionIndex);
      }
    }
  };

  const hasNextQuestion = getNextQuestion() !== null;
  const hasPreviousQuestion = getPreviousQuestion() !== null;

  if (loading) {
    return <AssessmentSkeleton />;
  }

  // When no premium domains are available, render info message instead of redirecting
  // Only show this UI when fetch succeeded and there are no premium domains
  if (fetchSucceeded && (noPremiumDomains || domains.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <IconCrown className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">
            No Premium Domains Available
          </h1>
          <p className="text-muted-foreground mb-8">
            There are currently no premium domains available for this project. Please check back later.
          </p>
          <div className="flex flex-col gap-4">
            {projectId && (
              <button
                type="button"
                onClick={() => router.push(`/assess/${projectId}/fairness-bias/options`)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all duration-300 font-semibold"
              >
                <IconScale className="w-5 h-5" />
                Fairness & Bias Test
              </button>
            )}
            {projectId && (
              <button
                type="button"
                onClick={() => router.push(`/assess/${projectId}`)}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-border text-foreground hover:bg-muted rounded-xl transition-all duration-300"
              >
                <IconArrowLeft className="w-4 h-4" />
                Back to Assessment
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!currentPractice || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-row-reverse">
        <AssessmentTreeNavigation
          domains={progressData}
          currentDomainId={currentDomainId}
          currentPracticeId={currentPracticeId}
          currentQuestionIndex={currentQuestionIndex}
          onDomainClick={handleDomainClick}
          onPracticeClick={handlePracticeClick}
          onQuestionClick={handleQuestionClick}
          projectId={projectId}
          isPremium={isPremium}
          hidePremiumFeaturesButton={true}
          onFairnessBiasClick={() => {
            router.push(`/assess/${projectId}/fairness-bias/options`);
          }}
        />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-background border-b border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push(`/assess/${projectId}`)}
                  className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                >
                  <IconArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <div className="h-6 w-px bg-border" />
                <div>
                  <h1 className="text-lg font-semibold text-foreground">
                    Premium Domains Assessment
                  </h1>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <IconCrown className="w-16 h-16 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-4">
                Premium Domains Assessment
              </h1>
              <p className="text-muted-foreground mb-6">
                Select a domain, practice, or question from the navigation tree to get started.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const validQuestionIndex = Math.min(currentQuestionIndex, questions.length - 1);
  const currentQuestion = questions[validQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton variant="circular" width="3rem" height="3rem" className="mx-auto" />
          <Skeleton height="1.25rem" width="150px" className="mx-auto" />
        </div>
      </div>
    );
  }

  if (validQuestionIndex !== currentQuestionIndex) {
    setCurrentQuestionIndex(validQuestionIndex);
  }

  const questionKey = `${currentDomainId}:${currentPracticeId}:${currentQuestion.level}:${currentQuestion.stream}:${validQuestionIndex}`;
  const currentAnswer = answers[questionKey];
  const currentNote = notes[questionKey] || "";

  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(answers).filter((key) =>
    key.startsWith(`${currentDomainId}:${currentPracticeId}:`),
  ).length;
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-row-reverse">
      {/* Tree Navigation Sidebar */}
      <AssessmentTreeNavigation
        domains={progressData}
        currentDomainId={currentDomainId}
        currentPracticeId={currentPracticeId}
        currentQuestionIndex={currentQuestionIndex}
        onDomainClick={handleDomainClick}
        onPracticeClick={handlePracticeClick}
        onQuestionClick={handleQuestionClick}
        projectId={projectId}
        isPremium={isPremium}
        hidePremiumFeaturesButton={true}
        onFairnessBiasClick={() => {
          router.push(`/assess/${projectId}/fairness-bias/options`);
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-background border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/assess/${projectId}`)}
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <IconArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {currentPractice?.title || 'Loading...'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {domains.find(d => d.id === currentDomainId)?.title} • Question {validQuestionIndex + 1} of {totalQuestions}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {saving && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <IconDeviceFloppy className="w-4 h-4 animate-spin" />
                  Saving...
                </div>
              )}
              {submitting && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <IconDeviceFloppy className="w-4 h-4 animate-spin" />
                  Submitting...
                </div>
              )}
              <button
                onClick={handleSubmitProject}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Project
              </button>
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  Question {validQuestionIndex + 1} of {totalQuestions}
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

            {/* Question Card */}
            <motion.div
              key={validQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-card rounded-2xl shadow-lg border border-border p-8 mb-8"
            >
              <div className="mb-6">
                <div className="flex items-center gap-5 mb-4">
                  <div className="flex items-center gap-1">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground">
                      Level {currentQuestion.level}
                    </span>
                    <div className="relative group">
                      <IconInfoCircle size={16} className="cursor-pointer text-muted-foreground hover:text-foreground" />
                      <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block bg-popover text-popover-foreground text-xs rounded-md px-2 py-1 whitespace-nowrap border border-border shadow-md">
                        Represents the maturity stage of the AI practice — from basic (Level 1) to advanced (Level 3).
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground">
                      Stream {currentQuestion.stream}
                    </span>
                    <div className="relative group">
                      <IconInfoCircle size={16} className="cursor-pointer text-muted-foreground hover:text-foreground" />
                      <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block bg-popover text-popover-foreground text-xs rounded-md px-2 py-1 whitespace-nowrap border border-border shadow-md">
                        Each domain has two complementary streams: Stream A – Create & Promote and Stream B – Measure & Improve.
                      </span>
                    </div>
                  </div>
                </div>

                <h2 className="text-xl font-semibold text-foreground leading-relaxed">
                  {currentQuestion.question}
                </h2>
                {currentQuestion.description && (
                  <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/50 p-4 text-sm text-muted-foreground [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:mb-1 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_a]:text-primary [&_a]:underline [&_p]:mb-2 [&_p:last-child]:mb-0">
                    <div dangerouslySetInnerHTML={{ __html: safeRenderHTML(currentQuestion.description) }} />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {[
                  {
                    value: 0,
                    label: "No",
                    description: "Not implemented or not applicable",
                  },
                  {
                    value: 0.5,
                    label: "Partially",
                    description: "Partially implemented or in progress",
                  },
                  {
                    value: 1,
                    label: "Yes",
                    description: "Fully implemented and operational",
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${currentAnswer === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={option.value}
                      checked={currentAnswer === option.value}
                      onChange={() =>
                        handleAnswerChange(validQuestionIndex, option.value)
                      }
                      className="mt-1 w-4 h-4 text-primary bg-background border-border focus:ring-primary focus:ring-2"
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-foreground">
                        {option.label}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Notes Section */}
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-sm font-medium text-foreground mb-3">
                  Your Notes
                </h3>
                <SecureTextarea
                  value={currentNote}
                  onChange={(note) =>
                    handleNoteChange(validQuestionIndex, note)
                  }
                  onSave={(value) => handleNoteSave(validQuestionIndex, value)}
                  placeholder="Add your notes, reminders, or thoughts about this question..."
                  maxLength={5000}
                  className="w-full"
                />
              </div>
            </motion.div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePreviousQuestion}
                disabled={!hasPreviousQuestion}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-border text-foreground hover:bg-muted"
              >
                <IconArrowLeftIcon className="w-4 h-4" />
                Previous
              </button>

              <button
                onClick={handleNextQuestion}
                disabled={!hasNextQuestion}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Next
                <IconArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

