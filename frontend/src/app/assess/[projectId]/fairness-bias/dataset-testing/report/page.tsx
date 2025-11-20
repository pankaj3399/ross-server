"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    AlertTriangle,
    ArrowLeft,
    Download,
    FileText,
    RefreshCw,
    Shield,
    ShieldAlert,
    ShieldCheck,
} from "lucide-react";
import type { DatasetMetric, DatasetReportPayload, FairnessColumn, MetricLabel, VerdictStatus } from "../types";
import { getDatasetTestingReportKey } from "../storage";

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

const verdictStyles: Record<
    VerdictStatus,
    { label: string; color: string; bg: string; icon: typeof Shield }
> = {
    pass: {
        label: "Pass",
        color: "text-emerald-600",
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
        icon: ShieldCheck,
    },
    caution: {
        label: "Caution",
        color: "text-amber-600",
        bg: "bg-amber-50 dark:bg-amber-500/10",
        icon: Shield,
    },
    fail: {
        label: "Fail",
        color: "text-rose-600",
        bg: "bg-rose-50 dark:bg-rose-500/10",
        icon: ShieldAlert,
    },
    insufficient: {
        label: "Insufficient",
        color: "text-slate-500",
        bg: "bg-slate-50 dark:bg-slate-800/70",
        icon: Shield,
    },
};

const metricStyles: Record<
    MetricLabel,
    { label: string; color: string; bg: string; border: string }
> = {
    low: {
        label: "Low",
        color: "text-emerald-600",
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
        border: "border-emerald-100 dark:border-emerald-500/30",
    },
    moderate: {
        label: "Moderate",
        color: "text-amber-600",
        bg: "bg-amber-50 dark:bg-amber-500/10",
        border: "border-amber-100 dark:border-amber-500/30",
    },
    high: {
        label: "High",
        color: "text-rose-600",
        bg: "bg-rose-50 dark:bg-rose-500/10",
        border: "border-rose-100 dark:border-rose-500/30",
    },
};

