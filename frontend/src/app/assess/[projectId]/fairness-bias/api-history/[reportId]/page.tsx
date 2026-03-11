"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Server, Terminal, FileJson, Download, Loader2, Shield } from "lucide-react";
import { usePdfReport } from "../../../../../../hooks/usePdfReport";
import { API_BASE_URL } from "@/lib/api";

type SecurityReportPayload = {
    overall_score: number;
    risk: string;
    categories: Record<string, number>;
    failures: Array<{ prompt: string; reason: string }>;
    tests?: Array<{ category: string; prompt: string; passed: boolean; reason?: string }>;
};

type ApiReportDetail = {
    id: string;
    job_id: string;
    total_prompts: number;
    success_count: number;
    failure_count: number;
    average_scores: {
        total?: number;
        successful?: number;
        failed?: number;
        averageOverallScore?: number;
        averageBiasScore?: number;
        averageToxicityScore?: number;
        [key: string]: number | undefined;
    };
    results: Array<{
        category: string;
        prompt: string;
        success: boolean;
        evaluation?: {
            overallVerdict: string;
            overallScore: number;
            biasScore: number;
            toxicityScore: number;
            explanation: string;
        };
        message?: string;
    }> | SecurityReportPayload;
    errors: Array<{
        category: string;
        prompt: string;
        success: boolean;
        error: string;
        message: string;
    }>;
    config: { testType?: string; apiUrl?: string; requestTemplate?: string; responseKey?: string; apiKeyPlacement?: string; apiKeyFieldName?: string;[key: string]: unknown };
    created_at: string;
};

