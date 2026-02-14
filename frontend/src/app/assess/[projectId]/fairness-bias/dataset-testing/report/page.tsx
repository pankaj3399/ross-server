"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    AlertTriangle,
    ArrowLeft,
    FileText,
} from "lucide-react";
import { apiService } from "@/lib/api";
import type { DatasetMetric, DatasetReportPayload, FairnessColumn } from "../types";
import { getDatasetTestingReportKey } from "../storage";
import { Skeleton } from "@/components/Skeleton";
import { verdictStyles, getThresholds } from "../constants";
import { FairnessMetricCard } from "./components/FairnessMetricCard";
import { SensitiveColumnAnalysis } from "./components/SensitiveColumnAnalysis";
import { DatasetSnapshot } from "./components/DatasetSnapshot";
import { usePdfExport } from "./hooks/usePdfExport";

const formatBytes = (bytes: number) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    if (bytes < 1024) return `${Math.round(bytes)} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

const loadPayloadFromSession = (projectId: string): DatasetReportPayload | null => {
    if (typeof window === "undefined") return null;
    const key = getDatasetTestingReportKey(projectId);
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as DatasetReportPayload;
    } catch {
        return null;
    }
};

const DatasetTestingReportPage = () => {
    const router = useRouter();
    const params = useParams<{ projectId: string }>();
    const projectId = params.projectId;

    const [payload, setPayload] = useState<DatasetReportPayload | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const reportRef = useRef<HTMLDivElement | null>(null);

    const THRESHOLDS = useMemo(() => getThresholds(), []);

    const { exportPdf: handleExportPdf, isExporting } = usePdfExport({ reportRef, payload });

    useEffect(() => {
        if (!projectId) return;

        const fetchReport = async () => {
            setIsLoading(true);
            try {
                // Try to get from API first (preferred method for large datasets)
                const response = await apiService.getDatasetReports(projectId);
                if (response.success && response.reports.length > 0) {
                    // Take the most recent report
                    const latestReport = response.reports[0];

                    // Map API response to local payload format
                    const mappedPayload: DatasetReportPayload = {
                        result: {
                            fairness: latestReport.fairness_data,
                            fairnessResult: latestReport.fairness_result,
                            biasness: latestReport.biasness_result,
                            toxicity: latestReport.toxicity_result,
                            relevance: latestReport.relevance_result,
                            faithfulness: latestReport.faithfulness_result,
                        },
                        fileMeta: {
                            name: latestReport.file_name,
                            size: latestReport.file_size,
                            uploadedAt: latestReport.uploaded_at,
                        },
                        preview: latestReport.csv_preview,
                        generatedAt: latestReport.created_at,
                        selections: latestReport.selections,
                        // Optional fields might need to be fetched or inferred if not in report data
                        // For now leaving undefined as they are optional in DatasetReportPayload
                    };
                    setPayload(mappedPayload);
                } else {
                    // Fallback to session storage only if API fails or returns no reports (backward compatibility)
                    setPayload(loadPayloadFromSession(projectId));
                }
            } catch (error) {
                console.error("Failed to fetch report:", error);

                // Fallback to session storage on API error
                setPayload(loadPayloadFromSession(projectId));
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [projectId]);

    const metricCards = useMemo<Array<{ key: string; title: string; data: DatasetMetric }>>(() => {
        if (!payload) return [];
        const result = payload.result;
        return [
            { key: "fairness", title: "Fairness", data: result.fairnessResult },
            { key: "biasness", title: "Biasness", data: result.biasness },
            { key: "toxicity", title: "Toxicity", data: result.toxicity },
            { key: "relevance", title: "Relevance", data: result.relevance },
            { key: "faithfulness", title: "Faithfulness", data: result.faithfulness },
        ];
    }, [payload]);

    const handleBackToUpload = () => {
        router.push(`/assess/${projectId}/fairness-bias/dataset-testing`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950">
                <div className="text-center space-y-3">
                    <Skeleton variant="circular" width="2rem" height="2rem" className="mx-auto" />
                    <Skeleton height="1rem" width="180px" className="mx-auto" />
                </div>
            </div>
        );
    }

    if (!payload) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center px-6">
                <div className="max-w-md rounded-3xl bg-white dark:bg-gray-900 shadow-xl ring-1 ring-slate-100 dark:ring-gray-800 p-8 space-y-4 text-center">
                    <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">No report found</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Run a fairness evaluation from the dataset testing page to view a detailed report.
                    </p>
                    <button
                        onClick={handleBackToUpload}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go to Dataset Testing
                    </button>
                </div>
            </div>
        );
    }

    const { result, fileMeta, preview, generatedAt, selections } = payload;
    const verdictStyle = verdictStyles[result.fairness.overallVerdict];

    return (
        <div ref={reportRef} className="min-h-screen bg-slate-50 dark:bg-gray-950">
            <header className="">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBackToUpload}
                            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200 transition-colors hide-in-pdf"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Dataset Testing
                        </button>
                        <div className="h-6 w-px bg-slate-200 dark:bg-gray-700 hide-in-pdf" />
                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Report</p>
                            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Fairness & Bias Evaluation Summary</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBackToUpload}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 hide-in-pdf"
                        >
                            <FileText className="w-4 h-4" />
                            Upload New CSV
                        </button>
                        <button
                            type="button"
                            onClick={handleExportPdf}
                            disabled={isExporting}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 hide-in-pdf"
                        >
                            {isExporting ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-4 h-4" />
                                    Export PDF
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
                <section className="rounded-3xl bg-white dark:bg-gray-900 shadow-xl ring-1 ring-slate-100 dark:ring-gray-800 p-6 space-y-8">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-2xl border border-slate-100 dark:border-gray-800 p-5 space-y-3 bg-[#f8fafc] dark:bg-gray-800 page-break-avoid">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Upload Info</p>
                            <div>
                                <p className="text-sm text-slate-500">Filename</p>
                                <p className="text-base font-semibold text-slate-900 dark:text-white">{fileMeta.name}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-slate-500">Filesize</p>
                                    <p className="font-medium text-slate-900 dark:text-white">{formatBytes(Number(fileMeta.size ?? 0))}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Uploaded</p>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                        {new Date(fileMeta.uploadedAt).toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Total Rows</p>
                                    <p className="font-medium text-slate-900 dark:text-white">{result.fairness.datasetStats?.totalRows?.toLocaleString() ?? "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Positives</p>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                        {result.fairness.datasetStats?.totalPositives?.toLocaleString() ?? "N/A"} ({formatPercent(result.fairness.datasetStats?.overallPositiveRate ?? 0)})
                                    </p>
                                </div>
                            </div>
                            {result.fairness.outcomeColumn && (
                                <div className="pt-2 border-t border-slate-100 dark:border-gray-700">
                                    <p className="text-xs text-slate-500">
                                        Outcome: <span className="font-medium text-slate-700 dark:text-slate-300">{result.fairness.outcomeColumn}</span> (<span className="font-medium text-emerald-600">{result.fairness.positiveOutcome}</span>)
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Analysis Parameters Section */}
                        <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900 p-5 space-y-3 bg-[#f5f7ff] dark:bg-slate-900 page-break-avoid">
                            <p className="text-xs uppercase tracking-wide text-indigo-600 dark:text-indigo-400 font-semibold">Analysis Parameters</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Fairness Threshold</p>
                                    <p className="font-bold text-slate-900 dark:text-white text-lg">{formatPercent(selections?.threshold ?? THRESHOLDS.FAIRNESS.HIGH)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Evaluation Method</p>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                        {selections?.method === "selectionRate" ? "Selection Rate" : "Impact Ratio"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Test Type</p>
                                    <p className="font-medium text-slate-900 dark:text-white capitalize">{selections?.testType || "Standard"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Sensitive Attribute</p>
                                    <p className="font-medium text-slate-900 dark:text-white">{selections?.group || "All"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className={`rounded-2xl px-4 py-3 flex items-center gap-3 ${verdictStyle.bg} page-break-avoid`}>
                            <verdictStyle.icon className={`w-6 h-6 ${verdictStyle.color}`} />
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-300">Overall verdict</p>
                                <p className={`text-xl font-semibold ${verdictStyle.color}`}>{verdictStyle.label}</p>
                            </div>
                        </div>
                    </div>

                    {/* Metric Score Cards - Simplified Grid */}
                    <div className="space-y-4 rounded-2xl bg-white dark:bg-gray-900">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white px-1">Overall Metrics</h3>
                        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5 pdf-metric-grid">
                            {metricCards.map((metric) => (
                                <FairnessMetricCard key={metric.key} title={metric.title} data={metric.data} />
                            ))}
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Sensitive Columns</p>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Fairness Analysis by Demographic Group</h3>
                        </div>
                        <p className="text-xs text-slate-500">{result.fairness.sensitiveColumns.length} groups analyzed</p>
                    </div>

                    {result.fairness.sensitiveColumns.length === 0 ? (
                        <div className="rounded-2xl border border-slate-100 dark:border-gray-800 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:bg-gray-800 dark:text-slate-300">
                            No sensitive columns detected or insufficient data to compute disparities.
                        </div>
                    ) : (
                        <div className="grid gap-6 lg:grid-cols-2">
                            {result.fairness.sensitiveColumns.map((column: FairnessColumn) => (
                                <SensitiveColumnAnalysis
                                    key={column.column}
                                    column={column}
                                    threshold={selections?.threshold ?? THRESHOLDS.FAIRNESS.HIGH}
                                    isExporting={isExporting}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {preview && (
                    <DatasetSnapshot preview={preview} />
                )}
            </main>
        </div>
    );
};

export default DatasetTestingReportPage;
