import { Router } from "express";
import { z } from "zod";
import pool from "../config/database";
import { authenticateToken } from "../middleware/auth";
import { getMembership } from "../services/projectMembershipService";
import { recordEvent } from "../services/auditLogService";
import { 
  VENDOR_QUESTIONS, 
  VENDOR_PREFILLS, 
  calculateAssessmentScore,
  normalizeProviderKey
} from "../data/vendorPrefills";

const router = Router();

const saveAnswersSchema = z.object({
  answers: z.record(z.object({
    optionValue: z.string(),
    evidence: z.string().optional().default(""),
    url: z.string().optional().default("")
  }))
});

// GET /api/vendor-assessments/schema
router.get("/schema", async (req, res) => {
  try {
    return res.json({
      success: true,
      questions: VENDOR_QUESTIONS
    });
  } catch (error) {
    console.error("Error fetching vendor assessment schema:", error);
    res.status(500).json({ error: "Failed to fetch schema" });
  }
});

// GET /api/vendor-assessments/:projectId/component/:componentId
router.get("/:projectId/component/:componentId", authenticateToken, async (req, res) => {
  try {
    const { projectId, componentId } = req.params;
    const userId = req.user!.id;

    const membership = await getMembership(projectId, userId);
    if (!membership) {
      return res.status(403).json({ error: "Project not found or access denied" });
    }

    // Check that component exists in the project
    const compResult = await pool.query(
      "SELECT id, provider, component_name, vendor_assessment_status FROM component_inventory WHERE id = $1 AND project_id = $2",
      [componentId, projectId]
    );
    if (compResult.rows.length === 0) {
      return res.status(404).json({ error: "Component not found" });
    }
    const component = compResult.rows[0];

    // Fetch assessment
    const assessResult = await pool.query(
      "SELECT * FROM vendor_assessments WHERE component_id = $1 AND project_id = $2",
      [componentId, projectId]
    );

    if (assessResult.rows.length > 0) {
      const row = assessResult.rows[0];
      return res.json({
        success: true,
        data: {
          id: row.id,
          projectId: row.project_id,
          componentId: row.component_id,
          vendorName: row.vendor_name,
          answers: row.answers,
          score: row.score,
          riskTier: row.risk_tier,
          status: row.status,
          completedAt: row.completed_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }
      });
    }

    const providerKey = normalizeProviderKey(component.provider) || component.provider.toLowerCase().trim();

    let initialAnswers: Record<string, any> = {};
    let defaultRiskTier: "Low" | "Medium" | "High" | "Critical" = "Low";
    let defaultScore = 0;

    if (VENDOR_PREFILLS[providerKey]) {
      const prefill = VENDOR_PREFILLS[providerKey];
      defaultRiskTier = prefill.defaultRiskTierSuggestion;
      initialAnswers = prefill.answers;
      // Calculate prefill score
      const scoreData = calculateAssessmentScore(prefill.answers);
      defaultScore = scoreData.score;
    }

    return res.json({
      success: true,
      data: {
        id: null,
        projectId,
        componentId,
        vendorName: component.provider,
        answers: initialAnswers,
        score: defaultScore,
        riskTier: defaultRiskTier,
        status: "In Progress",
        completedAt: null
      }
    });
  } catch (error) {
    console.error("Error fetching vendor assessment:", error);
    res.status(500).json({ error: "Failed to fetch vendor assessment" });
  }
});

// POST /api/vendor-assessments/:projectId/component/:componentId/save
router.post("/:projectId/component/:componentId/save", authenticateToken, async (req, res) => {
  try {
    const { projectId, componentId } = req.params;
    const userId = req.user!.id;
    const { answers } = saveAnswersSchema.parse(req.body);

    const membership = await getMembership(projectId, userId);
    if (!membership) {
      return res.status(403).json({ error: "Project not found or access denied" });
    }
    if (!["OWNER", "EDITOR"].includes(membership.role)) {
      return res.status(403).json({ error: "Insufficient project permissions" });
    }

    const compResult = await pool.query(
      "SELECT id, provider FROM component_inventory WHERE id = $1 AND project_id = $2",
      [componentId, projectId]
    );
    if (compResult.rows.length === 0) {
      return res.status(404).json({ error: "Component not found" });
    }
    const component = compResult.rows[0];

    // Calculate score & risk tier
    const { score, riskTier } = calculateAssessmentScore(answers);

    const upsertResult = await pool.query(
      `INSERT INTO vendor_assessments (
        project_id, component_id, vendor_name, answers, score, risk_tier, status
      ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, 'In Progress')
      ON CONFLICT (component_id) DO UPDATE SET
        answers = EXCLUDED.answers,
        score = EXCLUDED.score,
        risk_tier = EXCLUDED.risk_tier,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [projectId, componentId, component.provider, JSON.stringify(answers), score, riskTier]
    );
    const dbRow = upsertResult.rows[0];

    // Also update component inventory status to show 'In Progress' if not already done
    await pool.query(
      `UPDATE component_inventory SET
        vendor_assessment_status = 'In Progress',
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [componentId]
    );

    res.json({
      success: true,
      data: {
        id: dbRow.id,
        projectId: dbRow.project_id,
        componentId: dbRow.component_id,
        vendorName: dbRow.vendor_name,
        answers: dbRow.answers,
        score: dbRow.score,
        riskTier: dbRow.risk_tier,
        status: dbRow.status,
        completedAt: dbRow.completed_at,
        createdAt: dbRow.created_at,
        updatedAt: dbRow.updated_at
      }
    });
  } catch (error) {
    console.error("Error saving vendor assessment:", error);
    res.status(500).json({ error: "Failed to save vendor assessment" });
  }
});