const formatBytes = (bytes: number) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    if (bytes < 1024) return `${Math.round(bytes)} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const DatasetTestingReportPage = () => {
    const router = useRouter();
    const params = useParams<{ projectId: string }>();
    const projectId = params.projectId;

    const [payload, setPayload] = useState<DatasetReportPayload | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const reportRef = useRef<HTMLDivElement | null>(null);

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

    const sampleSize = useMemo(() => {
        if (!payload?.result.fairness.sensitiveColumns.length) return null;
        return payload.result.fairness.sensitiveColumns.reduce((max, column) => {
            const total = column.groups.reduce((sum, group) => sum + group.rows, 0);
            return Math.max(max, total);
        }, 0);
    }, [payload]);

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

    const handleExportPdf = async () => {
        if (!reportRef.current || !payload) return;
        try {
            setIsExporting(true);
            const [jsPDFModule, html2canvasModule] = await Promise.all([import("jspdf"), import("html2canvas")]);
            const jsPDFConstructor = jsPDFModule.default;
            const html2canvas = html2canvasModule.default;

            const canvas = await html2canvas(reportRef.current, {
                scale: window.devicePixelRatio || 2,
                useCORS: true,
                backgroundColor: "#ffffff",
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDFConstructor({ orientation: "p", unit: "mm", format: "a4" });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const baseName = payload.fileMeta.name?.replace(/\.[^/.]+$/, "") || "dataset-report";
            const dateSuffix = new Date(payload.generatedAt).toISOString().split("T")[0];
            pdf.save(`${baseName}-fairness-report-${dateSuffix}.pdf`);
        } catch (error) {
            console.error("Failed to export PDF", error);
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading dataset report...
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
                            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Dataset Testing
                        </button>
                        <div className="h-6 w-px bg-slate-200 dark:bg-gray-700" />
                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Report</p>
                            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Fairness & Bias Evaluation Summary</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBackToUpload}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800"
                        >
                            <FileText className="w-4 h-4" />
                            Upload New CSV
                        </button>
                        <button
                            onClick={handleExportPdf}
                            disabled={isExporting}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:cursor-not-allowed disabled:bg-indigo-300"
                        >
                            {isExporting ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Export PDF
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
                <section className="rounded-3xl bg-white dark:bg-gray-900 shadow-xl ring-1 ring-slate-100 dark:ring-gray-800 p-6 grid gap-8 lg:grid-cols-1">
                    <div className="rounded-2xl border border-slate-100 dark:border-gray-800 p-5 space-y-3 bg-slate-50/60 dark:bg-gray-800/60">
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
                        </div>
                        <p className="text-xs text-slate-500">Generated {new Date(generatedAt).toLocaleString()}</p>
                    </div>
                    <div className="space-y-6">
                        <div className={`rounded-2xl px-4 py-3 flex items-center gap-3 ${verdictStyle.bg}`}>
                            <verdictStyle.icon className={`w-6 h-6 ${verdictStyle.color}`} />
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-300">Overall verdict</p>
                                <p className={`text-xl font-semibold ${verdictStyle.color}`}>{verdictStyle.label}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-8 xl:grid-cols-[1.25fr,0.75fr]">
                    <div className="rounded-3xl bg-white dark:bg-gray-900 shadow-xl ring-1 ring-slate-100 dark:ring-gray-800 p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500">Sensitive Columns</p>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Selection Rate Detail</h3>
                            </div>
                            <p className="text-xs text-slate-500">Groups analyzed: {result.fairness.sensitiveColumns.length}</p>
                        </div>

                        {result.fairness.sensitiveColumns.length === 0 ? (
                            <div className="rounded-2xl border border-slate-100 dark:border-gray-800 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:bg-gray-800/60 dark:text-slate-300">
                                No sensitive columns detected or insufficient data to compute disparities.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {result.fairness.sensitiveColumns.map((column: FairnessColumn) => {
                                    const style = verdictStyles[column.verdict];
                                    return (
                                        <div key={column.column} className="rounded-2xl border border-slate-100 dark:border-gray-800 p-4 space-y-4">
                                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                                <div className="flex items-center gap-3">
                                                    <style.icon className={`w-5 h-5 ${style.color}`} />
                                                    <div>
                                                        <p className="text-base font-semibold text-slate-900 dark:text-white">{column.column}</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">Disparity {formatPercent(column.disparity)}</p>
                                                    </div>
                                                </div>
                                                <span className={`text-sm font-medium px-3 py-1 rounded-full ${style.bg} ${style.color}`}>
                                                    {style.label}
                                                </span>
                                            </div>

                                            <div className="space-y-3">
                                                {column.groups.map((group) => (
                                                    <div key={group.value} className="space-y-1">
                                                        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                                                            <p className="font-medium">{group.value}</p>
                                                            <p>{formatPercent(group.positiveRate)}</p>
                                                        </div>
                                                        <div className="h-3 rounded-full bg-slate-100 dark:bg-gray-800 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${group.positiveRate < selections.threshold
                                                                    ? "bg-amber-400"
                                                                    : "bg-emerald-400"
                                                                    }`}
                                                                style={{ width: `${Math.min(group.positiveRate * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                        <div className="flex justify-between text-xs text-slate-500">
                                                            <span>{group.rows.toLocaleString()} rows</span>
                                                            <span>{group.positive.toLocaleString()} positive</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-3xl bg-white dark:bg-gray-900 shadow-xl ring-1 ring-slate-100 dark:ring-gray-800 p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Callout</p>
                                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Action Items</h4>
                                </div>
                            </div>
                            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                                <p>
                                    Analysis indicates any group under {selections.threshold * 100}% impact ratio should be investigated.
                                    Focus on slices highlighted in amber within the chart to validate sample sizes and decision rules.
                                </p>
                                <p>Re-run this evaluation whenever your scoring dataset is updated or retrained.</p>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {metricCards.map((metric) => {
                                const style = metricStyles[metric.data.label];
                                return (
                                    <div key={metric.key} className={`rounded-2xl border ${style.border} ${style.bg} p-4`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-200">{metric.title}</p>
                                            <span className={`text-xs font-semibold uppercase tracking-wide ${style.color}`}>{style.label}</span>
                                        </div>
                                        <div className="text-2xl font-semibold text-slate-900 dark:text-white">{metric.data.score.toFixed(2)}</div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{metric.data.explanation}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {preview && (
                    <section className="rounded-3xl bg-white dark:bg-gray-900 shadow-xl ring-1 ring-slate-100 dark:ring-gray-800 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500">Dataset Snapshot</p>
                                <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Preview</h4>
                            </div>
                            <p className="text-xs text-slate-500">
                                {preview.rows.length} rows • {preview.headers.length} columns staged
                            </p>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-gray-800">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr>
                                        {preview.headers.map((header) => (
                                            <th key={header} className="text-left px-4 py-3 bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-slate-300 font-medium">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.rows.map((row, rowIndex) => (
                                        <tr key={rowIndex} className="border-t border-slate-100 dark:border-gray-800">
                                            {row.map((value, colIndex) => (
                                                <td key={`${rowIndex}-${colIndex}`} className="px-4 py-2 text-slate-800 dark:text-slate-100">
                                                    {value || <span className="text-slate-400 italic">—</span>}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

export default DatasetTestingReportPage;

