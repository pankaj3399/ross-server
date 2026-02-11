"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { useAssessmentResultsStore } from "../../store/assessmentResultsStore";
import { apiService } from "../../lib/api";
import { motion } from "framer-motion";
import {
  IconArrowLeft,
  IconTrophy,
  IconStar,
  IconSparkles,
  IconBrain,
  IconLock,
  IconChevronRight,
  IconDownload,
  IconLoader,
  IconTrendingUp,
  IconAlertTriangle,
  IconListCheck,
  IconCheck
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { PieChart, Cell, ResponsiveContainer, Pie } from "recharts";
import { ReportSkeleton, Skeleton } from "../../components/Skeleton";
import { usePdfReport } from "../../hooks/usePdfReport";

// Helper to parse insight text into structured sections
const parseInsightText = (text: string) => {
  const sections = {
    analysis: "",
    strengths: "",
    improvements: "",
    recommendations: [] as string[]
  };

  if (!text) return sections;

  // Patterns to look for section headers
  // Using [\s\S]*? instead of .*? to match across newlines (ES5 compatible)
  const analysisPattern = /(?:Current Performance Analysis|Analysis|1\.\s*A brief analysis[^:]+):?\s*([\s\S]*?)(?=(?:Key strengths|Strengths|2\.|Areas|Specific|$))/i;
  const strengthsPattern = /(?:Key strengths|Strengths|2\.\s*Key strengths[^:]+):?\s*([\s\S]*?)(?=(?:Areas|Improvements|3\.|Specific|$))/i;
  const improvementsPattern = /(?:Areas that need improvement|Areas for Improvement|3\.\s*Areas[^:]+):?\s*([\s\S]*?)(?=(?:Specific|Actionable|Recommendations|4\.)|$)/i;
  const recommendationsPattern = /(?:Specific actionable recommendations|Actionable Recommendations|Recommendations|4\.\s*Specific[^:]+):?\s*([\s\S]*)/i;

  const analysisMatch = text.match(analysisPattern);
  const strengthsMatch = text.match(strengthsPattern);
  const improvementsMatch = text.match(improvementsPattern);
  const recommendationsMatch = text.match(recommendationsPattern);

  if (analysisMatch) sections.analysis = analysisMatch[1].trim();
  else if (!strengthsMatch && !improvementsMatch) sections.analysis = text; // Fallback if no headers found

  if (strengthsMatch) sections.strengths = strengthsMatch[1].trim();

  if (improvementsMatch) sections.improvements = improvementsMatch[1].trim();

  if (recommendationsMatch) {
    const rawRecs = recommendationsMatch[1].trim();
    // Split by numbered lists (1., 2.) or bullets (-, •)
    sections.recommendations = rawRecs
      .split(/(?:\r\n|\r|\n)?(?:\d+\.|-|\u2022)\s+/)
      .map(r => r.trim())
      .filter(r => r.length > 0);
  }

  return sections;
};

// Performance variants mapped to Tailwind classes
const PERFORMANCE_VARIANTS = {
  excellent: {
    text: "text-success",
    bg: "bg-success/20",
    border: "border-success/30",
    fill: "fill-success",
    color: "var(--success)"
  },
  good: {
    text: "text-chart-4",
    bg: "bg-chart-4/20",
    border: "border-chart-4/30",
    fill: "fill-chart-4",
    color: "var(--chart-4)"
  },
  average: {
    text: "text-warning",
    bg: "bg-warning/20",
    border: "border-warning/30",
    fill: "fill-warning",
    color: "var(--warning)"
  },
  poor: {
    text: "text-destructive",
    bg: "bg-destructive/20",
    border: "border-destructive/30",
    fill: "fill-destructive",
    color: "var(--destructive)"
  },
};

export default function ScoreReportPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { loading: authLoading } = useRequireAuth();
  const { getProjectResults } = useAssessmentResultsStore();
  const reportRef = useRef<HTMLDivElement>(null);

  // Check if user is premium
  const isUserPremium = user?.subscription_status === "basic_premium" || user?.subscription_status === "pro_premium";

  const projectId = searchParams.get("projectId");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [insights, setInsights] = useState<Record<string, string>>({});
  const [premiumDomainIds, setPremiumDomainIds] = useState<Set<string>>(new Set());

  const { exportPdf, isExporting } = usePdfReport({
    reportRef,
    fileName: `premium-score-report-${projectId}.pdf`,
    reportTitle: "Premium Assessment Score Report",
    projectName: results?.project?.name,
    generatedAt: results?.submittedAt
  });

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      return;
    }

    if (!projectId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      // 1. Get Results
      const projectResults = getProjectResults(projectId);
      if (projectResults) {
        setResults(projectResults);
      }

      // 2. Get Domain Details to check for premium status
      try {
        const domainsData = await apiService.getDomainsFull(projectId);
        const premiumIds = new Set(
          domainsData.domains
            .filter((d: any) => d.is_premium)
            .map((d: any) => d.id)
        );
        setPremiumDomainIds(premiumIds);
      } catch (error) {
        console.error("Failed to fetch domain details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, isAuthenticated, authLoading, router, getProjectResults]);

  // Auto-generate insights when page loads - ONLY FOR PREMIUM USERS
  useEffect(() => {
    if (!projectId || !results || loading || !isUserPremium) return;

    // Don't regenerate if insights already exist in results
    const hasExistingInsights = results.results.domains.some((domain: any) => domain.insights);
    if (hasExistingInsights) {
      // If insights exist in results, populate the insights state
      const existingInsights: Record<string, string> = {};
      results.results.domains.forEach((domain: any) => {
        if (domain.insights) {
          existingInsights[domain.domainId] = domain.insights;
        }
      });
      if (Object.keys(existingInsights).length > 0) {
        setInsights(existingInsights);
      }
      return;
    }

    let pollInterval: NodeJS.Timeout | null = null;
    let safetyTimeout: NodeJS.Timeout | null = null;

    const generateInsights = async () => {
      setGeneratingInsights(true);
      try {
        const response = await apiService.generateDomainInsights(projectId);

        // CASE 1: Instant results (cached)
        if (response.success && response.insights && response.status === 'completed') {
          setInsights(response.insights);
          updateResultsWithInsights(response.insights);
          setGeneratingInsights(false);
          return;
        }

        // CASE 2: Background job started
        if (response.success && response.jobId && response.status === 'processing') {
          const jobId = response.jobId;

          // Poll every 2 seconds
          pollInterval = setInterval(async () => {
            try {
              const jobStatus = await apiService.getInsightsJobStatus(projectId, jobId);

              if (jobStatus.status === 'completed' && jobStatus.insights) {
                if (pollInterval) clearInterval(pollInterval);
                if (safetyTimeout) clearTimeout(safetyTimeout);
                setInsights(jobStatus.insights);
                updateResultsWithInsights(jobStatus.insights);
                setGeneratingInsights(false);
              } else if (jobStatus.status === 'failed') {
                if (pollInterval) clearInterval(pollInterval);
                if (safetyTimeout) clearTimeout(safetyTimeout);
                setGeneratingInsights(false);
                console.error("Insights generation job failed:", jobStatus.error);
              }
            } catch (pollError) {
              console.error("Error polling insights status:", pollError);
              if (pollInterval) clearInterval(pollInterval);
              if (safetyTimeout) clearTimeout(safetyTimeout);
              setGeneratingInsights(false);
            }
          }, 2000); // Poll every 2 seconds

          // Safety timeout after 5 minutes
          safetyTimeout = setTimeout(() => {
            if (pollInterval) clearInterval(pollInterval);
            if (safetyTimeout) clearTimeout(safetyTimeout);
            setGeneratingInsights(false);
          }, 300000);
        } else {
          // Fallback/Error case
          setGeneratingInsights(false);
        }

      } catch (error) {
        console.error("Error generating insights:", error);
        setGeneratingInsights(false);
      }
    };

    const updateResultsWithInsights = (newInsights: Record<string, string>) => {
      const updatedDomains = results.results.domains.map((domain: any) => {
        if (newInsights[domain.domainId]) {
          return {
            ...domain,
            insights: newInsights[domain.domainId]
          };
        }
        return domain;
      });

      // Use functional update to ensure we have latest state if needed, 
      // though here 'results' from closure is likely fine due to dependency array
      setResults((prevResults: any) => ({
        ...prevResults,
        results: {
          ...prevResults.results,
          domains: updatedDomains
        }
      }));
    };

    generateInsights();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (safetyTimeout) clearTimeout(safetyTimeout);
    };
  }, [projectId, results, loading, isUserPremium]);

  if (loading) {
    return <ReportSkeleton />;
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted transition-colors duration-300">
        <div className="text-center p-8 bg-card backdrop-blur-lg rounded-3xl border border-border shadow-xl">
          <h1 className="text-3xl font-bold text-foreground mb-4">No Results Found</h1>
          <p className="text-muted-foreground mb-8 text-lg">Assessment results not found for this project.</p>
          <Button
            onClick={() => router.push(`/assess/${projectId}/premium-domains`)}
            disabled={!projectId}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back to Assessment
          </Button>
        </div>
      </div>
    );
  }

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 80) return { level: "Excellent", ...PERFORMANCE_VARIANTS.excellent };
    if (percentage >= 60) return { level: "Good", ...PERFORMANCE_VARIANTS.good };
    if (percentage >= 40) return { level: "Average", ...PERFORMANCE_VARIANTS.average };
    return { level: "Needs Improvement", ...PERFORMANCE_VARIANTS.poor };
  };

  // Show all domains for premium users (backend already filters non-visible domains)
  // But we want to ensure we're showing the full report
  const displayDomains = results.results.domains;

  // Calculate overall score for all displayed domains
  const overallStats = displayDomains.reduce(
    (acc: { totalCorrectAnswers: number; totalQuestions: number }, domain: any) => {

      acc.totalCorrectAnswers += domain.correctAnswers;
      acc.totalQuestions += domain.totalQuestions;
      return acc;
    },
    { totalCorrectAnswers: 0, totalQuestions: 0 }
  );

  const overallPercentage = overallStats.totalQuestions > 0
    ? Math.round((overallStats.totalCorrectAnswers / overallStats.totalQuestions) * 100 * 100) / 100
    : 0;

  const performance = getPerformanceLevel(overallPercentage);

  // Prepare data for charts - using premium domains only
  const overallPieData = [
    {
      name: "Correct",
      value: overallStats.totalCorrectAnswers,
      color: PERFORMANCE_VARIANTS.excellent.color,
      fill: PERFORMANCE_VARIANTS.excellent.color
    },
    {
      name: "Incorrect",
      value: overallStats.totalQuestions - overallStats.totalCorrectAnswers,
      color: PERFORMANCE_VARIANTS.poor.color,
      fill: PERFORMANCE_VARIANTS.poor.color
    },
  ];

  // Filter domains that have insights
  const domainsWithInsights = displayDomains.filter((domain: any) =>
    insights[domain.domainId]
  );

  return (
    <div ref={reportRef} className="min-h-screen bg-background text-foreground selection:bg-primary/30 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex justify-between items-center mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push(`/assess/${projectId}/premium-domains`)}
              className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors pl-0 hover:bg-transparent hide-in-pdf"
            >
              <div className="p-2 rounded-full bg-muted group-hover:bg-muted/80 transition-colors">
                <IconArrowLeft className="w-5 h-5" />
              </div>
              <span className="font-medium">Back to Assessment</span>
            </Button>

            <Button
              onClick={exportPdf}
              disabled={isExporting}
              className="group flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hide-in-pdf"
            >
              {isExporting ? (
                <IconLoader className="w-5 h-5 animate-spin" />
              ) : (
                <IconDownload className="w-5 h-5" />
              )}
              <span className="font-medium">{isExporting ? "Generating PDF..." : "Download Report"}</span>
            </Button>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 pb-1 leading-relaxed">
                Premium Assessment Report
              </h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="text-xl font-medium text-foreground">{results.project.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                <span>{new Date(results.submittedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            {!isUserPremium && (
              <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-warning/10 border border-warning/20 text-warning shadow-sm">
                <IconLock className="w-5 h-5" />
                <span className="font-medium">Unlock AI Insights with Premium</span>
                <Button
                  size="sm"
                  onClick={() => router.push(`/assess/${projectId}/premium-features`)}
                  className="ml-2 px-4 py-1.5 rounded-lg bg-warning hover:bg-warning/90 text-warning-foreground font-bold text-sm transition-colors shadow-md hover:shadow-lg"
                >
                  Upgrade
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Overall Performance */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1 space-y-8"
          >
            <div className="relative overflow-hidden rounded-[2.5rem] bg-card border border-border p-8 shadow-xl">
              <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10">
                <IconTrophy className="w-32 h-32 text-foreground" />
              </div>

              <div className="relative z-10">
                <h2 className="text-xl font-semibold text-muted-foreground mb-8 flex items-center gap-2">
                  <IconTrophy className="w-5 h-5 text-warning" />
                  Overall Score
                </h2>

                <div className="flex flex-col items-center justify-center mb-8">
                  <div className="relative w-64 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={overallPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={85}
                          outerRadius={110}
                          dataKey="value"
                          startAngle={90}
                          endAngle={450}
                          stroke="none"
                          cornerRadius={10}
                          paddingAngle={5}
                        >
                          {overallPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pdf-overall-score-container">
                      <span className="text-6xl font-bold text-foreground tracking-tight py-1 leading-normal pdf-overall-score-value">
                        {overallPercentage.toFixed(0)}%
                      </span>
                      <span className="text-sm font-medium text-muted-foreground mt-1 pdf-overall-score-label">Total Score</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-5 rounded-2xl bg-muted border border-border">
                    <span className="text-muted-foreground font-medium">Performance Level</span>
                    <div
                      className={`flex items-center font-medium text-sm ${performance.text} whitespace-nowrap`}
                    >
                      {performance.level}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 p-5 rounded-2xl bg-muted border border-border">
                    <span className="text-muted-foreground font-medium">Correct Answers</span>
                    <span className="font-semibold text-foreground whitespace-nowrap">
                      {overallStats.totalCorrectAnswers} <span className="text-muted-foreground">/ {overallStats.totalQuestions}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Domain Performance & Insights */}
          <div className="lg:col-span-2 flex flex-col">
            {/* Domain Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col h-full"
            >
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3 flex-shrink-0">
                <div className="w-1 h-8 rounded-full bg-primary" />
                Domain Breakdown
              </h2>

              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {displayDomains.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayDomains.map((domain: any, index: number) => {
                      const domainPerformance = getPerformanceLevel(domain.percentage);

                      return (
                        <motion.div
                          key={domain.domainId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.1 * index }}
                          className="group relative overflow-hidden rounded-3xl bg-card hover:bg-muted border border-border p-6 transition-all duration-300 shadow-sm hover:shadow-md break-inside-avoid"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg text-foreground pr-2 break-words" title={domain.domainTitle}>
                                {domain.domainTitle}
                              </h3>
                              {premiumDomainIds.has(domain.domainId) && (
                                <div className="px-2 py-0.5 rounded-full bg-primary/10 text-xs font-medium text-primary border border-primary/30">
                                  Premium
                                </div>
                              )}
                            </div>
                            <div
                              className={`flex items-center justify-center w-12 h-12 rounded-full bg-muted font-bold border pdf-percentage-circle ${domainPerformance.border} ${domainPerformance.text}`}
                            >
                              {domain.percentage.toFixed(0)}%
                            </div>
                          </div>

                          <div className="w-full bg-muted rounded-full h-2 mb-4 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${domainPerformance.bg.replace('/20', '')}`}
                              style={{ width: `${domain.percentage}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{domain.correctAnswers}/{domain.totalQuestions} Correct</span>
                            <span className={`font-medium ${domainPerformance.text}`}>
                              {domainPerformance.level}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/50 rounded-3xl border border-border">
                    <p className="text-muted-foreground">
                      No domains found in this assessment.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* AI Insights Section - Conditional Rendering */}
        <div className="mt-12 hide-in-pdf">
          {isUserPremium ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="relative overflow-hidden rounded-[2.5rem] bg-primary/5 border border-primary/20 p-8 shadow-lg"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 dark:opacity-20">
                <IconBrain className="w-64 h-64 text-primary" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <IconSparkles className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">AI Strategic Insights</h2>
                </div>
                <p className="text-muted-foreground mb-8 ml-14">
                  {generatingInsights
                    ? "Analyzing your performance data to generate personalized recommendations..."
                    : "Tailored strategic recommendations for your assessment."}
                </p>

                {generatingInsights && Object.keys(insights).length === 0 ? (
                  <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : domainsWithInsights.length > 0 ? (
                  <div className="grid gap-6">
                    {domainsWithInsights.map((domain: any, index: number) => {
                      const analysis = parseInsightText(insights[domain.domainId]);

                      return (
                        <motion.div
                          key={domain.domainId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          className="rounded-3xl bg-card border border-primary/10 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                        >
                          <div className="p-6 border-b border-border/50 bg-muted/30">
                            <div className="flex items-center gap-3">
                              <h3 className="text-xl font-bold text-foreground">
                                {domain.domainTitle}
                              </h3>
                              <div className="px-2.5 py-0.5 rounded-full bg-primary/10 text-xs font-semibold text-primary border border-primary/20">
                                Premium Analysis
                              </div>
                            </div>
                          </div>

                          <div className="p-6 space-y-6">
                            {/* Analysis Section */}
                            {analysis.analysis && (
                              <div className="space-y-2">
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                  <IconTrendingUp className="w-4 h-4" />
                                  Current Analysis
                                </h4>
                                <p className="text-foreground leading-relaxed">
                                  {analysis.analysis}
                                </p>
                              </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-6">
                              {/* Strengths */}
                              {analysis.strengths && (
                                <div className="space-y-3 bg-success/5 p-4 rounded-2xl border border-success/10">
                                  <h4 className="flex items-center gap-2 text-sm font-bold text-success uppercase tracking-wider">
                                    <IconCheck className="w-4 h-4" />
                                    Key Strengths
                                  </h4>
                                  <p className="text-sm text-foreground/90 leading-relaxed">
                                    {analysis.strengths}
                                  </p>
                                </div>
                              )}

                              {/* Areas for Improvement */}
                              {analysis.improvements && (
                                <div className="space-y-3 bg-warning/5 p-4 rounded-2xl border border-warning/10">
                                  <h4 className="flex items-center gap-2 text-sm font-bold text-warning uppercase tracking-wider">
                                    <IconAlertTriangle className="w-4 h-4" />
                                    Areas for Improvement
                                  </h4>
                                  <p className="text-sm text-foreground/90 leading-relaxed">
                                    {analysis.improvements}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Recommendations */}
                            {analysis.recommendations && analysis.recommendations.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wider">
                                  <IconListCheck className="w-5 h-5" />
                                  Strategic Recommendations
                                </h4>
                                <div className="grid gap-3">
                                  {analysis.recommendations.map((rec, i) => (
                                    <div key={i} className="flex gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                                        {i + 1}
                                      </span>
                                      <p className="text-sm text-foreground leading-snug pt-0.5">
                                        {rec}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : !generatingInsights ? (
                  <div className="text-center py-12 bg-muted/50 rounded-3xl border border-border">
                    <p className="text-muted-foreground">
                      {displayDomains.length > 0
                        ? "No specific insights generated for your domains."
                        : "You don't have enough data in this assessment."}
                    </p>
                  </div>
                ) : null}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="relative overflow-hidden rounded-[2.5rem] bg-muted border border-border p-8 text-center"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-muted/50 pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-6 shadow-md">
                  <IconLock className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Unlock Premium Insights</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                  Upgrade to Premium to get detailed AI-powered strategic recommendations tailored to your assessment results.
                </p>
                <Button
                  onClick={() => router.push(`/assess/${projectId}/premium-features`)}
                  className="group flex items-center gap-2 px-8 py-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Upgrade Now
                  <IconChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}