import pool from "../config/database";

// Mirrors the answer scale enforced by migration 1774362642332:
// 0 = No, 0.5 = Partially, 1 = Yes, 2 = NA, 3 = Not Sure.
//
// Readiness formula (from spec):
//   (total points) / (totalControls - naCount) × 100
//
// NA is excluded from the denominator entirely.
// Not Sure and No both score 0 points but remain in the denominator.
// Unanswered controls also remain in the denominator (they are applicable gaps).
const ANSWER_NO = 0;
const ANSWER_PARTIAL = 0.5;
const ANSWER_YES = 1;
const ANSWER_NA = 2;
const ANSWER_NOT_SURE = 3;

const SCOREABLE_VALUES = new Set<number>([ANSWER_NO, ANSWER_PARTIAL, ANSWER_YES]);

export type CrcCategoryResult = {
    categoryId: number | null;
    categoryName: string;
    totalControls: number;
    answeredControls: number;
    scoredControls: number;
    naCount: number;
    applicableControls: number;
    averageScore: number | null;
    percentage: number | null;
};

export type CrcFrameworkResult = {
    totalControls: number;
    scoredControls: number;
    naCount: number;
    applicableControls: number;
    points: number;
    percentage: number | null;
};

export type RiskSummary = {
    critical: number;
    high: number;
    medium: number;
    low: number;
};

export type CrcResults = {
    overall: {
        totalControls: number;
        answeredControls: number;
        scoredControls: number;
        naCount: number;
        applicableControls: number;
        averageScore: number | null;
        percentage: number | null;
    };
    categories: CrcCategoryResult[];
    breakdown: {
        yes: number;
        partial: number;
        no: number;
        na: number;
        notSure: number;
    };
    frameworks: {
        eu_ai_act: CrcFrameworkResult;
        nist_ai_rmf: CrcFrameworkResult;
        iso_42001: CrcFrameworkResult;
    };
    riskSummary: RiskSummary;
    evidenceProgress?: {
        complete: number;
        total: number;
        percentage: number;
        breakdown: {
            noEvidence: number;
            templateDownloaded: number;
            inProgress: number;
            evidenceComplete: number;
        };
    };
};

type ComplianceMapping = {
    eu_ai_act?: Array<{ ref: string; context: string }>;
    nist_ai_rmf?: Array<{ ref: string; context: string }>;
    iso_42001?: Array<{ ref: string; context: string }>;
};

type ControlRow = {
    control_id: string;
    category_id: number | null;
    category_name: string | null;
    response_value: number | null;
    compliance_mapping: ComplianceMapping | null;
    evidence_status?: string | null;
    evidence_url?: string | null;
    audit_ready?: boolean | null;
};

/**
 * Compute the dashboard readiness score for a single control response.
 * Fully Implemented (1) = 1 point, Partially (0.5) = 0.5 points,
 * everything else (No / NA / Not Sure / unanswered) = 0 points.
 */
function readinessPoints(value: number | null): number {
    if (value === ANSWER_YES) return 1;
    if (value === ANSWER_PARTIAL) return 0.5;
    return 0;
}

