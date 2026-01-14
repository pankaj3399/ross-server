/**
 * Dataset Fairness Evaluation Module
 * 
 * This module provides comprehensive fairness analysis for datasets, implementing
 * industry-standard metrics used in algorithmic fairness research.
 * 
 * KEY CONCEPTS:
 * 
 * FAIRNESS vs BIAS - These are related but distinct concepts:
 * 
 * BIAS:
 *   - Definition: Systematic errors or prejudices in data, algorithms, or decisions
 *     that favor certain demographic groups over others
 *   - It represents the PROBLEM - the presence of unfair treatment
 *   - Example: A hiring algorithm that systematically rejects female candidates
 *     at higher rates than male candidates exhibits gender bias
 * 
 * FAIRNESS:
 *   - Definition: The quality of treating all demographic groups equitably,
 *     where similar individuals receive similar outcomes regardless of group membership
 *   - It represents the GOAL - the absence of bias
 *   - Example: A fair algorithm would have similar selection rates across all genders
 * 
 * Relationship: Bias is what we detect; Fairness is what we measure.
 * A system with high bias has low fairness, and vice versa.
 * 
 * METRIC DEFINITIONS:
 * 
 * 1. SELECTION RATE (per group):
 *    - Definition: The proportion of individuals in a group who receive a positive outcome
 *    - Formula: positiveOutcomes / totalGroupSize
 *    - Range: 0 to 1 (0% to 100%)
 *    - Example: If 30 out of 100 females are hired, selection rate = 0.30 (30%)
 * 
 * 2. DEMOGRAPHIC PARITY DIFFERENCE (DPD):
 *    - Definition: The difference in selection rates between the most and least favored groups
 *    - Formula: max(selectionRates) - min(selectionRates)
 *    - Range: 0 to 1 (0% to 100%)
 *    - Ideal: 0 (perfect parity)
 *    - Threshold: < 0.1 is generally considered fair
 * 
 * 3. DISPARATE IMPACT RATIO (DIR) - "80% Rule" / Four-Fifths Rule:
 *    - Definition: Ratio of the lowest selection rate to the highest selection rate
 *    - Formula: min(selectionRates) / max(selectionRates)
 *    - Range: 0 to 1
 *    - Ideal: 1.0 (perfect equality)
 *    - Threshold: >= 0.8 (80%) is legally defensible in US employment law (EEOC Guidelines)
 * 
 * 4. GROUP DISTRIBUTION:
 *    - Definition: The proportion of total dataset represented by each demographic group
 *    - Formula: groupSize / totalDatasetSize
 *    - Range: 0 to 1 (0% to 100%)
 *    - Note: Sum of all group distributions equals 100%
 * 
 * 5. OUTCOME DISTRIBUTION:
 *    - Definition: How positive outcomes are distributed across groups relative to their representation
 *    - Formula: groupPositiveOutcomes / totalPositiveOutcomes
 *    - Range: 0 to 1 (0% to 100%)
 *    - Note: Sum equals 100%
 * 
 * VERDICT THRESHOLDS:
 * - PASS: DPD < 0.1 AND DIR >= 0.8
 * - CAUTION: DPD 0.1-0.2 OR DIR 0.6-0.8
 * - FAIL: DPD >= 0.2 OR DIR < 0.6
 * - INSUFFICIENT: Less than 2 groups or insufficient data
 */

type ColumnType = "numeric" | "categorical" | "text" | "boolean" | "unknown";

type CSVRow = Record<string, string>;

type SensitiveCandidate = {
    column: string;
    type: ColumnType;
    reasons: string[];
    uniqueValues: string[];
};

type OutcomeConfig = {
    column: string;
    positiveValue: string;
};

export type FairnessGroup = {
    /** The group value (e.g., "Male", "Female", "Asian") */
    value: string;
    /** Total number of rows for this group */
    rows: number;
    /** Number of positive outcomes for this group */
    positive: number;
    /** Selection rate: positive / rows (proportion of group receiving positive outcome) */
    positiveRate: number;
    /** Distribution: rows / totalRows (proportion of dataset represented by this group) */
    distribution: number;
    /** Outcome share: positive / totalPositives (share of all positive outcomes going to this group) */
    outcomeShare: number;
};

