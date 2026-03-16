export const PERFORMANCE_VARIANTS = {
  excellent: {
    text: "text-success",
    bg: "bg-success/20",
    bgSolid: "bg-success",
    border: "border-success/30",
    fill: "fill-success",
    color: "var(--success)"
  },
  good: {
    text: "text-chart-4",
    bg: "bg-chart-4/20",
    bgSolid: "bg-chart-4",
    border: "border-chart-4/30",
    fill: "fill-chart-4",
    color: "var(--chart-4)"
  },
  average: {
    text: "text-warning",
    bg: "bg-warning/20",
    bgSolid: "bg-warning",
    border: "border-warning/30",
    fill: "fill-warning",
    color: "var(--warning)"
  },
  poor: {
    text: "text-destructive",
    bg: "bg-destructive/20",
    bgSolid: "bg-destructive",
    border: "border-destructive/30",
    fill: "fill-destructive",
    color: "var(--destructive)"
  },
};

export type PerformanceVariantKey = keyof typeof PERFORMANCE_VARIANTS;

export interface MaturityLevel {
  level: string;
  text: string;
  bg: string;
  bgSolid: string;
  border: string;
  fill: string;
  color: string;
}

export const getMaturityLevel = (score: number): MaturityLevel => {
  if (score >= 2.5) return { level: "Mature", ...PERFORMANCE_VARIANTS.excellent };
  if (score >= 1.5) return { level: "Developing", ...PERFORMANCE_VARIANTS.good };
  if (score >= 0.5) return { level: "Initial", ...PERFORMANCE_VARIANTS.average };
  return { level: "No Maturity", ...PERFORMANCE_VARIANTS.poor };
};

export const getRiskExposure = (score: number): { label: string, colorClass: string } => {
  if (score >= 2.5) return { label: "LOW", colorClass: "text-success" };
  if (score >= 1.5) return { label: "MEDIUM", colorClass: "text-warning" };
  return { label: "HIGH", colorClass: "text-destructive" };
};
