"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import { useRequireAuth } from "../hooks/useRequireAuth";
import {
    apiService,
    Domain as ApiDomain,
    Practice as ApiPractice,
    PracticeQuestionLevels,
    PracticeQuestionDetail,
} from "../lib/api";
import { showToast } from "../lib/toast";
import { PREMIUM_STATUS } from "../lib/constants";
import { usePracticeStore } from "../store/practiceStore";
import { useAssessmentResultsStore } from "../store/assessmentResultsStore";
import { stripHTML } from "../lib/htmlUtils";
import { sanitizeNoteInput } from "../lib/sanitize";

// --- Types ---

export interface Question {
    level: string;
    stream: string;
    question: string;
    description?: string | null;
}

export type LevelQuestionEntry =
    | string
    | {
        question_text: string;
        description?: string | null;
    };

export interface PracticeWithLevels extends Omit<ApiPractice, 'levels'> {
    levels: PracticeQuestionLevels;
    questionsAnswered: number;
    totalQuestions: number;
    isCompleted: boolean;
    isInProgress: boolean;
    questions?: Question[];
}

export interface DomainWithLevels extends Omit<ApiDomain, "practices"> {
    practices: Record<string, PracticeWithLevels>;
}

interface AssessmentContextType {
    projectId: string;
    domains: DomainWithLevels[];
    answers: Record<string, number>;
    notes: Record<string, string>;
    loading: boolean;
    error: string | null;
    projectNotFound: boolean;
    isPremium: boolean;

    // Navigation State
    currentDomainId: string;
    currentPracticeId: string;
    currentQuestionIndex: number;
    setCurrentDomainId: (id: string) => void;
    setCurrentPracticeId: (id: string) => void;
    setCurrentQuestionIndex: (index: number) => void;

    // Actions
    handleAnswerChange: (questionIndex: number, value: number) => Promise<void>;
    handleNoteChange: (questionIndex: number, note: string) => void;
    handleNoteSave: (questionIndex: number, note: string) => Promise<void>;
    saveAllNotes: (isSubmitting?: boolean) => Promise<boolean>;
    submitProject: () => Promise<void>;

    saving: boolean;
    savingNote: boolean;
    submitting: boolean;
    submissionPhase: 'saving-notes' | 'submitting' | null;

    questions: Question[]; // Questions for current practice
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export const useAssessmentContext = () => {
    const context = useContext(AssessmentContext);
    if (!context) {
        throw new Error("useAssessmentContext must be used within an AssessmentProvider");
    }
    return context;
};

// --- Helpers ---

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

export const AssessmentProvider = ({ children }: { children: React.ReactNode }) => {
    const params = useParams();
    const router = useRouter();
    const { isAuthenticated, user, loading: userLoading } = useAuth();
    const { loading: authLoading } = useRequireAuth();
    const projectId = params.projectId as string;

    const [domains, setDomains] = useState<DomainWithLevels[]>([]);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<Question[]>([]);

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
    } = usePracticeStore();

    const { setProjectResults } = useAssessmentResultsStore();

    const projectState = getProjectState(projectId);
    const currentDomainId = projectState?.currentDomainId || '';
    const currentPracticeId = projectState?.currentPracticeId || '';
    const currentQuestionIndex = projectState?.currentQuestionIndex || 0;

    // --- Helpers to update store ---
    const handleSetCurrentDomainId = useCallback((id: string) => {
        setProjectState(projectId, { currentDomainId: id });
    }, [projectId, setProjectState]);

    const handleSetCurrentPracticeId = useCallback((id: string) => {
        setProjectState(projectId, { currentPracticeId: id });
    }, [projectId, setProjectState]);

    const handleSetCurrentQuestionIndex = useCallback((index: number) => {
        setProjectState(projectId, { currentQuestionIndex: index });
    }, [projectId, setProjectState]);