type VerdictStatus = "pass" | "caution" | "fail" | "insufficient";

export type FairnessColumnAssessment = {
    /** Column name (e.g., "gender", "race") */
    column: string;
    /** Overall verdict for this column */
    verdict: VerdictStatus;
    /** Demographic Parity Difference: max - min selection rate */
    disparity: number;
    /** Disparate Impact Ratio: min / max selection rate (80% rule) */
    disparateImpactRatio: number;
    /** Total rows analyzed for this column */
    totalRows: number;
    /** Total positive outcomes for this column */
    totalPositives: number;
    /** Group-level metrics */
    groups: FairnessGroup[];
    /** Human-readable explanation of the metrics */
    explanation: string;
};

export type MetricDefinition = {
    name: string;
    formula: string;
    description: string;
    interpretation: string;
    threshold: string;
};

export type FairnessAssessment = {
    overallVerdict: VerdictStatus;
    sensitiveColumns: FairnessColumnAssessment[];
    /** Target/outcome column used for analysis */
    outcomeColumn: string | null;
    /** Value considered as positive outcome */
    positiveOutcome: string | null;
    /** Dataset statistics */
    datasetStats: {
        totalRows: number;
        totalPositives: number;
        overallPositiveRate: number;
    };
    /** Metric definitions for reference */
    metricDefinitions: {
        selectionRate: MetricDefinition;
        demographicParityDifference: MetricDefinition;
        disparateImpactRatio: MetricDefinition;
        groupDistribution: MetricDefinition;
    };
};

const SENSITIVE_KEYWORDS = [
    "gender",
    "sex",
    "male",
    "female",
    "race",
    "ethnicity",
    "origin",
    "religion",
    "faith",
    "belief",
    "birth",
    "disability",
    "ability",
    "salary",
    "wealth",
    "location",
    "country",
    "region",
    "nationality",
    "language",
    "orientation",
    "age",
    "marital",
];

const POSITIVE_KEYWORDS = ["approved", "success", "accepted", "true", "1", "positive", "pass", "hire", "hired", "qualified", "yes", "selected"];
const NEGATIVE_KEYWORDS = ["reject", "rejected", "denied", "fail", "false", "0", "negative", "declined", "no", "not selected"];

const TARGET_COLUMN_KEYWORDS = [
    "target",
    "label",
    "outcome",
    "result",
    "decision",
    "status",
    "approved",
    "prediction",
    "hired",
    "selected",
    "class",
];

const METRIC_DEFINITIONS: FairnessAssessment["metricDefinitions"] = {
    selectionRate: {
        name: "Selection Rate",
        formula: "positive_outcomes / group_size",
        description: "The proportion of individuals in a group who receive a positive outcome.",
        interpretation: "Higher values indicate more favorable treatment for that group.",
        threshold: "N/A - used comparatively across groups",
    },
    demographicParityDifference: {
        name: "Demographic Parity Difference (DPD)",
        formula: "max(selection_rates) - min(selection_rates)",
        description: "The difference between the highest and lowest selection rates across groups.",
        interpretation: "Measures how much selection rates vary across demographic groups. Lower is better.",
        threshold: "< 0.10 (10%) is considered fair; 0.10-0.20 requires caution; > 0.20 indicates significant disparity",
    },
    disparateImpactRatio: {
        name: "Disparate Impact Ratio (80% Rule)",
        formula: "min(selection_rates) / max(selection_rates)",
        description: "The ratio of the lowest to highest selection rate. Based on EEOC 4/5ths rule.",
        interpretation: "Values close to 1.0 indicate equality. Values below 0.8 may indicate adverse impact.",
        threshold: ">= 0.80 (80%) is legally defensible; 0.60-0.80 requires review; < 0.60 indicates severe disparity",
    },
    groupDistribution: {
        name: "Group Distribution",
        formula: "group_size / total_rows",
        description: "The proportion of the dataset represented by each demographic group.",
        interpretation: "Shows representation of each group. Sum of all groups equals 100%.",
        threshold: "N/A - contextual; should reflect expected population distribution",
    },
};

