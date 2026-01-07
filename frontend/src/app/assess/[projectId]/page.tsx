"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { useRequireAuth } from "../../../hooks/useRequireAuth";
import {
  apiService,
  Domain as ApiDomain,
  Practice as ApiPractice,
  PracticeQuestionLevels,
  PracticeQuestionDetail,
} from "../../../lib/api";
import { showToast } from "../../../lib/toast";
import { PREMIUM_STATUS } from "../../../lib/constants";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  ArrowRight,
  ArrowLeft as ArrowLeftIcon,
  Info,
  AlertTriangle,
} from "lucide-react";
import AssessmentTreeNavigation from "../../../components/AssessmentTreeNavigation";
import { SecureTextarea } from "../../../components/SecureTextarea";
import { useAssessmentNavigation } from "../../../hooks/useAssessmentNavigation";
import { sanitizeNoteInput } from "../../../lib/sanitize";
import { usePracticeStore } from "../../../store/practiceStore";
import { useAssessmentResultsStore } from "../../../store/assessmentResultsStore";
import { usePriceStore } from "../../../store/priceStore";
import { AssessmentSkeleton, Skeleton } from "../../../components/Skeleton";
import { stripHTML } from "../../../lib/htmlUtils";
import { safeRenderHTML } from "../../../lib/htmlUtils";

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

const DOMAIN_PRIORITY = [
  { id: "responsible_ai_principles", title: "Responsible AI Principles" },
  { id: "governance", title: "Governance" },
  { id: "data_management", title: "Data Management" },
  { id: "privacy", title: "Privacy" },
  { id: "design", title: "Design" },
  { id: "implementation", title: "Implementation" },
  { id: "verification", title: "Verification" },
  { id: "operations", title: "Operations" },
];

const normalize = (value?: string) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const sortDomainsByPriority = (domains: DomainWithLevels[]) => {
  const originalOrderMap = new Map(domains.map((domain, index) => [domain.id, index]));

  const getPriority = (domain: DomainWithLevels) => {
    const normalizedId = normalize(domain.id);
    const normalizedTitle = normalize(domain.title);

    const idMatch = DOMAIN_PRIORITY.findIndex(
      (entry) => normalize(entry.id) === normalizedId,
    );
    if (idMatch !== -1) return idMatch;

    const titleMatch = DOMAIN_PRIORITY.findIndex(
      (entry) => normalize(entry.title) === normalizedTitle,
    );
    if (titleMatch !== -1) return titleMatch;

    return DOMAIN_PRIORITY.length + (originalOrderMap.get(domain.id) ?? 0);
  };

  return [...domains].sort((a, b) => {
    const priorityA = getPriority(a);
    const priorityB = getPriority(b);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return (originalOrderMap.get(a.id) ?? 0) - (originalOrderMap.get(b.id) ?? 0);
  });
};

