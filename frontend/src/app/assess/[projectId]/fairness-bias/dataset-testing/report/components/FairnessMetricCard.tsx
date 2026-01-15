import { DatasetMetric } from "../../types";
import { metricStyles } from "../../constants";

import { AlertCircle } from "lucide-react";

interface FairnessMetricCardProps {
    title: string;
    data: DatasetMetric;
}

const formatScoreAsPercent = (score: number): string => {
    // Handle negative or invalid scores
    if (score < 0 || !Number.isFinite(score)) return "0.0%";
    // Scores are typically 0-1 or 0-10, normalize to percentage
    if (score <= 1) {
        return `${(score * 100).toFixed(1)}%`;
    }
    // If score is already in 0-100 or 0-10 scale
    if (score <= 10) {
        return `${(score * 10).toFixed(1)}%`;
    }
    return `${score.toFixed(1)}%`;
};

const getScorePercent = (score: number): number => {
    // Handle negative or invalid scores
    if (score < 0 || !Number.isFinite(score)) return 0;
    // Normalize score to 0-100 for progress bar
    if (score <= 1) return score * 100;
    if (score <= 10) return score * 10;
    return Math.min(score, 100);
};

// Progress bar color mapping by metric label
const progressBarColors: Record<string, string> = {
    low: 'bg-emerald-500',
    moderate: 'bg-amber-500',
    high: 'bg-rose-500',
};

export const FairnessMetricCard = ({ title, data }: FairnessMetricCardProps) => {
    const isError = !data || data.score === undefined || data.score === null;
    // Defensively resolve style by checking that data.label is a valid key in metricStyles
    const style = !isError && data && typeof data.label === 'string' &&
        Object.prototype.hasOwnProperty.call(metricStyles, data.label)
        ? metricStyles[data.label]
        : null;

    if (isError || !style) {
        return (
            <div className="rounded-2xl border border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50 p-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                    <AlertCircle className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl font-semibold text-slate-400">N/A</div>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                    Metric could not be evaluated.
                </p>
            </div>
        );
    }

    const scorePercent = getScorePercent(data.score);
    const displayScore = formatScoreAsPercent(data.score);

    return (
        <div className={`rounded-2xl border ${style.border} ${style.bg} p-4 page-break-avoid`}>
            {/* Header with title and status badge */}
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</p>
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.bg} ${style.color}`}>
                    {style.label}
                </span>
            </div>

            {/* Score display with parameter label */}
            <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Score</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{displayScore}</span>
                        <span className="text-xs text-slate-400">({data.score.toFixed(2)})</span>
                    </div>
                </div>

                {/* Progress bar for visual representation */}
                <div className="h-2 rounded-full bg-slate-200 dark:bg-gray-700 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${progressBarColors[data.label] ?? 'bg-slate-400'}`}
                        style={{ width: `${Math.min(scorePercent, 100)}%` }}
                    />
                </div>
            </div>

            {/* Explanation */}
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">{data.explanation}</p>
        </div>
    );
};