const sanitizeValue = (value: string | null | undefined) => (value ?? "").toString().trim();

const ensureUniqueHeaders = (headers: string[]) => {
    const counts: Record<string, number> = {};
    return headers.map((header) => {
        const base = header || "column";
        const lower = base.toLowerCase();
        counts[lower] = (counts[lower] || 0) + 1;
        if (counts[lower] === 1) return base;
        return `${base}_${counts[lower]}`;
    });
};

export const parseCSV = (text: string, delimiter = ","): { headers: string[]; rows: CSVRow[] } => {
    const rows: string[][] = [];
    let current = "";
    let inQuotes = false;
    let row: string[] = [];

    const pushValue = () => {
        row.push(current.trim());
        current = "";
    };

    const pushRow = () => {
        rows.push(row);
        row = [];
    };

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === delimiter && !inQuotes) {
            pushValue();
            continue;
        }

        if ((char === "\n" || char === "\r") && !inQuotes) {
            if (current.length || row.length) {
                pushValue();
                if (row.length) {
                    pushRow();
                }
            }
            while (text[i + 1] === "\n" || text[i + 1] === "\r") {
                i++;
            }
            continue;
        }

        current += char;
    }

    if (current.length || row.length) {
        pushValue();
        pushRow();
    }

    if (!rows.length) {
        return { headers: [], rows: [] };
    }

    const rawHeaders = rows.shift() || [];
    const headers = ensureUniqueHeaders(rawHeaders.map((h) => sanitizeValue(h)));

    const parsedRows: CSVRow[] = rows
        .filter((r) => r.some((value) => sanitizeValue(value).length))
        .map((cols) =>
            headers.reduce<CSVRow>((acc, header, idx) => {
                acc[header] = sanitizeValue(cols[idx]);
                return acc;
            }, {})
        );

    return { headers, rows: parsedRows };
};

const inferColumnTypes = (headers: string[], rows: CSVRow[]): Record<string, ColumnType> => {
    const typeMap: Record<string, ColumnType> = {};

    headers.forEach((header) => {
        const values = rows
            .map((row) => row[header])
            .filter((value) => value !== undefined && value !== null && value !== "");

        if (!values.length) {
            typeMap[header] = "unknown";
            return;
        }

        const uniqueValues = new Set(values.map((value) => sanitizeValue(value).toLowerCase()));
        const numericValues = values.filter((value) => !Number.isNaN(Number(value)));
        const booleanValues = values.filter((value) => {
            const normalized = sanitizeValue(value).toLowerCase();
            return ["true", "false", "yes", "no", "0", "1"].includes(normalized);
        });

        if (numericValues.length === values.length) {
            typeMap[header] = "numeric";
        } else if (booleanValues.length === values.length || uniqueValues.size <= 2) {
            typeMap[header] = "boolean";
        } else if (uniqueValues.size <= Math.max(6, rows.length * 0.2)) {
            typeMap[header] = "categorical";
        } else if (values.some((value) => value.length > 120)) {
            typeMap[header] = "text";
        } else {
            typeMap[header] = "categorical";
        }
    });

    return typeMap;
};

