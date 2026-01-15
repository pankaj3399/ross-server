import { DatasetMetric } from "../../types";
import { NEGATIVE_METRICS } from "../../constants";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";

interface FairnessMetricCardProps {
    title: string;
    data: DatasetMetric;
}

/** Minimum progress bar width percentage to ensure visibility even at 0% */
const MIN_PROGRESS_BAR_WIDTH = 5;

type VisualConfig = {
    icon: typeof CheckCircle2;
    color: string;
    bgColor: string;
    barColor: string;
    badgeLabel: string;
};

const VISUAL_CONFIGS: Record<'good' | 'caution' | 'bad' | 'unknown', VisualConfig> = {
    good: {
        icon: CheckCircle2,
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
        barColor: "bg-gradient-to-r from-emerald-500 to-emerald-400",
        badgeLabel: "Good"
    },
    caution: {
        icon: AlertTriangle,
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-500/10",
        barColor: "bg-gradient-to-r from-amber-500 to-amber-400",
        badgeLabel: "Review"
    },
    bad: {
        icon: XCircle,
        color: "text-rose-600 dark:text-rose-400",
        bgColor: "bg-rose-50 dark:bg-rose-500/10",
        barColor: "bg-gradient-to-r from-rose-500 to-rose-400",
        badgeLabel: "Alert"
    },
    unknown: {
        icon: HelpCircle,
        color: "text-slate-400 dark:text-slate-500",
        bgColor: "bg-slate-50 dark:bg-slate-500/10",
        barColor: "bg-slate-300 dark:bg-slate-600",
        badgeLabel: "Unknown"
    }
};

/**
 * Get the visual status based on metric type and label.
 * Maps backend labels to visual states correctly:
 * - For POSITIVE metrics: high → good, low → bad
 * - For NEGATIVE metrics: low → good, high → bad
 */
const getVisualStatus = (
    metricName: string,
    label: string
): 'good' | 'caution' | 'bad' | 'unknown' => {
    const normalizedLabel = label?.toLowerCase() ?? '';
    const isNegativeMetric = (NEGATIVE_METRICS as readonly string[]).includes(metricName);

    if (normalizedLabel === 'moderate') {
        return 'caution';
    }

    if (isNegativeMetric) {
        // For Biasness/Toxicity: low = good, high = bad
        if (normalizedLabel === 'low') return 'good';
        if (normalizedLabel === 'high') return 'bad';
    } else {
        // For Fairness/Relevance/Faithfulness: high = good, low = bad
        if (normalizedLabel === 'high') return 'good';
        if (normalizedLabel === 'low') return 'bad';
    }

    return 'unknown';
};

/**
 * Normalizes explanation text into a clean array of bullet points.
 * Handles array inputs and cleans up bullets.
 */
const normalizeExplanation = (explanation: string[] | undefined): string[] => {
    if (!explanation) return [];
    
    // Clean and filter
    return explanation
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^[•\-\*]\s*/, '').trim());
};

/**
 * Safely format a score for display.
 * - Always expects scores in 0.0-1.0 range from backend
 * - Handles edge cases: NaN, null, undefined, negative, > 1
 */
const formatScore = (score: unknown): { display: string; percent: number; isValid: boolean } => {
    // Handle null, undefined, NaN
    if (score === null || score === undefined) {
        return { display: "—", percent: 0, isValid: false };
    }

    const numScore = Number(score);

    if (!Number.isFinite(numScore)) {
        return { display: "—", percent: 0, isValid: false };
    }

    // Clamp to valid range [0, 1]
    const clampedScore = Math.min(1, Math.max(0, numScore));
    const percent = clampedScore * 100;

    return {
        display: `${percent.toFixed(1)}%`,
        percent,
        isValid: true
    };
};

/**
 * Get helper text describing what the score means for this metric type
 */
const getScoreContext = (metricName: string): string => {
    if ((NEGATIVE_METRICS as readonly string[]).includes(metricName)) {
        return "Lower is better";
    }
    return "Higher is better";
};

export const FairnessMetricCard = ({ title, data }: FairnessMetricCardProps) => {
    const { display, percent, isValid } = formatScore(data?.score);
    const visualStatus = isValid ? getVisualStatus(title, data?.label ?? '') : 'unknown';
    const config = VISUAL_CONFIGS[visualStatus];
    const Icon = config.icon;
    const scoreContext = getScoreContext(title);

    // Error/unavailable state with friendly message
    if (!isValid || !data) {
        return (
            <div className="rounded-xl bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</span>
                    <HelpCircle className="w-4 h-4 text-slate-300" />
                </div>
                <div className="flex-1 flex items-center justify-center py-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-slate-300 dark:text-slate-600">—</p>
                        <p className="text-xs text-slate-400 mt-1">Unavailable</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`rounded-xl bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 p-4 flex flex-col transition-all hover:shadow-md`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${config.bgColor} ${config.color}`}>
                    {config.badgeLabel}
                </span>
            </div>

            {/* Score Display */}
            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{display}</p>
                    <p className="text-xs text-slate-400">{scoreContext}</p>
                </div>
            </div>

            {/* Progress Bar 
                NOTE: If you change the classes below (esp h-1.5, rounded-full), check usePdfExport.ts 
                as it manually styles these for PDF header/canvas generation.
            */}
            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-gray-800 overflow-hidden mb-3">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${config.barColor}`}
                    style={{ width: `${Math.min(Math.max(percent, MIN_PROGRESS_BAR_WIDTH), 100)}%` }}
                />
            </div>

            {/* Explanation - beautifully formatted */}
            {data.explanation && data.explanation.length > 0 && (
                <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Analysis
                    </p>
                    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
                        {normalizeExplanation(data.explanation).map((line, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <span className="text-slate-400 mt-0.5">•</span>
                                <span>{line}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
                           