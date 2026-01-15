import { useState } from "react";
import { FairnessColumn } from "../../types";
import { verdictStyles } from "../../constants";


const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

interface SensitiveColumnAnalysisProps {
    column: FairnessColumn;
    threshold: number;
    isExporting: boolean;
}

export const SensitiveColumnAnalysis = ({ column, threshold, isExporting }: SensitiveColumnAnalysisProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const MAX_VISIBLE_GROUPS = 5;

    // In export mode, force show all groups
    const showAll = isExporting || isExpanded;

    // Logic for visible groups
    const visibleGroups = showAll ? column.groups : column.groups.slice(0, MAX_VISIBLE_GROUPS);
    const hiddenCount = column.groups.length - MAX_VISIBLE_GROUPS;
    const hasMore = column.groups.length > MAX_VISIBLE_GROUPS;

    // Defensive check: fallback to 'caution' style if verdict is unexpected
    const style = column.verdict in verdictStyles
        ? verdictStyles[column.verdict]
        : verdictStyles.caution;

    return (
        <div className="rounded-2xl border border-slate-100 dark:border-gray-800 p-4 space-y-4 page-break-avoid w-full">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                    <style.icon className={`w-5 h-5 ${style.color}`} />
                    <div>
                        <p className="text-base font-semibold text-slate-900 dark:text-white">{column.column}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span title="Demographic Parity Difference: max - min selection rate">
                                DPD: {formatPercent(column.disparity)}
                            </span>
                            <span title="Disparate Impact Ratio (80% Rule): min/max selection rate">
                                DIR: {formatPercent(column.disparateImpactRatio ?? 0)} {(column.disparateImpactRatio ?? 0) >= 0.8 ? '✓' : '⚠'}
                            </span>
                        </div>
                    </div>
                </div>
                <span className={`text-sm font-medium px-3 py-1 rounded-full w-fit ${style.bg} ${style.color}`}>
                    {style.label}
                </span>
            </div>

            {/* Column explanation */}
            {column.explanation && (
                <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-gray-800 rounded-lg p-2">
                    {column.explanation}
                </p>
            )}

            {/* Table wrapper for horizontal scroll */}
            <div className="overflow-x-auto w-full">
                <div className="min-w-[600px] space-y-3">
                    {/* Header row for metrics */}
                    <div className="grid grid-cols-[2fr,1fr,1fr,1fr,0.8fr] gap-2 text-xs font-medium text-slate-500 border-b border-slate-100 dark:border-gray-700 pb-2">
                        <span>Group</span>
                        <span className="text-right" title="Percentage of dataset represented by this group (sums to 100%)">Distribution</span>
                        <span className="text-right" title="Percentage of group receiving positive outcome">Selection Rate</span>
                        <span className="text-right" title="Share of all positive outcomes going to this group (sums to 100%)">Outcome Share</span>
                        <span className="text-right">Count</span>
                    </div>

                    <div className="space-y-3">
                        {visibleGroups.map((group) => (
                            <div key={group.value} className="space-y-2 page-break-avoid">
                                <div className="grid grid-cols-[2fr,1fr,1fr,1fr,0.8fr] gap-2 text-sm text-slate-600 dark:text-slate-300 items-center">
                                    <p className="font-medium break-words leading-tight" title={group.value}>{group.value}</p>
                                    <p className="text-right text-slate-500">
                                        <span className="text-xs text-slate-400 mr-1">Dist:</span>
                                        {formatPercent(group.distribution ?? 0)}
                                    </p>
                                    <p className="text-right font-bold text-slate-700 dark:text-slate-200">
                                        <span className="text-xs font-normal text-slate-400 mr-1">Rate:</span>
                                        {formatPercent(group.positiveRate)}
                                    </p>
                                    <p className="text-right text-slate-500">
                                        <span className="text-xs text-slate-400 mr-1">Share:</span>
                                        {formatPercent(group.outcomeShare ?? 0)}
                                    </p>
                                    <p className="text-right text-xs text-slate-400">
                                        <span className="text-slate-400 mr-1">n=</span>
                                        {group.rows.toLocaleString()}
                                    </p>
                                </div>
                                <div
                                    role="progressbar"
                                    aria-valuenow={Math.round(Math.min(group.positiveRate * 100, 100))}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-label={`${column.column} ${group.value} selection rate: ${Math.round(group.positiveRate * 100)}%`}
                                    className="h-2.5 rounded-full bg-slate-100 dark:bg-gray-800 overflow-hidden ring-1 ring-slate-100 dark:ring-gray-800/50"
                                >
                                    <div
                                        aria-hidden="true"
                                        className={`h-full rounded-full transition-all duration-500 ease-out ${group.positiveRate < threshold
                                            ? "bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                                            : "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                                            }`}
                                        style={{ width: `${Math.min(group.positiveRate * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Toggle Button - Hidden in PDF export */}
            {hasMore && !isExporting && (
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    data-html2canvas-ignore="true"
                    className="w-full text-center py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors hide-in-pdf"
                >
                    {isExpanded ? (
                        <>Show less</>
                    ) : (
                        <>Show all {column.groups.length} groups (+{hiddenCount} more)</>
                    )}
                </button>
            )}

            {/* Stats Footer */}
            <div className="text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-gray-700">
                Total: {column.groups.reduce((sum, g) => sum + g.rows, 0).toLocaleString()} rows •
                Distribution sum: {formatPercent(column.groups.reduce((sum, g) => sum + (g.distribution ?? 0), 0))} •
                Outcome share sum: {formatPercent(column.groups.reduce((sum, g) => sum + (g.outcomeShare ?? 0), 0))}
            </div>
        </div>
    );
};