const detectSensitiveColumns = (
    headers: string[],
    rows: CSVRow[],
    columnTypes: Record<string, ColumnType>
): SensitiveCandidate[] => {
    return headers
        .map((header) => {
            const lower = header.toLowerCase();
            const reasons: string[] = [];

            SENSITIVE_KEYWORDS.forEach((keyword) => {
                if (lower.includes(keyword)) {
                    reasons.push(`Header contains "${keyword}"`);
                }
            });

            const uniqueValues = Array.from(
                new Set(
                    rows
                        .map((row) => sanitizeValue(row[header]))
                        .filter((value) => value.length)
                )
            ).slice(0, 15);

            if (!reasons.length && uniqueValues.length > 1 && uniqueValues.length <= 12) {
                const sensitiveValuePatterns = ["male", "female", "non-binary", "asian", "black", "white", "hispanic", "latino", "caucasian"];
                const hasSensitiveValues = uniqueValues.some((value) => {
                    const lowerValue = value.toLowerCase();
                    return sensitiveValuePatterns.some((pattern) => lowerValue.includes(pattern));
                });
                if (hasSensitiveValues) {
                    reasons.push("Values resemble sensitive demographic groups");
                }
            }

            if (!reasons.length) return null;

            return {
                column: header,
                type: columnTypes[header] ?? "unknown",
                reasons,
                uniqueValues,
            };
        })
        .filter((candidate): candidate is SensitiveCandidate => Boolean(candidate));
};

const collectUniqueValues = (rows: CSVRow[], column: string, limit = 24) => {
    return Array.from(
        new Set(
            rows
                .map((row) => sanitizeValue(row[column]))
                .filter((value) => value.length)
        )
    ).slice(0, limit);
};

const inferOutcomeConfig = (
    headers: string[],
    rows: CSVRow[],
    columnTypes: Record<string, ColumnType>
): OutcomeConfig | null => {
    if (!rows.length) return null;
    const candidates = headers
        .filter((header) => {
            const type = columnTypes[header];
            return type === "categorical" || type === "boolean" || type === "numeric";
        })
        .map((header) => {
            const lower = header.toLowerCase();
            const headerScore = TARGET_COLUMN_KEYWORDS.reduce(
                (score, keyword) => (lower.includes(keyword) ? score + 2 : score),
                0
            );
            const values = collectUniqueValues(rows, header, 20);
            const uniqueScore = Math.max(0, 12 - values.length);
            const keywordMatch = values.some((value) => POSITIVE_KEYWORDS.includes(value.toLowerCase()));
            const keywordScore = keywordMatch ? 4 : 0;
            return {
                header,
                score: headerScore + uniqueScore + keywordScore,
                values,
            };
        })
        .filter((candidate) => candidate.values.length >= 2 && candidate.values.length <= 20)
        // Filter out candidates that are likely sensitive columns to avoid selecting "gender" as target
        .filter((candidate) => {
            const lowerHeader = candidate.header.toLowerCase();
            return !SENSITIVE_KEYWORDS.some(keyword => lowerHeader.includes(keyword));
        })
        .sort((a, b) => b.score - a.score);

    if (!candidates.length || candidates[0].score === 0) {
        return null;
    }

    const best = candidates[0];
    const valueFrequencies = best.values.map((value) => {
        const count = rows.reduce((acc, row) => (sanitizeValue(row[best.header]) === value ? acc + 1 : acc), 0);
        return { value, count };
    });
    valueFrequencies.sort((a, b) => b.count - a.count);

    const positiveValue =
        best.values.find((value) => POSITIVE_KEYWORDS.includes(value.toLowerCase())) ||
        valueFrequencies.find((freq) => {
            const lower = freq.value.toLowerCase();
            return !NEGATIVE_KEYWORDS.includes(lower);
        })?.value ||
        valueFrequencies[0]?.value ||
        "";

    if (!positiveValue) {
        return null;
    }

    return { column: best.header, positiveValue };
};

/**
 * Compute comprehensive fairness metrics for each sensitive column
 */