export default function AssessmentPage() {
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
  const [loadingPractice, setLoadingPractice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionPhase, setSubmissionPhase] = useState<'saving-notes' | 'submitting' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projectNotFound, setProjectNotFound] = useState(false);

  const isPremium = user?.subscription_status ? PREMIUM_STATUS.includes(user.subscription_status as typeof PREMIUM_STATUS[number]) : false;

  const { 
    getProjectState,
    setProjectState,
    clearProjectState,
  } = usePracticeStore();

  const { setProjectResults } = useAssessmentResultsStore();

  const { fetched, setPrices, setPriceLoading, setFetched } = usePriceStore();

  const projectState = getProjectState(projectId);
  const practice = projectState?.practice || null;
  const currentDomainId = projectState?.currentDomainId || '';
  const currentPracticeId = projectState?.currentPracticeId || '';
  const currentQuestionIndex = projectState?.currentQuestionIndex || 0;

  useEffect(() => {
    const BASIC_PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ID_BASIC || "";
    const PRO_PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ID_PRO || "";

    if (fetched || !BASIC_PRICE_ID || !PRO_PRICE_ID) {
      return;
    }

    const token = typeof window !== "undefined"
      ? localStorage.getItem("auth_token")
      : null;

    if (!token) {
      return;
    }

    const fetchPrices = async () => {
      setPriceLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/subscriptions/prices`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            priceIds: [BASIC_PRICE_ID, PRO_PRICE_ID]
          })
        });

        if (response.ok) {
          const data = await response.json();
          setPrices({
            basic: data.prices[BASIC_PRICE_ID] || null,
            pro: data.prices[PRO_PRICE_ID] || null
          });
          setFetched(true);
        } else {
          setPrices({ basic: 29, pro: 49 });
          setFetched(true);
        }
      } catch (error) {
        console.error('Error fetching prices:', error);
        setPrices({ basic: 29, pro: 49 });
        setFetched(true);
      } finally {
        setPriceLoading(false);
      }
    };

    fetchPrices();
  }, [fetched, setPrices, setLoading, setFetched]);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading || !isAuthenticated) {
      return;
    }

    const fetchData = async () => {
      try {
        setError(null);
        setProjectNotFound(false);
        setLoading(true);
        
        const domainsData = await apiService.getDomainsFull(projectId);

        // Check if domains array is empty or null
        if (!domainsData.domains || domainsData.domains.length === 0) {
          setError("No domains data available");
          setLoading(false);
          return;
        }

        const nonPremiumDomains = domainsData.domains.filter(
          (domain) => domain.is_premium === false
        );

        // Check if there are any non-premium domains after filtering
        if (nonPremiumDomains.length === 0) {
          setError("No non-premium domains available");
          setLoading(false);
          return;
        }

        // Transform domains - questions are now included in the response
        const transformedDomains = nonPremiumDomains.map((domain) => {
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

        const orderedDomains = sortDomainsByPriority(transformedDomains);
        setDomains(orderedDomains);

        const savedState = getProjectState(projectId);
        let targetDomainId = savedState?.currentDomainId || '';
        let targetPracticeId = savedState?.currentPracticeId || '';
        let targetQuestionIndex = savedState?.currentQuestionIndex || 0;

        // Check if saved domain exists in filtered non-premium domains
        // If not, reset to first available domain (in case saved domain was premium)
        if (targetDomainId) {
          const savedDomainExists = orderedDomains.find(d => d.id === targetDomainId);
          if (!savedDomainExists) {
            // Saved domain was premium or doesn't exist, reset to first non-premium domain
            targetDomainId = '';
            targetPracticeId = '';
            targetQuestionIndex = 0;
          }
        }

        if (!targetDomainId || !targetPracticeId) {
          if (orderedDomains.length > 0) {
            const firstDomain = orderedDomains[0];
            const firstPracticeId = Object.keys(firstDomain.practices)[0];
            if (firstPracticeId) {
              targetDomainId = firstDomain.id;
              targetPracticeId = firstPracticeId;
              targetQuestionIndex = 0;
            }
          }
        }

        if (targetDomainId && targetPracticeId) {
          const targetDomain = orderedDomains.find(d => d.id === targetDomainId);
          const targetPractice = targetDomain?.practices[targetPracticeId];
          
          if (targetPractice && targetPractice.levels && Object.keys(targetPractice.levels).length > 0) {
            const questionsList: Question[] = [];
            Object.entries(targetPractice.levels).forEach(([level, streams]) => {
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
            
            const validIndex = Math.min(targetQuestionIndex, Math.max(0, questionsList.length - 1));
            
            setProjectState(projectId, {
              currentDomainId: targetDomainId,
              currentPracticeId: targetPracticeId,
              currentQuestionIndex: validIndex,
              practice: {
                title: targetPractice.title,
                description: targetPractice.description,
                levels: targetPractice.levels,
              },
            });
          } else {
            // No questions available (premium or error)
            setQuestions([]);
            setProjectState(projectId, {
              currentDomainId: targetDomainId,
              currentPracticeId: targetPracticeId,
              currentQuestionIndex: 0,
              practice: null,
            });
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
      } catch (error: any) {
        console.error("Failed to fetch data:", error);
        
        // Check if it's a 400 or 404 error (project not found or invalid project ID)
        if (error?.status === 400 || error?.status === 404 || 
            error?.response?.status === 400 || error?.response?.status === 404) {
          setProjectNotFound(true);
          setError("No domains available for this project");
        } else {
          setError(error?.message || "Failed to load assessment data. Please refresh the page.");
          showToast.error("Failed to load assessment data. Please refresh the page.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, isAuthenticated, authLoading, router]);

useEffect(() => {
  if (!loading && domains.length > 0 && currentDomainId && currentPracticeId) {
    const domain = domains.find(d => d.id === currentDomainId);
    const currentPractice = domain?.practices[currentPracticeId];
    
    if (currentPractice && currentPractice.levels && Object.keys(currentPractice.levels).length > 0) {
      const questionsList: Question[] = [];
      Object.entries(currentPractice.levels).forEach(([level, streams]) => {
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
      
      if (questionsList.length > 0) {
        const validIndex = Math.min(currentQuestionIndex, questionsList.length - 1);
        if (validIndex !== currentQuestionIndex) {
          setProjectState(projectId, {
            currentQuestionIndex: validIndex,
          });
        }
      }
      
      if (!practice || practice.title !== currentPractice.title) {
        setProjectState(projectId, {
          practice: {
            title: currentPractice.title,
            description: currentPractice.description,
            levels: currentPractice.levels,
          },
        });
      }
    } else {
      setQuestions([]);
      if (currentPractice) {
        setProjectState(projectId, {
          practice: {
            title: currentPractice.title,
            description: currentPractice.description,
            levels: {},
          },
        });
      } else {
        setProjectState(projectId, {
          practice: null,
        });
      }
    }
  }
}, [loading, domains, currentDomainId, currentPracticeId, currentQuestionIndex, projectId, setProjectState, practice]);

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

  // Save all notes with user feedback
  const saveAllNotes = async (isSubmitting: boolean = false): Promise<void> => {
    const noteEntries = Object.entries(notes).filter(([_, note]) => note.trim());
    
    if (noteEntries.length === 0) {
      return;
    }

    // Show loading toast
    const toastMessage = isSubmitting 
      ? "Saving notes and submitting..." 
      : "Saving notes...";
    const toastId = showToast.loading(toastMessage);

    // Save all notes in parallel
    const savePromises = noteEntries.map(async ([key, note]) => {
      try {
        const [domainId, practiceId, level, stream, questionIndexStr] = key.split(":");
        const questionIndex = parseInt(questionIndexStr, 10);
        
        if (!domainId || !practiceId || !level || !stream || isNaN(questionIndex)) {
          console.warn(`Invalid note key format: ${key}`);
          return { success: false, key, error: "Invalid key format" };
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
        
        return { success: true, key };
      } catch (error) {
        console.error(`Failed to save note for key ${key}:`, error);
        return { success: false, key, error };
      }
    });

    // Wait for all saves to complete and collect results
    const results = await Promise.allSettled(savePromises);
    
    // Dismiss loading toast
    showToast.dismiss(toastId);

    // Check for failures (both rejected promises and failed saves)
    const failures = results.filter((result) => {
      if (result.status === "rejected") return true;
      if (result.status === "fulfilled") {
        const value = result.value;
        return value && !value.success;
      }
      return false;
    });

    if (failures.length > 0) {
      const failureCount = failures.length;
      const totalCount = results.length;
      showToast.error(
        `Failed to save ${failureCount} of ${totalCount} note${totalCount > 1 ? "s" : ""}. Please try again.`
      );
    }

    // Ensure function resolves after all saves complete
    return;
  };

  const handleDomainClick = (domainId: string) => {
    const domain = domains.find((d) => d.id === domainId);
    if (domain) {
      const firstPracticeId = Object.keys(domain.practices)[0];
      if (firstPracticeId) {
        const firstPractice = domain.practices[firstPracticeId];
        
        setProjectState(projectId, {
          currentDomainId: domainId,
          currentPracticeId: firstPracticeId,
          currentQuestionIndex: 0,
          practice: {
            title: firstPractice.title,
            description: firstPractice.description,
            levels: firstPractice.levels,
          },
        });
      }
    }
    navigateToDomain(domainId);
  };

  const handlePracticeClick = (domainId: string, practiceId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (domain && domain.practices[practiceId]) {
      const selectedPractice = domain.practices[practiceId];
      
      navigateToPractice(domainId, practiceId);
      
      setProjectState(projectId, {
        currentDomainId: domainId,
        currentPracticeId: practiceId,
        currentQuestionIndex: 0,
        practice: {
          title: selectedPractice.title,
          description: selectedPractice.description,
          levels: selectedPractice.levels,
        },
      });
    }
  };

  const handleQuestionClick = (domainId: string, practiceId: string, questionIndex: number) => {
    const domain = domains.find(d => d.id === domainId);
    if (domain && domain.practices[practiceId]) {
      const selectedPractice = domain.practices[practiceId];
      
      setProjectState(projectId, {
        currentDomainId: domainId,
        currentPracticeId: practiceId,
        currentQuestionIndex: questionIndex,
        practice: {
          title: selectedPractice.title,
          description: selectedPractice.description,
          levels: selectedPractice.levels,
        },
      });
    }
  };

  const getPracticeData = (domainId: string, practiceId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (domain && domain.practices[practiceId]) {
      const selectedPractice = domain.practices[practiceId];
      return {
        practice: {
          title: selectedPractice.title,
          description: selectedPractice.description,
          levels: selectedPractice.levels,
        },
      };
    }
    return { practice: null };
  };

  const handleNextQuestion = () => {
    const next = getNextQuestion();
    if (next) {
      const isMovingToDifferentDomain = next.domainId !== currentDomainId;
      const isMovingToDifferentPractice = next.practiceId !== currentPracticeId;
      
      if (isMovingToDifferentDomain || isMovingToDifferentPractice) {
        const practiceData = getPracticeData(next.domainId, next.practiceId);
        
        setProjectState(projectId, {
          currentDomainId: next.domainId,
          currentPracticeId: next.practiceId,
          currentQuestionIndex: next.questionIndex,
          ...practiceData,
        });
      } else {
        setProjectState(projectId, {
          currentDomainId: next.domainId,
          currentPracticeId: next.practiceId,
          currentQuestionIndex: next.questionIndex,
        });
      }
    }
  };

  const handlePreviousQuestion = () => {
    const prev = getPreviousQuestion();
    if (prev) {
      const isMovingToDifferentDomain = prev.domainId !== currentDomainId;
      const isMovingToDifferentPractice = prev.practiceId !== currentPracticeId;
      
      if (isMovingToDifferentDomain || isMovingToDifferentPractice) {
        const practiceData = getPracticeData(prev.domainId, prev.practiceId);
        
        setProjectState(projectId, {
          currentDomainId: prev.domainId,
          currentPracticeId: prev.practiceId,
          currentQuestionIndex: prev.questionIndex,
          ...practiceData,
        });
      } else {
        setProjectState(projectId, {
          currentDomainId: prev.domainId,
          currentPracticeId: prev.practiceId,
          currentQuestionIndex: prev.questionIndex,
        });
      }
    }
  };

  const hasNextQuestion = getNextQuestion() !== null;
  const hasPreviousQuestion = getPreviousQuestion() !== null;


  const handleSubmitProject = async () => {
    setSubmitting(true);
    try {
      // Save all notes before submitting (with user feedback)
      setSubmissionPhase('saving-notes');
      await saveAllNotes(true);
      
      // Now submit the project
      setSubmissionPhase('submitting');
      const response = await apiService.submitProject(projectId);
      
      setProjectResults(projectId, response.project, response.results);
      router.push(`/score-report-aima?projectId=${projectId}`);
    } catch (error) {
      console.error("Failed to submit project:", error);
      showToast.error("Failed to submit assessment. Please try again.");
    } finally {
      setSubmitting(false);
      setSubmissionPhase(null);
    }
  };

  // Show loading state
  if (loading) {
    return <AssessmentSkeleton />;
  }

  // Show project not found error (400/404)
  if (projectNotFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Project Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            No domains available for this project.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show error if there's an error and no domains (generic error)
  if (error && domains.length === 0 && !projectNotFound && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Unable to Load Assessment
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                window.location.reload();
              }}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
            >
              Retry
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show no domains data available (empty domains array)
  if (domains.length === 0 && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 max-w-lg w-full text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Assessment Data Available
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            No domains data available
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading skeleton if no practice or questions (but domains exist)
  if (!practice || questions.length === 0) {
    // Only show skeleton if we have domains but no practice yet (still loading)
    if (domains.length > 0 && currentDomainId && currentPracticeId) {
      return <AssessmentSkeleton />;
    }
    return <AssessmentSkeleton />;
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
    setProjectState(projectId, {
      currentQuestionIndex: validQuestionIndex,
    });
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
    <>
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
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* HEADER + Premium Button */}
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
                  {practice?.title || 'Loading...'}
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
                onClick={handleSubmitProject}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-700 hover:to-violet-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {submissionPhase === 'saving-notes' 
                      ? 'Saving notes...' 
                      : submissionPhase === 'submitting'
                      ? 'Submitting assessment...'
                      : 'Processing...'}
                  </>
                ) : (
                  <>
                    Submit Project
                  </>
                )}
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
    </>
  );
}
