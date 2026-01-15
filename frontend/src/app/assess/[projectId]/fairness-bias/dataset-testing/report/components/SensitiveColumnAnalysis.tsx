import { useState } from "react";
import { Info, CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { FairnessColumn } from "../../types";

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

interface SensitiveColumnAnalysisProps {
    column: FairnessColumn;
    threshold: number;
    isExporting: boolean;
}

// Visual status configuration
const getStatusConfig = (verdict: string) => {
    const configs: Record<string, { icon: typeof CheckCircle2; color: string; bgColor: string; label: string }> = {
        pass: {
            icon: CheckCircle2,
            color: "text-emerald-600 dark:text-emerald-400",
            bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
            label: "Pass"
        },
        caution: {
            icon: AlertTriangle,
            color: "text-amber-600 dark:text-amber-400",
            bgColor: "bg-amber-50 dark:bg-amber-500/10",
            label: "Needs Review"
        },
        fail: {
            icon: XCircle,
            color: "text-rose-600 dark:text-rose-400",
            bgColor: "bg-rose-50 dark:bg-rose-500/10",
            label: "Fail"
        }
    };
    return configs[verdict] || configs.caution;
};

export const SensitiveColumnAnalysis = ({ column, threshold, isExporting }: SensitiveColumnAnalysisProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const MAX_VISIBLE_GROUPS = 5;

    const showAll = isExporting || isExpanded;
    const visibleGroups = showAll ? column.groups : column.groups.slice(0, MAX_VISIBLE_GROUPS);
    const hiddenCount = column.groups.length - MAX_VISIBLE_GROUPS;
    const hasMore = column.groups.length > MAX_VISIBLE_GROUPS;

    const status = getStatusConfig(column.verdict);
    const StatusIcon = status.icon;

    // Calculate the fairness score for visual display (DIR value as percentage)
    const fairnessScore = (column.disparateImpactRatio ?? 0) * 100;

    return (
        <div className={`rounded-2xl border ${column.verdict === 'fail' ? 'border-rose-200 dark:border-rose-500/30' : 'border-slate-100 dark:border-gray-800'} p-5 space-y-5 page-break-avoid w-full bg-white dark:bg-gray-900`}>
            {/* Header with Status */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${status.bgColor}`}>
                        <StatusIcon className={`w-5 h-5 ${status.color}`} />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-white capitalize">
                            {column.column}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {column.groups.length} groups analyzed
                        </p>
                    </div>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${status.bgColor} ${status.color}`}>
                    {status.label}
                </span>
            </div>

            {/* Visual Fairness Score */}
            <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Fairness Score</span>
                    <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold ${fairnessScore >= 80 ? 'text-emerald-600' : fairnessScore >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {fairnessScore.toFixed(0)}%
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowDetails(!showDetails)}
                            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors hide-in-pdf"
                            title="What does this mean?"
                        >
                            <Info className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="relative h-3 rounded-full bg-slate-200 dark:bg-gray-700 overflow-hidden">
                    <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${fairnessScore >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                            fairnessScore >= 60 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                                'bg-gradient-to-r from-rose-500 to-rose-400'
                            }`}
                        style={{ width: `${Math.min(fairnessScore, 100)}%` }}
                    />
                    {/* Threshold marker at 80% */}
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-slate-600 dark:bg-slate-400"
                        style={{ left: '80%' }}
                        title="80% threshold (four-fifths rule)"
                    />
                </div>

                <div className="flex justify-between text-xs text-slate-400">
                    <span>0%</span>
                    <span className="font-medium">80% threshold</span>
                    <span>100%</span>
                </div>

                {/* Expandable details */}
                {showDetails && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-gray-700 text-xs text-slate-500 dark:text-slate-400 space-y-1 animate-fadeIn">
                        <p><strong>Fairness Score</strong> measures how equally outcomes are distributed across groups.</p>
                        <p>Scores ≥80% meet the "four-fifths rule" for fair treatment.</p>
                        <p className="text-slate-400 text-[10px] mt-2">
                            Technical: DIR = {formatPercent(column.disparateImpactRatio ?? 0)} | DPD = {formatPercent(column.disparity)}
                        </p>
                    </div>
                )}
            </div>

            {/* Groups - Visual Bar Chart */}
            <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Selection Rate by Group</p>

                <div className="space-y-2">
                    {visibleGroups.map((group) => {
                        const rate = group.positiveRate * 100;
                        const isBelowThreshold = rate < (threshold * 100);

                        return (
                            <div key={group.value} className="grid grid-cols-[140px_1fr_48px] items-center gap-4 group page-break-avoid">
                                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate" title={group.value}>
                                    {group.value}
                                </div>

                                <div className="relative h-2.5 rounded-full bg-slate-100 dark:bg-gray-800 overflow-hidden">
                                    <div
                                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${isBelowThreshold
                                            ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                                            : 'bg-gradient-to-r from-indigo-500 to-purple-400'
                                            }`}
                                        style={{ width: `${Math.min(rate, 100)}%` }}
                                    />
                                    {/* Hover info tooltip wrapper */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                        <div className="bg-slate-800/90 text-[10px] text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                                            {group.rows.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className={`text-sm font-bold text-right tabular-nums ${isBelowThreshold ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {formatPercent(group.positiveRate)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Show More Button */}
            {hasMore && !isExporting && (
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors hide-in-pdf"
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="w-4 h-4" />
                            Show Less
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-4 h-4" />
                            Show {hiddenCount} More Groups
                        </>
                    )}
                </button>
            )}

            {/* Summary Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-gray-700 text-xs text-slate-400">
                <span>{column.groups.reduce((sum, g) => sum + g.rows, 0).toLocaleString()} total samples</span>
                {column.explanation && (
                    <div className="relative">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                            className="group p-1 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors hide-in-pdf relative"
                            aria-label="Show explanation"
                        >
                            <Info className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />

                            {/* Custom Tooltip implementation */}
                            <div className="hidden group-hover:block absolute bottom-full right-0 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-xl shadow-xl z-50 animate-fadeIn pointer-events-none">
                                <div className="absolute -bottom-1 right-2 w-2 h-2 bg-slate-800 rotate-45"></div>
                                <p className="leading-relaxed">{column.explanation}</p>
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
