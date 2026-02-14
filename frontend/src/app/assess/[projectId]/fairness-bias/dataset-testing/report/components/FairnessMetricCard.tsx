import { DatasetMetric } from "../../types";
import { NEGATIVE_METRICS } from "../../constants";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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
    badgeVariant: "default" | "secondary" | "destructive" | "outline";
};

const VISUAL_CONFIGS: Record<'good' | 'caution' | 'bad' | 'unknown', VisualConfig> = {
    good: {
        icon: CheckCircle2,
        color: "text-primary",
        bgColor: "bg-[#eff6ff] dark:bg-[#1e3a8a]",
        barColor: "bg-[#4285f4] dark:bg-primary",
        badgeLabel: "Good",
        badgeVariant: "default"
    },
    caution: {
        icon: AlertTriangle,
        color: "text-muted-foreground",
        bgColor: "bg-[#f1f5f9] dark:bg-muted",
        barColor: "bg-[#64748b] dark:bg-muted-foreground",
        badgeLabel: "Review",
        badgeVariant: "secondary"
    },
    bad: {
        icon: XCircle,
        color: "text-destructive",
        bgColor: "bg-[#fef2f2] dark:bg-[#7f1d1d]",
        barColor: "bg-[#ea4335] dark:bg-destructive",
        badgeLabel: "Alert",
        badgeVariant: "destructive"
    },
    unknown: {
        icon: HelpCircle,
        color: "text-muted-foreground",
        bgColor: "bg-[#f1f3f5] dark:bg-muted",
        barColor: "bg-[#94a3b8] dark:bg-muted",
        badgeLabel: "Unknown",
        badgeVariant: "secondary"
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
 * Handles string or array inputs and cleans up bullets.
 */
const normalizeExplanation = (explanation: string | string[] | undefined): string[] => {
    if (!explanation) return [];

    // Handle string input by splitting on newlines
    const lines = Array.isArray(explanation) ? explanation : explanation.split('\n');

    // Clean and filter
    return lines
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
            <Card>
                <CardContent className="p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-muted-foreground">{title}</span>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 flex items-center justify-center py-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-muted-foreground">—</p>
                            <p className="text-xs text-muted-foreground mt-1">Unavailable</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="transition-all hover:shadow-md">
            <CardContent className="p-4 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-muted-foreground">{title}</span>
                    <Badge variant={config.badgeVariant} className={`${config.bgColor} ${config.color} pdf-badge`}>
                        {config.badgeLabel}
                    </Badge>
                </div>

                {/* Score Display */}
                <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-foreground">{display}</p>
                        <p className="text-xs text-muted-foreground">{scoreContext}</p>
                    </div>
                </div>

                {/* Progress Bar 
                    NOTE: If you change the classes below (esp h-1.5, rounded-full), check usePdfExport.ts 
                    as it manually styles these for PDF header/canvas generation.
                */}
                <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ${config.barColor}`}
                        style={{ width: `${Math.min(Math.max(percent, MIN_PROGRESS_BAR_WIDTH), 100)}%` }}
                    />
                </div>

                {/* Explanation - beautifully formatted */}
                {(() => {
                    const explanationItems = normalizeExplanation(data.explanation);

                    if (explanationItems.length === 0) return null;

                    return (
                        <div className="mt-1 p-3 bg-[#f8fafc] dark:bg-muted rounded-lg border border-border">
                            <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-primary" />
                                Analysis
                            </p>
                            <div className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                                {explanationItems.map((line, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <span className="text-muted-foreground mt-0.5">•</span>
                                        <span>{line}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}
            </CardContent>
        </Card>
    );
};