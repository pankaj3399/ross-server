import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { MetricLabel, VerdictStatus } from "./types";

export const verdictStyles: Record<
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

export const metricStyles: Record<
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

/**
 * Shared threshold constants for fairness metrics.
 * These mirror the backend thresholds in backend/src/utils/fairnessThresholds.ts
 */
const DEFAULT_THRESHOLDS = {
    /** Fairness: Higher is better (based on verdict conversion) */
    FAIRNESS: { HIGH: 0.8, MODERATE: 0.5 },
    /** Biasness: Lower is better (based on DPD - Demographic Parity Difference) */
    BIAS: { LOW: 0.1, MODERATE: 0.2 },
    /** Toxicity: Lower is better */
    TOXICITY: { LOW: 0.3, MODERATE: 0.6 },
    /** Positive metrics (Relevancy, Faithfulness): Higher is better */
    POSITIVE: { HIGH: 0.7, MODERATE: 0.4 }
};

let currentThresholds = deepMerge({}, DEFAULT_THRESHOLDS);

export const getThresholds = () => deepMerge({}, currentThresholds);

export const loadThresholds = async (fetcher: () => Promise<any>): Promise<boolean> => {
    try {
        const remoteThresholds = await fetcher();
        if (remoteThresholds) {
            currentThresholds = deepMerge(currentThresholds, remoteThresholds);
            return true;
        }
        return false;
    } catch (e) {
        console.warn("Failed to load thresholds from backend, using defaults", e);
        return false;
    }
};

/** List of metrics where lower scores are better */
export const NEGATIVE_METRICS = ['Biasness', 'Toxicity'] as const;

/**
 * Simple recursive deep merge utility
 */
function deepMerge(target: any, source: any) {
    if (typeof target !== 'object' || target === null || typeof source !== 'object' || source === null) {
        return source;
    }

    const output = { ...target };
    Object.keys(source).forEach(key => {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (key in target) {
                output[key] = deepMerge(target[key], source[key]);
            } else {
                output[key] = source[key];
            }
        } else {
            output[key] = source[key];
        }
    });
    return output;
};
