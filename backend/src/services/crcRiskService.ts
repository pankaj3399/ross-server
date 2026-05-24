import pool from "../config/database";

/**
 * Risk Rating Matrix (from spec):
 *
 * | Control Priority | No / Not Sure | Partially |
 * |:-----------------|:--------------|:----------|
 * | High             | Critical      | High      |
 * | Medium           | High          | Medium    |
 * | Low              | Medium        | Low       |
 *
 * Answer values (from migration 1774362642332):
 *   0 = No, 0.5 = Partially, 1 = Yes, 2 = NA, 3 = Not Sure
 */

type RiskRating = "Critical" | "High" | "Medium" | "Low";

const RISK_MATRIX: Record<string, Record<string, RiskRating>> = {
    High: { no: "Critical", not_sure: "Critical", partial: "High" },
    Medium: { no: "High", not_sure: "High", partial: "Medium" },
    Low: { no: "Medium", not_sure: "Medium", partial: "Low" },
};

function getAnswerBucket(value: number): "no" | "partial" | "not_sure" | null {
    if (value === 0) return "no";
    if (value === 0.5) return "partial";
    if (value === 3) return "not_sure";
    // Yes (1) and NA (2) don't create/maintain a risk
    return null;
}

function computeRiskRating(priority: string, answerValue: number): RiskRating | null {
    const bucket = getAnswerBucket(answerValue);
    if (!bucket) return null; // Yes or NA — no risk

    const priorityKey = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
    const row = RISK_MATRIX[priorityKey];
    if (!row) {
        // Unknown priority — default to Medium matrix row
        return RISK_MATRIX["Medium"][bucket] ?? "Medium";
    }
    return row[bucket] ?? "Medium";
}

/**
 * Sync a risk row for a specific control after a CRC assessment response is saved.
 *
 * - If the answer is No / Partially / Not Sure → upsert an Open risk with the
 *   auto-calculated rating.
 * - If the answer is Yes / NA → close the risk if one exists.
 */
export async function syncRiskFromResponse(
    projectId: string,
    controlId: string,
    answerValue: number
): Promise<void> {
    // Fetch control metadata for risk title & category & priority
    const controlResult = await pool.query(
        `SELECT control_id, control_title, category, priority, risk_description
         FROM crc_controls WHERE id = $1`,
        [controlId]
    );
    if (controlResult.rows.length === 0) return;

    const control = controlResult.rows[0];
    const rating = computeRiskRating(control.priority, answerValue);

    if (rating === null) {
        // Yes or NA — close any existing risk
        await pool.query(
            `UPDATE crc_risks SET status = 'Closed', updated_at = CURRENT_TIMESTAMP
             WHERE project_id = $1 AND control_id = $2 AND status = 'Open'`,
            [projectId, controlId]
        );
    } else {
        // No / Partially / Not Sure — upsert an Open risk
        const title = `${control.control_id}: ${control.control_title}`;
        const description = control.risk_description || "";

        // Fetch category name if control has a category_id, otherwise use control.category
        let categoryName = control.category || "Uncategorized";
        // The category column on crc_controls may be the direct name or mapped via
        // crc_categories. We use whatever is on the row.

        await pool.query(
            `INSERT INTO crc_risks (project_id, control_id, title, category, rating, status, description, source)
             VALUES ($1, $2, $3, $4, $5, 'Open', $6, 'Automated')
             ON CONFLICT (project_id, control_id)
             DO UPDATE SET rating = $5, status = 'Open',
                           title = $3, category = $4, description = $6,
                           updated_at = CURRENT_TIMESTAMP`,
            [projectId, controlId, title, categoryName, rating, description]
        );
    }
}
