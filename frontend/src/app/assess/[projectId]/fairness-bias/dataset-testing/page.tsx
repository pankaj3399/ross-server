"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Upload, Trash2, RefreshCw, FileText } from "lucide-react";
import { apiService } from "@/lib/api";
import { getDatasetTestingReportKey } from "./storage";
import type { DatasetEvaluationResponse, PreviewData, DatasetReportPayload } from "./types";

const PRIVACY_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes
const MAX_PREVIEW_COLUMNS = 20;
const MAX_PREVIEW_ROWS = 20;

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const parsePreview = (text: string): PreviewData => {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  const pushValue = () => {
    row.push(current.trim());
    current = "";
  };

  const pushRow = () => {
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      pushValue();
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (current.length || row.length) {
        pushValue();
        if (row.length) {
          pushRow();
        }
      }
      while (text[i + 1] === "\n" || text[i + 1] === "\r") {
        i++;
      }
      if (rows.length >= MAX_PREVIEW_ROWS) break;
      continue;
    }

    current += char;
  }

  if (current.length || row.length) {
    pushValue();
    pushRow();
  }

  if (!rows.length) {
    return { headers: [], rows: [] };
  }

  const headers = rows[0].slice(0, MAX_PREVIEW_COLUMNS);
  const dataRows = rows.slice(1).map((cols) => cols.slice(0, MAX_PREVIEW_COLUMNS));

  return { headers, rows: dataRows };
};

const DatasetTestingPage = () => {
  const router = useRouter();
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const privacyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [fileMeta, setFileMeta] = useState<{ name: string; size: number; uploadedAt: Date } | null>(null);
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<PreviewData>({ headers: [], rows: [] });
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState("adverseImpact");
  const [selectedMethod, setSelectedMethod] = useState<"selectionRate" | "impactRatio">("selectionRate");
  const [selectedGroup, setSelectedGroup] = useState("genderRace");
  const [selectedResumeFilter, setSelectedResumeFilter] = useState("all");
  const [threshold, setThreshold] = useState(0.5);
  const [testType, setTestType] = useState("userData");

  const hasFile = Boolean(csvText.length);

  const handleReset = useCallback(() => {
    if (privacyTimerRef.current) {
      clearTimeout(privacyTimerRef.current);
      privacyTimerRef.current = null;
    }
    setFileMeta(null);
    setCsvText("");
    setPreview({ headers: [], rows: [] });
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  useEffect(() => {
    if (!csvText.length) return;
    if (privacyTimerRef.current) {
      clearTimeout(privacyTimerRef.current);
    }
    privacyTimerRef.current = setTimeout(() => {
      handleReset();
    }, PRIVACY_TIMEOUT_MS);
  }, [csvText, handleReset]);

  useEffect(() => {
    return () => {
      if (privacyTimerRef.current) {
        clearTimeout(privacyTimerRef.current);
      }
    };
  }, []);

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a CSV file.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("File exceeds the 25MB limit.");
      return;
    }

    setIsParsing(true);
    try {
      const text = await file.text();
      const previewData = parsePreview(text);
      if (!previewData.headers.length) {
        setError("Could not detect any headers in this file.");
        return;
      }
      setCsvText(text);
      setPreview(previewData);
      setFileMeta({ name: file.name, size: file.size, uploadedAt: new Date() });
    } catch (parseError) {
      setError("Unable to read this CSV. Please verify formatting.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const handleEvaluate = async () => {
    if (!hasFile || !fileMeta) {
      setError("Upload a CSV before running evaluation.");
      return;
    }
    setIsEvaluating(true);
    setError(null);
    try {
      const response = await apiService.evaluateDatasetFairness({
        projectId,
        fileName: fileMeta.name,
        csvText,
      });
      const payload: DatasetReportPayload = {
        result: response,
        fileMeta: {
          name: fileMeta.name,
          size: fileMeta.size,
          uploadedAt: fileMeta.uploadedAt.toISOString(),
        },
        preview: preview.headers.length ? preview : null,
        generatedAt: new Date().toISOString(),
        selections: {
          metric: selectedMetric,
          method: selectedMethod,
          group: selectedGroup,
          resumeFilter: selectedResumeFilter,
          threshold,
          testType,
        },
      };
      if (typeof window !== "undefined") {
        const storageKey = getDatasetTestingReportKey(projectId);
        window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
      }
      router.push(`/assess/${projectId}/fairness-bias/dataset-testing/report`);
    } catch (apiError) {
      const message = apiError instanceof Error ? apiError.message : "Evaluation failed";
      setError(message);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/assess/${projectId}/fairness-bias/options`)}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dataset Testing
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload a CSV to evaluate your dataset for fairness and biasness
              </p>
            </div>
          </div>
        </div>
      </div>


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
                htmlFor="csv-upload"
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
                  id="csv-upload"
                  ref={fileInputRef}
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
                      onClick={handleReset}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear
                    </button>
                  )}
                  <button
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

export default DatasetTestingPage;

