"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  apiService,
  Domain as ApiDomain,
  Practice as ApiPractice,
} from "../../../../lib/api";
import { showToast } from "../../../../lib/toast";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  ArrowRight,
  ArrowLeft as ArrowLeftIcon,
  Info,
  Crown,
  Scale,
} from "lucide-react";
import AssessmentTreeNavigation from "../../../../components/AssessmentTreeNavigation";
import { SecureTextarea } from "../../../../components/SecureTextarea";
import { useAssessmentNavigation } from "../../../../hooks/useAssessmentNavigation";
import { sanitizeNoteInput } from "../../../../lib/sanitize";
import { AssessmentSkeleton, Skeleton } from "../../../../components/Skeleton";
import { stripHTML } from "../../../../lib/htmlUtils";
import { safeRenderHTML } from "../../../../lib/htmlUtils";

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

interface DomainWithLevels extends Omit<ApiDomain, "practices"> {
  practices: { [key: string]: PracticeWithLevels };
}

export default function PremiumDomainsPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user, loading: userLoading } = useAuth();
  const projectId = params.projectId as string;

  const [domains, setDomains] = useState<DomainWithLevels[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingPractice, setLoadingPractice] = useState<string | null>(null); // Track which practice is loading
  const [saving, setSaving] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [currentDomainId, setCurrentDomainId] = useState<string>("");
  const [currentPracticeId, setCurrentPracticeId] = useState<string>("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [currentPractice, setCurrentPractice] = useState<{ title: string; description: string } | null>(null);

  const PREMIUM_STATUS = ["basic_premium", "pro_premium"];
  const isPremium = user?.subscription_status ? PREMIUM_STATUS.includes(user.subscription_status) : false;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    if (!isPremium) {
      showToast.error("Premium subscription required to access premium domains.");
      router.push(`/assess/${projectId}`);
      return;
    }

    const fetchData = async () => {
      try {
        const domainsData = await apiService.getDomainsFull(projectId);

        const premiumDomains = domainsData.domains.filter(
          (domain) => domain.is_premium === true
        );

        if (premiumDomains.length === 0) {
          showToast.info("No premium domains available.");
          setLoading(false);
          return;
        }

        const transformedDomains = premiumDomains.map((domain) => {
          const practicesWithLevels: { [key: string]: PracticeWithLevels } = {};
          
          Object.entries(domain.practices).forEach(([practiceId, practice]) => {
            practicesWithLevels[practiceId] = {
              ...practice,
              levels: {},
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
  }, [projectId, isAuthenticated, router, isPremium]);

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
          setLoadingPractice(currentPracticeId);
          apiService.getPracticeQuestions(currentDomainId, currentPracticeId, projectId)
            .then((practiceData) => {
              setDomains(prevDomains => 
                prevDomains.map(d => {
                  if (d.id === currentDomainId && d.practices[currentPracticeId]) {
                    return {
                      ...d,
                      practices: {
                        ...d.practices,
                        [currentPracticeId]: {
                          ...d.practices[currentPracticeId],
                          levels: practiceData.levels,
                        },
                      },
                    };
                  }
                  return d;
                })
              );
              
              const questionsList: Question[] = [];
              Object.entries(practiceData.levels).forEach(([level, streams]) => {
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
              setCurrentPractice({
                title: practiceData.title,
                description: practiceData.description,
              });
              
              if (questionsList.length > 0) {
                const validIndex = Math.min(currentQuestionIndex, questionsList.length - 1);
                if (validIndex !== currentQuestionIndex) {
                  setCurrentQuestionIndex(validIndex);
                }
              } else {
                setCurrentQuestionIndex(0);
              }
            })
            .catch((error: any) => {
              console.error(`Failed to load practice ${currentPracticeId}:`, error);
              setQuestions([]);
              setCurrentPractice({
                title: practice.title,
                description: practice.description,
              });
            })
            .finally(() => {
              setLoadingPractice(null);
            });
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

  const handleNoteSave = async (questionIndex: number) => {
    const question = questions[questionIndex];
    if (!question) {
      console.error(`Question at index ${questionIndex} not found`);
      return;
    }
    const key = `${currentDomainId}:${currentPracticeId}:${question.level}:${question.stream}:${questionIndex}`;
    const note = notes[key] || "";

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

  if (domains.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No Premium Domains Available
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            There are no premium domains available at this time.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => router.push(`/assess/${projectId}`)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl font-semibold transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Assessment
            </button>
            <button
              onClick={() => router.push(`/assess/${projectId}/fairness-bias/options`)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl font-semibold transition-all duration-300"
            >
              <Scale className="w-4 h-4" />
              Fairness & Bias Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentPractice || questions.length === 0) {
    return (
      <div className="min-h-screen flex">
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
        />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push(`/assess/${projectId}`)}
                  className="flex items-center gap-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Premium Domains Assessment
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push(`/assess/${projectId}/fairness-bias/options`)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-700 hover:to-violet-700 transition-all duration-200"
                >
                  <Scale className="w-4 h-4" />
                  Fairness & Bias Test
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Crown className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Premium Domains Assessment
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
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
    <div className="min-h-screen flex">
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
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/assess/${projectId}`)}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentPractice?.title || 'Loading...'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {domains.find(d => d.id === currentDomainId)?.title} • Question {validQuestionIndex + 1} of {totalQuestions}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {saving && (
                <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                  <Save className="w-4 h-4 animate-spin" />
                  Saving...
                </div>
              )}
              <button
                onClick={() => router.push(`/assess/${projectId}/fairness-bias/options`)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-700 hover:to-violet-700 transition-all duration-200"
              >
                <Scale className="w-4 h-4" />
                Fairness & Bias Test
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
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Question {validQuestionIndex + 1} of {totalQuestions}
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
            <motion.div
              key={validQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 mb-8"
            >
              <div className="mb-6">
                <div className="flex items-center gap-5 mb-4">
                  <div className="flex items-center gap-1">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      Level {currentQuestion.level}
                    </span>
                    <div className="relative group">
                      <Info size={16} className="cursor-pointer text-gray-500 hover:text-gray-700" />
                      <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block bg-black text-white text-xs rounded-md px-2 py-1 whitespace-nowrap">
                        Represents the maturity stage of the AI practice — from basic (Level 1) to advanced (Level 3).
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      Stream {currentQuestion.stream}
                    </span>
                    <div className="relative group">
                      <Info size={16} className="cursor-pointer text-gray-500 hover:text-gray-700" />
                      <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block bg-black text-white text-xs rounded-md px-2 py-1 whitespace-nowrap">
                        Each domain has two complementary streams: Stream A – Create & Promote and Stream B – Measure & Improve.
                      </span>
                    </div>
                  </div>
                </div>

                <h2 className="text-xl font-semibold text-gray-900 dark:text-white leading-relaxed">
                  {currentQuestion.question}
                </h2>
                {currentQuestion.description && (
                  <div className="mt-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-600 dark:bg-gray-700/40 dark:text-gray-200 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:mb-1 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_a]:text-purple-600 [&_a]:underline [&_p]:mb-2 [&_p:last-child]:mb-0">
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
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                      className="mt-1 w-4 h-4 text-purple-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:ring-2"
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {option.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Notes Section */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Your Notes
                </h3>
                <SecureTextarea
                  value={currentNote}
                  onChange={(note) =>
                    handleNoteChange(validQuestionIndex, note)
                  }
                  onSave={() => handleNoteSave(validQuestionIndex)}
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
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Previous
              </button>

              <button
                onClick={handleNextQuestion}
                disabled={!hasNextQuestion}
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

