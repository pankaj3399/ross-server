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
