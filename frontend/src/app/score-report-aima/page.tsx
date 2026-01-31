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
  IconDownload,
  IconLoader
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { PieChart, Cell, ResponsiveContainer, Pie } from "recharts";
import { ReportSkeleton, Skeleton } from "../../components/Skeleton";
import { usePdfReport } from "../../hooks/usePdfReport";

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
  const { isAuthenticated } = useAuth();
  const { loading: authLoading } = useRequireAuth();
  const { getProjectResults } = useAssessmentResultsStore();
  const reportRef = useRef<HTMLDivElement>(null);

  const projectId = searchParams.get("projectId");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [premiumDomainIds, setPremiumDomainIds] = useState<Set<string>>(new Set());

  const { exportPdf, isExporting } = usePdfReport({
    reportRef,
    fileName: `aima-score-report-${projectId}.pdf`,
    reportTitle: "AIMA Assessment Score Report",
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
            onClick={() => router.push(`/assess/${projectId}`)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg"
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

  const performance = getPerformanceLevel(results.results.overall.overallPercentage);

  // Prepare data for charts
  const overallPieData = [
    {
      name: "Correct",
      value: results.results.overall.totalCorrectAnswers,
      color: PERFORMANCE_VARIANTS.excellent.color,
      fill: PERFORMANCE_VARIANTS.excellent.color
    },
    {
      name: "Incorrect",
      value: results.results.overall.totalQuestions - results.results.overall.totalCorrectAnswers,
      color: PERFORMANCE_VARIANTS.poor.color,
      fill: PERFORMANCE_VARIANTS.poor.color
    },
  ];

  // Filter to show only non-premium domains
  const nonPremiumDomains = results.results.domains.filter((domain: any) =>
    !premiumDomainIds.has(domain.domainId)
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
              onClick={() => router.push(`/assess/${projectId}`)}
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
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Assessment Report
              </h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="text-xl font-medium text-foreground">{results.project.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
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
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-6xl font-bold text-foreground tracking-tight">
                        {results.results.overall.overallPercentage.toFixed(0)}%
                      </span>
                      <span className="text-sm font-medium text-muted-foreground mt-2">Total Score</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-muted border border-border">
                    <span className="text-muted-foreground">Performance Level</span>
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg font-medium text-sm ${performance.bg} ${performance.text}`}
                    >
                      <IconStar className={`w-4 h-4 fill-current`} />
                      {performance.level}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-muted border border-border">
                    <span className="text-muted-foreground">Correct Answers</span>
                    <span className="font-semibold text-foreground">
                      {results.results.overall.totalCorrectAnswers} <span className="text-muted-foreground">/ {results.results.overall.totalQuestions}</span>
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
                          className="group relative overflow-hidden rounded-3xl bg-card hover:bg-muted border border-border p-6 transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg text-foreground pr-2 line-clamp-1" title={domain.domainTitle}>
                                {domain.domainTitle}
                              </h3>
                            </div>
                            <div
                              className={`flex items-center justify-center w-12 h-12 rounded-full bg-muted font-bold border ${domainPerformance.border} ${domainPerformance.text}`}
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