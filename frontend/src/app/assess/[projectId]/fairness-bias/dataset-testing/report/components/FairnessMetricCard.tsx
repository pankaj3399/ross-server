import { DatasetMetric } from "../../types";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";

interface FairnessMetricCardProps {
    title: string;
    data: DatasetMetric;
}

// Get visual config based on metric label
// Get visual config based on metric label and type
const getMetricConfig = (label: string, isInverseMetric: boolean) => {
    const configs: Record<string, {
        icon: typeof CheckCircle2;
        color: string;
        bgColor: string;
        barColor: string;
        badgeLabel: string;
    }> = {
        low: {
            icon: CheckCircle2,
            color: "text-emerald-600 dark:text-emerald-400",
            bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
            barColor: "bg-gradient-to-r from-emerald-500 to-emerald-400",
            badgeLabel: "Good"
        },
        moderate: {
            icon: AlertTriangle,
            color: "text-amber-600 dark:text-amber-400",
            bgColor: "bg-amber-50 dark:bg-amber-500/10",
            barColor: "bg-gradient-to-r from-amber-500 to-amber-400",
            badgeLabel: "Review"
        },
        high: {
            icon: XCircle,
            color: "text-rose-600 dark:text-rose-400",
            bgColor: "bg-rose-50 dark:bg-rose-500/10",
            barColor: "bg-gradient-to-r from-rose-500 to-rose-400",
            badgeLabel: "Alert"
        }
    };

    // If it's NOT an inverse metric (i.e., Fairness, Faithfulness), 
    // High score = Good (Green), Low score = Alert (Red).
    // The default mapping assumes High Label = High Risk (Red).
    // So we need to swap for positive metrics.
    if (!isInverseMetric) {
        if (label === 'high') return configs.low; // High Score -> Good
        if (label === 'low') return configs.high; // Low Score -> Alert
    }

    return configs[label] || configs.moderate;
};

// Format score for display
const formatScore = (score: number): { display: string; percent: number } => {
    if (!Number.isFinite(score) || score < 0) {
        return { display: "—", percent: 0 };
    }

    let percent = score;
    if (score <= 1) {
        percent = score * 100;
    } else if (score <= 10) {
        percent = score * 10;
    }

    return {
        display: `${percent.toFixed(1)}%`,
        percent: percent // Always show actual score percentage
    };
};

export const FairnessMetricCard = ({ title, data }: FairnessMetricCardProps) => {
    const isError = !data || data.score === undefined || data.score === null;

    // Error/unavailable state with friendly message
    if (isError) {
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

    // Determine if this is a "good" result based on metric type
    const isInverseMetric = ["Biasness", "Toxicity"].includes(title);

    // Get config based on label and metric type
    const config = getMetricConfig(data.label, isInverseMetric);
    const Icon = config.icon;
    const { display, percent } = formatScore(data.score);

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
                    <p className="text-xs text-slate-400">
                        {isInverseMetric ? "Lower is better" : "Score"}
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-gray-800 overflow-hidden mb-3">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${config.barColor}`}
                    style={{ width: `${Math.min(Math.max(percent, 5), 100)}%` }}
                />
            </div>

            {/* Explanation - beautifully formatted */}
            {data.explanation && (
                <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Analysis
                    </p>
                    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
                        {(Array.isArray(data.explanation)
                            ? data.explanation
                            : typeof data.explanation === 'string'
                                ? (data.explanation as string).split(/(?:•|\n-|\n\*|\n(?=\s*\d+\.))/)
                                : []
                        )
                            .map(line => line.trim())
                            .filter(line => line.length > 0)
                            .map((line, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <span className="text-slate-400 mt-0.5">•</span>
                                    <span>{line.replace(/^[•\-\*]\s*/, '').trim()}</span>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
};
