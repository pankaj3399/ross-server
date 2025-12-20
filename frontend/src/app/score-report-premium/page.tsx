"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { useAssessmentResultsStore } from "../../store/assessmentResultsStore";
import { apiService } from "../../lib/api";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Trophy,
  Star,
  Sparkles,
  Brain,
  Lock,
  ChevronRight
} from "lucide-react";
import { PieChart, Cell, ResponsiveContainer, Pie } from "recharts";
import { ReportSkeleton, Skeleton } from "../../components/Skeleton";

const PERFORMANCE_COLORS = {
  excellent: "#10B981", // Green
  good: "#84CC16", // Lime
  average: "#F59E0B", // Amber
  poor: "#EF4444", // Red
};

export default function ScoreReportPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { loading: authLoading } = useRequireAuth();
  const { getProjectResults } = useAssessmentResultsStore();

  // Check if user is premium
  const isUserPremium = user?.subscription_status === "basic_premium" || user?.subscription_status === "pro_premium";

  const projectId = searchParams.get("projectId");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [insights, setInsights] = useState<Record<string, string>>({});
  const [premiumDomainIds, setPremiumDomainIds] = useState<Set<string>>(new Set());

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

    const generateInsights = async () => {
      setGeneratingInsights(true);
      try {
        const response = await apiService.generateDomainInsights(projectId);

        if (response.success && response.insights) {
          setInsights(response.insights);

          // Update results with insights
          const updatedDomains = results.results.domains.map((domain: any) => {
            if (response.insights[domain.domainId]) {
              return {
                ...domain,
                insights: response.insights[domain.domainId]
              };
            }
            return domain;
          });

          setResults({
            ...results,
            results: {
              ...results.results,
              domains: updatedDomains
            }
          });
        }
      } catch (error) {
        console.error("Error generating insights:", error);
      } finally {
        setGeneratingInsights(false);
      }
    };

    generateInsights();
  }, [projectId, results, loading, isUserPremium]);

  if (loading) {
    return <ReportSkeleton />;
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 transition-colors duration-300">
        <div className="text-center p-8 bg-white dark:bg-white/5 backdrop-blur-lg rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl dark:shadow-2xl">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">No Results Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">Assessment results not found for this project.</p>
          <button
            onClick={() => router.push(`/assess/${projectId}/premium-domains`)}
            className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
          >
            Back to Assessment
          </button>
        </div>
      </div>
    );
  }

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 80) return { level: "Excellent", color: PERFORMANCE_COLORS.excellent };
    if (percentage >= 60) return { level: "Good", color: PERFORMANCE_COLORS.good };
    if (percentage >= 40) return { level: "Average", color: PERFORMANCE_COLORS.average };
    return { level: "Needs Improvement", color: PERFORMANCE_COLORS.poor };
  };

  // Filter to show only premium domains
  const premiumDomains = results.results.domains.filter((domain: any) =>
    premiumDomainIds.has(domain.domainId)
  );

  // Calculate overall score for premium domains only
  const premiumOverall = premiumDomains.reduce(
    (acc: { totalCorrectAnswers: number; totalQuestions: number }, domain: any) => {
      acc.totalCorrectAnswers += domain.correctAnswers;
      acc.totalQuestions += domain.totalQuestions;
      return acc;
    },
    { totalCorrectAnswers: 0, totalQuestions: 0 }
  );

  const premiumOverallPercentage = premiumOverall.totalQuestions > 0
    ? Math.round((premiumOverall.totalCorrectAnswers / premiumOverall.totalQuestions) * 100 * 100) / 100
    : 0;

  const performance = getPerformanceLevel(premiumOverallPercentage);

  // Prepare data for charts - using premium domains only
  const overallPieData = [
    {
      name: "Correct",
      value: premiumOverall.totalCorrectAnswers,
      color: PERFORMANCE_COLORS.excellent,
      fill: PERFORMANCE_COLORS.excellent
    },
    {
      name: "Incorrect",
      value: premiumOverall.totalQuestions - premiumOverall.totalCorrectAnswers,
      color: PERFORMANCE_COLORS.poor,
      fill: PERFORMANCE_COLORS.poor
    },
  ];

  // Filter domains that have insights AND are premium
  const domainsWithInsights = premiumDomains.filter((domain: any) =>
    insights[domain.domainId]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-purple-950 dark:to-slate-950 text-gray-900 dark:text-white selection:bg-purple-500/30 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <button
            onClick={() => router.push(`/assess/${projectId}/premium-domains`)}
            className="group flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-8"
          >
            <div className="p-2 rounded-full bg-gray-200 dark:bg-white/5 group-hover:bg-gray-300 dark:group-hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-medium">Back to Assessment</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-purple-200 dark:to-purple-400 mb-4">
                Premium Assessment Report
              </h1>
              <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                <span className="text-xl font-medium text-gray-900 dark:text-white">{results.project.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600" />
                <span>{new Date(results.submittedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            {!isUserPremium && (
              <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-amber-50 dark:bg-gradient-to-r dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-200 shadow-sm dark:shadow-none">
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                <span className="font-medium">Unlock AI Insights with Premium</span>
                <button
                  onClick={() => router.push(`/assess/${projectId}/premium-features`)}
                  className="ml-2 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white dark:text-black font-bold text-sm transition-colors shadow-md hover:shadow-lg"
                >
                  Upgrade
                </button>
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
            <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-8 shadow-xl dark:shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10">
                <Trophy className="w-32 h-32 text-gray-900 dark:text-white" />
              </div>

              <div className="relative z-10">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-300 mb-8 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
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
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-6xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {premiumOverallPercentage.toFixed(0)}%
                      </span>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">Total Score</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <span className="text-gray-600 dark:text-gray-400">Performance Level</span>
                    <div
                      className="flex items-center gap-2 px-3 py-1 rounded-lg font-medium text-sm"
                      style={{ backgroundColor: performance.color + '20', color: performance.color }}
                    >
                      <Star className="w-4 h-4 fill-current" />
                      {performance.level}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <span className="text-gray-600 dark:text-gray-400">Correct Answers</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {premiumOverall.totalCorrectAnswers} <span className="text-gray-400 dark:text-gray-500">/ {premiumOverall.totalQuestions}</span>
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3 flex-shrink-0">
                <div className="w-1 h-8 rounded-full bg-purple-500" />
                Domain Breakdown
              </h2>

              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {premiumDomains.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {premiumDomains.map((domain: any, index: number) => {
                    const domainPerformance = getPerformanceLevel(domain.percentage);

                    return (
                      <motion.div
                        key={domain.domainId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 * index }}
                        className="group relative overflow-hidden rounded-3xl bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 backdrop-blur-sm border border-gray-200 dark:border-white/10 p-6 transition-all duration-300 shadow-sm hover:shadow-md dark:shadow-none"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white pr-2 line-clamp-1" title={domain.domainTitle}>
                              {domain.domainTitle}
                            </h3>
                            <div className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-xs font-medium text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                              Premium
                            </div>
                          </div>
                          <div
                            className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 font-bold border border-gray-200 dark:border-white/10"
                            style={{ color: domainPerformance.color }}
                          >
                            {domain.percentage.toFixed(0)}%
                          </div>
                        </div>

                        <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-2 mb-4 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${domain.percentage}%`, backgroundColor: domainPerformance.color }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">{domain.correctAnswers}/{domain.totalQuestions} Correct</span>
                          <span style={{ color: domainPerformance.color }} className="font-medium">
                            {domainPerformance.level}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white/50 dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/10">
                    <p className="text-gray-500 dark:text-gray-400">
                      No premium domains found in this assessment.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* AI Insights Section - Conditional Rendering */}
        <div className="mt-12">
          {isUserPremium ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/40 dark:to-slate-900/40 backdrop-blur-xl border border-purple-200 dark:border-purple-500/20 p-8 shadow-lg dark:shadow-none"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 dark:opacity-20">
                <Brain className="w-64 h-64 text-purple-600 dark:text-purple-500" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Strategic Insights</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-8 ml-14">
                  {generatingInsights
                    ? "Analyzing your performance data to generate personalized recommendations..."
                    : "Tailored strategic recommendations for your premium domains."}
                </p>

                {generatingInsights && Object.keys(insights).length === 0 ? (
                  <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : domainsWithInsights.length > 0 ? (
                  <div className="grid gap-4">
                    {domainsWithInsights.map((domain: any, index: number) => (
                      <motion.div
                        key={domain.domainId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-purple-100 dark:border-white/10 hover:bg-purple-50 dark:hover:bg-white/10 transition-colors shadow-sm dark:shadow-none"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                            {domain.domainTitle}
                          </h3>
                          <div className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-xs font-medium text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                            Premium
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {insights[domain.domainId]}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                ) : !generatingInsights ? (
                  <div className="text-center py-12 bg-white/50 dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/10">
                    <p className="text-gray-500 dark:text-gray-400">
                      {premiumDomainIds.size > 0
                        ? "No specific insights generated for your premium domains."
                        : "You don't have any premium domains in this assessment."}
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
              className="relative overflow-hidden rounded-[2.5rem] bg-gray-100 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 p-8 text-center"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-200/50 dark:to-black/50 pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center mb-6 shadow-md dark:shadow-none">
                  <Lock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Unlock Premium Insights</h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
                  Upgrade to Premium to get detailed AI-powered strategic recommendations tailored to your assessment results.
                </p>
                <button
                  onClick={() => router.push(`/assess/${projectId}/premium-features`)}
                  className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white font-bold transition-all duration-300 shadow-lg hover:shadow-xl dark:shadow-none"
                >
                  Upgrade Now
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}