"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { useAssessmentResultsStore } from "../../store/assessmentResultsStore";
import { apiService } from "../../lib/api";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ReportSkeleton } from "../../components/Skeleton";
import { usePdfReport } from "../../hooks/usePdfReport";
import { getMaturityLevel } from "../../lib/maturity";
import {
  IconArrowLeft,
  IconTrophy,
  IconStar,
  IconDownload,
  IconLoader,
  IconSparkles,
  IconBrain,
  IconCheck,
  IconTrendingUp,
  IconListCheck
} from "@tabler/icons-react";
import { parseInsightText } from "../../lib/insightUtils";



export default function ScoreReportPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { loading: authLoading } = useRequireAuth();
  const { getProjectResults } = useAssessmentResultsStore();
  const reportRef = useRef<HTMLDivElement>(null);

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [insights, setInsights] = useState<Record<string, string>>({});
  const [premiumDomainIds, setPremiumDomainIds] = useState<Set<string> | null>(null);
  const [premiumDomainError, setPremiumDomainError] = useState(false);
  const projectId = searchParams.get("projectId");

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

  useEffect(() => {
    if (!projectId || !results || loading) return;

    // Collect all existing insights from results
    const existingInsights: Record<string, string> = {};
    results.results.domains.forEach((domain: any) => {
      if (domain.insights) {
        existingInsights[domain.domainId] = domain.insights;
      }
    });

    if (Object.keys(existingInsights).length > 0) {
      setInsights(prev => ({ ...prev, ...existingInsights }));
    }

    let safetyTimeout: NodeJS.Timeout | null = null;
    let isPolling = true;

    const pullInsightsStatus = async (jobId: string) => {
      if (!isPolling) return;
      try {
        const jobStatus = await apiService.getInsightsJobStatus(projectId, jobId);

        if (jobStatus.status === 'completed') {
          if (jobStatus.insights) {
            setInsights(prev => ({ ...prev, ...jobStatus.insights }));
            updateResultsWithInsights(jobStatus.insights);
          }
          setGeneratingInsights(false);
          isPolling = false;
          if (safetyTimeout) clearTimeout(safetyTimeout);
        } else if (jobStatus.status === 'failed') {
          setGeneratingInsights(false);
          isPolling = false;
          if (safetyTimeout) clearTimeout(safetyTimeout);
        } else if (isPolling) {
          // Schedule next poll
          setTimeout(() => pullInsightsStatus(jobId), 2000);
        }
      } catch (pollError) {
        console.error("Polling error:", pollError);
        setGeneratingInsights(false);
        isPolling = false;
      }
    };

    const generateInsights = async () => {
      // Guard: Ensure premium domains are resolved and no error
      if (premiumDomainIds === null || premiumDomainError) return;

      // Check if we already have insights for all relevant domains
      const nonPremiumDomainsToCheck = results.results.domains.filter((d: any) => !premiumDomainIds?.has(d.domainId));
      const allHaveInsights = nonPremiumDomainsToCheck.every((d: any) => d.insights || existingInsights[d.domainId]);
      
      if (allHaveInsights) return;

      setGeneratingInsights(true);
      try {
        const response = await apiService.generateDomainInsights(projectId);

        if (response.success && response.insights && response.status === 'completed') {
          setInsights(prev => ({ ...prev, ...response.insights }));
          updateResultsWithInsights(response.insights);
          setGeneratingInsights(false);
          return;
        }

        if (response.success && response.jobId && (response.status === 'processing' || response.status === 'pending')) {
          pullInsightsStatus(response.jobId);

          safetyTimeout = setTimeout(() => {
            isPolling = false;
            setGeneratingInsights(false);
          }, 300000);
        } else {
          setGeneratingInsights(false);
        }
      } catch (error) {
        setGeneratingInsights(false);
      }
    };

    const updateResultsWithInsights = (newInsights: Record<string, string>) => {
      setResults((prevResults: any) => {
        if (!prevResults) return null;
        const updatedDomains = prevResults.results.domains.map((domain: any) => ({
          ...domain,
          insights: newInsights[domain.domainId] || domain.insights
        }));
        return {
          ...prevResults,
          results: { ...prevResults.results, domains: updatedDomains }
        };
      });
    };

    generateInsights();

    return () => {
      isPolling = false;
      if (safetyTimeout) clearTimeout(safetyTimeout);
    };
  }, [projectId, results, loading, premiumDomainIds]);

  const performance = getMaturityLevel(results?.results?.overall?.overallMaturityScore ?? 0);

  // Filter to show only non-premium domains
  const nonPremiumDomains = results 
    ? ((premiumDomainIds || new Set()).size === 0 && premiumDomainError
        ? [] 
        : results.results.domains.filter((domain: any) => 
            premiumDomainIds ? !premiumDomainIds.has(domain.domainId) : false
          ))
    : [];

  const { exportVectorPdf, isExporting } = usePdfReport({
    reportRef,
    fileName: `aima-score-report-${projectId}.pdf`,
    reportTitle: "AIMA Assessment Score Report",
    projectName: results?.project?.name,
    generatedAt: results?.submittedAt,
    aimaData: results && performance ? {
      results,
      performance,
      nonPremiumDomains,
      insights
    } : undefined
  });

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

  return (
      <div ref={reportRef} className="text-foreground selection:bg-primary/30 transition-colors duration-300">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Navigation / Actions */}
          <div className="flex justify-between items-center mb-8 hide-in-pdf">
            <Button
              variant="ghost"
              onClick={() => router.push(`/assess/${projectId}`)}
              className="group flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-all pl-0 hover:bg-transparent"
            >
              <div className="p-1.5 rounded-full bg-muted group-hover:bg-muted/80 transition-colors">
                <IconArrowLeft className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Back to Assessment</span>
            </Button>

            <Button
              onClick={exportVectorPdf}
              disabled={isExporting}
              size="sm"
              className="group flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
            >
              {isExporting ? (
                <IconLoader className="w-4 h-4 animate-spin" />
              ) : (
                <IconDownload className="w-4 h-4" />
              )}
              <span className="font-medium text-xs">{isExporting ? "Generating..." : "Download Report"}</span>
            </Button>
          </div>

          {/* Structured Header for PDF & Web */}
          <header className="mb-10 border-b border-border pb-8 text-center flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl md:text-4xl font-black text-foreground mb-4 tracking-tight leading-[1.1]">
                Maturity Assessment <br className="hidden md:block" />
                <span className="text-primary">Report</span>
              </h1>
              
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Project Name</span>
                  <span className="text-base font-bold text-foreground">{results.project.name}</span>
                </div>
                <div className="w-px h-6 bg-border hidden sm:block" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Assessment Date</span>
                  <span className="text-base font-bold text-foreground">
                    {new Date(results.submittedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </motion.div>
          </header>

          <div className="flex flex-col items-center gap-10 w-full max-w-5xl mx-auto">
            {/* Overall Maturity - Horizontal Card */}
            <div className="w-full">
              <div className="relative overflow-hidden rounded-3xl bg-card border border-border p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
                <div className="flex-1 flex flex-col items-center md:items-start">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-2 rounded-lg bg-warning/10 text-warning border border-warning/20">
                      <IconTrophy className="w-5 h-5" />
                    </div>
                    <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      Overall Score
                    </h2>
                  </div>

                  <div className="flex flex-col items-center md:items-start py-2">
                    <div className="text-6xl font-black text-foreground mb-1 tracking-tighter leading-none">
                      {(results.results.overall.overallMaturityScore ?? 0).toFixed(2)}
                    </div>
                    <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">
                      OUT OF 3.0
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-px h-px md:h-24 bg-border" />

                <div className="flex-1 w-full flex flex-col gap-4">
                  <div className="p-4 rounded-xl bg-muted/50 border border-border flex flex-col gap-0.5">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">Maturity Level</span>
                    <div className={`text-lg font-black ${performance.text} uppercase tracking-tight`}>
                      {performance.level}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50 border border-border flex flex-col gap-0.5">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">Questions Evaluated</span>
                    <span className="text-lg font-black text-foreground">
                      {results.results.overall.totalQuestions}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Domain Breakdown Section */}
            <div className="w-full flex flex-col">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col w-full"
              >
                <h2 className="text-lg font-bold text-foreground mb-8 flex items-center justify-center gap-3">
                    <div className="w-6 h-0.5 rounded-full bg-primary" />
                    Domain Maturity Breakdown
                    <div className="w-6 h-0.5 rounded-full bg-primary" />
                </h2>

                <div className="space-y-8">
                  {nonPremiumDomains.length > 0 ? (
                    <div className="flex flex-col gap-8">
                      {nonPremiumDomains.map((domain: any, index: number) => {
                        const domainMaturity = getMaturityLevel(domain.maturityScore);

                        return (
                          <motion.div
                            key={domain.domainId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 * index }}
                            className="group relative overflow-hidden rounded-2xl bg-card border border-border p-5 md:p-6 transition-all duration-300 hover:shadow-md"
                          >
                            {/* Domain Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                              <div className="space-y-1.5">
                                  <h3 className="font-black text-xl text-foreground tracking-tight">
                                      {domain.domainTitle}
                                  </h3>
                                  <div className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.2em] ${domainMaturity.bg} ${domainMaturity.text} border ${domainMaturity.border}`}>
                                      {domainMaturity.level}
                                  </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 px-5">
                                  <div className="text-center">
                                      <div className="text-2xl font-black text-foreground tracking-tighter leading-none">
                                          {(domain.maturityScore != null ? domain.maturityScore : 0).toFixed(2)}
                                      </div>
                                      <div className="text-[8px] text-muted-foreground uppercase font-black tracking-[0.2em] mt-1">
                                          SCORE / 3.0
                                      </div>
                                  </div>
                              </div>
                            </div>

                            {/* Domain Progress */}
                            <div className="w-full bg-muted rounded-full h-3 mb-8 overflow-hidden border border-border/50 p-0.5">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${domainMaturity.bgSolid} shadow-[0_0_8px_rgba(0,0,0,0.1)]`}
                                style={{ width: `${(domain.maturityScore / 3) * 100}%` }}
                              />
                            </div>
                            
                            {/* AI Insights Section */}
                            <div className="mb-8 p-6 rounded-2xl bg-primary/5 border border-primary/10">
                              <div className="flex items-center gap-2 mb-4">
                                <IconSparkles className="w-4 h-4 text-primary fill-primary/20" />
                                <h4 className="text-sm font-black text-foreground tracking-tight uppercase">AI Insights & Recommendations</h4>
                                {generatingInsights && !insights[domain.domainId] && (
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase animate-pulse ml-auto">
                                    <IconLoader className="w-3 h-3 animate-spin" />
                                    Analyzing...
                                  </div>
                                )}
                              </div>

                              {(() => {
                                const domainInsights = parseInsightText(insights[domain.domainId] || domain.insights || "");
                                if (!domainInsights.analysis && !domainInsights.strengths && !domainInsights.improvements && domainInsights.recommendations.length === 0) {
                                  return (
                                    <div className="text-sm text-muted-foreground italic bg-background/50 p-4 rounded-xl border border-border/50">
                                      {generatingInsights ? "Preparing analysis..." : "Insights will appear once the analysis is complete."}
                                    </div>
                                  );
                                }

                                return (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                      {domainInsights.analysis && (
                                        <div>
                                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Analysis</span>
                                          <p className="text-sm text-foreground/80 leading-relaxed">{domainInsights.analysis}</p>
                                        </div>
                                      )}
                                      <div className="grid grid-cols-1 gap-3">
                                        {domainInsights.strengths && (
                                          <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                                            <span className="text-[9px] font-black text-success uppercase tracking-widest block mb-0.5">Key Strengths</span>
                                            <p className="text-xs text-foreground/80">{domainInsights.strengths}</p>
                                          </div>
                                        )}
                                        {domainInsights.improvements && (
                                          <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
                                            <span className="text-[9px] font-black text-warning uppercase tracking-widest block mb-0.5">Needs Improvement</span>
                                            <p className="text-xs text-foreground/80">{domainInsights.improvements}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Recommended Actions</span>
                                      <div className="space-y-2">
                                        {domainInsights.recommendations.length > 0 ? (
                                          domainInsights.recommendations.map((rec, i) => (
                                            <div key={i} className="flex gap-3 group/item bg-background/40 p-2.5 rounded-xl border border-border/50">
                                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-[9px] font-black flex items-center justify-center">
                                                {i + 1}
                                              </div>
                                              <p className="text-xs text-foreground/80 leading-snug pt-0.5">{rec}</p>
                                            </div>
                                          ))
                                        ) : (
                                          <p className="text-xs text-muted-foreground italic">No specific recommendations yet.</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Practice Level Breakdown Section */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-center gap-2 mb-4">
                                <div className="w-1 h-4 rounded-full bg-primary/20" />
                                <h4 className="text-[8px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                                  Practice Breakdown
                                </h4>
                                <div className="w-1 h-4 rounded-full bg-primary/20" />
                              </div>

                              <div className="flex flex-col gap-2.5">
                                 {domain.practiceScores?.map((practice: any, pIdx: number) => {
                                     const practiceMaturity = getMaturityLevel(practice.maturityScore);
                                     return (
                                         <div key={practice.practiceId} className="flex flex-col sm:flex-row sm:items-center gap-3.5 p-3.5 rounded-xl bg-muted/20 border border-border/40 hover:bg-muted/30 transition-colors group/practice">
                                             <div className="flex-1 min-w-0">
                                                 <div className="flex items-center gap-2.5 mb-2.5">
                                                     <span className="text-[9px] font-black text-muted-foreground/60 border border-border px-1.5 py-0.5 rounded bg-background shadow-xs">
                                                         P{String(pIdx + 1).padStart(2, '0')}
                                                     </span>
                                                     <span className="text-xs font-black text-foreground truncate block leading-tight tracking-tight uppercase" title={practice.practiceTitle}>
                                                         {practice.practiceTitle}
                                                     </span>
                                                 </div>
                                                 <div className="w-full bg-muted/60 rounded-full h-1 overflow-hidden">
                                                     <div 
                                                        className={`h-full rounded-full ${practiceMaturity.bgSolid} opacity-80`}
                                                        style={{ width: `${(practice.maturityScore / 3) * 100}%` }}
                                                     />
                                                 </div>
                                             </div>
                                             <div className={`sm:w-20 text-right shrink-0 p-2 rounded-lg ${practiceMaturity.bg} border ${practiceMaturity.border} transition-transform group-hover/practice:scale-105 shadow-xs flex flex-col items-center justify-center`}>
                                                 <div className={`text-lg font-black ${practiceMaturity.text} leading-none tracking-tighter`}>
                                                     {(practice.maturityScore != null ? practice.maturityScore : 0).toFixed(1)}
                                                 </div>
                                                 <div className={`text-[7px] font-black ${practiceMaturity.text} opacity-70 uppercase tracking-widest mt-0.5`}>
                                                     Score
                                                 </div>
                                             </div>
                                         </div>
                                     )
                                 })}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-muted/50 rounded-3xl border border-border">
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