export default function ApiReportDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;
    const reportId = params.reportId as string;
    const reportRef = useRef<HTMLDivElement>(null);

    const [report, setReport] = useState<ApiReportDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const normalizedGeneratedAt = (() => {
        if (!report?.created_at) return undefined;
        const d = new Date(report.created_at);
        return isNaN(d.getTime()) ? undefined : d.toISOString();
    })();

    const isSecurityReport = report?.config?.testType === "SECURITY_SCAN";
    const { exportPdf, isExporting } = usePdfReport({
        reportRef,
        fileName: isSecurityReport ? `security-scan-report-${reportId}.pdf` : `api-fairness-report-${reportId}.pdf`,
        reportTitle: isSecurityReport ? "Security Scan Report" : "API Fairness & Bias Report",
        projectName: projectId,
        generatedAt: normalizedGeneratedAt,
        sectionSelector: ".pdf-section"
    });

    useEffect(() => {
        const controller = new AbortController();

        const fetchReport = async () => {
            try {
                // Similarly using direct fetch as we assumed for the list
                const res = await fetch(`${API_BASE_URL}/fairness/api-reports/detail/${reportId}`, {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
                    },
                    signal: controller.signal
                });

                if (!res.ok) throw new Error("Failed to fetch report details");

                const data = await res.json();
                if (!controller.signal.aborted && data.success) {
                    setReport(data.report);
                }
            } catch (err: any) {
                if (err.name === 'AbortError' || controller.signal.aborted) return;
                console.error("Failed to fetch API report details:", err);
                setError("Failed to load report details");
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        if (reportId) {
            fetchReport();
        }

        return () => {
            controller.abort();
        };
    }, [reportId]);

    const getScoreColor = (score: number) => {
        if (score >= 0.8) return "text-green-500";
        if (score >= 0.6) return "text-yellow-500";
        return "text-red-500";
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="min-h-screen bg-background p-8 flex flex-col items-center justify-center">
                <div className="text-red-500 mb-4">{error || "Report not found"}</div>
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-primary hover:underline"
                    type="button"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Go Back
                </button>
            </div>
        );
    }

    const securityPayload = isSecurityReport ? (report.results as SecurityReportPayload) : null;
    const resultsArray = Array.isArray(report.results) ? report.results : [];
    const errors = report.errors || [];
    const allItems = [...resultsArray, ...errors];

    const getRiskBadgeColor = (risk: string) => {
        switch (risk) {
            case "Low": return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
            case "Medium": return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
            case "High": return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
            case "Critical": return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
            default: return "bg-muted text-muted-foreground border-border";
        }
    };

    return (
        <div ref={reportRef} className="min-h-screen bg-background">
            {/* Header / Meta */}
            <header className="px-8 py-10 border-b border-border bg-white dark:bg-slate-900 break-inside-avoid pdf-break-safe">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors hide-in-pdf"
                            type="button"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                        <div className="h-6 w-px bg-border hide-in-pdf" />
                        <div>
                            <h1 className="text-2xl font-bold text-foreground pb-1 leading-relaxed flex items-center gap-2">
                                {isSecurityReport ? (
                                    <> <Shield className="w-6 h-6" /> Security Scan Report </>
                                ) : (
                                    "API Report Details"
                                )}
                            </h1>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1.5">
                                    <Server className="w-3.5 h-3.5" />
                                    {report.config?.apiUrl}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end hide-in-pdf">
                        <button
                            onClick={exportPdf}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg transition-colors"
                            type="button"
                        >
                            {isExporting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            <span className="text-sm font-medium hidden sm:inline">{isExporting ? "Exporting..." : "PDF"}</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className={`max-w-7xl mx-auto px-0 py-8 ${isSecurityReport ? "space-y-8" : "space-y-6"}`}>
                {/* Stats Grid */}
                <div className={`grid gap-4 ${isSecurityReport ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-4"} pdf-metric-grid break-inside-avoid pdf-break-safe pdf-section`}>
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm break-inside-avoid pdf-break-safe">
                        <div className="text-sm text-muted-foreground mb-1 font-medium uppercase tracking-wider text-balance">Total Tests</div>
                        <div className="text-3xl font-bold text-foreground">{report.total_prompts}</div>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm break-inside-avoid pdf-break-safe">
                        <div className="text-sm text-muted-foreground mb-1 font-medium uppercase tracking-wider text-balance">Success Rate</div>
                        <div className="text-3xl font-bold text-green-500">
                            {report.total_prompts > 0 ? ((report.success_count / report.total_prompts) * 100).toFixed(1) + "%" : "0.0%"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 font-medium">
                            {report.success_count} passed • {report.failure_count} failed
                        </div>
                    </div>
                    {isSecurityReport && securityPayload ? (
                        <>
                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <div className="text-sm text-muted-foreground mb-1 font-medium uppercase tracking-wider text-balance">Overall Security Score</div>
                                <div className={`text-3xl font-bold ${getScoreColor(securityPayload.overall_score / 100)}`}>
                                    {securityPayload.overall_score}%
                                </div>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <div className="text-sm text-muted-foreground mb-1 font-medium uppercase tracking-wider text-balance">Risk Level</div>
                                <div className="mt-2">
                                    <span className={`inline-flex px-4 py-2 rounded-lg text-sm font-bold border pdf-badge ${getRiskBadgeColor(securityPayload.risk)}`}>
                                        {securityPayload.risk.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <div className="text-sm text-muted-foreground mb-1 font-medium uppercase tracking-wider text-balance">Avg Overall Score</div>
                                <div className={`text-3xl font-bold ${report.average_scores?.averageOverallScore != null
                                    ? getScoreColor(report.average_scores.averageOverallScore)
                                    : "text-muted-foreground"
                                    }`}>
                                    {report.average_scores?.averageOverallScore != null
                                        ? (report.average_scores.averageOverallScore * 100).toFixed(1) + "%"
                                        : "N/A"}
                                </div>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <div className="text-sm text-muted-foreground mb-1 font-medium uppercase tracking-wider text-balance">Avg Bias Score</div>
                                <div className={`text-3xl font-bold ${report.average_scores?.averageBiasScore != null
                                    ? getScoreColor(1 - (report.average_scores.averageBiasScore ?? 0))
                                    : "text-muted-foreground"
                                    }`}>
                                    {report.average_scores?.averageBiasScore != null
                                        ? (report.average_scores.averageBiasScore * 100).toFixed(1) + "%"
                                        : "N/A"}
                                </div>
                                <div className="text-xs text-muted-foreground mt-2 italic">Lower score indicates less bias</div>
                            </div>
                        </>
                    )}
                </div>

                {/* Category scores for security report */}
                {isSecurityReport && securityPayload?.categories && Object.keys(securityPayload.categories).length > 0 && (
                    <div className="space-y-4 break-inside-avoid pdf-break-safe pdf-section">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                            <Shield className="w-5 h-5 text-primary" />
                            Security Category Analysis
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            {Object.entries(securityPayload.categories).map(([name, score]) => (
                                <div key={name} className="bg-card border border-border rounded-xl p-5 shadow-sm">
                                    <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide truncate">{name.replace(/_/g, " ")}</div>
                                    <div className={`text-2xl font-black ${getScoreColor(score / 100)}`}>{score}%</div>
                                    <div className="mt-3 h-1.5 w-full bg-secondary/30 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${score}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {/* Security failures list */}
                {isSecurityReport && securityPayload?.failures && securityPayload.failures.length > 0 && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 break-inside-avoid text-foreground pdf-section">
                            <XCircle className="w-6 h-6 text-red-500" />
                            Critical Vulnerabilities Identified
                        </h3>
                        <div className="space-y-4">
                            {securityPayload.failures.map((f, idx) => (
                                <div key={idx} className="bg-red-50/30 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-2xl overflow-hidden break-inside-avoid pdf-break-safe shadow-sm group pdf-section">
                                    <div className="bg-red-500/10 dark:bg-red-500/20 px-6 py-3 border-b border-red-100 dark:border-red-900/40 flex items-center justify-between">
                                        <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-widest">Failure #{idx + 1}</span>
                                        <XCircle className="w-4 h-4 text-red-500" />
                                    </div>
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <div className="text-[10px] font-black text-red-900/40 dark:text-red-400/40 mb-2 uppercase tracking-tighter">Attack Prompt</div>
                                            <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-xl text-sm border border-red-100/50 dark:border-red-900/30 shadow-inner font-mono text-slate-800 dark:text-slate-200 italic leading-relaxed">
                                                "{f.prompt}"
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-red-900/40 dark:text-red-400/40 mb-2 uppercase tracking-tighter">Detrimental Impact / Reason</div>
                                            <div className="text-sm text-red-700 dark:text-red-400 font-medium leading-relaxed bg-white/50 dark:bg-slate-900/40 p-4 rounded-xl border border-red-100/30 dark:border-red-900/20">
                                                {f.reason}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Configuration */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden break-inside-avoid pdf-break-safe shadow-sm pdf-section">
                    <div className="px-6 py-4 border-b border-border bg-slate-50/50 dark:bg-slate-900/50">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Terminal className="w-5 h-5 text-primary" />
                            Assessment Configuration
                        </h3>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Endpoint URL</div>
                                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg font-mono text-primary break-all border border-slate-100 dark:border-slate-800 italic">
                                        {report.config?.apiUrl}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Request Template</div>
                                    <pre className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-100 p-4 rounded-xl text-xs font-mono overflow-auto max-h-[250px] shadow-inner leading-relaxed border border-slate-100 dark:border-slate-800">
                                        {report.config?.requestTemplate}
                                    </pre>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Response JSON Key</div>
                                    <div className="bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 px-4 py-3 rounded-xl font-mono font-bold border border-indigo-100 dark:border-indigo-900/30 italic">
                                        "{report.config?.responseKey}"
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Authentication Strategy</div>
                                    <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 font-medium text-slate-700 dark:text-slate-300">
                                        {report.config?.apiKeyPlacement === "header" ? "HTTP Header" : "Query Param"}
                                        {report.config?.apiKeyFieldName ? (
                                            <span className="ml-2 text-[10px] font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-foreground">
                                                KEY: {report.config.apiKeyFieldName}
                                            </span>
                                        ) : ""}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Results */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2 break-inside-avoid pdf-section">
                        <FileJson className="w-5 h-5 text-primary" />
                        Detailed Results
                    </h3>

                    {isSecurityReport && securityPayload?.tests && securityPayload.tests.length > 0 ? (
                        <>
                            {Object.entries(
                                securityPayload.tests.reduce((acc, t) => {
                                    const cat = t.category || "General Security";
                                    if (!acc[cat]) acc[cat] = [];
                                    acc[cat].push(t);
                                    return acc;
                                }, {} as Record<string, Array<{ category: string; prompt: string; passed: boolean; reason?: string }>>)
                            ).map(([category, items]) => (
                                <div key={category} className="space-y-6 pdf-break-safe">
                                    <div className="flex items-center gap-3 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] pl-1 break-inside-avoid pdf-break-safe border-l-4 border-slate-200 dark:border-slate-800 ml-1 py-1 pdf-section">
                                        <span>{category.replace(/_/g, " ")}</span>
                                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold">{items.length} OVERALL</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="bg-card border border-border rounded-2xl overflow-hidden ml-4 break-inside-avoid pdf-break-safe shadow-sm hover:shadow-md transition-shadow duration-300 pdf-section">
                                                <div className={`px-6 py-3 border-b flex items-center justify-between ${item.passed ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"} pdf-break-safe`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-1.5 rounded-full ${item.passed ? "bg-emerald-500/20" : "bg-rose-500/20"}`}>
                                                            {item.passed ? (
                                                                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                            ) : (
                                                                <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                                            )}
                                                        </div>
                                                        <span className={`font-bold text-sm ${item.passed ? "text-emerald-800 dark:text-emerald-300" : "text-rose-800 dark:text-rose-300"}`}>
                                                            Test Iteration #{idx + 1}
                                                        </span>
                                                    </div>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${item.passed ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}>
                                                        {item.passed ? "PASSED" : "FAILED"}
                                                    </span>
                                                </div>
                                                <div className="p-6 space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div className="md:col-span-2 break-inside-avoid pdf-break-safe">
                                                            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">Injected Prompt</div>
                                                            <div className="bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-xl text-sm text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-800 shadow-inner italic font-mono">
                                                                "{item.prompt}"
                                                            </div>
                                                        </div>
                                                        {!item.passed && item.reason && (
                                                            <div className="break-inside-avoid pdf-break-safe">
                                                                <div className="text-[10px] font-bold text-rose-400 dark:text-rose-500 mb-2 uppercase tracking-widest">Vulnerability Reason</div>
                                                                <div className="text-xs text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-100 dark:border-rose-900/30 leading-relaxed font-medium">
                                                                    {item.reason}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <>
                            {Object.entries(
                                allItems.reduce((acc, item) => {
                                    const cat = item.category || "Unknown";
                                    if (!acc[cat]) acc[cat] = [];
                                    acc[cat].push(item);
                                    return acc;
                                }, {} as Record<string, typeof allItems>)
                            ).map(([category, items], catIdx) => (
                                <div key={category} className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-1 break-inside-avoid">
                                        <span>{category}</span>
                                        <span className="px-2 py-0.5 rounded-full bg-secondary text-xs">
                                            {items.length}
                                        </span>
                                    </div>

                                    {items.map((item, idx) => (
                                        <div key={idx} className="bg-card border border-border rounded-xl overflow-hidden ml-4 break-inside-avoid">
                                            <div className={`px-6 py-3 border-b border-border flex items-center justify-between ${item.success ? "bg-green-500/5" : "bg-red-500/5"
                                                }`}>
                                                <div className="flex items-center gap-3">
                                                    {item.success ? (
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-red-500" />
                                                    )}
                                                    <span className="font-medium text-foreground/80">
                                                        Prompt #{idx + 1}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {/* Status indicator or score could go here */}
                                                </div>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                <div>
                                                    <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider pb-1 leading-normal text-balance">Prompt</div>
                                                    <div className="bg-secondary/10 p-3 rounded-lg text-sm text-foreground/90">{item.prompt}</div>
                                                </div>

                                                {(item as any).success && (item as any).evaluation ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider pb-1 leading-normal text-balance">Evaluation</div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <span>Overall Score:</span>
                                                                    <span className={`font-bold ${Number.isFinite((item as any).evaluation?.overallScore)
                                                                        ? getScoreColor((item as any).evaluation?.overallScore)
                                                                        : "text-muted-foreground"
                                                                        }`}>
                                                                        {Number.isFinite((item as any).evaluation?.overallScore)
                                                                            ? ((item as any).evaluation?.overallScore * 100).toFixed(0) + "%"
                                                                            : "N/A"}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <span>Bias Score:</span>
                                                                    <span className="font-mono text-foreground">
                                                                        {Number.isFinite((item as any).evaluation?.biasScore)
                                                                            ? ((item as any).evaluation?.biasScore * 100).toFixed(1) + "%"
                                                                            : "N/A"}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <span>Toxicity Score:</span>
                                                                    <span className="font-mono text-foreground">
                                                                        {Number.isFinite((item as any).evaluation?.toxicityScore)
                                                                            ? ((item as any).evaluation?.toxicityScore * 100).toFixed(1) + "%"
                                                                            : "N/A"}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-2 text-sm text-muted-foreground bg-secondary/20 p-2 rounded">
                                                                    {(item as any).evaluation?.overallVerdict || "No verdict"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider pb-1 leading-normal text-balance">Explanation</div>
                                                            <div className="text-sm text-foreground/80 leading-relaxed">
                                                                {(item as any).evaluation?.explanation || "No explanation provided."}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20 text-red-600 text-sm">
                                                        <strong>Error:</strong> {item.message || (item as any).error || "Unknown error occurred"}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
