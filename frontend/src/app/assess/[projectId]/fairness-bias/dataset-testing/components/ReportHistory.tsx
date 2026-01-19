import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Eye, Clock, AlertTriangle, CheckCircle, XCircle, ChevronRight } from "lucide-react";
import { apiService } from "@/lib/api";
import { getDatasetTestingReportKey } from "../storage";
import type { DatasetReportPayload, PreviewData, DatasetMetric } from "../types";

type ReportHistoryProps = {
    projectId: string;
};

interface FairnessData {
    overallVerdict: "pass" | "caution" | "fail" | "insufficient";
    sensitiveColumns: any[];
    outcomeColumn: string | null;
    positiveOutcome: string | null;
    datasetStats: any;
    metricDefinitions: any;
}

type Report = {
    id: string;
    file_name: string;
    file_size: number;
    uploaded_at: string;
    fairness_data: FairnessData;
    fairness_result: DatasetMetric;
    biasness_result: DatasetMetric;
    toxicity_result: DatasetMetric;
    relevance_result: DatasetMetric;
    faithfulness_result: DatasetMetric;
    csv_preview: PreviewData;
    selections: Record<string, any> | null;
    created_at: string;
};

export const ReportHistory = ({ projectId }: ReportHistoryProps) => {
    const router = useRouter();
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await apiService.getDatasetReports(projectId);
                if (response.success) {
                    setReports(response.reports);
                }
            } catch (err) {
                console.error("Failed to fetch reports:", err);
                setError("Failed to load report history");
            } finally {
                setIsLoading(false);
            }
        };

        fetchReports();
    }, [projectId]);

    const handleViewReport = (report: Report) => {
        const payload: DatasetReportPayload = {
            result: {
                fairness: report.fairness_data,
                fairnessResult: report.fairness_result,
                biasness: report.biasness_result,
                toxicity: report.toxicity_result,
                relevance: report.relevance_result,
                faithfulness: report.faithfulness_result,
            },
            fileMeta: {
                name: report.file_name,
                size: report.file_size,
                uploadedAt: report.uploaded_at,
            },
            preview: report.csv_preview,
            generatedAt: report.created_at,
            // Default selections if not stored (backwards compatibility or if not saved)
            selections: (report.selections as any) || {
                metric: "adverseImpact",
                method: "selectionRate",
                group: "genderRace",
                resumeFilter: "all",
                threshold: 0.5,
                testType: "userData",
            },
        };

        if (typeof window !== "undefined") {
            const storageKey = getDatasetTestingReportKey(projectId);
            window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
            router.push(`/assess/${projectId}/fairness-bias/dataset-testing/report`);
        }
    };

    const getVerdictBadge = (verdict: string) => {
        switch (verdict) {
            case "pass":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Pass
                    </span>
                );
            case "caution":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Caution
                    </span>
                );
            case "fail":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                        <XCircle className="w-3.5 h-3.5" />
                        Fail
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-500 border border-gray-500/20">
                        Insufficient Data
                    </span>
                );
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const [isExpanded, setIsExpanded] = useState(false);

    const parseBackendDate = (dateStr: string) => {
        // Ensure the date is treated as UTC if it doesn't end with Z
        const safeDateStr = dateStr.endsWith("Z") ? dateStr : `${dateStr}Z`;
        return new Date(safeDateStr);
    };

    // Sort reports by date descending (just in case API didn't)
    const sortedReports = [...reports].sort((a, b) =>
        parseBackendDate(b.created_at).getTime() - parseBackendDate(a.created_at).getTime()
    );

    const displayedReports = isExpanded ? sortedReports : sortedReports.slice(0, 5);
    const hasMore = reports.length > 5;

    if (isLoading) {
        return (
            <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-8 text-center text-muted-foreground">
                <p className="text-red-500 mb-2">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="text-primary hover:underline text-sm"
                    type="button"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    Recent Evaluations
                </h2>
                <div className="text-xs text-muted-foreground">
                    {reports.length} report{reports.length !== 1 ? 's' : ''} found
                </div>
            </div>

            {reports.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
                    <p>No reports found. Run a new evaluation to see it here.</p>
                </div>
            ) : (
                <div className="relative rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-secondary/30 border-b border-border">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Date</th>
                                    <th className="px-6 py-3 font-medium">Dataset</th>
                                    <th className="px-6 py-3 font-medium">Verdict</th>
                                    <th className="px-6 py-3 font-medium text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {displayedReports.map((report) => (
                                    <tr
                                        key={report.id}
                                        className="bg-card hover:bg-secondary/20 transition-colors group cursor-pointer"
                                        onClick={() => handleViewReport(report)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                                            <div>{parseBackendDate(report.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                                            <div className="text-xs opacity-70">{parseBackendDate(report.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric" })}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-foreground">{report.file_name}</div>
                                                    <div className="text-xs text-muted-foreground">{formatFileSize(report.file_size)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getVerdictBadge(report.fairness_data?.overallVerdict ?? 'insufficient')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewReport(report);
                                                }}
                                                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                                            >
                                                View Report
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Expand Overlay */}
                    {!isExpanded && hasMore && (
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card to-transparent pointer-events-none flex items-end justify-center pb-4">
                            <button
                                onClick={() => setIsExpanded(true)}
                                className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <ChevronRight className="w-4 h-4 rotate-90" />
                                Show complete history ({reports.length})
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Collapse button if expanded */}
            {isExpanded && hasMore && (
                <div className="flex justify-center pt-2">
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Show less
                    </button>
                </div>
            )}
        </div>
    );
};
