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
  Star
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
  const { isAuthenticated } = useAuth();
  const { loading: authLoading } = useRequireAuth();
  const { getProjectResults } = useAssessmentResultsStore();

  const projectId = searchParams.get("projectId");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
            onClick={() => router.push(`/assess/${projectId}`)}
            className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
          >
            Back to Assessment
          </button>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const overallPieData = [
    {
      name: "Correct",
      value: results.results.overall.totalCorrectAnswers,
      color: PERFORMANCE_COLORS.excellent,
      fill: PERFORMANCE_COLORS.excellent
    },
    {
      name: "Incorrect",
      value: results.results.overall.totalQuestions - results.results.overall.totalCorrectAnswers,
      color: PERFORMANCE_COLORS.poor,
      fill: PERFORMANCE_COLORS.poor
    },
  ];

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 80) return { level: "Excellent", color: PERFORMANCE_COLORS.excellent };
    if (percentage >= 60) return { level: "Good", color: PERFORMANCE_COLORS.good };
    if (percentage >= 40) return { level: "Average", color: PERFORMANCE_COLORS.average };
    return { level: "Needs Improvement", color: PERFORMANCE_COLORS.poor };
  };

  const performance = getPerformanceLevel(results.results.overall.overallPercentage);

  // Filter to show only non-premium domains
  const nonPremiumDomains = results.results.domains.filter((domain: any) =>
    !premiumDomainIds.has(domain.domainId)
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
            onClick={() => router.push(`/assess/${projectId}`)}
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
                Assessment Report
              </h1>
              <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                <span className="text-xl font-medium text-gray-900 dark:text-white">{results.project.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600" />
                <span>{new Date(results.submittedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

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
                        {results.results.overall.overallPercentage.toFixed(0)}%
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
                      {results.results.overall.totalCorrectAnswers} <span className="text-gray-400 dark:text-gray-500">/ {results.results.overall.totalQuestions}</span>
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
                {nonPremiumDomains.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {nonPremiumDomains.map((domain: any, index: number) => {
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
                      No non-premium domains found in this assessment.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}