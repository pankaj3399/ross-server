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
import { ReportSkeleton } from "../../components/Skeleton";
import { usePdfReport } from "../../hooks/usePdfReport";
import { getMaturityLevel } from "../../lib/maturity";


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
  const [premiumDomainIds, setPremiumDomainIds] = useState<Set<string> | null>(new Set());
  const [premiumDomainError, setPremiumDomainError] = useState(false);

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
        setPremiumDomainError(false);
      } catch (error) {
        console.error("Failed to fetch domain details:", error);
        setPremiumDomainError(true);
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


  const performance = getMaturityLevel(results.results.overall.overallMaturityScore);

  // Filter to show only non-premium domains
  const nonPremiumDomains = (premiumDomainIds || new Set()).size === 0 && premiumDomainError
    ? [] // If error and no data, show nothing (fail-closed)
    : results.results.domains.filter((domain: any) => 
        premiumDomainIds ? !premiumDomainIds.has(domain.domainId) : false
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
              className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all pl-0 hover:bg-transparent hide-in-pdf"
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
                Maturity Assessment Report
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
          {/* Left Column: Overall Maturity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1 space-y-8"
          >
            <div className="relative overflow-hidden rounded-[2.5rem] bg-card border border-border p-8 shadow-xl">
              <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10">
                <IconStar className="w-32 h-32 text-foreground" />
              </div>

              <div className="relative z-10">
                <h2 className="text-xl font-semibold text-muted-foreground mb-8 flex items-center gap-2">
                  <IconTrophy className="w-5 h-5 text-warning" />
                  Overall Maturity Score
                </h2>

                <div className="flex flex-col items-center justify-center mb-8">
                  <div className="relative w-64 h-64 flex flex-col items-center justify-center">
                    {/* Radial Gauge / Big Score */}
                    <div className="text-center">
                       <div className="text-7xl font-bold text-foreground mb-2">
                         {results.results.overall.overallMaturityScore.toFixed(2)}
                       </div>
                       <div className="text-xl font-medium text-muted-foreground uppercase tracking-widest">
                         OUT OF 3.0
                       </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-5 rounded-2xl bg-muted border border-border">
                    <span className="text-muted-foreground font-medium">Maturity Level</span>
                    <div
                      className={`flex items-center font-bold text-sm ${performance.text} uppercase tracking-wider`}
                    >
                      {performance.level}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 p-5 rounded-2xl bg-muted border border-border">
                    <span className="text-muted-foreground font-medium">Questions Evaluated</span>
                    <span className="font-semibold text-foreground">
                      {results.results.overall.totalQuestions}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Domain Breakdown */}
          <div className="lg:col-span-2 flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col h-full"
            >
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center justify-between gap-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 rounded-full bg-primary" />
                  Domain Maturity Breakdown
                </div>
                {premiumDomainError && (
                  <span className="text-xs font-medium text-warning bg-warning/10 px-3 py-1 rounded-full border border-warning/20">
                    Live status unavailable - showing cached results
                  </span>
                )}
              </h2>

              <div className="flex-1 space-y-4 overflow-y-auto scrollbar-hide">
                {nonPremiumDomains.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {nonPremiumDomains.map((domain: any, index: number) => {
                      const domainMaturity = getMaturityLevel(domain.maturityScore);

                      return (
                        <motion.div
                          key={domain.domainId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.1 * index }}
                          className="group relative overflow-hidden rounded-3xl bg-card hover:bg-muted border border-border p-8 transition-all duration-300 shadow-sm hover:shadow-md break-inside-avoid"
                        >
                          <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="font-bold text-2xl text-foreground mb-1">
                                    {domain.domainTitle}
                                </h3>
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${domainMaturity.bg} ${domainMaturity.text} border ${domainMaturity.border}`}>
                                    {domainMaturity.level}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-foreground">
                                    {domain.maturityScore.toFixed(2)}
                                </div>
                                <div className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
                                    Score / 3.0
                                </div>
                            </div>
                          </div>

                          {/* Progress Bar (0-3 scale) */}
                          <div className="w-full bg-muted rounded-full h-3 mb-8 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${domainMaturity.bgSolid}`}
                              style={{ width: `${(domain.maturityScore / 3) * 100}%` }}
                            />
                          </div>

                          {/* Practice Level Breakdown */}
                          <div className="space-y-4 grid md:grid-cols-2 gap-x-8 gap-y-4">
                             {domain.practiceScores?.map((practice: any) => {
                                 const practiceMaturity = getMaturityLevel(practice.maturityScore);
                                 return (
                                     <div key={practice.practiceId} className="flex flex-col gap-2 p-4 rounded-2xl bg-background/50 border border-border/50">
                                         <div className="flex justify-between items-center mb-1">
                                             <span className="text-sm font-semibold text-foreground truncate max-w-[70%]" title={practice.practiceTitle}>
                                                 {practice.practiceTitle}
                                             </span>
                                             <span className={`text-sm font-bold ${practiceMaturity.text}`}>
                                                 {practice.maturityScore.toFixed(1)}
                                             </span>
                                         </div>
                                         <div className="w-full bg-muted rounded-full h-1.5">
                                             <div 
                                                className={`h-full rounded-full ${practiceMaturity.bgSolid}`}
                                                style={{ width: `${(practice.maturityScore / 3) * 100}%` }}
                                             />
                                         </div>
                                     </div>
                                 )
                             })}
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