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
        generatedAt: normalizedGeneratedAt
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
            <div className="bg-card border-b border-border">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
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

                        <button
                            onClick={exportPdf}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg transition-colors hide-in-pdf"
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
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Stats Grid */}
                <div className={`grid gap-4 ${isSecurityReport ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-4"} break-inside-avoid`}>
                    <div className="bg-card border border-border rounded-xl p-6">
                        <div className="text-sm text-muted-foreground mb-1 pb-1 leading-normal">Total Tests</div>
                        <div className="text-2xl font-bold text-foreground">{report.total_prompts}</div>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-6">
                        <div className="text-sm text-muted-foreground mb-1 pb-1 leading-normal">Success Rate</div>
                        <div className="text-2xl font-bold text-green-500">
                            {report.total_prompts > 0 ? ((report.success_count / report.total_prompts) * 100).toFixed(1) + "%" : "0.0%"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {report.success_count} passed, {report.failure_count} failed
                        </div>
                    </div>
                    {isSecurityReport && securityPayload ? (
                        <>
                            <div className="bg-card border border-border rounded-xl p-6">
                                <div className="text-sm text-muted-foreground mb-1 pb-1 leading-normal">Overall Security Score</div>
                                <div className={`text-2xl font-bold ${getScoreColor(securityPayload.overall_score / 100)}`}>
                                    {securityPayload.overall_score}%
                                </div>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-6">
                                <div className="text-sm text-muted-foreground mb-1 pb-1 leading-normal">Risk Level</div>
                                <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-semibold border ${getRiskBadgeColor(securityPayload.risk)}`}>
                                    {securityPayload.risk}
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-card border border-border rounded-xl p-6">
                                <div className="text-sm text-muted-foreground mb-1 pb-1 leading-normal">Avg Overall Score</div>
                                <div className={`text-2xl font-bold ${report.average_scores?.averageOverallScore != null
                                    ? getScoreColor(report.average_scores.averageOverallScore)
                                    : "text-muted-foreground"
                                    }`}>
                                    {report.average_scores?.averageOverallScore != null
                                        ? (report.average_scores.averageOverallScore * 100).toFixed(1) + "%"
                                        : "N/A"}
                                </div>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-6">
                                <div className="text-sm text-muted-foreground mb-1 pb-1 leading-normal">Avg Bias Score</div>
                                <div className={`text-2xl font-bold ${report.average_scores?.averageBiasScore != null
                                    ? getScoreColor(1 - (report.average_scores.averageBiasScore ?? 0))
                                    : "text-muted-foreground"
                                    }`}>
                                    {report.average_scores?.averageBiasScore != null
                                        ? (report.average_scores.averageBiasScore * 100).toFixed(1) + "%"
                                        : "N/A"}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">Lower is better</div>
                            </div>
                        </>
                    )}
                </div>

                {/* Category scores for security report */}
                {isSecurityReport && securityPayload?.categories && Object.keys(securityPayload.categories).length > 0 && (
                    <div className="space-y-4 break-inside-avoid">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Category Scores
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            {Object.entries(securityPayload.categories).map(([name, score]) => (
                                <div key={name} className="bg-card border border-border rounded-xl p-4">
                                    <div className="text-xs text-muted-foreground mb-1 capitalize">{name.replace(/_/g, " ")}</div>
                                    <div className={`text-xl font-bold ${getScoreColor(score / 100)}`}>{score}%</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Security failures list */}
                {isSecurityReport && securityPayload?.failures && securityPayload.failures.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 break-inside-avoid">
                            <XCircle className="w-5 h-5 text-red-500" />
                            Failures
                        </h3>
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            <div className="divide-y divide-border">
                                {securityPayload.failures.map((f, idx) => (
                                    <div key={idx} className="p-6 break-inside-avoid">
                                        <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Prompt</div>
                                        <div className="bg-secondary/10 p-3 rounded-lg text-sm mb-3">{f.prompt}</div>
                                        <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Reason</div>
                                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{f.reason}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Configuration */}
                <div className="bg-card border border-border rounded-xl overflow-hidden break-inside-avoid">
                    <div className="px-6 py-4 border-b border-border bg-secondary/10">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Terminal className="w-4 h-4" />
                            Test Configuration
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-2">Request Template</div>
                                <pre className="bg-secondary/20 p-4 rounded-lg text-xs font-mono overflow-auto max-h-[200px]">
                                    {report.config?.requestTemplate}
                                </pre>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground mb-1">Response Key</div>
                                    <div className="bg-secondary/20 px-3 py-2 rounded-lg text-sm font-mono">
                                        {report.config?.responseKey}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground mb-1">API Key Strategy</div>
                                    <div className="bg-secondary/20 px-3 py-2 rounded-lg text-sm">
                                        {report.config?.apiKeyPlacement || "None"}
                                        {report.config?.apiKeyFieldName ? ` (${report.config.apiKeyFieldName})` : ""}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Results */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2 break-inside-avoid">
                        <FileJson className="w-5 h-5" />
                        Detailed Results
                    </h3>

                    {isSecurityReport && securityPayload?.tests && securityPayload.tests.length > 0 ? (
                        <>
                            {Object.entries(
                                securityPayload.tests.reduce((acc, t) => {
                                    const cat = t.category || "Unknown";
                                    if (!acc[cat]) acc[cat] = [];
                                    acc[cat].push(t);
                                    return acc;
                                }, {} as Record<string, Array<{ category: string; prompt: string; passed: boolean; reason?: string }>>)
                            ).map(([category, items]) => (
                                <div key={category} className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-1 break-inside-avoid">
                                        <span>{category.replace(/_/g, " ")}</span>
                                        <span className="px-2 py-0.5 rounded-full bg-secondary text-xs">{items.length}</span>
                                    </div>
                                    {items.map((item, idx) => (
                                        <div key={idx} className="bg-card border border-border rounded-xl overflow-hidden ml-4 break-inside-avoid">
                                            <div className={`px-6 py-3 border-b border-border flex items-center justify-between ${item.passed ? "bg-green-500/5" : "bg-red-500/5"}`}>
                                                <div className="flex items-center gap-3">
                                                    {item.passed ? (
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-red-500" />
                                                    )}
                                                    <span className="font-medium text-foreground/80">Prompt #{idx + 1}</span>
                                                </div>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                <div>
                                                    <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider pb-1">Prompt</div>
                                                    <div className="bg-secondary/10 p-3 rounded-lg text-sm">{item.prompt}</div>
                                                </div>
                                                {!item.passed && item.reason && (
                                                    <div className="text-sm text-red-600 dark:text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                                        <strong>Reason:</strong> {item.reason}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
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
                                                    <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider pb-1 leading-normal">Prompt</div>
                                                    <div className="bg-secondary/10 p-3 rounded-lg text-sm">{item.prompt}</div>
                                                </div>

                                                {(item as any).success && (item as any).evaluation ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider pb-1 leading-normal">Evaluation</div>
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
                                                                    <span className="font-mono">
                                                                        {Number.isFinite((item as any).evaluation?.biasScore)
                                                                            ? ((item as any).evaluation?.biasScore * 100).toFixed(1) + "%"
                                                                            : "N/A"}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <span>Toxicity Score:</span>
                                                                    <span className="font-mono">
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
                                                            <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider pb-1 leading-normal">Explanation</div>
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
