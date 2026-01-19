import { useState } from "react";
import { Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { FairnessColumn } from "../../types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

interface SensitiveColumnAnalysisProps {
    column: FairnessColumn;
    threshold: number;
    isExporting: boolean;
}

// Visual status configuration
// Visual status configuration
const getStatusConfig = (verdict: string) => {
    const configs: Record<string, { icon: typeof CheckCircle2; color: string; bgColor: string; label: string; badgeVariant: "default" | "secondary" | "destructive" | "outline" }> = {
        pass: {
            icon: CheckCircle2,
            color: "text-success",
            bgColor: "bg-success/10",
            label: "Pass",
            badgeVariant: "default"
        },
        caution: {
            icon: AlertTriangle,
            color: "text-warning",
            bgColor: "bg-warning/10",
            label: "Needs Review",
            badgeVariant: "outline"
        },
        fail: {
            icon: XCircle,
            color: "text-destructive",
            bgColor: "bg-destructive/10",
            label: "Fail",
            badgeVariant: "destructive"
        },
        insufficient: {
            icon: Info,
            color: "text-muted-foreground",
            bgColor: "bg-muted",
            label: "Insufficient",
            badgeVariant: "secondary"
        }
    };
    return configs[verdict] || configs.caution;
};

export const SensitiveColumnAnalysis = ({ column, threshold, isExporting }: SensitiveColumnAnalysisProps) => {
    const [showDetails, setShowDetails] = useState(false);
    const MIN_PROGRESS_BAR_WIDTH = 5;

    const status = getStatusConfig(column.verdict);
    const StatusIcon = status.icon;

    // Calculate the fairness score for visual display (DIR value as percentage)
    const fairnessScore = (column.disparateImpactRatio === null || column.disparateImpactRatio === undefined)
        ? null
        : column.disparateImpactRatio * 100;

    const thresholdPercent = threshold * 100;
    // Derive caution threshold (Amber) based on the Pass threshold.
    // Standard 4/5ths rule checks 0.8 (Pass) vs 0.6 (Caution starts). Ratio is 0.75.
    const cautionPercent = thresholdPercent * 0.75;

    return (
        <Card className={`page-break-avoid w-full ${column.verdict === 'fail' ? 'border-destructive/30' : ''}`}>
            <CardContent className="p-5 space-y-5">
                {/* Header with Status */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${status.bgColor}`}>
                            <StatusIcon className={`w-5 h-5 ${status.color}`} />
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-foreground capitalize">
                                {column.column}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                {column.groups.length} groups analyzed
                            </p>
                        </div>
                    </div>
                    <Badge variant={status.badgeVariant} className={`${status.bgColor} ${status.color}`}>
                        {status.label}
                    </Badge>
                </div>

                {/* Visual Fairness Score */}
                {fairnessScore !== null && (
                    <div className="bg-muted rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Fairness Score</span>
                            <div className="flex items-center gap-2">
                                <span className={`text-2xl font-bold ${fairnessScore >= thresholdPercent ? 'text-success' : fairnessScore >= cautionPercent ? 'text-warning' : 'text-destructive'}`}>
                                    {fairnessScore.toFixed(0)}%
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="h-6 w-6 hide-in-pdf"
                                    title="What does this mean?"
                                    aria-label="Toggle fairness score details"
                                    aria-expanded={showDetails}
                                >
                                    <Info className="w-4 h-4 text-muted-foreground" />
                                </Button>
                            </div>
                        </div>

                        {/* 
                            Progress bar 
                            NOTE: Checked by usePdfExport.ts for PDF styling. 
                            Do not change structure without verifying export.
                        */}
                        <div className="relative h-3 rounded-full bg-muted-foreground/20 overflow-hidden pdf-progress-bar">
                            <div
                                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${fairnessScore >= thresholdPercent ? 'bg-success' :
                                    fairnessScore >= cautionPercent ? 'bg-warning' :
                                        'bg-destructive'
                                    }`}
                                style={{ width: `${Math.min(Math.max(fairnessScore, MIN_PROGRESS_BAR_WIDTH), 100)}%` }}
                            />
                            {/* Threshold marker */}
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-foreground/60"
                                style={{ left: `${thresholdPercent}%` }}
                                title={`${thresholdPercent.toFixed(0)}% threshold`}
                            />
                        </div>

                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0%</span>
                            <span className="font-medium">{thresholdPercent.toFixed(0)}% threshold</span>
                            <span>100%</span>
                        </div>
                        {/* Expandable details */}
                        {showDetails && (
                            <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground space-y-1 animate-fadeIn">
                                <p><strong>Fairness Score</strong> measures how equally outcomes are distributed across groups.</p>
                                <p>Scores ≥{thresholdPercent.toFixed(0)}% meet the required fairness threshold.</p>
                                <p className="text-muted-foreground/60 text-[10px] mt-2">
                                    Technical: DIR = {formatPercent(column.disparateImpactRatio ?? 0)} | DPD = {formatPercent(column.disparity)}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Groups - Visual Bar Chart */}
                <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Selection Rate by Group</p>

                    <div className={`space-y-2 ${isExporting ? 'h-auto overflow-visible' : 'max-h-60 overflow-y-auto pr-2 custom-scrollbar'}`}>
                        {column.groups.map((group) => {
                            const rate = group.positiveRate * 100;
                            const isBelowThreshold = rate < (threshold * 100);

                            return (
                                <div key={group.value} className="grid grid-cols-[140px_1fr_48px] items-center gap-4 group page-break-avoid">
                                    <div className="text-sm font-medium text-muted-foreground truncate" title={group.value}>
                                        {group.value}
                                    </div>
                                    <div className="relative h-2.5">
                                        <div className="absolute inset-0 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${isBelowThreshold
                                                    ? 'bg-gradient-to-r from-warning to-warning/80'
                                                    : 'bg-gradient-to-r from-primary to-primary/80'
                                                    }`}
                                                style={{ width: `${Math.min(rate, 100)}%` }}
                                            />
                                        </div>
                                        {/* Hover info tooltip wrapper */}
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
                                            <div className="bg-popover text-[10px] text-popover-foreground px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm border border-border">
                                                {group.rows.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`text-sm font-bold text-right tabular-nums ${isBelowThreshold ? 'text-warning' : 'text-muted-foreground'}`}>
                                        {formatPercent(group.positiveRate)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>



                {/* Summary Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
                    <span>{column.groups.reduce((sum, g) => sum + g.rows, 0).toLocaleString()} total samples</span>
                    {column.explanation && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 hide-in-pdf"
                                        aria-label="Show explanation"
                                    >
                                        <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                    <div className="leading-relaxed text-xs">
                                        {Array.isArray(column.explanation)
                                            ? column.explanation.map((item, i) => (
                                                <p key={i} className="mb-1 last:mb-0">
                                                    {item}
                                                </p>
                                            ))
                                            : column.explanation}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
