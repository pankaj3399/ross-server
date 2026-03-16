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
import { ReportSkeleton } from "../../components/Skeleton";
import { usePdfReport } from "../../hooks/usePdfReport";
import { getMaturityLevel, getRiskExposure } from "../../lib/maturity";

// Helper to parse insight text into structured sections
const parseInsightText = (text: string) => {
  const sections = {
    analysis: "",
    strengths: "",
    improvements: "",
    recommendations: [] as string[]
  };

  if (!text) return sections;

  const analysisPattern = /(?:Current Performance Analysis|Analysis|1\.\s*A brief analysis[^:]+):?\s*([\s\S]*?)(?=(?:Key strengths|Strengths|2\.|Areas|Specific|$))/i;
  const strengthsPattern = /(?:Key strengths|Strengths|2\.\s*Key strengths[^:]+):?\s*([\s\S]*?)(?=(?:Areas|Improvements|3\.|Specific|$))/i;
  const improvementsPattern = /(?:Areas that need improvement|Areas for Improvement|3\.\s*Areas[^:]+):?\s*([\s\S]*?)(?=(?:Specific|Actionable|Recommendations|4\.)|$)/i;
  const recommendationsPattern = /(?:Specific actionable recommendations|Actionable Recommendations|Recommendations|4\.\s*Specific[^:]+):?\s*([\s\S]*)/i;

  const analysisMatch = text.match(analysisPattern);
  const strengthsMatch = text.match(strengthsPattern);
  const improvementsMatch = text.match(improvementsPattern);
  const recommendationsMatch = text.match(recommendationsPattern);

  if (analysisMatch) sections.analysis = analysisMatch[1].trim();
  else if (!strengthsMatch && !improvementsMatch && !recommendationsMatch) sections.analysis = text;

  if (strengthsMatch) sections.strengths = strengthsMatch[1].trim();

  if (improvementsMatch) sections.improvements = improvementsMatch[1].trim();

  if (recommendationsMatch) {
    const rawRecs = recommendationsMatch[1].trim();
    sections.recommendations = rawRecs
      .split(/(?:\r\n|\r|\n)?(?:\d+\.|-|\u2022)\s+/)
      .map(r => r.trim())
      .filter(r => r.length > 0);
  }

  return sections;
};