    useEffect(() => {
        if (authLoading || !isAuthenticated) return;

        const controller = new AbortController();
        const fetchData = async () => {
            try {
                setError(null);
                setProjectNotFound(false);
                setLoading(true);

                // Fetch domains
                const domainsData = await apiService.getDomainsFull(projectId);

                if (controller.signal.aborted) return;

                if (!domainsData.domains || domainsData.domains.length === 0) {
                    setError("No domains data available");
                    setLoading(false);
                    return;
                }

                // Transform domains
                const transformedDomains = domainsData.domains.map((domain) => {
                    const practicesWithLevels: Record<string, PracticeWithLevels> = {};

                    Object.entries(domain.practices).forEach(([practiceId, practice]) => {
                        practicesWithLevels[practiceId] = {
                            ...practice,
                            levels: practice.levels || {},
                            questionsAnswered: practice.questionsAnswered || 0,
                            totalQuestions: practice.totalQuestions || 0,
                            isCompleted: practice.isCompleted || false,
                            isInProgress: practice.isInProgress || false,
                        };
                    });

                    return {
                        ...domain,
                        practices: practicesWithLevels,
                    };
                });

                const orderedDomains = sortDomainsByPriority(transformedDomains);
                if (controller.signal.aborted) return;
                setDomains(orderedDomains);

                // Initialize state if needed
                let targetDomainId = currentDomainId;
                let targetPracticeId = currentPracticeId;

                // If no state or state invalid, set default
                if (!targetDomainId || !orderedDomains.find(d => d.id === targetDomainId)) {
                    // Default to first non-premium domain if possible, or just first domain
                    const firstDomain = orderedDomains.find(d => d.is_premium !== true) || orderedDomains[0];
                    if (firstDomain) {
                        targetDomainId = firstDomain.id;
                        const firstPracticeId = Object.keys(firstDomain.practices)[0];
                        targetPracticeId = firstPracticeId || '';

                        // Only update if we actually changed something to avoid loops/unnecessary writes
                        if (targetDomainId !== currentDomainId || targetPracticeId !== currentPracticeId) {
                            setProjectState(projectId, {
                                currentDomainId: targetDomainId,
                                currentPracticeId: targetPracticeId,
                                currentQuestionIndex: 0
                            });
                        }
                    }
                }

                // Fetch Answers and Notes
                const [answersData, notesData] = await Promise.all([
                    apiService.getAnswers(projectId).catch(() => ({ answers: {} })),
                    apiService.getQuestionNotes(projectId).catch(() => []),
                ]);

                if (controller.signal.aborted) return;

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

            } catch (error: any) {
                if (controller.signal.aborted) return;
                console.error("Failed to fetch data:", error);
                if (error?.status === 400 || error?.status === 404 ||
                    error?.response?.status === 400 || error?.response?.status === 404) {
                    setProjectNotFound(true);
                    setError("No domains available for this project");
                } else {
                    setError(error?.message || "Failed to load assessment data.");
                    showToast.error("Failed to load assessment data.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchData();
        return () => controller.abort();
    }, [projectId, isAuthenticated, authLoading, currentDomainId, currentPracticeId, setProjectState]);

    // --- Derive Questions for Current Practice ---
    useEffect(() => {
        if (!loading && domains.length > 0 && currentDomainId && currentPracticeId) {
            const domain = domains.find(d => d.id === currentDomainId);
            const practice = domain?.practices[currentPracticeId];

            if (practice && practice.levels && Object.keys(practice.levels).length > 0) {
                const questionsList: Question[] = [];
                Object.entries(practice.levels).forEach(([level, streams]) => {
                    Object.entries(
                        streams as Record<string, PracticeQuestionDetail[]>,
                    ).forEach(([stream, questionEntries]) => {
                        questionEntries.forEach((questionEntry) => {
                            const normalized = normalizeQuestionEntry(questionEntry);
                            if (!normalized) return;
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

                // Validate index
                if (questionsList.length > 0 && currentQuestionIndex >= questionsList.length) {
                    setProjectState(projectId, { currentQuestionIndex: 0 });
                }

                // Update practice detail in store if needed
                if (projectState?.practice?.title !== practice.title) {
                    setProjectState(projectId, {
                        practice: {
                            title: practice.title,
                            description: practice.description,
                            levels: practice.levels
                        }
                    });
                }

            } else {
                setQuestions([]);
            }
        }
    }, [loading, domains, currentDomainId, currentPracticeId, projectId]);


    // --- Actions ---

    const handleAnswerChange = async (questionIndex: number, value: number) => {
        const question = questions[questionIndex];
        if (!question) return;

        const key = `${currentDomainId}:${currentPracticeId}:${question.level}:${question.stream}:${questionIndex}`;
        const previousValue = answers[key];

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
            console.error("Failed to save answer:", error);
            // Rollback optimistic update
            setAnswers((prev) => ({ ...prev, [key]: previousValue }));
            showToast.error("Failed to save answer. Progress reverted.");
        } finally {
            setSaving(false);
        }
    };

    const handleNoteChange = (questionIndex: number, note: string) => {
        const question = questions[questionIndex];
        if (!question) return;
        const key = `${currentDomainId}:${currentPracticeId}:${question.level}:${question.stream}:${questionIndex}`;
        setNotes((prev) => ({ ...prev, [key]: note }));
    };

    const handleNoteSave = async (questionIndex: number, note: string) => {
        const question = questions[questionIndex];
        if (!question) return;
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

    const saveAllNotes = async (isSubmitting: boolean = false): Promise<boolean> => {
        const noteEntries = Object.entries(notes).filter(([_, note]) => note.trim());
        if (noteEntries.length === 0) return true;

        const toastMessage = isSubmitting ? "Saving notes and submitting..." : "Saving notes...";
        const toastId = showToast.loading(toastMessage);

        const savePromises = noteEntries.map(async ([key, note]) => {
            const [domainId, practiceId, level, stream, questionIndexStr] = key.split(":");
            const questionIndex = parseInt(questionIndexStr, 10);
            if (!domainId || !practiceId || !level || !stream || isNaN(questionIndex)) {
                return { success: false, key, error: "Invalid note key" };
            }

            try {
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
                return { success: false, key, error };
            }
        });

        const results = await Promise.allSettled(savePromises);
        showToast.dismiss(toastId);

        const failures = results.filter(
            (res): res is PromiseFulfilledResult<{ success: boolean; key: string; error?: any }> =>
                res.status === 'fulfilled' && !res.value.success
        );

        if (failures.length > 0) {
            console.error("Some notes failed to save:", failures);
            showToast.warning(`Failed to save ${failures.length} notes. Please try again.`);
            return false;
        }

        return true;
    };

    const submitProject = async () => {
        setSubmitting(true);
        try {
            setSubmissionPhase('saving-notes');
            const notesSaved = await saveAllNotes(true);
            if (!notesSaved) {
                setSubmitting(false);
                setSubmissionPhase(null);
                return;
            }

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

    const value = {
        projectId,
        domains,
        answers,
        notes,
        loading,
        error,
        projectNotFound,
        isPremium,
        currentDomainId,
        currentPracticeId,
        currentQuestionIndex,
        setCurrentDomainId: handleSetCurrentDomainId,
        setCurrentPracticeId: handleSetCurrentPracticeId,
        setCurrentQuestionIndex: handleSetCurrentQuestionIndex,
        handleAnswerChange,
        handleNoteChange,
        handleNoteSave,
        saveAllNotes,
        submitProject,
        saving,
        savingNote,
        submitting,
        submissionPhase,
        questions,
    };

    return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
};
