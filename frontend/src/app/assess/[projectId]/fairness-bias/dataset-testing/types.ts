export type VerdictStatus = "pass" | "caution" | "fail" | "insufficient";

export type MetricLabel = "low" | "moderate" | "high";

export type DatasetMetric = {
  /** Score value (0.0-1.0 scale) */
  score: number;
  /** Label classification based on metric-specific thresholds */
  label: MetricLabel;
  /** AI-generated explanation points */
  explanation: string[];
  /** True if score is an estimate due to AI service unavailability */
  isEstimated?: boolean;
};

export type FairnessGroup = {
  /** The group value (e.g., "Male", "Female", "Asian") */
  value: string;
  /** Total number of rows for this group */
  rows: number;
  /** Number of positive outcomes for this group */
  positive: number;
  /** Selection rate: positive / rows (proportion of group receiving positive outcome) */
  positiveRate: number;
  /** Distribution: rows / totalRows (proportion of dataset represented by this group) - sums to 100% */
  distribution: number;
  /** Outcome share: positive / totalPositives (share of all positive outcomes going to this group) - sums to 100% */
  outcomeShare: number;
};

export type MetricDefinition = {
  name: string;
  formula: string;
  description: string;
  interpretation: string;
  threshold: string;
};

export type FairnessColumn = {
  /** Column name (e.g., "gender", "race") */
  column: string;
  /** Overall verdict for this column */
  verdict: VerdictStatus;
  /** Demographic Parity Difference: max - min selection rate */
  disparity: number;
  /** Disparate Impact Ratio: min / max selection rate (80% rule) */
  disparateImpactRatio: number;
  /** Total rows analyzed for this column */
  totalRows: number;
  /** Total positive outcomes for this column */
  totalPositives: number;
  /** Group-level metrics */
  groups: FairnessGroup[];
  /** Human-readable explanation of the metrics */
  explanation: string[];
};

export type DatasetEvaluationResponse = {
  fairness: {
    overallVerdict: VerdictStatus;
    sensitiveColumns: FairnessColumn[];
    /** Target/outcome column used for analysis */
    outcomeColumn: string | null;
    /** Value considered as positive outcome */
    positiveOutcome: string | null;
    /** Dataset statistics */
    datasetStats: {
      totalRows: number;
      totalPositives: number;
      overallPositiveRate: number;
    };
    /** Metric definitions for reference */
    metricDefinitions: {
      selectionRate: MetricDefinition;
      demographicParityDifference: MetricDefinition;
      disparateImpactRatio: MetricDefinition;
      groupDistribution: MetricDefinition;
    };
  };
  fairnessResult: DatasetMetric;
  biasness: DatasetMetric;
  toxicity: DatasetMetric;
  relevance: DatasetMetric;
  faithfulness: DatasetMetric;
};

export type PreviewData = {
  headers: string[];
  rows: (string[] | Record<string, string>)[];
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

