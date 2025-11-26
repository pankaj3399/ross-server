export type VerdictStatus = "pass" | "caution" | "fail" | "insufficient";

export type MetricLabel = "low" | "moderate" | "high";

export type DatasetMetric = {
  score: number;
  label: MetricLabel;
  explanation: string;
};

export type FairnessGroup = {
  value: string;
  rows: number;
  positive: number;
  positiveRate: number;
};

export type FairnessColumn = {
  column: string;
  verdict: VerdictStatus;
  disparity: number;
  groups: FairnessGroup[];
};

export type DatasetEvaluationResponse = {
  fairness: {
    overallVerdict: VerdictStatus;
    sensitiveColumns: FairnessColumn[];
  };
  fairnessResult: DatasetMetric;
  biasness: DatasetMetric;
  toxicity: DatasetMetric;
  relevance: DatasetMetric;
  faithfulness: DatasetMetric;
};

export type PreviewData = {
  headers: string[];
  rows: string[][];
};

export type DatasetReportPayload = {
  result: DatasetEvaluationResponse;
  fileMeta: { name: string; size: number; uploadedAt: string };
  preview: PreviewData | null;
  generatedAt: string;
  selections: {
    metric: string;
    method: "selectionRate" | "impactRatio";
    group: string;
    resumeFilter: string;
    threshold: number;
    testType: string;
  };
};

