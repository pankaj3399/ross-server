"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, AlertTriangle, ChevronRight, FileEdit, Trash2, Search, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

type ManualReport = {
    id: string;
    job_id: string;
    total_prompts: number;
    success_count: number;
    failure_count: number;
    average_scores: {
        total: number;
        successful: number;
        failed: number;
        averageOverallScore: number;
        averageBiasScore: number;
        averageToxicityScore: number;
    };
    created_at: string;
};

type ManualTestHistoryProps = {
    projectId: string;
};

export const ManualTestHistory = ({ projectId }: ManualTestHistoryProps) => {
    const router = useRouter();
    const [reports, setReports] = useState<ManualReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isExpanded, setIsExpanded] = useState(false);
    const [deletingReportId, setDeletingReportId] = useState<string | null>(null);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/fairness/manual-reports/${projectId}`, {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
                    }
                });

                if (!res.ok) throw new Error("Failed to fetch");

                const data = await res.json();
                if (data.success) {
                    setReports(data.reports);
                }
            } catch (err) {
                console.error("Failed to fetch manual reports:", err);
                setError("Failed to load manual test history");
            } finally {
                setIsLoading(false);
            }
        };

        fetchReports();
    }, [projectId]);

    const handleViewReport = (report: ManualReport) => {
        router.push(`/assess/${projectId}/fairness-bias/manual-history/${report.id}`);
    };

    const parseBackendDate = (dateStr: string) => {
        const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(dateStr);
        let normalized = dateStr.replace(' ', 'T');
        if (!hasTimezone) {
            normalized = `${normalized}Z`;
        }
        return new Date(normalized);
    };

    const sortedReports = useMemo(() => {
        return [...reports].sort((a, b) =>
            parseBackendDate(b.created_at).getTime() - parseBackendDate(a.created_at).getTime()
        );
    }, [reports]);

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

    const getStatusBadge = (success: number, failure: number) => {
        if (failure === 0 && success > 0) {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Success
                </span>
            );
        } else if (success === 0 && failure > 0) {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                    <XCircle className="w-3.5 h-3.5" />
                    Failed
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Partial ({success}/{success + failure})
                </span>
            );
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-end justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <FileEdit className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">
                            Manual Test History
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Past manual prompt evaluations
                        </p>
                    </div>
                </div>
                <div className="text-xs font-medium px-2 py-1 rounded bg-secondary/50 text-muted-foreground border border-border">
                    {reports.length} report{reports.length !== 1 ? 's' : ''} found
                </div>
            </div>

            {reports.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                        <Search className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-medium text-foreground mb-1">No manual test history found</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        Run a manual prompt evaluation to see your past results here.
                    </p>
                </div>
            ) : (
                <div className="relative rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-secondary/30 border-b border-border">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Date</th>
                                    <th className="px-6 py-3 font-medium">Test Type</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium">Score</th>
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
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                                    <FileEdit className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-foreground truncate max-w-[200px]">
                                                        Manual Evaluation
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {report.total_prompts} prompts
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(report.success_count, report.failure_count)}
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            {report.average_scores?.averageOverallScore != null ?
                                                `${(report.average_scores.averageOverallScore * 100).toFixed(1)}%` :
                                                "N/A"}
                                        </td>
                                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewReport(report);
                                                }}
                                                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                                                type="button"
                                            >
                                                View Details
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (deletingReportId) return; // Prevent double clicks
                                                    if (confirm("Are you sure you want to delete this report?")) {
                                                        setDeletingReportId(report.id);
                                                        try {
                                                            const res = await fetch(`${API_BASE_URL}/fairness/manual-reports/${report.id}`, {
                                                                method: 'DELETE',
                                                                headers: {
                                                                    "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
                                                                }
                                                            });
                                                            if (res.ok) {
                                                                setReports(prev => prev.filter(r => r.id !== report.id));
                                                            } else {
                                                                alert("Failed to delete report. Please try again.");
                                                            }
                                                        } catch (err) {
                                                            console.error("Failed to delete report:", err);
                                                            alert("An error occurred while deleting the report.");
                                                        } finally {
                                                            setDeletingReportId(null);
                                                        }
                                                    }
                                                }}
                                                className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                                title="Delete report"
                                                type="button"
                                                disabled={!!deletingReportId}
                                            >
                                                {deletingReportId === report.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {!isExpanded && hasMore && (
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card to-transparent pointer-events-none flex items-end justify-center pb-4">
                            <button
                                onClick={() => setIsExpanded(true)}
                                className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                                type="button"
                            >
                                <ChevronRight className="w-4 h-4 rotate-90" />
                                Show complete history ({reports.length})
                            </button>
                        </div>
                    )}
                </div>
            )}

            {isExpanded && hasMore && (
                <div className="flex justify-center pt-2">
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        type="button"
                    >
                        Show less
                    </button>
                </div>
            )}
        </div>
    );
};