const computeGroupMetrics = (
    rows: CSVRow[],
    columns: string[],
    targetColumn: string,
    positiveValue: string
): FairnessColumnAssessment[] => {
    const normalizedPositive = sanitizeValue(positiveValue).toLowerCase();
    const positiveIsNumeric = normalizedPositive.length === 0 ? false : !Number.isNaN(Number(normalizedPositive));

    // First, compute total positive outcomes across all rows
    const totalDatasetRows = rows.length;
    let totalDatasetPositives = 0;
    rows.forEach((row) => {
        const targetValueRaw = sanitizeValue(row[targetColumn]);
        const targetValue = targetValueRaw.toLowerCase();
        const isPositive =
            targetValue === normalizedPositive ||
            (positiveIsNumeric && targetValueRaw === positiveValue) ||
            (normalizedPositive === "1" && Number(targetValueRaw) === 1);
        if (isPositive) {
            totalDatasetPositives++;
        }
    });

    return columns
        .map((column) => {
            // Pre-scan to check for numeric high-cardinality
            const values = rows
                .map(r => r[column])
                .filter(v => v !== undefined && v !== null && v.trim() !== "")
                .map(v => v.trim());
            
            const uniqueValues = new Set(values);
            const isHighCardinality = uniqueValues.size > 12;
            
            // Check if mostly numeric
            const numericCount = values.filter(v => !isNaN(Number(v))).length;
            const isNumeric = values.length > 0 && (numericCount / values.length > 0.9);

            let binner: ((val: string) => string) | null = null;

            if (isHighCardinality && isNumeric) {
                const numbers = Array.from(uniqueValues).map(Number).filter(n => !isNaN(n));
                if (numbers.length > 0) {
                    const min = Math.min(...numbers);
                    const max = Math.max(...numbers);
                    // Create roughly 6-8 bins
                    const numBins = Math.min(8, Math.ceil(uniqueValues.size / 3));
                    const range = max - min;
                    const step = range / numBins;

                    if (range === 0 || step === 0 || numBins <= 0) {
                        binner = (val: string) => {
                            const num = Number(val);
                            if (isNaN(num)) return "Unknown";
                            return `${Math.floor(min)}-${Math.ceil(max)}`;
                        };
                    } else {
                        binner = (val: string) => {
                            const num = Number(val);
                            if (isNaN(num)) return "Unknown";
                            // Find bin
                            const binIndex = Math.min(numBins - 1, Math.floor((num - min) / step));
                            const binStart = Math.floor(min + (binIndex * step));
                            const binEnd = Math.ceil(min + ((binIndex + 1) * step));
                            // Make label inclusive-exclusive style or just range
                            if (binIndex === numBins - 1) {
                                return `${binStart}-${Math.ceil(max)}`;
                            }
                            return `${binStart}-${Math.max(binStart, binEnd - 1)}`;
                        };
                    }
                }
            }

            const groupMap = new Map<
                string,
                {
                    rows: number;
                    positive: number;
                }
            >();

            rows.forEach((row) => {
                let groupValue = sanitizeValue(row[column]) || "Unspecified";
                
                if (binner) {
                    // Apply binning if active
                    groupValue = binner(groupValue);
                } else if (groupValue !== "Unspecified") {
                     // Normalize group value to Title Case to merge "male", "Male", "MALE " -> "Male"
                    groupValue = groupValue.trim();
                    // Simple Title Case implementation
                    groupValue = groupValue.charAt(0).toUpperCase() + groupValue.slice(1).toLowerCase();
                }

                const targetValueRaw = sanitizeValue(row[targetColumn]);
                const targetValue = targetValueRaw.toLowerCase();
                if (!groupMap.has(groupValue)) {
                    groupMap.set(groupValue, { rows: 0, positive: 0 });
                }
                const stats = groupMap.get(groupValue)!;
                stats.rows += 1;

                const isPositive =
                    targetValue === normalizedPositive ||
                    (positiveIsNumeric && targetValueRaw === positiveValue) ||
                    (normalizedPositive === "1" && Number(targetValueRaw) === 1);

                if (isPositive) {
                    stats.positive += 1;
                }
            });

            // Calculate total rows and positives for this column
            const totalRows = Array.from(groupMap.values()).reduce((sum, g) => sum + g.rows, 0);
            const totalPositives = Array.from(groupMap.values()).reduce((sum, g) => sum + g.positive, 0);

            // Build groups with all metrics
            const groups: FairnessGroup[] = Array.from(groupMap.entries())
                .sort((a, b) => b[1].rows - a[1].rows)
                .map(([value, stats]) => ({
                    value,
                    rows: stats.rows,
                    positive: stats.positive,
                    // Selection rate: proportion of this group receiving positive outcome
                    positiveRate: stats.rows > 0 ? stats.positive / stats.rows : 0,
                    // Distribution: proportion of total dataset represented by this group
                    distribution: totalRows > 0 ? stats.rows / totalRows : 0,
                    // Outcome share: proportion of all positive outcomes going to this group
                    outcomeShare: totalPositives > 0 ? stats.positive / totalPositives : 0,
                }));

            // Calculate fairness metrics
            const rates = groups.map((group) => group.positiveRate).filter(r => !isNaN(r));
            const validRates = rates.filter(r => r >= 0);
            
            const maxRate = validRates.length > 0 ? Math.max(...validRates) : 0;
            const minRate = validRates.length > 0 ? Math.min(...validRates) : 0;
            
            // Demographic Parity Difference
            const disparity = validRates.length > 1 ? maxRate - minRate : 0;
            
            // Disparate Impact Ratio (80% rule)
            // Protect against division by zero
            const disparateImpactRatio = (validRates.length > 1 && maxRate > 0) 
                ? minRate / maxRate 
                : 1; // If there's no disparity or only one group, consider it equal

            // Determine verdict based on both metrics
            let verdict: VerdictStatus = "insufficient";

            if (groups.length >= 2 && validRates.length >= 2) {
                // Fail if DPD >= 0.2 OR DIR < 0.6
                if (disparity >= 0.2 || disparateImpactRatio < 0.6) {
                    verdict = "fail";
                }
                // Caution if DPD 0.1-0.2 OR DIR 0.6-0.8
                else if (disparity >= 0.1 || disparateImpactRatio < 0.8) {
                    verdict = "caution";
                }
                // Pass if DPD < 0.1 AND DIR >= 0.8
                else {
                    verdict = "pass";
                }
            }

            // Generate human-readable explanation
            const explanation = generateColumnExplanation(
                column,
                verdict,
                disparity,
                disparateImpactRatio,
                groups,
                totalRows,
                totalPositives
            );

            return {
                column,
                verdict,
                disparity: Number(disparity.toFixed(4)),
                disparateImpactRatio: Number(disparateImpactRatio.toFixed(4)),
                totalRows,
                totalPositives,
                groups: groups.map((group) => ({
                    ...group,
                    positiveRate: Number(group.positiveRate.toFixed(4)),
                    distribution: Number(group.distribution.toFixed(4)),
                    outcomeShare: Number(group.outcomeShare.toFixed(4)),
                })),
                explanation,
            };
        })
        .filter((metric) => metric.groups.length >= 2);
};