// POST /api/vendor-assessments/:projectId/component/:componentId/complete
router.post("/:projectId/component/:componentId/complete", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { projectId, componentId } = req.params;
    const userId = req.user!.id;
    const { answers } = saveAnswersSchema.parse(req.body);

    const membership = await getMembership(projectId, userId);
    if (!membership) {
      client.release();
      return res.status(403).json({ error: "Project not found or access denied" });
    }
    if (!["OWNER", "EDITOR"].includes(membership.role)) {
      client.release();
      return res.status(403).json({ error: "Insufficient project permissions" });
    }

    const compResult = await pool.query(
      "SELECT id, provider FROM component_inventory WHERE id = $1 AND project_id = $2",
      [componentId, projectId]
    );
    if (compResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: "Component not found" });
    }
    const component = compResult.rows[0];

    // Validate that ALL 18 questions are answered
    const missingQuestions = VENDOR_QUESTIONS.filter(q => !answers[q.id] || !answers[q.id].optionValue);
    if (missingQuestions.length > 0) {
      client.release();
      return res.status(400).json({
        error: "All 18 questions must be answered to complete the assessment.",
        missing: missingQuestions.map(q => q.id)
      });
    }

    await client.query("BEGIN");

    // Calculate final score & risk tier
    const { score, riskTier } = calculateAssessmentScore(answers);

    const checkResult = await client.query(
      "SELECT id FROM vendor_assessments WHERE component_id = $1 AND project_id = $2 FOR UPDATE",
      [componentId, projectId]
    );

    let dbRow;
    const now = new Date();
    if (checkResult.rows.length === 0) {
      const insertResult = await client.query(
        `INSERT INTO vendor_assessments (
          project_id, component_id, vendor_name, answers, score, risk_tier, status, completed_at
        ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, 'Completed', $7)
        RETURNING *`,
        [projectId, componentId, component.provider, JSON.stringify(answers), score, riskTier, now]
      );
      dbRow = insertResult.rows[0];
    } else {
      const updateResult = await client.query(
        `UPDATE vendor_assessments SET
          answers = $1::jsonb,
          score = $2,
          risk_tier = $3,
          status = 'Completed',
          completed_at = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE component_id = $5 AND project_id = $6
        RETURNING *`,
        [JSON.stringify(answers), score, riskTier, now, componentId, projectId]
      );
      dbRow = updateResult.rows[0];
    }

    // 1. Update component inventory
    await client.query(
      `UPDATE component_inventory SET
        vendor_assessment_status = 'Completed',
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [componentId]
    );

    const targetControls = ['GOV-3P-01', 'GOV-3P-02', 'GOV-3P-03'];
    const controlsRes = await client.query(
      "SELECT id, control_id FROM crc_controls WHERE control_id = ANY($1) AND status = 'Published'",
      [targetControls]
    );

    const foundControlIds = controlsRes.rows.map((r) => r.control_id);
    const missingControlIds = targetControls.filter((id) => !foundControlIds.includes(id));
    if (missingControlIds.length > 0) {
      console.warn(`Missing or non-Published CRC controls: ${missingControlIds.join(", ")}`);
    }

    const evidenceUrl = `/assess/${projectId}/inventory?openAssessment=${componentId}`;

    for (const ctrl of controlsRes.rows) {
      await client.query(
        `INSERT INTO crc_assessment_responses (
          project_id, control_id, user_id, value, notes, evidence_status, evidence_url, audit_ready
        ) VALUES ($1, $2, $3, 1, 'Satisfied via Vendor AI Risk Assessment.', 'Evidence Complete', $4, true)
        ON CONFLICT (project_id, control_id)
        DO UPDATE SET
          evidence_status = 'Evidence Complete',
          evidence_url = $4,
          audit_ready = true,
          updated_at = CURRENT_TIMESTAMP`,
        [projectId, ctrl.id, userId, evidenceUrl]
      );
    }

    // 3. Record Audit Log event
    await recordEvent({
      projectId,
      actorId: userId,
      action: "vendor_assessment_complete",
      objectType: "VENDOR_ASSESSMENT",
      objectId: dbRow.id,
      metadata: {
        vendorName: component.provider,
        score,
        riskTier,
        completedAt: now.toISOString()
      },
      client
    });

    await client.query("COMMIT");
    client.release();

    res.json({
      success: true,
      data: {
        id: dbRow.id,
        projectId: dbRow.project_id,
        componentId: dbRow.component_id,
        vendorName: dbRow.vendor_name,
        answers: dbRow.answers,
        score: dbRow.score,
        riskTier: dbRow.risk_tier,
        status: dbRow.status,
        completedAt: dbRow.completed_at,
        createdAt: dbRow.created_at,
        updatedAt: dbRow.updated_at
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    client.release();
    console.error("Error completing vendor assessment:", error);
    res.status(500).json({ error: "Failed to complete vendor assessment" });
  }
});

export default router;
