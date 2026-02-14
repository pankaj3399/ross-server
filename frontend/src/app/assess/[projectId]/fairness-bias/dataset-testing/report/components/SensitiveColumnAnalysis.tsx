import { useState } from "react";
import { Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { FairnessColumn } from "../../types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
            bgColor: "bg-[#f0fdf4] dark:bg-[#064e3b]",
            label: "Pass",
            badgeVariant: "default"
        },
        caution: {
            icon: AlertTriangle,
            color: "text-warning",
            bgColor: "bg-[#fffbeb] dark:bg-[#78350f]",
            label: "Needs Review",
            badgeVariant: "outline"
        },
        fail: {
            icon: XCircle,
            color: "text-destructive",
            bgColor: "bg-[#fef2f2] dark:bg-[#7f1d1d]",
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
    const [showExplanation, setShowExplanation] = useState(false);
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
        <Card
            className={`page-break-avoid w-full ${column.verdict === 'fail' ? 'border-[#fca5a5] dark:border-destructive' : ''}`}
            style={isExporting ? { marginBottom: '20px', paddingBottom: '20px', breakInside: 'avoid' } : {}}
        >
            <CardContent className="p-5" style={isExporting ? { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' } : {}}>
                {/* Header with Status */}
                <div className={`flex items-center justify-between ${!isExporting ? 'mb-5' : ''}`}>
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
                    <Badge variant={status.badgeVariant} className={`${status.bgColor} ${status.color} pdf-badge`}>
                        {status.label}
                    </Badge>
                </div>

                {/* Visual Fairness Score */}
                {fairnessScore !== null && (
                    <div
                        className="bg-muted rounded-xl p-4"
                        style={isExporting ? { padding: '16px', marginBottom: '24px', backgroundColor: '#f1f5f9' } : {}}
                    >
                        <div className="flex items-center justify-between mb-3" style={isExporting ? { marginBottom: '12px' } : {}}>
                            <span className="text-sm font-medium text-muted-foreground">Fairness Score</span>
                            <div className="flex items-center gap-2">
                                <span className={`text-2xl font-bold ${(fairnessScore ?? 0) >= thresholdPercent ? 'text-success' : (fairnessScore ?? 0) >= cautionPercent ? 'text-warning' : 'text-destructive'}`}>
                                    {(fairnessScore ?? 0).toFixed(0)}%
                                </span>
                                {!isExporting && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setShowDetails(!showDetails)}
                                        className="h-6 w-6"
                                        title="What does this mean?"
                                    >
                                        <Info className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div
                            className="relative h-3 rounded-full bg-[#cbd5e1] overflow-hidden pdf-progress-bar"
                            style={isExporting ? { height: '10px', marginBottom: '12px', backgroundColor: '#e2e8f0' } : {}}
                        >
                            <div
                                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${(fairnessScore ?? 0) >= thresholdPercent ? 'bg-[#34a853] dark:bg-success' :
                                    (fairnessScore ?? 0) >= cautionPercent ? 'bg-[#fbbc04] dark:bg-warning' :
                                        'bg-[#ea4335] dark:bg-destructive'
                                    }`}
                                style={{ width: `${Math.min(Math.max(fairnessScore ?? 0, MIN_PROGRESS_BAR_WIDTH), 100)}%` }}
                            />
                            {/* Threshold marker */}
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-[#475569]"
                                style={{ left: `${thresholdPercent}%` }}
                            />
                        </div>

                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0%</span>
                            <span className="font-medium">{thresholdPercent.toFixed(0)}% threshold</span>
                            <span>100%</span>
                        </div>
                        {/* Expandable details */}
                        {(showDetails || isExporting) && (
                            <div
                                className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground space-y-1"
                                style={isExporting ? { marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' } : {}}
                            >
                                <p style={isExporting ? { marginBottom: '4px', lineHeight: '1.4' } : {}}><strong>Fairness Score</strong> measures how equally outcomes are distributed across groups.</p>
                                <p style={isExporting ? { marginBottom: '4px', lineHeight: '1.4' } : {}}>Scores ≥{thresholdPercent.toFixed(0)}% meet the required fairness threshold.</p>
                                <p className="text-slate-500 text-[10px] mt-2" style={isExporting ? { marginTop: '6px' } : {}}>
                                    Technical: DIR = {formatPercent(column.disparateImpactRatio ?? 0)} | DPD = {formatPercent(column.disparity)}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Groups - Visual Bar Chart */}
                <div
                    className={!isExporting ? "space-y-3" : ""}
                    style={isExporting ? { marginTop: '24px', marginBottom: '24px' } : {}}
                >
                    <p className={`text-sm font-medium text-muted-foreground ${!isExporting ? 'mb-3' : ''}`} style={isExporting ? { marginBottom: '12px' } : {}}>Selection Rate by Group</p>

                    {/* Limit groups shown in PDF to prevent overflow - show max 6 groups */}
                    {(() => {
                        const MAX_GROUPS_IN_PDF = 6;
                        const displayGroups = isExporting ? column.groups.slice(0, MAX_GROUPS_IN_PDF) : column.groups;
                        const hiddenGroupsCount = isExporting ? Math.max(0, column.groups.length - MAX_GROUPS_IN_PDF) : 0;

                        return (
                            <>
                                <div className={`${isExporting ? 'h-auto overflow-visible' : 'max-h-60 overflow-y-auto pr-2 custom-scrollbar space-y-2'}`}>
                                    {displayGroups.map((group) => {
                                        const rate = group.positiveRate * 100;
                                        const isBelowThreshold = rate < (threshold * 100);

                                        return (
                                            <div
                                                key={group.value}
                                                className={`grid items-center gap-4 group page-break-avoid ${!isExporting ? 'grid-cols-[140px_1fr_48px]' : ''}`}
                                                style={isExporting ? {
                                                    display: 'grid',
                                                    gridTemplateColumns: '200px 1fr 60px',
                                                    gap: '16px',
                                                    marginBottom: '12px'
                                                } : {}}
                                            >
                                                <div className="text-sm font-medium text-muted-foreground truncate" title={group.value} style={isExporting ? { whiteSpace: 'normal', overflow: 'visible' } : {}}>
                                                    {group.value}
                                                </div>
                                                <div className="relative h-2.5" style={isExporting ? { height: '10px', backgroundColor: '#f1f5f9', borderRadius: '5px' } : {}}>
                                                    <div className={`absolute inset-0 rounded-full bg-muted overflow-hidden ${isExporting ? 'hidden' : ''}`}>
                                                        {/* Native BG specific for screen */}
                                                    </div>
                                                    <div
                                                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${isBelowThreshold
                                                            ? 'bg-[#f59e0b] dark:bg-amber-500'
                                                            : 'bg-[#4285f4] dark:bg-primary'
                                                            }`}
                                                        style={{
                                                            width: `${Math.min(rate, 100)}%`,
                                                            ...(isExporting ? {
                                                                background: isBelowThreshold ? '#f59e0b' : '#94a3b8',
                                                                borderRadius: '5px',
                                                                height: '100%'
                                                            } : {})
                                                        }}
                                                    />
                                                </div>

                                                <div className={`text-sm font-bold text-right tabular-nums ${isBelowThreshold ? 'text-warning' : 'text-muted-foreground'}`}>
                                                    {formatPercent(group.positiveRate)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Show truncation notice in PDF if groups were hidden */}
                                {hiddenGroupsCount > 0 && (
                                    <p className="text-xs text-muted-foreground italic pt-1">
                                        + {hiddenGroupsCount} more group{hiddenGroupsCount > 1 ? 's' : ''} (see full report for details)
                                    </p>
                                )}
                            </>
                        );
                    })()}
                </div>

                {/* Summary Footer */}
                <div
                    className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground"
                    style={isExporting ? { marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' } : {}}
                >
                    <span>{column.groups.reduce((sum, g) => sum + g.rows, 0).toLocaleString()} total samples</span>
                    {column.explanation && !isExporting && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowExplanation(!showExplanation)}
                            className="h-6 w-6"
                            title="What does this mean?"
                        >
                            <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                        </Button>
                    )}
                </div>
                {/* Expandable explanation */}
                {(showExplanation || isExporting) && column.explanation && (
                    <div
                        className={`mt-3 pt-3 border-t border-border text-xs text-muted-foreground animate-fadeIn ${!isExporting ? 'space-y-1' : ''}`}
                        style={isExporting ? { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' } : {}}
                    >
                        {Array.isArray(column.explanation)
                            ? column.explanation.map((item, i) => (
                                <p key={i} className="mb-1 last:mb-0" style={isExporting ? { marginBottom: '8px', lineHeight: '1.6', fontSize: '11px', color: '#475569' } : {}}>
                                    {item}
                                </p>
                            ))
                            : <p style={isExporting ? { lineHeight: '1.6', fontSize: '11px', color: '#475569' } : {}}>{column.explanation}</p>}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