/**
 * Generate a human-readable explanation for a column's fairness metrics
 */
const generateColumnExplanation = (
    column: string,
    verdict: VerdictStatus,
    disparity: number,
    disparateImpactRatio: number,
    groups: FairnessGroup[],
    totalRows: number,
    totalPositives: number
): string => {
    if (groups.length < 2) {
        return `Insufficient data for fairness analysis on "${column}".`;
    }

    const maxRateGroup = groups.reduce((max, g) => g.positiveRate > max.positiveRate ? g : max);
    const minRateGroup = groups.reduce((min, g) => g.positiveRate < min.positiveRate ? g : min);

    const disparityPercent = (disparity * 100).toFixed(1);
    const dirPercent = (disparateImpactRatio * 100).toFixed(1);

    let verdictText = "";
    switch (verdict) {
        case "pass":
            verdictText = `The "${column}" column shows fair treatment across groups.`;
            break;
        case "caution":
            verdictText = `The "${column}" column shows moderate disparity that warrants review.`;
            break;
        case "fail":
            verdictText = `The "${column}" column shows significant disparity that requires immediate attention.`;
            break;
        default:
            verdictText = `Insufficient data to analyze "${column}".`;
    }

    return `${verdictText} ` +
        `Demographic Parity Difference: ${disparityPercent}% (${disparity < 0.1 ? 'acceptable' : disparity < 0.2 ? 'borderline' : 'high'}). ` +
        `Disparate Impact Ratio: ${dirPercent}% (${disparateImpactRatio >= 0.8 ? 'passes 80% rule' : disparateImpactRatio >= 0.6 ? 'below 80% threshold' : 'significantly below threshold'}). ` +
        `Highest selection rate: "${maxRateGroup.value}" at ${(maxRateGroup.positiveRate * 100).toFixed(1)}%. ` +
        `Lowest selection rate: "${minRateGroup.value}" at ${(minRateGroup.positiveRate * 100).toFixed(1)}%.`;
};