export default function ScoreReportPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { loading: authLoading } = useRequireAuth();
  const { getProjectResults } = useAssessmentResultsStore();
  const reportRef = useRef<HTMLDivElement>(null);

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
    if (authLoading || !isAuthenticated || !projectId) {
      if (!authLoading) setLoading(false);
      return;
    }

    const fetchData = async () => {
      const projectResults = getProjectResults(projectId);
      if (projectResults) {
        setResults(projectResults);
      } else if (projectId) {
        // Handle case where we have a projectId but no results yet
        // This might happen if user bookmarked or manually navigated
      }

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
  }, [projectId, isAuthenticated, authLoading, getProjectResults]);

  useEffect(() => {
    if (!projectId || !results || loading || !isUserPremium) return;

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

            if (jobStatus.status === 'completed' && jobStatus.insights) {
                setInsights(prev => ({ ...prev, ...jobStatus.insights }));
                updateResultsWithInsights(jobStatus.insights);
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
      // Check if we already have insights for ALL domains
      const allDomainsHaveInsights = results.results.domains.every((d: any) => d.insights || existingInsights[d.domainId]);
      if (allDomainsHaveInsights) return;

      setGeneratingInsights(true);
      try {
        const response = await apiService.generateDomainInsights(projectId);

        if (response.success && response.insights && response.status === 'completed') {
          setInsights(prev => ({ ...prev, ...response.insights }));
          updateResultsWithInsights(response.insights);
          setGeneratingInsights(false);
          return;
        }

        if (response.success && response.jobId && response.status === 'processing') {
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
  }, [projectId, results, loading, isUserPremium]);

  if (loading) {
    return <ReportSkeleton />;
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center p-8 bg-card rounded-3xl border border-border">
          <h1 className="text-3xl font-bold text-foreground mb-4">No Results Found</h1>
          <p className="text-muted-foreground mb-8">Assessment results not found.</p>
          <Button onClick={() => router.push(projectId ? `/assess/${projectId}` : "/dashboard")}>
            {projectId ? "Back to Assessment" : "Go to Dashboard"}
          </Button>
        </div>
      </div>
    );
  }


  const performance = getMaturityLevel(results.results.overall.overallMaturityScore);

  const totalDomains = results.results.domains.length;
  const highMaturityDomains = results.results.domains.filter((d: any) => d.maturityScore >= 2.5).length;
  const initialMaturityDomains = results.results.domains.filter((d: any) => d.maturityScore < 1.5).length;

  return (
    <div ref={reportRef} className="min-h-screen bg-background text-foreground transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex justify-between items-center mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push(projectId ? `/assess/${projectId}` : "/dashboard")}
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
              className="group flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hide-in-pdf px-6 py-2 rounded-xl"
            >
              {isExporting ? (
                <IconLoader className="w-5 h-5 animate-spin" />
              ) : (
                <IconDownload className="w-5 h-5" />
              )}
              <span className="font-medium">{isExporting ? "Generating PDF..." : "Download Report"}</span>
            </Button>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-bold uppercase tracking-wider mb-2">
                <IconSparkles className="w-4 h-4 fill-primary" />
                Premium Maturity Report
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-foreground tracking-tight leading-tight">
                AI Governance maturity <br />Insights
              </h1>
              <div className="flex items-center gap-4 text-lg">
                <span className="font-semibold text-foreground">{results.project.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                <span className="text-muted-foreground">
                    {new Date(results.submittedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Executive Summary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
          {/* Main Overall Maturity Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2 relative overflow-hidden rounded-[3rem] bg-card border border-border p-10 shadow-2xl group"
          >
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-xl font-bold text-muted-foreground flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-warning/10 text-warning">
                    <IconTrophy className="w-6 h-6" />
                  </div>
                  Overall Maturity Score
                </h2>
                <div className={`px-4 py-1.5 rounded-full ${performance.bg} ${performance.text} border ${performance.border} text-sm font-black uppercase tracking-widest`}>
                  {performance.level}
                </div>
              </div>

              <div className="flex items-center gap-12 mb-10">
                <div className="relative">
                  <div className="text-8xl font-black text-foreground tracking-tighter">
                    {results.results.overall.overallMaturityScore.toFixed(2)}
                  </div>
                  <div className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2 ml-1">
                    OUT OF 3.0
                  </div>
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(results.results.overall.overallMaturityScore / 3) * 100}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={`h-full rounded-full ${performance.bgSolid}`}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    Your organization is currently at the <span className={`font-bold ${performance.text}`}>{performance.level}</span> stage of the OWASP AIMA maturity model.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-auto">
                <div className="p-5 rounded-3xl bg-muted/50 border border-border flex flex-col gap-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Questions Analyzed</span>
                  <span className="text-2xl font-black text-foreground">{results.results.overall.totalQuestions}</span>
                </div>
                <div className="p-5 rounded-3xl bg-muted/50 border border-border flex flex-col gap-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Risk Exposure</span>
                  <span className={`text-2xl font-black ${getRiskExposure(results.results.overall.overallMaturityScore).colorClass}`}>
                    {getRiskExposure(results.results.overall.overallMaturityScore).label}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stat Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-[2.5rem] bg-success/5 border border-success/10 p-8 flex flex-col justify-between group hover:bg-success/10 transition-all duration-300"
            >
              <div className="p-3 rounded-2xl bg-success/10 text-success w-fit mb-4">
                <IconTrendingUp className="w-6 h-6" />
              </div>
              <div>
                <div className="text-4xl font-black text-success mb-2">{highMaturityDomains}</div>
                <div className="text-sm font-bold text-success/70 uppercase tracking-widest">Mature Domains</div>
                <p className="text-xs text-muted-foreground mt-3 font-medium">Areas where you meet level 2.5 or higher.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="rounded-[2.5rem] bg-warning/5 border border-warning/10 p-8 flex flex-col justify-between group hover:bg-warning/10 transition-all duration-300"
            >
              <div className="p-3 rounded-2xl bg-warning/10 text-warning w-fit mb-4">
                <IconAlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-4xl font-black text-warning mb-2">{initialMaturityDomains}</div>
                <div className="text-sm font-bold text-warning/70 uppercase tracking-widest">Action Required</div>
                <p className="text-xs text-muted-foreground mt-3 font-medium">Areas scoring below 1.5 maturity.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="sm:col-span-2 rounded-[2.5rem] bg-primary/5 border border-primary/10 p-8 flex items-center justify-between group hover:bg-primary/10 transition-all duration-300"
            >
              <div className="flex items-center gap-6">
                <div className="p-4 rounded-[1.5rem] bg-primary/10 text-primary">
                  <IconBrain className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-xl font-bold text-foreground">AI Intelligence</div>
                  <p className="text-sm text-muted-foreground font-medium">Domain-specific recommendations generated via LLM.</p>
                </div>
              </div>
              <div className="hidden sm:block text-2xl font-black text-primary/30 uppercase tracking-widest -rotate-12">ACTIVE</div>
            </motion.div>
          </div>
        </div>

        {/* Detailed Domain Findings */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-foreground flex items-center gap-4">
              <div className="w-2 h-10 rounded-full bg-primary" />
              Detailed Domain Findings
            </h2>
          </div>

          <div className="space-y-12">
            {results.results.domains.map((domain: any, index: number) => {
              const domainMaturity = getMaturityLevel(domain.maturityScore);
              const domainInsights = parseInsightText(insights[domain.domainId] || (isUserPremium ? domain.insights : "") || "");

              return (
                <motion.div
                  key={domain.domainId}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="rounded-[3rem] bg-card border border-border shadow-soft overflow-hidden group"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    {/* Domain Metadata & Practice Breakdown */}
                    <div className="lg:col-span-12 p-10 bg-muted/30 border-b border-border">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-foreground tracking-tight">
                                    {domain.domainTitle}
                                </h3>
                                <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${domainMaturity.bg} ${domainMaturity.text} border ${domainMaturity.border}`}>
                                    {domainMaturity.level} Level
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="text-5xl font-black text-foreground">
                                        {domain.maturityScore.toFixed(2)}
                                    </div>
                                    <div className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mt-1">
                                        Score / 3.0
                                    </div>
                                </div>
                                <div className="h-16 w-[1.5px] bg-border hidden md:block" />
                                <div className="hidden md:block">
                                    <div className="text-lg font-bold text-foreground">
                                        {((domain.maturityScore / 3) * 100).toFixed(0)}%
                                    </div>
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        Maturity
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Progress Indicator */}
                        <div className="w-full bg-muted rounded-full h-4 mb-10 overflow-hidden shadow-inner">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(domain.maturityScore / 3) * 100}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className={`h-full rounded-full ${domainMaturity.bgSolid} shadow-lg`}
                            />
                        </div>

                        {/* Practice Scores Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {domain.practiceScores?.map((practice: any) => {
                                const practiceMaturity = getMaturityLevel(practice.maturityScore);
                                return (
                                    <div key={practice.practiceId} className="p-5 rounded-3xl bg-background border border-border/50 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-xs font-black text-muted-foreground uppercase tracking-wider line-clamp-2 pr-2" title={practice.practiceTitle}>
                                                {practice.practiceTitle}
                                            </span>
                                            <span className={`text-sm font-black ${practiceMaturity.text}`}>
                                                {practice.maturityScore.toFixed(1)}
                                            </span>
                                        </div>
                                        <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
                                            <div 
                                                 className={`h-full rounded-full ${practiceMaturity.bgSolid}`}
                                                style={{ width: `${(practice.maturityScore / 3) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* AI Insights Section */}
                    <div className="lg:col-span-12 p-10 bg-card">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                          <IconSparkles className="w-5 h-5 fill-primary" />
                        </div>
                        <h4 className="text-xl font-black text-foreground tracking-tight">AI Generated Insights</h4>
                        {generatingInsights && !insights[domain.domainId] && (
                          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase animate-pulse ml-auto bg-primary/5 px-4 py-2 rounded-full">
                            <IconLoader className="w-4 h-4 animate-spin" />
                            Analyzing domain data...
                          </div>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Analysis Card */}
                        <div className="space-y-4">
                          <h5 className="flex items-center gap-2 text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">
                            <IconTrendingUp className="w-4 h-4" />
                            Strategic Analysis
                          </h5>
                          <div className="p-6 rounded-3xl bg-muted/40 border border-border min-h-[160px]">
                            <p className="text-foreground leading-relaxed text-sm font-medium">
                              {domainInsights.analysis || "No direct analysis available for this domain. Our AI is evaluating your practice scores to provide strategic context."}
                            </p>
                          </div>
                        </div>

                        {/* Strengths & Improvements */}
                        <div className="space-y-4">
                          <h5 className="flex items-center gap-2 text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">
                            <IconCheck className="w-4 h-4" />
                            Key Indicators
                          </h5>
                          <div className="space-y-4">
                            <div className="p-5 rounded-3xl bg-success/5 border border-success/10 text-sm">
                              <span className="block font-black text-success uppercase text-[10px] tracking-widest mb-1">Strengths</span>
                              <p className="text-foreground/90 font-medium leading-relaxed">{domainInsights.strengths || "Strengths identified in high-scoring practices."}</p>
                            </div>
                            <div className="p-5 rounded-3xl bg-warning/5 border border-warning/10 text-sm">
                              <span className="block font-black text-warning uppercase text-[10px] tracking-widest mb-1">Gap Analysis</span>
                              <p className="text-foreground/90 font-medium leading-relaxed">{domainInsights.improvements || "Improving baseline standards in developing areas."}</p>
                            </div>
                          </div>
                        </div>

                        {/* Actionable Recommendations */}
                        <div className="space-y-4">
                          <h5 className="flex items-center gap-2 text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">
                            <IconListCheck className="w-4 h-4" />
                            Action Plan
                          </h5>
                          <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 shadow-sm min-h-[160px]">
                            <div className="space-y-4">
                              {domainInsights.recommendations.length > 0 ? (
                                domainInsights.recommendations.map((rec, i) => (
                                  <div key={i} className="flex gap-4 group/item">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform">
                                      {i + 1}
                                    </div>
                                    <p className="text-sm text-foreground/90 leading-tight pt-0.5 font-medium">{rec}</p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground italic">No specific recommendations at this stage. Increase assessment coverage for detailed AI action plans.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}