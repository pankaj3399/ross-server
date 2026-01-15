"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    AlertTriangle,
    ArrowLeft,
    FileText,
} from "lucide-react";
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

const DatasetTestingReportPage = () => {
    const router = useRouter();
    const params = useParams<{ projectId: string }>();
    const projectId = params.projectId;

    const [payload, setPayload] = useState<DatasetReportPayload | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const reportRef = useRef<HTMLDivElement | null>(null);

    const THRESHOLDS = useMemo(() => getThresholds(), []);

    // eslint-disable-next-line no-unused-vars
    const { exportPdf: handleExportPdf, isExporting } = usePdfExport({ reportRef, payload });

    useEffect(() => {
        if (!projectId) return;
        const key = getDatasetTestingReportKey(projectId);
        const raw = typeof window !== "undefined" ? window.sessionStorage.getItem(key) : null;
        if (raw) {
            try {
                setPayload(JSON.parse(raw) as DatasetReportPayload);
            } catch {
                setPayload(null);
            }
        } else {
            setPayload(null);
        }
        setIsLoading(false);
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
            <header className="backdrop-blur">
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
                        {/* 
                            TODO: [ISSUE-FAIR-102] Re-enable PDF export once progress bar rendering issues are resolved.
                            Owner: @frontend-team
                            Follow-up: 
                            1. Verify PDF canvas rendering of gradient progress bars in usePdfExport.
                            2. Remove eslint-disable on line 40.
                            3. Uncomment export button and wire to handleExportPdf.
                        */}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
                <section className="rounded-3xl bg-white dark:bg-gray-900 shadow-xl ring-1 ring-slate-100 dark:ring-gray-800 p-6 grid gap-8 lg:grid-cols-1">
                    <div className="rounded-2xl border border-slate-100 dark:border-gray-800 p-5 space-y-3 bg-slate-50/60 dark:bg-gray-800/60 page-break-avoid">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Upload Info</p>
                        <div>
                            <p className="text-sm text-slate-500">Filename</p>
                            <p className="text-base font-semibold text-slate-900 dark:text-white">{fileMeta.name}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                                <p className="text-xs text-slate-500">Positive Outcomes</p>
                                <p className="font-medium text-slate-900 dark:text-white">
                                    {result.fairness.datasetStats?.totalPositives?.toLocaleString() ?? "N/A"} ({formatPercent(result.fairness.datasetStats?.overallPositiveRate ?? 0)})
                                </p>
                            </div>
                        </div>
                        {result.fairness.outcomeColumn && (
                            <div className="pt-2 border-t border-slate-100 dark:border-gray-700">
                                <p className="text-xs text-slate-500">
                                    Outcome column: <span className="font-medium text-slate-700 dark:text-slate-300">{result.fairness.outcomeColumn}</span> (positive value: <span className="font-medium text-emerald-600">{result.fairness.positiveOutcome}</span>)
                                </p>
                            </div>
                        )}
                        <p className="text-xs text-slate-500">Generated {new Date(generatedAt).toLocaleString()}</p>
                    </div>

                    {/* Analysis Parameters Section */}
                    <div className="rounded-2xl border border-indigo-100 dark:border-indigo-500/30 p-5 space-y-3 bg-indigo-50/50 dark:bg-indigo-500/5 page-break-avoid">
                        <p className="text-xs uppercase tracking-wide text-indigo-600 dark:text-indigo-400 font-semibold">Analysis Parameters</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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

                    <div className="space-y-6">
                        <div className={`rounded-2xl px-4 py-3 flex items-center gap-3 ${verdictStyle.bg} page-break-avoid`}>
                            <verdictStyle.icon className={`w-6 h-6 ${verdictStyle.color}`} />
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-300">Overall verdict</p>
                                <p className={`text-xl font-semibold ${verdictStyle.color}`}>{verdictStyle.label}</p>
                            </div>
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
                        <div className="rounded-2xl border border-slate-100 dark:border-gray-800 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:bg-gray-800/60 dark:text-slate-300">
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

                {/* Metric Score Cards - Simplified Grid */}
                <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Overall Metrics</h3>
                    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5 pdf-metric-grid">
                        {metricCards.map((metric) => (
                            <FairnessMetricCard key={metric.key} title={metric.title} data={metric.data} />
                        ))}
                    </div>
                </section>

                {preview && (
                    <DatasetSnapshot preview={preview} />
                )}
            </main>
        </div>
    );
};

export default DatasetTestingReportPage;
