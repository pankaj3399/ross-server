// Shared metric result shape for fairness/bias/toxicity/relevance/faithfulness.
// `score: null` and `label: "insufficient_data"` represent skipped metrics
// (e.g. no analyzable text, no measurable groups) so callers can render an
// explicit "unavailable" state instead of a misleading 0.0.
export type WideMetricResult = {
    score: number | null;
    label: "low" | "moderate" | "high" | "insufficient_data";
    explanation: string[];
};
