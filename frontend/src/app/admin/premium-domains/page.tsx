"use client";

import { API_BASE_URL, apiService } from "@/lib/api";
import { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "../../../hooks/useRequireAuth";
import { SimplePageSkeleton, AimaDataManagementSkeleton } from "@/components/Skeleton";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { safeRenderHTML, stripHTML } from "@/lib/htmlUtils";
import { ROLES } from "@/lib/constants";
import { IconCrown, IconChevronDown, IconChevronRight } from "@tabler/icons-react";

interface Question {
    id: string;
    level: string;
    stream: string;
    question_index: number;
    question_text: string;
    description?: string | null;
    created_at: string;
}

interface Practice {
    id: string;
    domain_id: string;
    title: string;
    description: string;
    created_at: string;
    questions: Question[];
}

interface Domain {
    id: string;
    title: string;
    description: string;
    is_premium: boolean;
    created_at: string;
    practices: Practice[];
}

interface AIMAResponse {
    success: boolean;
    data: {
        domains: Domain[];
        summary: {
            total_domains: number;
            total_practices: number;
            total_questions: number;
        };
    };
}

const DOMAIN_DISPLAY_ORDER = [
    "Responsible AI Principles",
    "Governance",
    "Data Management",
    "Privacy",
    "Design",
    "Implementation",
    "Verification",
    "Operations",
];

const sortDomainsByOrder = (domains: Domain[]) => {
    const orderMap = new Map(
        DOMAIN_DISPLAY_ORDER.map((title, index) => [title.toLowerCase(), index]),
    );
    const fallbackIndex = DOMAIN_DISPLAY_ORDER.length;

    return [...domains].sort((a, b) => {
        const aIndex = orderMap.get(a.title.toLowerCase()) ?? fallbackIndex;
        const bIndex = orderMap.get(b.title.toLowerCase()) ?? fallbackIndex;
        if (aIndex !== bIndex) return aIndex - bIndex;
        return a.title.localeCompare(b.title);
    });
};

export default function PremiumDomainsAdmin() {
    const { user, isAuthenticated } = useAuth();
    const { loading: authLoading } = useRequireAuth();
    const { theme } = useTheme();
    const router = useRouter();

    const [aimaData, setAimaData] = useState<AIMAResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedDomains, setExpandedDomains] = useState<Set<string>>(
        new Set(),
    );
    const [expandedPractices, setExpandedPractices] = useState<Set<string>>(
        new Set(),
    );

    // Check authentication and admin role
    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated) {
            return; // useRequireAuth handles redirect to /auth
        }

        if (user?.role !== ROLES.ADMIN) {
            // Redirect non-admin users to dashboard (preserves history)
            router.push("/dashboard");
            return;
        }
    }, [isAuthenticated, user, authLoading, router]);

    // Modal states
    const [showPracticeModal, setShowPracticeModal] = useState(false);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [selectedDomainId, setSelectedDomainId] = useState<string>("");
    const [selectedPracticeId, setSelectedPracticeId] = useState<string>("");

    // Form states
    const [practiceForm, setPracticeForm] = useState({
        title: "",
        description: "",
    });
    const [questionForm, setQuestionForm] = useState({
        level: "1",
        stream: "A",
        question_text: "",
        description: "",
    });
    const [editingQuestions, setEditingQuestions] = useState<Record<string, boolean>>({});
    const [questionTextEdits, setQuestionTextEdits] = useState<Record<string, string>>({});
    const [questionLevelEdits, setQuestionLevelEdits] = useState<Record<string, string>>({});
    const [questionStreamEdits, setQuestionStreamEdits] = useState<Record<string, string>>({});
    const [savingQuestionUpdates, setSavingQuestionUpdates] = useState<Record<string, boolean>>({});
    const [questionUpdateStatus, setQuestionUpdateStatus] = useState<Record<string, "saved" | "error">>({});
    const [questionDescriptions, setQuestionDescriptions] = useState<Record<string, string>>({});
    const [savingDescriptions, setSavingDescriptions] = useState<Record<string, boolean>>({});
    const [descriptionStatus, setDescriptionStatus] = useState<Record<string, "saved" | "error">>({});

    const toggleDomain = (domainId: string) => {
        const newExpandedDomains = new Set(expandedDomains);
        if (newExpandedDomains.has(domainId)) {
            newExpandedDomains.delete(domainId);
            const newExpandedPractices = new Set(expandedPractices);
            aimaData?.data.domains
                .find((d) => d.id === domainId)
                ?.practices.forEach((practice) =>
                    newExpandedPractices.delete(practice.id),
                );
            setExpandedPractices(newExpandedPractices);
        } else {
            newExpandedDomains.add(domainId);
        }
        setExpandedDomains(newExpandedDomains);
    };

    const togglePractice = (practiceId: string) => {
        const newExpandedPractices = new Set(expandedPractices);
        if (newExpandedPractices.has(practiceId)) {
            newExpandedPractices.delete(practiceId);
        } else {
            newExpandedPractices.add(practiceId);
        }
        setExpandedPractices(newExpandedPractices);
    };

    const handleAddPractice = (domainId: string) => {
        setSelectedDomainId(domainId);
        setPracticeForm({ title: "", description: "" });
        setShowPracticeModal(true);
    };

    const handleAddQuestion = (practiceId: string) => {
        setSelectedPracticeId(practiceId);
        setQuestionForm({ level: "1", stream: "A", question_text: "", description: "" });
        setShowQuestionModal(true);
    };

    const closeModals = () => {
        setShowPracticeModal(false);
        setShowQuestionModal(false);
        setSelectedDomainId("");
        setSelectedPracticeId("");
        setQuestionForm({ level: "1", stream: "A", question_text: "", description: "" });
    };

    const toggleDomainPremium = async (domainId: string, currentPremiumStatus: boolean) => {
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${API_BASE_URL}/admin/domains/${domainId}/premium`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ is_premium: !currentPremiumStatus }),
            });

            if (response.ok) {
                // Remove domain from list since we're toggling off premium
                setAimaData((prev) => {
                    if (!prev) return prev;
                    const updatedDomains = prev.data.domains.filter(d => d.id !== domainId);
                    const practicesCount = updatedDomains.reduce((acc, d) => acc + d.practices.length, 0);
                    const questionsCount = updatedDomains.reduce(
                        (acc, d) => acc + d.practices.reduce((pAcc, p) => pAcc + p.questions.length, 0),
                        0
                    );
                    return {
                        ...prev,
                        data: {
                            ...prev.data,
                            domains: updatedDomains,
                            summary: {
                                total_domains: updatedDomains.length,
                                total_practices: practicesCount,
                                total_questions: questionsCount,
                            },
                        },
                    };
                });
            } else {
                const error = await response.json();
                console.error(`Error: ${error.error}`);
                alert(`Failed to update premium status: ${error.error}`);
            }
        } catch (err) {
            console.error("Failed to toggle domain premium status");
            alert("Failed to update premium status. Please try again.");
        }
    };

    const submitPractice = async () => {
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${API_BASE_URL}/admin/add-practice`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ...practiceForm, domain_id: selectedDomainId }),
            });

            if (response.ok) {
                const data = await response.json();
                const newPractice = data?.data?.practice?.id ? data.data.practice : {
                    id: crypto.randomUUID(),
                    domain_id: selectedDomainId,
                    title: practiceForm.title,
                    description: practiceForm.description,
                    created_at: new Date().toISOString(),
                    questions: [],
                };
                setAimaData((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        data: {
                            ...prev.data,
                            domains: prev.data.domains.map((domain) =>
                                domain.id === selectedDomainId
                                    ? { ...domain, practices: [...domain.practices, newPractice] }
                                    : domain
                            ),
                            summary: {
                                ...prev.data.summary,
                                total_practices: prev.data.summary.total_practices + 1,
                            },
                        },
                    };
                });
                closeModals();
            } else {
                const error = await response.json();
                console.error(`Error: ${error.error}`);
            }
        } catch (err) {
            console.error("Failed to add practice");
        }
    };

    const submitQuestion = async () => {
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${API_BASE_URL}/admin/add-question`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...questionForm,
                    practice_id: selectedPracticeId,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const newQuestion = data?.data?.question?.id ? data.data.question : {
                    id: crypto.randomUUID(),
                    level: questionForm.level,
                    stream: questionForm.stream,
                    question_index: 0,
                    question_text: questionForm.question_text,
                    description: questionForm.description || null,
                    created_at: new Date().toISOString(),
                };
                setAimaData((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        data: {
                            ...prev.data,
                            domains: prev.data.domains.map((domain) => ({
                                ...domain,
                                practices: domain.practices.map((practice) =>
                                    practice.id === selectedPracticeId
                                        ? {
                                            ...practice,
                                            questions: [...practice.questions, newQuestion].sort((a, b) => {
                                                if (a.level !== b.level) return a.level.localeCompare(b.level);
                                                if (a.stream !== b.stream) return a.stream.localeCompare(b.stream);
                                                return a.question_index - b.question_index;
                                            }),
                                        }
                                        : practice
                                ),
                            })),
                            summary: {
                                ...prev.data.summary,
                                total_questions: prev.data.summary.total_questions + 1,
                            },
                        },
                    };
                });
                closeModals();
            } else {
                const error = await response.json();
                console.error(`Error: ${error.error}`);
            }
        } catch (err) {
            console.error("Failed to add question");
        }
    };

    const getQuestionDescriptionValue = (question: Question) =>
        questionDescriptions[question.id] ?? question.description ?? "";

    const startEditingQuestion = (question: Question) => {
        setEditingQuestions((prev) => ({ ...prev, [question.id]: true }));
        setQuestionTextEdits((prev) => ({
            ...prev,
            [question.id]: prev[question.id] ?? stripHTML(question.question_text),
        }));
        setQuestionLevelEdits((prev) => ({
            ...prev,
            [question.id]: prev[question.id] ?? question.level,
        }));
        setQuestionStreamEdits((prev) => ({
            ...prev,
            [question.id]: prev[question.id] ?? question.stream,
        }));
    };

    const cancelEditingQuestion = (
        questionId: string,
        options?: { preserveStatus?: boolean },
    ) => {
        setEditingQuestions((prev) => {
            const updated = { ...prev };
            delete updated[questionId];
            return updated;
        });
        setQuestionTextEdits((prev) => {
            const updated = { ...prev };
            delete updated[questionId];
            return updated;
        });
        setQuestionLevelEdits((prev) => {
            const updated = { ...prev };
            delete updated[questionId];
            return updated;
        });
        setQuestionStreamEdits((prev) => {
            const updated = { ...prev };
            delete updated[questionId];
            return updated;
        });
        if (!options?.preserveStatus) {
            setQuestionUpdateStatus((prev) => {
                const updated = { ...prev };
                delete updated[questionId];
                return updated;
            });
        }
    };

    const handleQuestionUpdate = async (question: Question) => {
        const draftedText = questionTextEdits[question.id];
        const draftedLevel = questionLevelEdits[question.id];
        const draftedStream = questionStreamEdits[question.id];

        const payload: {
            question_text?: string;
            level?: string;
            stream?: string;
        } = {};

        let hasChanges = false;

        if (draftedText !== undefined) {
            const trimmedText = draftedText.trim();
            if (!trimmedText) {
                setQuestionUpdateStatus((prev) => ({ ...prev, [question.id]: "error" }));
                return;
            }
            const existingText = stripHTML(question.question_text).trim();
            if (trimmedText !== existingText) {
                payload.question_text = trimmedText;
                hasChanges = true;
            }
        }

        if (draftedLevel !== undefined && draftedLevel !== question.level) {
            payload.level = draftedLevel;
            hasChanges = true;
        }

        if (draftedStream !== undefined && draftedStream !== question.stream) {
            payload.stream = draftedStream;
            hasChanges = true;
        }

        if (!hasChanges) {
            return;
        }

        setSavingQuestionUpdates((prev) => ({ ...prev, [question.id]: true }));

        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${API_BASE_URL}/admin/questions/${question.id}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || "Failed to update question");
            }

            const data = await response.json();
            const updatedQuestion = data?.data?.question;
            const updatedText = updatedQuestion?.question_text ?? payload.question_text ?? question.question_text;
            const updatedLevel = updatedQuestion?.level ?? payload.level ?? question.level;
            const updatedStream = updatedQuestion?.stream ?? payload.stream ?? question.stream;

            setAimaData((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    data: {
                        ...prev.data,
                        domains: prev.data.domains.map((domain) => ({
                            ...domain,
                            practices: domain.practices.map((practice) => ({
                                ...practice,
                                questions: practice.questions
                                    .map((q) =>
                                        q.id === question.id
                                            ? {
                                                ...q,
                                                question_text: updatedText,
                                                level: updatedLevel,
                                                stream: updatedStream,
                                            }
                                            : q,
                                    )
                                    .sort((a, b) => {
                                        if (a.level !== b.level) return a.level.localeCompare(b.level);
                                        if (a.stream !== b.stream) return a.stream.localeCompare(b.stream);
                                        return a.question_index - b.question_index;
                                    }),
                            })),
                        })),
                    },
                };
            });

            cancelEditingQuestion(question.id, { preserveStatus: true });

            setQuestionUpdateStatus((prev) => ({ ...prev, [question.id]: "saved" }));
            setTimeout(() => {
                setQuestionUpdateStatus((prev) => {
                    const updated = { ...prev };
                    delete updated[question.id];
                    return updated;
                });
            }, 2000);
        } catch (error) {
            console.error("Failed to update question:", error);
            setQuestionUpdateStatus((prev) => ({ ...prev, [question.id]: "error" }));
        } finally {
            setSavingQuestionUpdates((prev) => ({ ...prev, [question.id]: false }));
        }
    };

    const handleQuestionDescriptionChange = (questionId: string, value: string) => {
        setQuestionDescriptions((prev) => ({ ...prev, [questionId]: value }));
    };

    const handleQuestionDescriptionSave = async (question: Question) => {
        const descriptionValue = getQuestionDescriptionValue(question);
        setSavingDescriptions((prev) => ({ ...prev, [question.id]: true }));

        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${API_BASE_URL}/admin/questions/${question.id}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ description: descriptionValue }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || "Failed to update question");
            }

            const data = await response.json();
            const updatedDescription =
                data?.data?.question?.description ?? (descriptionValue.trim() ? descriptionValue : null);

            setAimaData((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    data: {
                        ...prev.data,
                        domains: prev.data.domains.map((domain) => ({
                            ...domain,
                            practices: domain.practices.map((practice) => ({
                                ...practice,
                                questions: practice.questions.map((q) =>
                                    q.id === question.id ? { ...q, description: updatedDescription } : q,
                                ),
                            })),
                        })),
                    },
                };
            });

            setQuestionDescriptions((prev) => {
                const updated = { ...prev };
                delete updated[question.id];
                return updated;
            });

            setDescriptionStatus((prev) => ({ ...prev, [question.id]: "saved" }));
            setTimeout(() => {
                setDescriptionStatus((prev) => {
                    const updated = { ...prev };
                    delete updated[question.id];
                    return updated;
                });
            }, 2000);
        } catch (error) {
            console.error("Failed to update question description:", error);
            setDescriptionStatus((prev) => ({ ...prev, [question.id]: "error" }));
        } finally {
            setSavingDescriptions((prev) => ({ ...prev, [question.id]: false }));
        }
    };

    // Fetch AIMA data only if user is authenticated and is admin
    useEffect(() => {
        if (authLoading || !isAuthenticated || user?.role !== "ADMIN") {
            return;
        }
        async function fetchAIMAData() {
            try {
                const token = localStorage.getItem("auth_token");
                const response = await fetch(`${API_BASE_URL}/admin/aima-data`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data: AIMAResponse = await response.json();

                if (data.success) {
                    // Filter to only show premium domains
                    const premiumDomains = data.data.domains.filter(domain => domain.is_premium);

                    // Calculate summary for premium domains only
                    const premiumPracticesCount = premiumDomains.reduce(
                        (acc, domain) => acc + domain.practices.length,
                        0
                    );
                    const premiumQuestionsCount = premiumDomains.reduce(
                        (acc, domain) =>
                            acc + domain.practices.reduce((pAcc, practice) => pAcc + practice.questions.length, 0),
                        0
                    );

                    setAimaData({
                        ...data,
                        data: {
                            ...data.data,
                            domains: sortDomainsByOrder(premiumDomains),
                            summary: {
                                total_domains: premiumDomains.length,
                                total_practices: premiumPracticesCount,
                                total_questions: premiumQuestionsCount,
                            },
                        },
                    });
                } else {
                    throw new Error("Failed to fetch AIMA data");
                }
            } catch (err) {
                console.error("Error fetching AIMA data:", err);
                setError(err instanceof Error ? err.message : "Unknown error occurred");
            } finally {
                setLoading(false);
            }
        }

        fetchAIMAData();
    }, [authLoading, isAuthenticated, user?.role]);

    // Show loading while checking auth
    if (authLoading) {
        return <SimplePageSkeleton />;
    }

    // Don't render anything if not authenticated or not admin (redirects will handle this)
    if (!isAuthenticated || user?.role !== "ADMIN") {
        return null;
    }

    if (loading) {
        return <AimaDataManagementSkeleton />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="bg-destructive/15 border border-destructive/50 text-destructive px-4 py-3 rounded">
                    <strong>Error:</strong> {error}
                </div>
            </div>
        );
    }

    if (!aimaData) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="bg-muted border border-border text-muted-foreground px-4 py-3 rounded">
                    No data available
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <div className="flex items-center gap-3">
                                <IconCrown className="w-10 h-10 text-primary" />
                                <h1 className="text-4xl font-bold text-primary">
                                    Premium Domains
                                </h1>
                            </div>
                            <p className="text-muted-foreground text-lg mt-2">
                                Manage premium domains, practices, and questions for the AIMA assessment framework.
                            </p>
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                        <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center gap-2">
                            <IconCrown className="w-5 h-5 text-primary" />
                            Premium Content Summary
                        </h2>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-muted/50 rounded-xl">
                                <div className="text-3xl font-bold text-primary">
                                    {aimaData.data.summary.total_domains}
                                </div>
                                <div className="text-muted-foreground font-medium">
                                    Premium Domains
                                </div>
                            </div>
                            <div className="text-center p-4 bg-muted/50 rounded-xl">
                                <div className="text-3xl font-bold text-primary">
                                    {aimaData.data.summary.total_practices}
                                </div>
                                <div className="text-muted-foreground font-medium">
                                    Practices
                                </div>
                            </div>
                            <div className="text-center p-4 bg-muted/50 rounded-xl">
                                <div className="text-3xl font-bold text-primary">
                                    {aimaData.data.summary.total_questions}
                                </div>
                                <div className="text-muted-foreground font-medium">
                                    Questions
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {aimaData.data.domains.length === 0 ? (
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-primary/20 dark:border-primary/50 rounded-2xl p-12 shadow-lg text-center">
                        <IconCrown className="w-16 h-16 text-primary mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No Premium Domains Yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Mark domains as premium in the AIMA Data Management page to see them here.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 max-w-6xl mx-auto">
                    {aimaData.data.domains.map((domain) => (
                        <div
                            key={domain.id}
                            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-primary/20 dark:border-primary/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 dark:shadow-gray-900/20"
                        >
                            {/* Domain Header - Always Visible */}
                            <div
                                className="p-6 cursor-pointer hover:bg-yellow-50/50 dark:hover:bg-gray-700/50 transition-all duration-200 rounded-2xl"
                                onClick={() => toggleDomain(domain.id)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDomain(domain.id); } }}
                                role="button"
                                tabIndex={0}
                                aria-expanded={expandedDomains.has(domain.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0">
                                                {expandedDomains.has(domain.id) ? (
                                                    <IconChevronDown className="w-5 h-5 text-primary transition-transform duration-200" />
                                                ) : (
                                                    <IconChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                        {domain.title}
                                                    </h2>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 shadow-sm">
                                                        ⭐ Premium
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                                    {domain.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleDomainPremium(domain.id, domain.is_premium);
                                            }}
                                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50"
                                            title="Click to remove premium status"
                                        >
                                            Remove Premium
                                        </button>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                                            {domain.practices.length} practices
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Practices - Collapsible */}
                            {expandedDomains.has(domain.id) && (
                                <div className="border-t border-primary/20 dark:border-primary/30">
                                    <div className="p-6 space-y-4">
                                        {domain.practices.length === 0 ? (
                                            <p className="text-gray-500 dark:text-gray-400 italic">
                                                No practices in this domain yet.
                                            </p>
                                        ) : (
                                            domain.practices.map((practice) => (
                                                <div
                                                    key={practice.id}
                                                    className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-4"
                                                >
                                                    <div
                                                        className="flex items-center justify-between cursor-pointer"
                                                        onClick={() => togglePractice(practice.id)}
                                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePractice(practice.id); } }}
                                                        role="button"
                                                        tabIndex={0}
                                                        aria-expanded={expandedPractices.has(practice.id)}
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <div className="flex-shrink-0">
                                                                {expandedPractices.has(practice.id) ? (
                                                                    <svg
                                                                        className="w-4 h-4 text-primary"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M19 9l-7 7-7-7"
                                                                        />
                                                                    </svg>
                                                                ) : (
                                                                    <svg
                                                                        className="w-4 h-4 text-gray-400"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M9 5l7 7-7 7"
                                                                        />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h3 className="font-medium text-gray-900 dark:text-white">
                                                                    {practice.title}
                                                                </h3>
                                                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                                                    {practice.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                            {practice.questions.length} questions
                                                        </span>
                                                    </div>

                                                    {/* Questions */}
                                                    {expandedPractices.has(practice.id) && (
                                                        <div className="mt-4 space-y-3">
                                                            {practice.questions.length === 0 ? (
                                                                <p className="text-gray-500 dark:text-gray-400 italic text-sm">
                                                                    No questions in this practice yet.
                                                                </p>
                                                            ) : (
                                                                practice.questions.map((question, idx) => (
                                                                    <div
                                                                        key={question.id}
                                                                        className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200/50 dark:border-gray-600/50"
                                                                    >
                                                                        <div className="flex items-start justify-between">
                                                                            <div className="flex-1">
                                                                                <div className="flex items-center space-x-2 mb-2">
                                                                                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                                                                                        L{question.level}
                                                                                    </span>
                                                                                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                                                                                        {question.stream}
                                                                                    </span>
                                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                                        Q{idx + 1}
                                                                                    </span>
                                                                                </div>
                                                                                {editingQuestions[question.id] ? (
                                                                                    <div className="space-y-2">
                                                                                        <textarea
                                                                                            value={questionTextEdits[question.id] ?? stripHTML(question.question_text)}
                                                                                            onChange={(e) =>
                                                                                                setQuestionTextEdits((prev) => ({
                                                                                                    ...prev,
                                                                                                    [question.id]: e.target.value,
                                                                                                }))
                                                                                            }
                                                                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
                                                                                            rows={3}
                                                                                        />
                                                                                        <div className="flex gap-2">
                                                                                            <select
                                                                                                value={questionLevelEdits[question.id] ?? question.level}
                                                                                                onChange={(e) =>
                                                                                                    setQuestionLevelEdits((prev) => ({
                                                                                                        ...prev,
                                                                                                        [question.id]: e.target.value,
                                                                                                    }))
                                                                                                }
                                                                                                className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                                                                            >
                                                                                                <option value="1">Level 1</option>
                                                                                                <option value="2">Level 2</option>
                                                                                                <option value="3">Level 3</option>
                                                                                            </select>
                                                                                            <select
                                                                                                value={questionStreamEdits[question.id] ?? question.stream}
                                                                                                onChange={(e) =>
                                                                                                    setQuestionStreamEdits((prev) => ({
                                                                                                        ...prev,
                                                                                                        [question.id]: e.target.value,
                                                                                                    }))
                                                                                                }
                                                                                                className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                                                                            >
                                                                                                <option value="A">Stream A</option>
                                                                                                <option value="B">Stream B</option>
                                                                                            </select>
                                                                                        </div>
                                                                                        <div className="flex gap-2">
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => handleQuestionUpdate(question)}
                                                                                                disabled={savingQuestionUpdates[question.id]}
                                                                                                className="px-3 py-1 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                                                                            >
                                                                                                {savingQuestionUpdates[question.id] ? "Saving..." : "Save"}
                                                                                            </button>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => cancelEditingQuestion(question.id)}
                                                                                                className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                                                                                            >
                                                                                                Cancel
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <p
                                                                                        className="text-gray-700 dark:text-gray-300 text-sm cursor-pointer hover:text-primary"
                                                                                        onClick={() => startEditingQuestion(question)}
                                                                                        dangerouslySetInnerHTML={{
                                                                                            __html: safeRenderHTML(question.question_text),
                                                                                        }}
                                                                                    />
                                                                                )}
                                                                                {questionUpdateStatus[question.id] === "saved" && (
                                                                                    <span className="text-xs text-success mt-1 block">
                                                                                        ✓ Saved
                                                                                    </span>
                                                                                )}
                                                                                {questionUpdateStatus[question.id] === "error" && (
                                                                                    <span className="text-xs text-destructive mt-1 block">
                                                                                        ✗ Error saving
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Description Editor */}
                                                                        <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-600/50">
                                                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">
                                                                                Description / Notes
                                                                            </label>
                                                                            <RichTextEditor
                                                                                value={getQuestionDescriptionValue(question)}
                                                                                onChange={(value) => handleQuestionDescriptionChange(question.id, value)}
                                                                                placeholder="Add description or notes..."
                                                                                className="min-h-[100px]"
                                                                            />
                                                                            <div className="flex items-center gap-2 mt-2">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleQuestionDescriptionSave(question)}
                                                                                    disabled={savingDescriptions[question.id]}
                                                                                    className="px-3 py-1 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                                                                >
                                                                                    {savingDescriptions[question.id] ? "Saving..." : "Save Description"}
                                                                                </button>
                                                                                {descriptionStatus[question.id] === "saved" && (
                                                                                    <span className="text-xs text-success">
                                                                                        ✓ Saved
                                                                                    </span>
                                                                                )}
                                                                                {descriptionStatus[question.id] === "error" && (
                                                                                    <span className="text-xs text-destructive">
                                                                                        ✗ Error
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            )}
                                                            <button
                                                                onClick={() => handleAddQuestion(practice.id)}
                                                                className="w-full py-2 text-sm font-medium text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg transition-colors"
                                                            >
                                                                + Add Question
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                        <button
                                            onClick={() => handleAddPractice(domain.id)}
                                            className="w-full py-3 text-sm font-medium text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg transition-colors border border-dashed border-primary/50"
                                        >
                                            + Add Practice
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Practice Modal */}
            {showPracticeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Add New Practice
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="practice-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Title
                                </label>
                                <input
                                    id="practice-title"
                                    type="text"
                                    value={practiceForm.title}
                                    onChange={(e) => setPracticeForm({ ...practiceForm, title: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Enter practice title"
                                />
                            </div>
                            <div>
                                <label htmlFor="practice-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="practice-description"
                                    value={practiceForm.description}
                                    onChange={(e) => setPracticeForm({ ...practiceForm, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                    placeholder="Enter practice description"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={closeModals}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={submitPractice}
                                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                            >
                                Add Practice
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Question Modal */}
            {showQuestionModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Add New Question
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="question-level" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Level
                                    </label>
                                    <select
                                        id="question-level"
                                        value={questionForm.level}
                                        onChange={(e) => setQuestionForm({ ...questionForm, level: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="1">Level 1</option>
                                        <option value="2">Level 2</option>
                                        <option value="3">Level 3</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="question-stream" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Stream
                                    </label>
                                    <select
                                        id="question-stream"
                                        value={questionForm.stream}
                                        onChange={(e) => setQuestionForm({ ...questionForm, stream: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="A">Stream A</option>
                                        <option value="B">Stream B</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="question-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Question Text
                                </label>
                                <textarea
                                    id="question-text"
                                    value={questionForm.question_text}
                                    onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                    placeholder="Enter question text"
                                />
                            </div>
                            <div>
                                <label htmlFor="question-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description (Optional)
                                </label>
                                <textarea
                                    id="question-description"
                                    value={questionForm.description}
                                    onChange={(e) => setQuestionForm({ ...questionForm, description: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                    placeholder="Enter question description"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={closeModals}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={submitQuestion}
                                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                            >
                                Add Question
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
