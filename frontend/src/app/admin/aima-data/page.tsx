"use client";

import { API_BASE_URL, apiService } from "@/lib/api";
import { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "../../../hooks/useRequireAuth";
import { IconDownload, IconPlus, IconChevronDown, IconChevronRight, IconX } from "@tabler/icons-react";
import { SimplePageSkeleton, Skeleton, AimaDataManagementSkeleton } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { safeRenderHTML, stripHTML } from "@/lib/htmlUtils";
import { ROLES } from "@/lib/constants";

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

export default function AdminQuestions() {
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
  const [industryAnalytics, setIndustryAnalytics] = useState<{
    industries: Array<{ industry: string; count: string; percentage: string }>;
    summary: { total_projects: string; projects_with_industry: string; projects_without_industry: string };
  } | null>(null);
  const [loadingIndustryAnalytics, setLoadingIndustryAnalytics] = useState(true);

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
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState<string>("");
  const [selectedPracticeId, setSelectedPracticeId] = useState<string>("");

  // Form states
  const [domainForm, setDomainForm] = useState({ title: "", description: "", is_premium: false });
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
  const [downloadingEmails, setDownloadingEmails] = useState(false);
  const [submittingDomain, setSubmittingDomain] = useState(false);
  const [submittingPractice, setSubmittingPractice] = useState(false);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  const handleDownloadWaitlistEmails = async () => {
    try {
      setDownloadingEmails(true);
      const response = await apiService.getWaitlistEmails();

      if (response.success && response.data.emails.length > 0) {
        // Convert to CSV format
        const headers = ["Email", "Source", "User Agent", "IP", "Created At"];
        const rows = response.data.emails.map((email) => [
          email.email,
          email.source || "",
          email.user_agent || "",
          email.ip || "",
          new Date(email.created_at).toLocaleString(),
        ]);

        // Create CSV content
        const csvContent = [
          headers.join(","),
          ...rows.map((row) =>
            row
              .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
              .join(","),
          ),
        ].join("\n");

        // Create blob and download
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `waitlist-emails-${new Date().toISOString().split("T")[0]}.csv`,
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("No waitlist emails found.");
      }
    } catch (error) {
      console.error("Error downloading waitlist emails:", error);
      alert("Failed to download waitlist emails. Please try again.");
    } finally {
      setDownloadingEmails(false);
    }
  };

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

  const handleAddDomain = () => {
    setDomainForm({ title: "", description: "", is_premium: false });
    setShowDomainModal(true);
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
    setShowDomainModal(false);
    setShowPracticeModal(false);
    setShowQuestionModal(false);
    setSelectedDomainId("");
    setSelectedPracticeId("");
    setDomainForm({ title: "", description: "", is_premium: false });
    setQuestionForm({ level: "1", stream: "A", question_text: "", description: "" });
  };

  const submitDomain = async () => {
    try {
      setSubmittingDomain(true);
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE_URL}/admin/add-domain`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(domainForm),
      });

      if (response.ok) {
        closeModals();
        window.location.reload();
      } else {
        const error = await response.json();
        console.error(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error("Failed to add domain");
    } finally {
      setSubmittingDomain(false);
    }
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
        window.location.reload();
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
      setSubmittingPractice(true);
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
        closeModals();
        window.location.reload();
      } else {
        const error = await response.json();
        console.error(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error("Failed to add practice");
    } finally {
      setSubmittingPractice(false);
    }
  };

  const submitQuestion = async () => {
    try {
      setSubmittingQuestion(true);
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
        closeModals();
        window.location.reload();
      } else {
        const error = await response.json();
        console.error(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error("Failed to add question");
    } finally {
      setSubmittingQuestion(false);
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
      // Compare with stripped HTML to handle existing HTML-formatted questions
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
    // Don't fetch if still loading auth or not authenticated or not admin
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
          // Filter to only show basic (non-premium) domains
          const basicDomains = data.data.domains.filter(domain => !domain.is_premium);

          // Calculate summary for basic domains only
          const basicPracticesCount = basicDomains.reduce(
            (acc, domain) => acc + domain.practices.length,
            0
          );
          const basicQuestionsCount = basicDomains.reduce(
            (acc, domain) =>
              acc + domain.practices.reduce((pAcc, practice) => pAcc + practice.questions.length, 0),
            0
          );

          setAimaData({
            ...data,
            data: {
              ...data.data,
              domains: sortDomainsByOrder(basicDomains),
              summary: {
                total_domains: basicDomains.length,
                total_practices: basicPracticesCount,
                total_questions: basicQuestionsCount,
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

  // Fetch industry analytics
  useEffect(() => {
    if (authLoading || !isAuthenticated || user?.role !== "ADMIN") {
      return;
    }
    async function fetchIndustryAnalytics() {
      try {
        const data = await apiService.getIndustryAnalytics();
        if (data.success) {
          setIndustryAnalytics(data.data);
        }
      } catch (err) {
        console.error("Error fetching industry analytics:", err);
      } finally {
        setLoadingIndustryAnalytics(false);
      }
    }
    fetchIndustryAnalytics();
  }, [authLoading, isAuthenticated, user?.role]);

  // Note: Auth redirect is handled by useRequireAuth hook
  // Admin role check is handled in the first useEffect above

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
              <h1 className="text-4xl font-bold mb-2 text-primary">
                AIMA Data Management
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage domains, practices, and questions for the AIMA assessment
                framework.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleDownloadWaitlistEmails}
                isLoading={downloadingEmails}
                disabled={downloadingEmails}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium rounded-xl shadow-sm"
              >
                {!downloadingEmails && <IconDownload className="w-5 h-5 mr-2" />}
                {downloadingEmails ? "Downloading..." : "Download Waitlist Emails"}
              </Button>
              <button
                onClick={handleAddDomain}
                className="inline-flex items-center px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-all duration-200 transform hover:scale-105 shadow-sm"
              >
                <IconPlus className="w-5 h-5 mr-2" />
                Add New Domain
              </button>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">
              Summary
            </h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <div className="text-3xl font-bold text-primary">
                  {aimaData.data.summary.total_domains}
                </div>
                <div className="text-muted-foreground font-medium">
                  Domains
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

      {/* Industry Analytics Section */}
      <div className="my-8">
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Industry Analytics
          </h2>
          {loadingIndustryAnalytics ? (
            <div className="text-center py-8 space-y-3">
              <Skeleton variant="circular" width="2rem" height="2rem" className="mx-auto" />
              <Skeleton height="1rem" width="150px" className="mx-auto" />
            </div>
          ) : industryAnalytics ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-primary/10 rounded-xl">
                  <div className="text-2xl font-bold text-primary">
                    {industryAnalytics.summary.total_projects}
                  </div>
                  <div className="text-primary/80 font-medium text-sm">
                    Total Projects
                  </div>
                </div>
                <div className="text-center p-4 bg-success/10 rounded-xl">
                  <div className="text-2xl font-bold text-success">
                    {industryAnalytics.summary.projects_with_industry}
                  </div>
                  <div className="text-success-foreground font-medium text-sm">
                    With Industry
                  </div>
                </div>
                <div className="text-center p-4 bg-warning/10 rounded-xl">
                  <div className="text-2xl font-bold text-warning">
                    {industryAnalytics.summary.projects_without_industry}
                  </div>
                  <div className="text-warning-foreground font-medium text-sm">
                  </div>
                </div>
              </div>

              {/* Industry Distribution */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Industry Distribution
                </h3>
                <div className="space-y-3">
                  {industryAnalytics.industries.length > 0 ? (
                    industryAnalytics.industries.map((item, index) => {
                      const count = parseInt(item.count);
                      const percentage = parseFloat(item.percentage);
                      return (
                        <div
                          key={index}
                          className="bg-muted/30 rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-foreground">
                              {item.industry || "Not Specified"}
                            </span>
                            <div className="flex items-center space-x-4">
                              <span className="text-sm font-semibold text-muted-foreground">
                                {count} projects
                              </span>
                              <span className="text-sm font-semibold text-primary">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No industry data available yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Failed to load industry analytics.</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {aimaData.data.domains.map((domain) => (
          <div
            key={domain.id}
            className="bg-card backdrop-blur-sm border border-border rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {/* Domain Header - Always Visible */}
            <div
              className="p-6 cursor-pointer hover:bg-muted/50 transition-all duration-200 rounded-2xl"
              onClick={() => toggleDomain(domain.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {expandedDomains.has(domain.id) ? (
                        <IconChevronDown className="w-5 h-5 text-primary transition-transform duration-200" />
                      ) : (
                        <IconChevronRight className="w-5 h-5 text-muted-foreground transition-transform duration-200" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-xl font-semibold text-foreground">
                          {domain.title}
                        </h2>
                        {domain.is_premium && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning text-warning-foreground shadow-sm">
                            ⭐ Premium
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm mt-1">
                        {domain.description}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDomainPremium(domain.id, domain.is_premium);
                    }}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${domain.is_premium
                      ? "bg-warning/20 text-warning hover:bg-warning/30"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    title={domain.is_premium ? "Click to remove premium status" : "Click to mark as premium"}
                  >
                    {domain.is_premium ? "⭐ Premium" : "Mark as Premium"}
                  </button>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                    {domain.practices.length} practices
                  </span>
                </div>
              </div>
            </div>

            {/* Practices - Collapsible */}
            {expandedDomains.has(domain.id) && (
              <div className="border-t border-border">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-foreground">
                      Practices
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddPractice(domain.id);
                      }}
                      className="inline-flex items-center px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium rounded-md transition-colors"
                    >
                      <IconPlus className="w-3 h-3 mr-1" />
                      Add Practice
                    </button>
                  </div>
                  <div className="space-y-4">
                    {domain.practices.map((practice) => (
                      <div
                        key={practice.id}
                        className="border border-border rounded-lg bg-secondary/30"
                      >
                        {/* Practice Header */}
                        <div
                          className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => togglePractice(practice.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                {expandedPractices.has(practice.id) ? (
                                  <IconChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <IconChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h3 className="text-lg font-medium text-foreground">
                                    {practice.title}
                                  </h3>
                                  {aimaData?.data.domains.find(d => d.id === practice.domain_id)?.is_premium && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-warning text-warning-foreground shadow-sm">
                                      ⭐ Premium
                                    </span>
                                  )}
                                </div>
                                <p className="text-muted-foreground text-sm mt-1">
                                  {practice.description}
                                </p>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {practice.questions.length} questions
                            </div>
                          </div>
                        </div>

                        {/* Questions - Collapsible */}
                        {expandedPractices.has(practice.id) && (
                          <div className="border-t border-border p-4 bg-muted/20">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-medium text-foreground">
                                Questions
                              </h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddQuestion(practice.id);
                                }}
                                className="inline-flex items-center px-2.5 py-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium rounded transition-colors"
                              >
                                <IconPlus className="w-3 h-3 mr-1" />
                                Add Question
                              </button>
                            </div>
                            <div className="space-y-3">
                              {practice.questions.map((question) => {
                                const descriptionValue = getQuestionDescriptionValue(question);
                                const originalDescription = question.description ?? "";
                                const descriptionChanged = descriptionValue !== originalDescription;
                                const isSaving = !!savingDescriptions[question.id];
                                const status = descriptionStatus[question.id];
                                const isEditingQuestion = !!editingQuestions[question.id];
                                const questionTextValue =
                                  questionTextEdits[question.id] ?? stripHTML(question.question_text);
                                const questionLevelValue =
                                  questionLevelEdits[question.id] ?? question.level;
                                const questionStreamValue =
                                  questionStreamEdits[question.id] ?? question.stream;
                                const questionTextChanged =
                                  questionTextEdits[question.id] !== undefined &&
                                  questionTextValue.trim() !== stripHTML(question.question_text).trim();
                                const questionLevelChanged =
                                  questionLevelEdits[question.id] !== undefined &&
                                  questionLevelValue !== question.level;
                                const questionStreamChanged =
                                  questionStreamEdits[question.id] !== undefined &&
                                  questionStreamValue !== question.stream;
                                const hasQuestionChanges =
                                  questionTextChanged || questionLevelChanged || questionStreamChanged;
                                const isSavingQuestionUpdate = !!savingQuestionUpdates[question.id];
                                const questionUpdateFeedback = questionUpdateStatus[question.id];

                                return (
                                  <div
                                    key={question.id}
                                    className="bg-card rounded-lg p-4 border border-border"
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                                        {(() => {
                                          const domain = aimaData?.data.domains.find(d => d.id === practice.domain_id);
                                          const isPremium = domain?.is_premium || false;
                                          return isPremium ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-warning text-warning-foreground shadow-sm">
                                              ⭐ Premium
                                            </span>
                                          ) : null;
                                        })()}
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                          Level {isEditingQuestion ? questionLevelValue : question.level}
                                        </span>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                          Stream {isEditingQuestion ? questionStreamValue : question.stream}
                                        </span>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                          Q{question.question_index + 1}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        {isEditingQuestion && (
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              cancelEditingQuestion(question.id);
                                            }}
                                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
                                          >
                                            Cancel
                                          </button>
                                        )}
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (isEditingQuestion) {
                                              handleQuestionUpdate(question);
                                            } else {
                                              startEditingQuestion(question);
                                            }
                                          }}
                                          disabled={
                                            isEditingQuestion &&
                                            (!hasQuestionChanges ||
                                              (questionTextChanged && !questionTextValue.trim()) ||
                                              isSavingQuestionUpdate)
                                          }
                                          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${isEditingQuestion
                                            ? !hasQuestionChanges ||
                                              (questionTextChanged && !questionTextValue.trim()) ||
                                              isSavingQuestionUpdate
                                              ? "bg-muted text-muted-foreground cursor-not-allowed"
                                              : "bg-primary text-primary-foreground hover:bg-primary/90"
                                            : "bg-primary/10 text-primary hover:bg-primary/20"
                                            }`}
                                        >
                                          {isEditingQuestion
                                            ? isSavingQuestionUpdate
                                              ? "Saving..."
                                              : "Save Changes"
                                            : "Edit Question"}
                                        </button>
                                      </div>
                                    </div>
                                    {isEditingQuestion && (
                                      <div className="grid grid-cols-2 gap-3 mb-3 mt-2">
                                        <div>
                                          <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                            Level
                                          </label>
                                          <select
                                            value={questionLevelValue}
                                            onChange={(e) =>
                                              setQuestionLevelEdits((prev) => ({
                                                ...prev,
                                                [question.id]: e.target.value,
                                              }))
                                            }
                                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all duration-200"
                                          >
                                            <option value="1">Level 1</option>
                                            <option value="2">Level 2</option>
                                            <option value="3">Level 3</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                            Stream
                                          </label>
                                          <select
                                            value={questionStreamValue}
                                            onChange={(e) =>
                                              setQuestionStreamEdits((prev) => ({
                                                ...prev,
                                                [question.id]: e.target.value,
                                              }))
                                            }
                                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all duration-200"
                                          >
                                            <option value="A">Stream A</option>
                                            <option value="B">Stream B</option>
                                          </select>
                                        </div>
                                      </div>
                                    )}
                                    {isEditingQuestion ? (
                                      <textarea
                                        value={stripHTML(questionTextValue)}
                                        onChange={(e) =>
                                          setQuestionTextEdits((prev) => ({
                                            ...prev,
                                            [question.id]: e.target.value,
                                          }))
                                        }
                                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all duration-200"
                                        rows={4}
                                        placeholder="Update the question text..."
                                      />
                                    ) : (
                                      <p className="text-card-foreground leading-relaxed">
                                        {stripHTML(question.question_text)}
                                      </p>
                                    )}
                                    {questionUpdateFeedback === "saved" && (
                                      <p className="text-xs text-success mt-1">
                                        Question updated
                                      </p>
                                    )}
                                    {questionUpdateFeedback === "error" && (
                                      <p className="text-xs text-destructive mt-1">
                                        Failed to save question. Please try again.
                                      </p>
                                    )}

                                    <div className="mt-4 space-y-3">
                                      <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                                          Description (guide text)
                                        </label>
                                        <RichTextEditor
                                          value={descriptionValue}
                                          onChange={(value) =>
                                            handleQuestionDescriptionChange(
                                              question.id,
                                              value,
                                            )
                                          }
                                          className="w-full"
                                          rows={3}
                                          placeholder="Add guidance text to help users interpret this question..."
                                        />
                                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                          <span>Shown directly under this question in assessments.</span>
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              handleQuestionDescriptionSave(question);
                                            }}
                                            disabled={!descriptionChanged || isSaving}
                                            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!descriptionChanged || isSaving
                                              ? "bg-muted text-muted-foreground cursor-not-allowed"
                                              : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                                              }`}
                                          >
                                            {isSaving ? "Saving..." : "Save Description"}
                                          </button>
                                        </div>
                                      </div>

                                      <div className="rounded-lg border border-dashed border-border bg-muted/40 p-3 text-sm">
                                        {descriptionValue ? (
                                          <div
                                            className="rich-text-preview text-muted-foreground [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:mb-1 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_a]:text-primary [&_a]:underline [&_p]:mb-2 [&_p:last-child]:mb-0"
                                            dangerouslySetInnerHTML={{ __html: safeRenderHTML(descriptionValue) }}
                                          />
                                        ) : (
                                          <span className="text-muted-foreground">No description yet. This preview matches what respondents will see.</span>
                                        )}
                                      </div>

                                      {status === "saved" && (
                                        <p className="text-xs text-success">
                                          Description saved
                                        </p>
                                      )}
                                      {status === "error" && (
                                        <p className="text-xs text-destructive">
                                          Failed to save description. Please try again.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Domain/Practice Modal */}
      {
        (showDomainModal || showPracticeModal) && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">
                  {showDomainModal ? "Add New Domain" : "Add New Practice"}
                </h2>
                <button
                  onClick={closeModals}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
                >
                  <IconX className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor={showDomainModal ? "title-input-domain" : "title-input-practice"}
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Title
                  </label>
                  <input
                    id={showDomainModal ? "title-input-domain" : "title-input-practice"}
                    type="text"
                    value={
                      showDomainModal ? domainForm.title : practiceForm.title
                    }
                    onChange={(e) => {
                      if (showDomainModal) {
                        setDomainForm({ ...domainForm, title: e.target.value });
                      } else {
                        setPracticeForm({
                          ...practiceForm,
                          title: e.target.value,
                        });
                      }
                    }}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground transition-all duration-200"
                    placeholder={
                      showDomainModal ? "Domain title" : "Practice title"
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor={showDomainModal ? "description-input-domain" : "description-input-practice"}
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Description
                  </label>
                  <textarea
                    id={showDomainModal ? "description-input-domain" : "description-input-practice"}
                    value={
                      showDomainModal
                        ? domainForm.description
                        : practiceForm.description
                    }
                    onChange={(e) => {
                      if (showDomainModal) {
                        setDomainForm({
                          ...domainForm,
                          description: e.target.value,
                        });
                      } else {
                        setPracticeForm({
                          ...practiceForm,
                          description: e.target.value,
                        });
                      }
                    }}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground transition-all duration-200 resize-none"
                    rows={3}
                    placeholder={
                      showDomainModal
                        ? "Domain description (optional)"
                        : "Practice description (optional)"
                    }
                  />
                </div>

                {showDomainModal && (
                  <div className="flex items-center space-x-3 p-4 bg-warning/10 border border-warning/20 rounded-xl">
                    <input
                      type="checkbox"
                      id="is_premium"
                      checked={domainForm.is_premium}
                      onChange={(e) =>
                        setDomainForm({
                          ...domainForm,
                          is_premium: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-warning border-border rounded focus:ring-warning focus:ring-2"
                    />
                    <label
                      htmlFor="is_premium"
                      className="text-sm font-medium text-foreground cursor-pointer flex-1"
                    >
                      <span className="font-semibold text-warning">⭐ Premium Domain</span>
                      <span className="block text-xs text-muted-foreground mt-1">
                        Mark this domain as premium. All practices and questions under this domain will be considered premium and only visible to premium users.
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={closeModals}
                  className="px-6 py-3 text-muted-foreground bg-secondary hover:bg-secondary/80 rounded-xl font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <Button
                  onClick={showDomainModal ? submitDomain : submitPractice}
                  isLoading={showDomainModal ? submittingDomain : submittingPractice}
                  className={`px-6 py-3 text-primary-foreground rounded-xl font-medium shadow-lg hover:shadow-primary/25 ${showDomainModal
                    ? "bg-primary hover:bg-primary/90"
                    : "bg-primary hover:bg-primary/90"
                    }`}
                >
                  {showDomainModal ? (submittingDomain ? "Adding..." : "Add Domain") : (submittingPractice ? "Adding..." : "Add Practice")}
                </Button>
              </div>
            </div>
          </div>
        )
      }

      {/* Question Modal */}
      {
        showQuestionModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">
                  Add New Question
                </h2>
                <button
                  onClick={closeModals}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
                >
                  <IconX className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Level
                    </label>
                    <select
                      value={questionForm.level}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          level: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-input bg-background text-foreground transition-all duration-200"
                    >
                      <option value="1">Level 1</option>
                      <option value="2">Level 2</option>
                      <option value="3">Level 3</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Stream
                    </label>
                    <select
                      value={questionForm.stream}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          stream: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground transition-all duration-200"
                    >
                      <option value="A">Stream A</option>
                      <option value="B">Stream B</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Question Text
                  </label>
                  <textarea
                    value={questionForm.question_text}
                    onChange={(e) =>
                      setQuestionForm({
                        ...questionForm,
                        question_text: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground transition-all duration-200 resize-none"
                    rows={4}
                    placeholder="Enter the question text..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description (optional)
                  </label>
                  <RichTextEditor
                    value={questionForm.description}
                    onChange={(value) =>
                      setQuestionForm({
                        ...questionForm,
                        description: value,
                      })
                    }
                    className="w-full"
                    rows={3}
                    placeholder="Add guidance to help users interpret this question..."
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    This text appears under the question for respondents.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={closeModals}
                  className="px-6 py-3 text-muted-foreground bg-secondary hover:bg-secondary/80 rounded-xl font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <Button
                  onClick={submitQuestion}
                  isLoading={submittingQuestion}
                  className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium shadow-lg hover:shadow-primary/25"
                >
                  {submittingQuestion ? "Adding..." : "Add Question"}
                </Button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
