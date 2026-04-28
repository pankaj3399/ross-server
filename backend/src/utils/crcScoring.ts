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
};

type ControlRow = {
    control_id: string;
    category_id: number | null;
    category_name: string | null;
    response_value: number | null;
};

export async function computeCrcResults(projectId: string): Promise<CrcResults> {
    // Left join: every published control appears once, with the user's response
    // value if any. This is the source of truth for both completion and scoring.
    const result = await pool.query<ControlRow>(
        `SELECT c.id AS control_id,
                c.category_id,
                cat.name AS category_name,
                r.value AS response_value
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
    };
}

export function isCrcAssessmentComplete(results: CrcResults): boolean {
    return results.overall.totalControls > 0 &&
        results.overall.answeredControls === results.overall.totalControls;
}