export async function computeCrcResults(projectId: string): Promise<CrcResults> {
    // Left join: every published control appears once, with the user's response
    // value if any. This is the source of truth for both completion and scoring.
    // Also fetch compliance_mapping for per-framework scoring.
    const result = await pool.query<ControlRow>(
        `SELECT c.id AS control_id,
                c.category_id,
                cat.name AS category_name,
                r.value AS response_value,
                r.evidence_status,
                r.evidence_url,
                r.audit_ready,
                c.compliance_mapping
         FROM crc_controls c
         LEFT JOIN crc_categories cat ON cat.id = c.category_id
         LEFT JOIN crc_assessment_responses r
                ON r.control_id = c.id AND r.project_id = $1
         WHERE c.status = 'Published'`,
        [projectId]
    );

    const rows = result.rows;
    const breakdown = { yes: 0, partial: 0, no: 0, na: 0, notSure: 0 };
    const evidenceBreakdown = { noEvidence: 0, templateDownloaded: 0, inProgress: 0, evidenceComplete: 0 };
    const categoryMap = new Map<string, {
        categoryId: number | null;
        categoryName: string;
        totalControls: number;
        answeredControls: number;
        scoreSum: number;
        scoredControls: number;
        naCount: number;
    }>();

    // Per-framework accumulators
    const fw = {
        eu_ai_act: { totalControls: 0, scoredControls: 0, naCount: 0, points: 0 },
        nist_ai_rmf: { totalControls: 0, scoredControls: 0, naCount: 0, points: 0 },
        iso_42001: { totalControls: 0, scoredControls: 0, naCount: 0, points: 0 },
    };

    let totalControls = 0;
    let answeredControls = 0;
    let scoredControls = 0;
    let scoreSum = 0;
    let naCount = 0;

    for (const row of rows) {
        totalControls++;
        const value = row.response_value === null ? null : Number(row.response_value);
        const categoryName = row.category_name ?? "Uncategorized";
        const key = `${row.category_id ?? "null"}|${categoryName}`;

        if (!categoryMap.has(key)) {
            categoryMap.set(key, {
                categoryId: row.category_id,
                categoryName,
                totalControls: 0,
                answeredControls: 0,
                scoreSum: 0,
                scoredControls: 0,
                naCount: 0,
            });
        }
        const bucket = categoryMap.get(key)!;
        bucket.totalControls++;

        // --- Per-framework tracking ---
        // Parse compliance_mapping (may be a string or already an object depending
        // on the pg driver configuration).
        let mapping: ComplianceMapping = {};
        if (row.compliance_mapping) {
            if (typeof row.compliance_mapping === "string") {
                try {
                    mapping = JSON.parse(row.compliance_mapping);
                } catch (error) {
                    if (error instanceof SyntaxError) {
                        console.error(`Malformed compliance_mapping for row ${row.control_id}:`, error);
                        mapping = {};
                    } else {
                        throw error;
                    }
                }
            } else {
                mapping = row.compliance_mapping;
            }
        }

        const pts = readinessPoints(value);

        if (mapping.eu_ai_act && mapping.eu_ai_act.length > 0) {
            fw.eu_ai_act.totalControls++;
            if (value === ANSWER_NA) {
                fw.eu_ai_act.naCount++;
            }
            if (value !== null && SCOREABLE_VALUES.has(value)) {
                fw.eu_ai_act.scoredControls++;
                fw.eu_ai_act.points += pts;
            }
        }
        if (mapping.nist_ai_rmf && mapping.nist_ai_rmf.length > 0) {
            fw.nist_ai_rmf.totalControls++;
            if (value === ANSWER_NA) {
                fw.nist_ai_rmf.naCount++;
            }
            if (value !== null && SCOREABLE_VALUES.has(value)) {
                fw.nist_ai_rmf.scoredControls++;
                fw.nist_ai_rmf.points += pts;
            }
        }

        // --- Evidence Tracking Accumulation ---
        const status = row.evidence_status ?? 'No Evidence';
        if (status === 'No Evidence') {
            evidenceBreakdown.noEvidence++;
        } else if (status === 'Template Downloaded') {
            evidenceBreakdown.templateDownloaded++;
        } else if (status === 'Evidence in Progress') {
            evidenceBreakdown.inProgress++;
        } else if (status === 'Evidence Complete') {
            evidenceBreakdown.evidenceComplete++;
        }

        if (mapping.iso_42001 && mapping.iso_42001.length > 0) {
            fw.iso_42001.totalControls++;
            if (value === ANSWER_NA) {
                fw.iso_42001.naCount++;
            }
            if (value !== null && SCOREABLE_VALUES.has(value)) {
                fw.iso_42001.scoredControls++;
                fw.iso_42001.points += pts;
            }
        }

        if (value === null) continue;

        answeredControls++;

        if (value === ANSWER_YES) breakdown.yes++;
        else if (value === ANSWER_PARTIAL) breakdown.partial++;
        else if (value === ANSWER_NO) breakdown.no++;
        else if (value === ANSWER_NA) { breakdown.na++; naCount++; bucket.naCount++; }
        else if (value === ANSWER_NOT_SURE) breakdown.notSure++;

        bucket.answeredControls++;

        if (SCOREABLE_VALUES.has(value)) {
            bucket.scoreSum += value;
            bucket.scoredControls++;
            scoreSum += value;
            scoredControls++;
        }
    }

    const categories: CrcCategoryResult[] = Array.from(categoryMap.values())
        .map((b) => {
            const applicable = b.totalControls - b.naCount;
            return {
                categoryId: b.categoryId,
                categoryName: b.categoryName,
                totalControls: b.totalControls,
                answeredControls: b.answeredControls,
                scoredControls: b.scoredControls,
                naCount: b.naCount,
                applicableControls: applicable,
                averageScore: b.scoredControls > 0 ? b.scoreSum / b.scoredControls : null,
                percentage: b.answeredControls > 0 && applicable > 0 ? (b.scoreSum / applicable) * 100 : null,
            };
        })
        .sort((a, b) => a.categoryName.localeCompare(b.categoryName));

    // Build per-framework results
    // Denominator = totalControls - naCount (applicable controls for this framework)
    const buildFrameworkResult = (acc: typeof fw.eu_ai_act): CrcFrameworkResult => {
        const applicable = acc.totalControls - acc.naCount;
        const answered = acc.scoredControls + acc.naCount;
        return {
            totalControls: acc.totalControls,
            scoredControls: acc.scoredControls,
            naCount: acc.naCount,
            applicableControls: applicable,
            points: acc.points,
            percentage: answered > 0 && applicable > 0
                ? (acc.points / applicable) * 100
                : null,
        };
    };

    // Query risk summary from crc_risks table
    let riskSummary: RiskSummary = { critical: 0, high: 0, medium: 0, low: 0 };
    try {
        const riskResult = await pool.query(
            `SELECT rating, COUNT(*)::int as count
             FROM crc_risks
             WHERE project_id = $1 AND status = 'Open'
             GROUP BY rating`,
            [projectId]
        );
        for (const row of riskResult.rows) {
            if (!row.rating) continue;
            const key = (row.rating as string).toLowerCase() as keyof RiskSummary;
            if (key in riskSummary) {
                riskSummary[key] = row.count;
            }
        }
    } catch (error: any) {
        // Table may not exist yet (pre-migration); silently return zeros only for missing table (PG error code '42P01')
        if (error && error.code === "42P01") {
            // Silently return zeros
        } else {
            console.error("Database error querying crc_risks summary:", error);
            throw error;
        }
    }

    const overallApplicable = totalControls - naCount;

    return {
        overall: {
            totalControls,
            answeredControls,
            scoredControls,
            naCount,
            applicableControls: overallApplicable,
            averageScore: scoredControls > 0 ? scoreSum / scoredControls : null,
            percentage: overallApplicable > 0 ? (scoreSum / overallApplicable) * 100 : null,
        },
        categories,
        breakdown,
        frameworks: {
            eu_ai_act: buildFrameworkResult(fw.eu_ai_act),
            nist_ai_rmf: buildFrameworkResult(fw.nist_ai_rmf),
            iso_42001: buildFrameworkResult(fw.iso_42001),
        },
        riskSummary,
        evidenceProgress: {
            complete: evidenceBreakdown.evidenceComplete,
            total: totalControls,
            percentage: totalControls > 0 ? Math.round((evidenceBreakdown.evidenceComplete / totalControls) * 100) : 0,
            breakdown: evidenceBreakdown
        }
    };
}

export function isCrcAssessmentComplete(results: CrcResults): boolean {
    return results.overall.totalControls > 0 &&
        results.overall.answeredControls === results.overall.totalControls;
}
