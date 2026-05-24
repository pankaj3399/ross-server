import pool from "../config/database";

// Mirrors the answer scale enforced by migration 1774362642332:
// 0 = No, 0.5 = Partially, 1 = Yes, 2 = NA, 3 = Not Sure.
// NA and "Not Sure" are excluded from averages — they shouldn't penalize the
// score, but they do count toward "answered" for completion purposes.
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
    averageScore: number | null;
    percentage: number | null;
};

export type CrcFrameworkResult = {
    totalControls: number;
    scoredControls: number;
    points: number;
    percentage: number | null;
};

export type CrcResults = {
    overall: {
        totalControls: number;
        answeredControls: number;
        scoredControls: number;
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
    const categoryMap = new Map<string, {
        categoryId: number | null;
        categoryName: string;
        totalControls: number;
        answeredControls: number;
        scoreSum: number;
        scoredControls: number;
    }>();

    // Per-framework accumulators
    const fw = {
        eu_ai_act: { totalControls: 0, scoredControls: 0, points: 0 },
        nist_ai_rmf: { totalControls: 0, scoredControls: 0, points: 0 },
        iso_42001: { totalControls: 0, scoredControls: 0, points: 0 },
    };

    let totalControls = 0;
    let answeredControls = 0;
    let scoredControls = 0;
    let scoreSum = 0;

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
            });
        }
        const bucket = categoryMap.get(key)!;
        bucket.totalControls++;

        // --- Per-framework tracking ---
        // Parse compliance_mapping (may be a string or already an object depending
        // on the pg driver configuration).
        let mapping: ComplianceMapping = {};
        if (row.compliance_mapping) {
            mapping = typeof row.compliance_mapping === "string"
                ? JSON.parse(row.compliance_mapping)
                : row.compliance_mapping;
        }

        const pts = readinessPoints(value);

        if (mapping.eu_ai_act && mapping.eu_ai_act.length > 0) {
            fw.eu_ai_act.totalControls++;
            if (value !== null) {
                fw.eu_ai_act.scoredControls++;
                fw.eu_ai_act.points += pts;
            }
        }
        if (mapping.nist_ai_rmf && mapping.nist_ai_rmf.length > 0) {
            fw.nist_ai_rmf.totalControls++;
            if (value !== null) {
                fw.nist_ai_rmf.scoredControls++;
                fw.nist_ai_rmf.points += pts;
            }
        }
        if (mapping.iso_42001 && mapping.iso_42001.length > 0) {
            fw.iso_42001.totalControls++;
            if (value !== null) {
                fw.iso_42001.scoredControls++;
                fw.iso_42001.points += pts;
            }
        }

        if (value === null) continue;

        answeredControls++;

        if (value === ANSWER_YES) breakdown.yes++;
        else if (value === ANSWER_PARTIAL) breakdown.partial++;
        else if (value === ANSWER_NO) breakdown.no++;
        else if (value === ANSWER_NA) breakdown.na++;
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
        .map((b) => ({
            categoryId: b.categoryId,
            categoryName: b.categoryName,
            totalControls: b.totalControls,
            answeredControls: b.answeredControls,
            scoredControls: b.scoredControls,
            averageScore: b.scoredControls > 0 ? b.scoreSum / b.scoredControls : null,
            percentage: b.scoredControls > 0 ? (b.scoreSum / b.scoredControls) * 100 : null,
        }))
        .sort((a, b) => a.categoryName.localeCompare(b.categoryName));

    // Build per-framework results
    const buildFrameworkResult = (acc: typeof fw.eu_ai_act): CrcFrameworkResult => ({
        totalControls: acc.totalControls,
        scoredControls: acc.scoredControls,
        points: acc.points,
        percentage: acc.scoredControls > 0
            ? (acc.points / acc.scoredControls) * 100
            : null,
    });

    return {
        overall: {
            totalControls,
            answeredControls,
            scoredControls,
            averageScore: scoredControls > 0 ? scoreSum / scoredControls : null,
            percentage: scoredControls > 0 ? (scoreSum / scoredControls) * 100 : null,
        },
        categories,
        breakdown,
        frameworks: {
            eu_ai_act: buildFrameworkResult(fw.eu_ai_act),
            nist_ai_rmf: buildFrameworkResult(fw.nist_ai_rmf),
            iso_42001: buildFrameworkResult(fw.iso_42001),
        },
    };
}

export function isCrcAssessmentComplete(results: CrcResults): boolean {
    return results.overall.totalControls > 0 &&
        results.overall.answeredControls === results.overall.totalControls;
}