const deriveOverallVerdict = (metrics: FairnessColumnAssessment[]): VerdictStatus => {
    if (!metrics.length) return "insufficient";
    if (metrics.some((metric) => metric.verdict === "fail")) return "fail";
    if (metrics.some((metric) => metric.verdict === "caution")) return "caution";
    if (metrics.every((metric) => metric.verdict === "pass")) return "pass";
    return "insufficient";
};

export const evaluateDatasetFairnessFromParsed = (parsed: { headers: string[]; rows: CSVRow[] }): FairnessAssessment => {
    const emptyResult: FairnessAssessment = {
        overallVerdict: "insufficient",
        sensitiveColumns: [],
        outcomeColumn: null,
        positiveOutcome: null,
        datasetStats: {
            totalRows: 0,
            totalPositives: 0,
            overallPositiveRate: 0,
        },
        metricDefinitions: METRIC_DEFINITIONS,
    };

    if (!parsed.headers.length || !parsed.rows.length) {
        return emptyResult;
    }

    const columnTypes = inferColumnTypes(parsed.headers, parsed.rows);
    const sensitiveCandidates = detectSensitiveColumns(parsed.headers, parsed.rows, columnTypes);
    if (!sensitiveCandidates.length) {
        return {
            ...emptyResult,
            datasetStats: {
                totalRows: parsed.rows.length,
                totalPositives: 0,
                overallPositiveRate: 0,
            },
        };
    }

    const outcomeConfig = inferOutcomeConfig(parsed.headers, parsed.rows, columnTypes);
    if (!outcomeConfig) {
        return {
            ...emptyResult,
            datasetStats: {
                totalRows: parsed.rows.length,
                totalPositives: 0,
                overallPositiveRate: 0,
            },
        };
    }

    // Calculate overall dataset statistics
    const normalizedPositive = sanitizeValue(outcomeConfig.positiveValue).toLowerCase();
    const positiveIsNumeric = !Number.isNaN(Number(normalizedPositive));
    
    let totalPositives = 0;
    parsed.rows.forEach((row) => {
        const targetValueRaw = sanitizeValue(row[outcomeConfig.column]);
        const targetValue = targetValueRaw.toLowerCase();
        const isPositive =
            targetValue === normalizedPositive ||
            (positiveIsNumeric && targetValueRaw === outcomeConfig.positiveValue) ||
            (normalizedPositive === "1" && Number(targetValueRaw) === 1);
        if (isPositive) {
            totalPositives++;
        }
    });

    const metrics = computeGroupMetrics(
        parsed.rows,
        sensitiveCandidates.map((candidate) => candidate.column),
        outcomeConfig.column,
        outcomeConfig.positiveValue
    );

    return {
        overallVerdict: deriveOverallVerdict(metrics),
        sensitiveColumns: metrics,
        outcomeColumn: outcomeConfig.column,
        positiveOutcome: outcomeConfig.positiveValue,
        datasetStats: {
            totalRows: parsed.rows.length,
            totalPositives,
            overallPositiveRate: parsed.rows.length > 0 ? Number((totalPositives / parsed.rows.length).toFixed(4)) : 0,
        },
        metricDefinitions: METRIC_DEFINITIONS,
    };
};

export const evaluateDatasetFairness = (csvText: string): FairnessAssessment => {
    const parsed = parseCSV(csvText);
    return evaluateDatasetFairnessFromParsed(parsed);
};
