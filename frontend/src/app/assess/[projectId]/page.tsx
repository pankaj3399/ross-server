"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import {
  apiService,
  Domain as ApiDomain,
  Practice as ApiPractice,
} from "../../../lib/api";
import { showToast } from "../../../lib/toast";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  ArrowRight,
  ArrowLeft as ArrowLeftIcon,
  Info,
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
  const projectId = params.projectId as string;

  const [domains, setDomains] = useState<DomainWithLevels[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const PREMIUM_STATUS = ["basic_premium", "pro_premium"];
  const isPremium = user?.subscription_status ? PREMIUM_STATUS.includes(user.subscription_status) : false;

  // Use Zustand store for project-specific state
  const { 
    getProjectState,
    setProjectState,
    clearProjectState,
  } = usePracticeStore();

  // Use assessment results store
  const { setProjectResults } = useAssessmentResultsStore();

  // Use price store to pre-load prices
  const { prices, fetched, setPrices, setPriceLoading, setFetched } = usePriceStore();

  // Get current project state
  const projectState = getProjectState(projectId);
  const practice = projectState?.practice || null;
  const currentDomainId = projectState?.currentDomainId || '';
  const currentPracticeId = projectState?.currentPracticeId || '';
  const currentQuestionIndex = projectState?.currentQuestionIndex || 0;

  // Pre-load prices when assessment page loads
  useEffect(() => {
    const BASIC_PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ID_BASIC || "";
    const PRO_PRICE_ID = process.env.NEXT_PUBLIC_PRICE_ID_PRO || "";

    // Only fetch if not already fetched
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
          // Fallback to hardcoded values if API fails
          setPrices({ basic: 29, pro: 49 });
          setFetched(true);
        }
      } catch (error) {
        console.error('Error fetching prices:', error);
        // Fallback to hardcoded values if API fails
        setPrices({ basic: 29, pro: 49 });
        setFetched(true);
      } finally {
        setPriceLoading(false);
      }
    };

    fetchPrices();
  }, [fetched, setPrices, setLoading, setFetched]);

  // Load domains and initial data
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    // No need to clear store - each project has its own state

    const fetchData = async () => {
      try {
        // Fetch domains - only get the list, not all practice details
        const domainsData = await apiService.getDomains(projectId);

        // Transform API data - PRE-LOAD all practice questions upfront
        const transformedDomains = await Promise.all(
          domainsData.domains.map(async (domain) => {
            try {
              const domainDetails = await apiService.getDomain(domain.id, projectId);

              // Pre-load all practice questions for all practices in this domain
              const practicesWithLevels: { [key: string]: PracticeWithLevels } =
                {};
              for (const [practiceId, practice] of Object.entries(
                domainDetails.practices,
              )) {
                try {
                  // Load practice questions immediately
                  const practiceData = await apiService.getPracticeQuestions(
                    domain.id,
                    practiceId,
                    projectId,
                  );
                  practicesWithLevels[practiceId] = {
                    ...practice,
                    levels: practiceData.levels, // Pre-loaded with all questions
                  };
                } catch (error: any) {
                  console.error(`Failed to load practice ${practiceId}:`, error);
                  // If it's a premium error, still store the practice but with empty levels
                  if (error?.status === 403 || error?.message?.includes("Premium")) {
                    practicesWithLevels[practiceId] = {
                      ...practice,
                      levels: {}, // Empty for premium practices
                    };
                  } else {
                    // For other errors, store with empty levels
                    practicesWithLevels[practiceId] = {
                      ...practice,
                      levels: {},
                    };
                  }
                }
              }

              return {
                id: domain.id,
                title: domain.title,
                description: domain.description,
                practices: practicesWithLevels,
              };
            } catch (error) {
              console.error(`Failed to load domain ${domain.id}:`, error);
              // Return domain with empty practices if it fails
              return {
                id: domain.id,
                title: domain.title,
                description: domain.description || "",
                practices: {},
              };
            }
          }),
        );

        const orderedDomains = sortDomainsByPriority(transformedDomains);
        setDomains(orderedDomains);

        // Only set initial domain and practice if we don't have existing state for this project
        if (orderedDomains.length > 0 && !projectState) {
          const firstDomain = orderedDomains[0];
          const firstPracticeId = Object.keys(firstDomain.practices)[0];
          if (firstPracticeId) {
            const firstPractice = firstDomain.practices[firstPracticeId];
            // Set practice data from pre-loaded data
            setProjectState(projectId, {
              currentDomainId: firstDomain.id,
              currentPracticeId: firstPracticeId,
              currentQuestionIndex: 0,
              practice: firstPractice.levels ? {
                title: firstPractice.title,
                description: firstPractice.description,
                levels: firstPractice.levels,
              } : null,
            });
          }
        }

        // Load existing answers
        try {
          const answersData = await apiService.getAnswers(projectId);

          // Make a map from the answers object
          const answersMap: Record<string, number> = {};

          if (answersData && answersData.answers) {
            Object.entries(answersData.answers).forEach(([key, value]) => {
              answersMap[key] = value as number;
            });
          }

          setAnswers(answersMap);
        } catch (error) {
          console.error("Failed to load answers:", error);
          // Continue even if answers fail to load
        }

        // Load existing notes
        try {
          const notesData = await apiService.getQuestionNotes(projectId);
          const notesMap: Record<string, string> = {};
          notesData.forEach((note: any) => {
            const key = `${note.domain_id}:${note.practice_id}:${note.level}:${note.stream}:${note.question_index}`;
            notesMap[key] = note.note;
          });
          setNotes(notesMap);
        } catch (error) {
          console.error("Failed to load notes:", error);
          // Continue even if notes fail to load
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        showToast.error("Failed to load assessment data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

  fetchData();
}, [projectId, isAuthenticated, router]);

// Resume from Zustand store after data is loaded and update questions when practice changes
useEffect(() => {
  if (!loading && domains.length > 0) {
    // Check if we have navigation state for this project
    if (currentDomainId && currentPracticeId) {
      // Check if the current practice is still valid (domain and practice exist)
      const domain = domains.find(d => d.id === currentDomainId);
      if (domain && domain.practices[currentPracticeId]) {
        const currentPractice = domain.practices[currentPracticeId];
        
        // If practice has levels (pre-loaded), use them directly
        if (currentPractice.levels && Object.keys(currentPractice.levels).length > 0) {
          // Update practice in store if not already set
          if (!practice || practice.title !== currentPractice.title) {
            setProjectState(projectId, {
              practice: {
                title: currentPractice.title,
                description: currentPractice.description,
                levels: currentPractice.levels,
              },
            });
          }
          
          // Flatten questions from levels
          const questionsList: Question[] = [];
          Object.entries(currentPractice.levels).forEach(([level, streams]) => {
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
          
          // Validate and adjust currentQuestionIndex if out of bounds
          if (questionsList.length > 0) {
            const validIndex = Math.min(currentQuestionIndex, questionsList.length - 1);
            if (validIndex !== currentQuestionIndex) {
              setProjectState(projectId, {
                currentQuestionIndex: validIndex,
              });
            }
          } else {
            // No questions available, reset index
            setProjectState(projectId, {
              currentQuestionIndex: 0,
            });
          }
        } else {
          // Practice has no levels (premium or error case)
          setQuestions([]);
          setProjectState(projectId, {
            practice: null,
            currentQuestionIndex: 0,
          });
        }
      } else {
        // Clear invalid state for this project
        setProjectState(projectId, {
          currentDomainId: '',
          currentPracticeId: '',
          currentQuestionIndex: 0,
          practice: null,
        });
        setQuestions([]);
      }
    }
  }
}, [loading, domains, currentDomainId, currentPracticeId, projectId, setProjectState, practice]);

  // Use assessment navigation hook
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

    // Save to backend
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
      
      // Position is managed by Zustand store
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
      // Sanitize the note before saving
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
        const firstPractice = domain.practices[firstPracticeId];
        
        // If practice has levels (pre-loaded), use them directly
        if (firstPractice.levels && Object.keys(firstPractice.levels).length > 0) {
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
          
          // Flatten questions from levels
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
        } else {
          // Practice has no levels (premium or error case)
          setProjectState(projectId, {
            currentDomainId: domainId,
            currentPracticeId: firstPracticeId,
            currentQuestionIndex: 0,
            practice: null,
          });
          setQuestions([]);
        }
      }
      
      // Navigate to domain
    }
    navigateToDomain(domainId);
  };

  const handlePracticeClick = (domainId: string, practiceId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (domain && domain.practices[practiceId]) {
      const selectedPractice = domain.practices[practiceId];
      
      // If practice has levels (pre-loaded), use them directly
      if (selectedPractice.levels && Object.keys(selectedPractice.levels).length > 0) {
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
        
        // Flatten questions from levels
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
      } else {
        // Practice has no levels (premium or error case)
        setProjectState(projectId, {
          currentDomainId: domainId,
          currentPracticeId: practiceId,
          currentQuestionIndex: 0,
          practice: null,
        });
        setQuestions([]);
        showToast.error("This practice requires a premium subscription or could not be loaded.");
      }
    }
    
    // Navigate to practice
    navigateToPractice(domainId, practiceId);
  };

  const handleQuestionClick = (domainId: string, practiceId: string, questionIndex: number) => {
    const domain = domains.find(d => d.id === domainId);
    if (domain && domain.practices[practiceId]) {
      const selectedPractice = domain.practices[practiceId];
      
      // If practice has levels (pre-loaded), use them directly
      if (selectedPractice.levels && Object.keys(selectedPractice.levels).length > 0) {
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
        
        // Flatten questions from levels if not already loaded
        if (currentDomainId !== domainId || currentPracticeId !== practiceId || questions.length === 0) {
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
        }
      }
    }
    
    // Navigate to question
  };

  // Helper function to load questions from pre-loaded practice data
  const loadQuestionsFromPractice = (domainId: string, practiceId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (domain && domain.practices[practiceId]) {
      const selectedPractice = domain.practices[practiceId];
      
      // If practice has levels (pre-loaded), use them directly
      if (selectedPractice.levels && Object.keys(selectedPractice.levels).length > 0) {
        // Flatten questions from levels
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
        
        return {
          practice: {
            title: selectedPractice.title,
            description: selectedPractice.description,
            levels: selectedPractice.levels,
          },
        };
      } else {
        // Practice has no levels (premium or error case)
        setQuestions([]);
        return {
          practice: null,
        };
      }
    }
    return { practice: null };
  };

  const handleNextQuestion = () => {
    const next = getNextQuestion();
    if (next) {
      // Check if we're moving to a different domain or practice
      const isMovingToDifferentDomain = next.domainId !== currentDomainId;
      const isMovingToDifferentPractice = next.practiceId !== currentPracticeId;
      
      if (isMovingToDifferentDomain || isMovingToDifferentPractice) {
        // Load questions from pre-loaded practice data
        const practiceData = loadQuestionsFromPractice(next.domainId, next.practiceId);
        
        // Add a small delay for smooth transition
        setTimeout(() => {
          setProjectState(projectId, {
            currentDomainId: next.domainId,
            currentPracticeId: next.practiceId,
            currentQuestionIndex: next.questionIndex,
            ...practiceData,
          });
          
          // Position updated in Zustand
        }, 100);
      } else {
        setProjectState(projectId, {
          currentDomainId: next.domainId,
          currentPracticeId: next.practiceId,
          currentQuestionIndex: next.questionIndex,
        });
        
        // Position updated in Zustand
      }
    }
  };

  const handlePreviousQuestion = () => {
    const prev = getPreviousQuestion();
    if (prev) {
      // Check if we're moving to a different domain or practice
      const isMovingToDifferentDomain = prev.domainId !== currentDomainId;
      const isMovingToDifferentPractice = prev.practiceId !== currentPracticeId;
      
      if (isMovingToDifferentDomain || isMovingToDifferentPractice) {
        // Load questions from pre-loaded practice data
        const practiceData = loadQuestionsFromPractice(prev.domainId, prev.practiceId);
        
        setTimeout(() => {
          setProjectState(projectId, {
            currentDomainId: prev.domainId,
            currentPracticeId: prev.practiceId,
            currentQuestionIndex: prev.questionIndex,
            ...practiceData,
          });
          
          // Position updated in Zustand
        }, 100);
      } else {
        setProjectState(projectId, {
          currentDomainId: prev.domainId,
          currentPracticeId: prev.practiceId,
          currentQuestionIndex: prev.questionIndex,
        });
        
        // Position updated in Zustand
      }
    }
  };

  // Check if there's a next/previous question available globally
  const hasNextQuestion = getNextQuestion() !== null;
  const hasPreviousQuestion = getPreviousQuestion() !== null;

  const handleStartAssessment = () => {
    // Start with the first domain and first practice
    const firstDomain = domains[0];
    if (firstDomain) {
      const firstPracticeId = Object.keys(firstDomain.practices)[0];
      if (firstPracticeId) {
        const firstPractice = firstDomain.practices[firstPracticeId];
        
        // If practice has levels (pre-loaded), use them directly
        if (firstPractice.levels && Object.keys(firstPractice.levels).length > 0) {
          setProjectState(projectId, {
            currentDomainId: firstDomain.id,
            currentPracticeId: firstPracticeId,
            currentQuestionIndex: 0,
            practice: {
              title: firstPractice.title,
              description: firstPractice.description,
              levels: firstPractice.levels,
            },
          });
          
          // Flatten questions from levels
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
        } else {
          setProjectState(projectId, {
            currentDomainId: firstDomain.id,
            currentPracticeId: firstPracticeId,
            currentQuestionIndex: 0,
            practice: null,
          });
          setQuestions([]);
        }
      }
      
      // Starting assessment
    }
  };

  const handleSubmitProject = async () => {
    setSubmitting(true);
    try {
      const response = await apiService.submitProject(projectId);
      
      // Store the results in Zustand store
      setProjectResults(projectId, response.project, response.results);
      router.push(`/score-report?projectId=${projectId}`);
    } catch (error) {
      console.error("Failed to submit project:", error);
      showToast.error("Failed to submit assessment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <AssessmentSkeleton />;
  }

  // If we have practice and questions loaded, show the assessment
  if (!practice || questions.length === 0) {
    // No practice loaded yet or failed to load - show overview
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Assessment Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Ready to measure your AI maturity? Let's get started.
          </p>
          
          {domains.length > 0 && (
            <button
              onClick={handleStartAssessment}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
            >
              Start Assessment
            </button>
          )}
        </div>
      </div>
    );
  }

  // Validate currentQuestionIndex is within bounds
  const validQuestionIndex = Math.min(currentQuestionIndex, questions.length - 1);
  const currentQuestion = questions[validQuestionIndex];
  
  // Guard against undefined currentQuestion (shouldn't happen if questions.length > 0, but safety check)
  if (!currentQuestion) {
    // If no question is available, show loading or return early
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton variant="circular" width="3rem" height="3rem" className="mx-auto" />
          <Skeleton height="1.25rem" width="150px" className="mx-auto" />
        </div>
      </div>
    );
  }

  // Update index if it was out of bounds
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
        onFairnessBiasClick={() => {
          router.push(`/assess/${projectId}/fairness-bias/options`);
        }}
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
                    Submitting...
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
    </>
  );
}
