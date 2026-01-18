"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Upload, Trash2, RefreshCw, FileText } from "lucide-react";
import { apiService } from "@/lib/api";
import { Lock } from "lucide-react";
import { getDatasetTestingReportKey } from "./storage";
import { DatasetUploadSection } from "./components/DatasetUploadSection";
import type { DatasetEvaluationResponse, PreviewData, DatasetReportPayload } from "./types";

const PRIVACY_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes
const MAX_PREVIEW_COLUMNS = 20;
const MAX_PREVIEW_ROWS = 20;

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Shared CSV parsing helper with optional row/column limits
 */
const parseCsv = (
  text: string,
  options?: { maxRows?: number; maxCols?: number }
): PreviewData => {
  const { maxRows, maxCols } = options || {};
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
      // Apply row limit if specified (add 1 for header row)
      if (maxRows !== undefined && rows.length >= maxRows + 1) break;
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

  // Apply column limit if specified
  const headers = maxCols !== undefined ? rows[0].slice(0, maxCols) : rows[0];
  const dataRows = rows.slice(1).map((cols) =>
    maxCols !== undefined ? cols.slice(0, maxCols) : cols
  );

  return { headers, rows: dataRows };
};

const parsePreview = (text: string): PreviewData => {
  return parseCsv(text, { maxRows: MAX_PREVIEW_ROWS, maxCols: MAX_PREVIEW_COLUMNS });
};

const parseFullCsv = (text: string): PreviewData => {
  return parseCsv(text);
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
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'unknown' | 'free' | 'trial' | 'premium'>('unknown');

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const user = await apiService.getCurrentUser();
        const status = user.subscription_status;
        // Explicitly map recognized subscription values
        if (status === 'basic_premium' || status === 'pro_premium') {
          setSubscriptionStatus('premium');
        } else if (status === 'trial') {
          setSubscriptionStatus('trial');
        } else if (status === 'free') {
          setSubscriptionStatus('free');
        } else {
          // Unknown subscription value - treat as free for safety
          console.warn(`Unknown subscription status: ${status}, defaulting to free`);
          setSubscriptionStatus('free');
        }
      } catch (error) {
        console.error("Failed to check subscription status", error);
        setSubscriptionStatus('unknown');
      } finally {
        setIsCheckingSubscription(false);
      }
    };
    checkAccess();
  }, []);

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
        preview: parseFullCsv(csvText),
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
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push(`/assess/${projectId}/fairness-bias/options`)}
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Dataset Testing
              </h1>
              <p className="text-sm text-muted-foreground">
                Upload a CSV to evaluate your dataset for fairness and bias
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Error state - subscription check failed */}
      {!isCheckingSubscription && subscriptionStatus === 'unknown' && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="rounded-3xl bg-card shadow-xl ring-1 ring-border p-12 text-center space-y-6">
            <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto">
              <RefreshCw className="w-8 h-8 text-warning" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Unable to Verify Subscription</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                We encountered a temporary error while checking your subscription status. Please try again.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-xl bg-warning px-6 py-3 text-sm font-semibold text-warning-foreground hover:bg-warning/90 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Free tier - locked feature */}
      {
        !isCheckingSubscription && subscriptionStatus === 'free' && (
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="rounded-3xl bg-card shadow-xl ring-1 ring-border p-12 text-center space-y-6">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Premium Feature</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Fairness & Bias evaluation is available on Premium plans. Upgrade your account to access advanced dataset testing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/subscriptions")}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
              >
                Upgrade to Premium
              </button>
            </div>
          </div>
        )
      }

      {/* Trial tier - temporary premium access with notice */}
      {
        !isCheckingSubscription && subscriptionStatus === 'trial' && (
          <>
            <div className="max-w-7xl mx-auto px-6 pt-6">
              <div className="rounded-xl bg-secondary/50 border border-secondary px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-secondary-foreground text-sm">⏱</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    You're on a trial plan
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Upgrade to keep access to Fairness & Bias evaluation after your trial ends.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/subscriptions")}
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition"
                >
                  Upgrade →
                </button>
              </div>
            </div>
            <DatasetUploadSection
              inputId="csv-upload-trial"
              fileInputRef={fileInputRef}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
              handleFileChange={handleFileChange}
              handleReset={handleReset}
              handleEvaluate={handleEvaluate}
              error={error}
              isParsing={isParsing}
              isEvaluating={isEvaluating}
              hasFile={hasFile}
              fileMeta={fileMeta}
              preview={preview}
            />
          </>
        )
      }

      {/* Premium tier - full access */}
      {
        !isCheckingSubscription && subscriptionStatus === 'premium' && (
          <DatasetUploadSection
            inputId="csv-upload"
            fileInputRef={fileInputRef}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            handleFileChange={handleFileChange}
            handleReset={handleReset}
            handleEvaluate={handleEvaluate}
            error={error}
            isParsing={isParsing}
            isEvaluating={isEvaluating}
            hasFile={hasFile}
            fileMeta={fileMeta}
            preview={preview}
          />
        )
      }
    </div>
  );
};

export default DatasetTestingPage;

