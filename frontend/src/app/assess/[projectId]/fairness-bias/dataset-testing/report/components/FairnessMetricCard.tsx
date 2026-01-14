import { DatasetMetric } from "../../types";
import { metricStyles } from "../../constants";

import { AlertCircle } from "lucide-react";

interface FairnessMetricCardProps {
    title: string;
    data: DatasetMetric;
}

export const FairnessMetricCard = ({ title, data }: FairnessMetricCardProps) => {
    const isError = !data || data.score === undefined || data.score === null;
    const style = !isError ? metricStyles[data.label] : null;

    if (isError) {
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

    return (
        <div className={`rounded-2xl border ${style!.border} ${style!.bg} p-4 page-break-avoid`}>
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-200">{title}</p>
                <span className={`text-xs font-semibold uppercase tracking-wide ${style!.color}`}>{style!.label}</span>
            </div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-white">{data.score.toFixed(2)}</div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{data.explanation}</p>
        </div>
    );
};
