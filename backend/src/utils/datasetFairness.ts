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

type FairnessGroup = {
    value: string;
    rows: number;
    positive: number;
    positiveRate: number;
};

type VerdictStatus = "pass" | "caution" | "fail" | "insufficient";

export type FairnessColumnAssessment = {
    column: string;
    verdict: VerdictStatus;
    disparity: number;
    groups: FairnessGroup[];
};

export type FairnessAssessment = {
    overallVerdict: VerdictStatus;
    sensitiveColumns: FairnessColumnAssessment[];
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
];

const POSITIVE_KEYWORDS = ["approved", "success", "accepted", "true", "1", "positive", "pass", "hire", "qualified"];
const NEGATIVE_KEYWORDS = ["reject", "denied", "fail", "false", "0", "negative", "declined"];

const TARGET_COLUMN_KEYWORDS = [
    "target",
    "label",
    "outcome",
    "result",
    "decision",
    "status",
    "approved",
    "prediction",
];

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
                const sensitiveValuePatterns = ["male", "female", "non-binary", "asian", "black", "white"];
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

const computeGroupMetrics = (
    rows: CSVRow[],
    columns: string[],
    targetColumn: string,
    positiveValue: string
): FairnessColumnAssessment[] => {
    const normalizedPositive = sanitizeValue(positiveValue).toLowerCase();
    const positiveIsNumeric = normalizedPositive.length === 0 ? false : !Number.isNaN(Number(normalizedPositive));

    return columns
        .map((column) => {
            const groupMap = new Map<
                string,
                {
                    rows: number;
                    positive: number;
                }
            >();

            rows.forEach((row) => {
                const groupValue = sanitizeValue(row[column]) || "Unspecified";
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

            const groups = Array.from(groupMap.entries())
                .sort((a, b) => b[1].rows - a[1].rows)
                .map(([value, stats]) => ({
                    value,
                    rows: stats.rows,
                    positive: stats.positive,
                    positiveRate: stats.rows ? stats.positive / stats.rows : 0,
                }));

            const rates = groups.map((group) => group.positiveRate);
            const maxRate = Math.max(...rates);
            const minRate = Math.min(...rates);
            const disparity = rates.length > 1 ? maxRate - minRate : 0;

            let verdict: VerdictStatus = "insufficient";

            if (rates.length > 1) {
                if (disparity >= 0.2) {
                    verdict = "fail";
                } else if (disparity >= 0.1) {
                    verdict = "caution";
                } else {
                    verdict = "pass";
                }
            }

            return {
                column,
                verdict,
                disparity,
                groups,
            };
        })
        .filter((metric) => metric.groups.length >= 2);
};

const deriveOverallVerdict = (metrics: FairnessColumnAssessment[]): VerdictStatus => {
    if (!metrics.length) return "insufficient";
    if (metrics.some((metric) => metric.verdict === "fail")) return "fail";
    if (metrics.some((metric) => metric.verdict === "caution")) return "caution";
    if (metrics.every((metric) => metric.verdict === "pass")) return "pass";
    return "insufficient";
};

export const evaluateDatasetFairnessFromParsed = (parsed: { headers: string[]; rows: CSVRow[] }): FairnessAssessment => {
    if (!parsed.headers.length || !parsed.rows.length) {
        return { overallVerdict: "insufficient", sensitiveColumns: [] };
    }

    const columnTypes = inferColumnTypes(parsed.headers, parsed.rows);
    const sensitiveCandidates = detectSensitiveColumns(parsed.headers, parsed.rows, columnTypes);
    if (!sensitiveCandidates.length) {
        return { overallVerdict: "insufficient", sensitiveColumns: [] };
    }

    const outcomeConfig = inferOutcomeConfig(parsed.headers, parsed.rows, columnTypes);
    if (!outcomeConfig) {
        return { overallVerdict: "insufficient", sensitiveColumns: [] };
    }

    const metrics = computeGroupMetrics(
        parsed.rows,
        sensitiveCandidates.map((candidate) => candidate.column),
        outcomeConfig.column,
        outcomeConfig.positiveValue
    ).map((metric) => ({
        ...metric,
        disparity: Number(metric.disparity.toFixed(4)),
        groups: metric.groups.map((group) => ({
            ...group,
            positiveRate: Number(group.positiveRate.toFixed(4)),
        })),
    }));

    return {
        overallVerdict: deriveOverallVerdict(metrics),
        sensitiveColumns: metrics,
    };
};

export const evaluateDatasetFairness = (csvText: string): FairnessAssessment => {
    const parsed = parseCSV(csvText);
    return evaluateDatasetFairnessFromParsed(parsed);
};

