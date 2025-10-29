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

interface Question {
  level: string;
  stream: string;
  question: string;
}

interface PracticeWithLevels extends ApiPractice {
  levels: {
    [level: string]: {
      [stream: string]: string[];
    };
  };
}

interface DomainWithLevels extends Omit<ApiDomain, "practices"> {
  practices: { [key: string]: PracticeWithLevels };
}

export default function AssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const projectId = params.projectId as string;

  const [domains, setDomains] = useState<DomainWithLevels[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Use Zustand store for project-specific state
  const { 
    getProjectState,
    setProjectState,
    clearProjectState,
  } = usePracticeStore();

  // Use assessment results store
  const { setProjectResults } = useAssessmentResultsStore();

  // Get current project state
  const projectState = getProjectState(projectId);
  const practice = projectState?.practice || null;
  const currentDomainId = projectState?.currentDomainId || '';
  const currentPracticeId = projectState?.currentPracticeId || '';
  const currentQuestionIndex = projectState?.currentQuestionIndex || 0;

  // Load domains and initial data
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    // No need to clear store - each project has its own state

    const fetchData = async () => {
      try {
        // Fetch domains
        const domainsData = await apiService.getDomains(projectId);

        // Transform API data to match our interface
        const transformedDomains = await Promise.all(
          domainsData.domains.map(async (domain) => {
            const domainDetails = await apiService.getDomain(domain.id, projectId);

            // Transform practices to include levels structure
            const practicesWithLevels: { [key: string]: PracticeWithLevels } =
              {};
            for (const [practiceId, practice] of Object.entries(
              domainDetails.practices,
            )) {
              try {
                const practiceQuestions = await apiService.getPracticeQuestions(
                  domain.id,
                  practiceId,
                  projectId,
                );
                practicesWithLevels[practiceId] = {
                  ...practice,
                  levels: practiceQuestions.levels,
                };
              } catch (error) {
                console.error(`Failed to load practice ${practiceId}:`, error);
                practicesWithLevels[practiceId] = {
                  ...practice,
                  levels: {},
                };
              }
            }

            return {
              id: domain.id,
              title: domain.title,
              description: domain.description,
              practices: practicesWithLevels,
            };
          }),
        );

        setDomains(transformedDomains);

        // Only set initial domain and practice if we don't have existing state for this project
        if (transformedDomains.length > 0 && !projectState) {
          const firstDomain = transformedDomains[0];
          const firstPracticeId = Object.keys(firstDomain.practices)[0];
          setProjectState(projectId, {
            currentDomainId: firstDomain.id,
            currentPracticeId: firstPracticeId,
            currentQuestionIndex: 0,
            practice: null,
          });
        }

        // Load existing answers
        const answersData = await apiService.getAnswers(projectId);

        // Make a map from the answers object
        const answersMap: Record<string, number> = {};

        if (answersData && answersData.answers) {
          Object.entries(answersData.answers).forEach(([key, value]) => {
            answersMap[key] = value as number;
          });
        }

        setAnswers(answersMap);

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
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [projectId, isAuthenticated, router]);

// Resume from Zustand store after data is loaded
useEffect(() => {
  if (!loading && domains.length > 0 && projectState) {
    // Check if we have navigation state for this project
    if (currentDomainId && currentPracticeId) {
      // Check if the current practice is still valid (domain and practice exist)
      const domain = domains.find(d => d.id === currentDomainId);
      if (domain && domain.practices[currentPracticeId]) {
        // The navigation state is already set, we just need to trigger the practice loading
        // The practice loading effect will handle fetching the practice data
      } else {
        // Clear invalid state for this project
        setProjectState(projectId, {
          currentDomainId: '',
          currentPracticeId: '',
          currentQuestionIndex: 0,
          practice: null,
        });
      }
    }
  }
}, [loading, domains, projectState, currentDomainId, currentPracticeId, currentQuestionIndex, projectId, setProjectState]);

  // Load practice questions when domain/practice changes
  useEffect(() => {
    if (!currentDomainId || !currentPracticeId) return;

    const fetchPractice = async () => {
      try {
        const data = await apiService.getPracticeQuestions(
          currentDomainId,
          currentPracticeId,
          projectId,
        );
        
        setProjectState(projectId, {
          practice: {
            title: data.title,
            description: data.description,
            levels: data.levels,
          },
        });

        // Flatten questions from levels
        const questionsList: Question[] = [];
        Object.entries(data.levels).forEach(([level, streams]) => {
          Object.entries(streams as Record<string, string[]>).forEach(
            ([stream, questions]) => {
              questions.forEach((question, index) => {
                questionsList.push({
                  level,
                  stream,
                  question,
                });
              });
            },
          );
        });

        setQuestions(questionsList);
        
        // Position is managed by Zustand store
      } catch (error) {
        console.error("Failed to fetch practice:", error);
      }
    };

    fetchPractice();
  }, [currentDomainId, currentPracticeId, projectId]);

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
    const key = `${currentDomainId}:${currentPracticeId}:${question.level}:${question.stream}:${questionIndex}`;

    setNotes((prev) => ({ ...prev, [key]: note }));
  };

  const handleNoteSave = async (questionIndex: number) => {
    const question = questions[questionIndex];
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
      setProjectState(projectId, {
        currentDomainId: domainId,
        currentPracticeId: firstPracticeId,
        currentQuestionIndex: 0,
      });
      
      // Navigate to domain
    }
    navigateToDomain(domainId);
  };

  const handlePracticeClick = (domainId: string, practiceId: string) => {
    setProjectState(projectId, {
      currentDomainId: domainId,
      currentPracticeId: practiceId,
      currentQuestionIndex: 0,
    });
    
    // Navigate to practice
    navigateToPractice(domainId, practiceId);
  };

  const handleQuestionClick = (domainId: string, practiceId: string, questionIndex: number) => {
    setProjectState(projectId, {
      currentDomainId: domainId,
      currentPracticeId: practiceId,
      currentQuestionIndex: questionIndex,
    });
    
    // Navigate to question
  };

  const handleNextQuestion = () => {
    const next = getNextQuestion();
    if (next) {
      // Check if we're moving to a different domain or practice
      const isMovingToDifferentDomain = next.domainId !== currentDomainId;
      const isMovingToDifferentPractice = next.practiceId !== currentPracticeId;
      
      if (isMovingToDifferentDomain || isMovingToDifferentPractice) {
        // Add a small delay for smooth transition
        setTimeout(() => {
          setProjectState(projectId, {
            currentDomainId: next.domainId,
            currentPracticeId: next.practiceId,
            currentQuestionIndex: next.questionIndex,
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
        setTimeout(() => {
          setProjectState(projectId, {
            currentDomainId: prev.domainId,
            currentPracticeId: prev.practiceId,
            currentQuestionIndex: prev.questionIndex,
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
      setProjectState(projectId, {
        currentDomainId: firstDomain.id,
        currentPracticeId: firstPracticeId,
        currentQuestionIndex: 0,
        practice: null,
      });
      
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Loading assessment...
          </p>
        </div>
      </div>
    );
  }

  // Check if there's navigation state for the current project
  const hasNavigationState = currentDomainId && currentPracticeId;
  
  // If we have navigation state but no practice loaded yet, show loading
  if (hasNavigationState && (!practice || questions.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Resuming your assessment...
          </p>
        </div>
      </div>
    );
  }
  
  // If no navigation state and no practice, show overview
  if (!hasNavigationState && (!practice || questions.length === 0)) {
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Assessment Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Ready to measure your AI maturity? Let's get started.
          </p>
          
          <button
            onClick={handleStartAssessment}
            className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
          >
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const questionKey = `${currentDomainId}:${currentPracticeId}:${currentQuestion.level}:${currentQuestion.stream}:${currentQuestionIndex}`;
  const currentAnswer = answers[questionKey];
  const currentNote = notes[questionKey] || "";

  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(answers).filter((key) =>
    key.startsWith(`${currentDomainId}:${currentPracticeId}:`),
  ).length;
  const progress = (answeredQuestions / totalQuestions) * 100;

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
      />

      {/* Main Content */}
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
                  {practice?.title || 'Loading...'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {domains.find(d => d.id === currentDomainId)?.title} • Question {currentQuestionIndex + 1} of {totalQuestions}
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
                  Question {currentQuestionIndex + 1} of {totalQuestions}
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
              key={currentQuestionIndex}
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
                        handleAnswerChange(currentQuestionIndex, option.value)
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
                    handleNoteChange(currentQuestionIndex, note)
                  }
                  onSave={() => handleNoteSave(currentQuestionIndex)}
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
