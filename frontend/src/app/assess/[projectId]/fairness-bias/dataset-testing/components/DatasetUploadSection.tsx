"use client";

import { RefreshCw, Upload, Trash2, FileText } from "lucide-react";
import type { PreviewData } from "../types";

const PRIVACY_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes
const MAX_PREVIEW_COLUMNS = 20;
const MAX_PREVIEW_ROWS = 20;

const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface DatasetUploadSectionProps {
    inputId: string;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleDragOver: (e: React.DragEvent<HTMLLabelElement>) => void;
    handleDrop: (e: React.DragEvent<HTMLLabelElement>) => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleReset: () => void;
    handleEvaluate: () => void;
    error: string | null;
    isParsing: boolean;
    isEvaluating: boolean;
    hasFile: boolean;
    fileMeta: { name: string; size: number; uploadedAt: Date } | null;
    preview: PreviewData;
}

export const DatasetUploadSection = ({
    inputId,
    fileInputRef,
    handleDragOver,
    handleDrop,
    handleFileChange,
    handleReset,
    handleEvaluate,
    error,
    isParsing,
    isEvaluating,
    hasFile,
    fileMeta,
    preview,
}: DatasetUploadSectionProps) => {
    return (
        <>
            <section className="bg-gradient-to-br from-indigo-50 via-sky-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
                <div className="max-w-7xl mx-auto px-6 py-12 grid gap-8 lg:grid-cols-[minmax(0,1fr),380px]">
                    <div className="space-y-6">
                        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Fairness & Bias Evaluation</p>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                            Upload a CSV
                        </h2>
                    </div>
                </div>
            </section>

            <main className="max-w-7xl mx-auto px-6 pb-16 space-y-10 -mt-8">
                <section className="grid gap-8 lg:grid-cols-1">
                    <div className="rounded-3xl bg-white dark:bg-gray-900 shadow-xl ring-1 ring-slate-100 dark:ring-gray-800 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 to-sky-500 text-white px-6 py-5 flex flex-col gap-2">
                            <p className="text-sm uppercase tracking-wide text-white/80">Dataset Testing</p>
                            <h3 className="text-2xl font-semibold">Upload & Evaluate</h3>
                            <p className="text-sm text-white/80">We only use your CSV for this session and purge it automatically.</p>
                        </div>

                        <div className="p-6 space-y-6">
                            <label
                                htmlFor={inputId}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                className="border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-400 transition-colors bg-slate-50/60 dark:bg-gray-800/60"
                            >
                                <Upload className="w-10 h-10 text-indigo-500 dark:text-indigo-300 mb-3" />
                                <p className="text-slate-900 dark:text-white font-medium">Drop CSV here or browse</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Max 25MB • Auto-deleted after {Math.round(PRIVACY_TIMEOUT_MS / 60000)} minutes of inactivity.
                                </p>
                                <input
                                    id={inputId}
                                    ref={fileInputRef as React.RefObject<HTMLInputElement>}
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </label>

                            {error && (
                                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
                            )}

                            {isParsing && (
                                <div className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Parsing CSV...
                                </div>
                            )}

                            {fileMeta && hasFile && (
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="rounded-2xl border border-slate-200 dark:border-gray-800 p-4">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Filename</p>
                                        <p className="font-medium text-slate-900 dark:text-white truncate">{fileMeta.name}</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 dark:border-gray-800 p-4">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Filesize</p>
                                        <p className="font-medium text-slate-900 dark:text-white">{formatBytes(fileMeta.size)}</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 dark:border-gray-800 p-4">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Uploaded</p>
                                        <p className="font-medium text-slate-900 dark:text-white">
                                            {fileMeta.uploadedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Data never leaves this workspace.
                                </p>
                                <div className="flex gap-3">
                                    {hasFile && (
                                        <button
                                            type="button"
                                            onClick={handleReset}
                                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Clear
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleEvaluate}
                                        disabled={!hasFile || isEvaluating}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                                    >
                                        {isEvaluating && <RefreshCw className="w-4 h-4 animate-spin" />}
                                        {isEvaluating ? "Evaluating..." : "Run Fairness Evaluation"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {preview.headers.length > 0 && (
                    <section className="rounded-3xl bg-white dark:bg-gray-900 shadow-xl ring-1 ring-slate-100 dark:ring-gray-800 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500">Preview</p>
                                <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Dataset Snapshot</h4>
                            </div>
                            <p className="text-xs text-slate-500">
                                Showing up to {MAX_PREVIEW_ROWS} rows • {MAX_PREVIEW_COLUMNS} columns
                            </p>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-gray-800">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr>
                                        {preview.headers.map((header: string, headerIndex: number) => (
                                            <th key={`${headerIndex}-${header}`} className="text-left px-4 py-3 bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-slate-300 font-medium">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.rows.map((row: string[], rowIndex: number) => (
                                        <tr key={rowIndex} className="border-t border-slate-100 dark:border-gray-800">
                                            {row.map((value: string, colIndex: number) => (
                                                <td key={`${rowIndex}-${colIndex}`} className="px-4 py-2 text-slate-800 dark:text-slate-100">
                                                    {(value === null || value === undefined || value === '') ? (
                                                        <span className="text-slate-400 italic">—</span>
                                                    ) : (
                                                        value
                                                    )}
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
        </>
    );
};
