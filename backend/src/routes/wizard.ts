import { Router } from "express";
import { z } from "zod";
import pool from "../config/database";
import { authenticateToken } from "../middleware/auth";
import { loadProject, requireProjectRole } from "../middleware/projectAccess";
import { runRulesEngine, WizardAnswers } from "../services/wizardRulesEngine";
import { recordEvent } from "../services/auditLogService";

const router = Router();

// Zod schema for partial wizard answers saving
const saveAnswersSchema = z.object({
  governance_scope: z.enum(["system", "organization"]).optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  use_case: z.string().optional(),
  regulatory_role: z.enum(["provider", "deployer", "both"]).optional(),
  data_categories: z.array(z.string()).optional(),
  geographic_scope: z.array(z.string()).optional(),
  scale: z.string().optional(),
  uses_third_party_models: z.enum(["yes", "no", "not_sure"]).optional(),
  third_party_providers: z.array(z.string()).optional(),
  automation_level: z.string().optional(),
  existing_certifications: z.array(z.string()).optional(),
  annex_iii_domains: z.array(z.string()).optional(),
  biometric_use: z.string().optional(),
  affects_children: z.enum(["yes", "no", "not_sure"]).optional(),
  public_url: z.string().optional(),
  wizard_step: z.number().int().min(1).max(6).optional(),
});

// Helper to convert db row to WizardAnswers structure
function mapRowToAnswers(row: any): WizardAnswers {
  return {
    name: row.name || "",
    description: row.description || "",
    governance_scope: row.governance_scope || undefined,
    use_case: row.use_case || undefined,
    regulatory_role: row.regulatory_role || undefined,
    data_categories: row.data_categories || [],
    geographic_scope: row.geographic_scope || [],
    scale: row.scale || undefined,
    uses_third_party_models: row.uses_third_party_models || undefined,
    third_party_providers: row.third_party_providers || [],
    automation_level: row.automation_level || undefined,
    existing_certifications: row.existing_certifications || [],
    annex_iii_domains: row.annex_iii_domains || [],
    biometric_use: row.biometric_use || undefined,
    affects_children: row.affects_children || undefined,
    public_url: row.public_url || undefined,
  };
}

// GET /wizard/:projectId/status - Check wizard status
router.get("/:projectId/status", authenticateToken, loadProject, async (req, res) => {
  try {
    const projectId = req.params.projectId;

    const result = await pool.query(
      `SELECT wp.wizard_status, wp.wizard_step, wp.completed_at, weo.applied_at
       FROM wizard_profiles wp
       LEFT JOIN wizard_engine_outputs weo ON wp.project_id = weo.project_id
       WHERE wp.project_id = $1`,
      [projectId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        status: "not_started",
        step: 1,
        completedAt: null,
        appliedAt: null,
      });
    }

    const profile = result.rows[0];
    res.json({
      success: true,
      status: profile.wizard_status,
      step: profile.wizard_step,
      completedAt: profile.completed_at,
      appliedAt: profile.applied_at,
    });
  } catch (error) {
    console.error("Error fetching wizard status:", error);
    res.status(500).json({ success: false, error: "Failed to fetch wizard status" });
  }
});

// GET /wizard/:projectId/answers - Get current wizard answers
router.get("/:projectId/answers", authenticateToken, loadProject, requireProjectRole(["OWNER", "EDITOR"]), async (req, res) => {
  try {
    const projectId = req.params.projectId;

    const result = await pool.query(
      `SELECT * FROM wizard_profiles WHERE project_id = $1`,
      [projectId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        answers: null,
      });
    }

    res.json({
      success: true,
      answers: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching wizard answers:", error);
    res.status(500).json({ success: false, error: "Failed to fetch wizard answers" });
  }
});

// POST /wizard/:projectId/save - Save partial wizard progress
router.post("/:projectId/save", authenticateToken, loadProject, requireProjectRole(["OWNER", "EDITOR"]), async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const body = saveAnswersSchema.parse(req.body);

    const checkResult = await pool.query(
      "SELECT id FROM wizard_profiles WHERE project_id = $1",
      [projectId]
    );

    let profileId: string;

    if (checkResult.rows.length === 0) {
      // Create new profile row
      const insertResult = await pool.query(
        `INSERT INTO wizard_profiles (
          project_id, name, description, governance_scope, use_case, regulatory_role, data_categories,
          geographic_scope, scale, uses_third_party_models, third_party_providers,
          automation_level, existing_certifications, annex_iii_domains, biometric_use,
          affects_children, public_url, wizard_status, wizard_step
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11::jsonb, $12, $13::jsonb,
          $14::jsonb, $15, $16, $17, 'in_progress', $18
        ) RETURNING id`,
        [
          projectId,
          body.name || null,
          body.description || null,
          body.governance_scope || null,
          body.use_case || null,
          body.regulatory_role || null,
          JSON.stringify(body.data_categories || []),
          JSON.stringify(body.geographic_scope || []),
          body.scale || null,
          body.uses_third_party_models || null,
          JSON.stringify(body.third_party_providers || []),
          body.automation_level || null,
          JSON.stringify(body.existing_certifications || []),
          JSON.stringify(body.annex_iii_domains || []),
          body.biometric_use || null,
          body.affects_children || null,
          body.public_url || null,
          body.wizard_step || 1,
        ]
      );
      profileId = insertResult.rows[0].id;
    } else {
      // Update existing profile row
      const existingId = checkResult.rows[0].id;
      profileId = existingId;

      // Construct dynamic update fields to avoid overwriting with nulls if sending partial patches
      const updates: string[] = [];
      const values: any[] = [existingId];
      let valIdx = 2;

      const fields = [
        "name", "description", "governance_scope", "use_case", "regulatory_role", "scale", 
        "uses_third_party_models", "automation_level", "biometric_use", 
        "affects_children", "public_url", "wizard_step"
      ];

      for (const field of fields) {
        if ((body as any)[field] !== undefined) {
          updates.push(`${field} = $${valIdx}`);
          values.push((body as any)[field]);
          valIdx++;
        }
      }

      const jsonFields = [
        "data_categories", "geographic_scope", "third_party_providers", 
        "existing_certifications", "annex_iii_domains"
      ];

      for (const field of jsonFields) {
        if ((body as any)[field] !== undefined) {
          updates.push(`${field} = $${valIdx}::jsonb`);
          values.push(JSON.stringify((body as any)[field]));
          valIdx++;
        }
      }

      if (updates.length > 0) {
        await pool.query(
          `UPDATE wizard_profiles SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          values
        );
      }
    }

    // Update the project-level link if not set
    await pool.query(
      "UPDATE projects SET wizard_profile_id = $1 WHERE id = $2 AND wizard_profile_id IS NULL",
      [profileId, projectId]
    );

    res.json({ success: true, profileId });
  } catch (error) {
    console.error("Error saving wizard progress:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: "Failed to save wizard progress" });
  }
});

// POST /wizard/:projectId/complete - Run engine and show outputs
router.post("/:projectId/complete", authenticateToken, loadProject, requireProjectRole(["OWNER", "EDITOR"]), async (req, res) => {
  try {
    const projectId = req.params.projectId;

    // Fetch complete answers from database
    const profileResult = await pool.query(
      "SELECT * FROM wizard_profiles WHERE project_id = $1",
      [projectId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(400).json({ success: false, error: "No wizard answers found. Please save progress first." });
    }

    const profileRow = profileResult.rows[0];
    const answers = mapRowToAnswers(profileRow);

    // Fetch all controls from database to run the mapping engine
    const controlsResult = await pool.query("SELECT id, control_id, compliance_mapping FROM crc_controls WHERE status = 'Published'");
    const controls = controlsResult.rows;

    // Run rules engine
    const outputs = runRulesEngine(answers, controls);

    // Save outputs to database
    await pool.query(
      `INSERT INTO wizard_engine_outputs (
        project_id, eu_risk_tier, internal_risk_tier, eu_risk_reason, applicable_frameworks,
        control_flags, suggested_risks, suggested_components, vulnerability_scope,
        bias_scope, template_variables, copilot_context, article5_warning,
        article50_note, gpai_warning, informational_notes, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb,
        $10::jsonb, $11::jsonb, $12, $13, $14, $15, $16::jsonb, CURRENT_TIMESTAMP
      )
      ON CONFLICT (project_id) DO UPDATE SET
        eu_risk_tier = EXCLUDED.eu_risk_tier,
        internal_risk_tier = EXCLUDED.internal_risk_tier,
        eu_risk_reason = EXCLUDED.eu_risk_reason,
        applicable_frameworks = EXCLUDED.applicable_frameworks,
        control_flags = EXCLUDED.control_flags,
        suggested_risks = EXCLUDED.suggested_risks,
        suggested_components = EXCLUDED.suggested_components,
        vulnerability_scope = EXCLUDED.vulnerability_scope,
        bias_scope = EXCLUDED.bias_scope,
        template_variables = EXCLUDED.template_variables,
        copilot_context = EXCLUDED.copilot_context,
        article5_warning = EXCLUDED.article5_warning,
        article50_note = EXCLUDED.article50_note,
        gpai_warning = EXCLUDED.gpai_warning,
        informational_notes = EXCLUDED.informational_notes,
        updated_at = CURRENT_TIMESTAMP`,
      [
        projectId,
        outputs.eu_risk_tier,
        outputs.internal_risk_tier,
        outputs.eu_risk_reason,
        JSON.stringify(outputs.applicable_frameworks),
        JSON.stringify(outputs.control_flags),
        JSON.stringify(outputs.suggested_risks),
        JSON.stringify(outputs.suggested_components),
        JSON.stringify(outputs.vulnerability_scope),
        JSON.stringify(outputs.bias_scope),
        JSON.stringify(outputs.template_variables),
        outputs.copilot_context,
        outputs.article5_warning,
        outputs.article50_note,
        outputs.gpai_warning,
        JSON.stringify(outputs.informational_notes),
      ]
    );

    // Mark profile status as completed
    await pool.query(
      "UPDATE wizard_profiles SET wizard_status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE project_id = $1",
      [projectId]
    );

    res.json({
      success: true,
      outputs,
    });
  } catch (error) {
    console.error("Error completing wizard run:", error);
    res.status(500).json({ success: false, error: "Failed to complete wizard rules engine run" });
  }
});

// POST /wizard/:projectId/apply - Apply outputs to project (Transaction + Advisory Lock)
router.post("/:projectId/apply", authenticateToken, loadProject, requireProjectRole(["OWNER", "EDITOR"]), async (req, res) => {
  const projectId = req.params.projectId;
  const userId = req.user!.id;
  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // 1. Acquire project-level advisory lock
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [projectId]);

    // 2. Fetch completed wizard engine output
    const outputResult = await client.query(
      "SELECT * FROM wizard_engine_outputs WHERE project_id = $1",
      [projectId]
    );

    if (outputResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, error: "No rules engine outputs found. Complete the wizard first." });
    }

    const outputs = outputResult.rows[0];

    // 3. Snapshot existing project state before modification (Simple backup inside audit log)
    const existingRisks = await client.query("SELECT * FROM crc_risks WHERE project_id = $1", [projectId]);
    const existingComponents = await client.query("SELECT * FROM component_inventory WHERE project_id = $1", [projectId]);
    
    const snapshot = {
      risks: existingRisks.rows,
      components: existingComponents.rows,
      applied_at: outputs.applied_at,
    };

    // 4. Update project table fields
    // Prefill name and description from wizard profile if available
    const profileResult = await client.query(
      "SELECT name, description FROM wizard_profiles WHERE project_id = $1",
      [projectId]
    );
    if (profileResult.rows.length > 0) {
      const profile = profileResult.rows[0];
      await client.query(
        "UPDATE projects SET name = $1, description = $2, wizard_completed = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
        [profile.name, profile.description, projectId]
      );
    } else {
      await client.query(
        "UPDATE projects SET wizard_completed = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [projectId]
      );
    }

    // 5. Insert starter risks if they don't conflict (or just append) and are accepted by the user
    const suggestedRisks = outputs.suggested_risks || [];
    const acceptedRisks = Array.isArray(req.body.acceptedRisks) ? req.body.acceptedRisks : null;
    
    for (const risk of suggestedRisks) {
      // Skip if user explicitly filtered/deselected this risk
      if (acceptedRisks && !acceptedRisks.includes(risk.title)) {
        continue;
      }

      // Avoid inserting identical title duplicates
      const dupeCheck = await client.query(
        "SELECT id FROM crc_risks WHERE project_id = $1 AND title = $2",
        [projectId, risk.title]
      );

      if (dupeCheck.rows.length === 0) {
        await client.query(
          `INSERT INTO crc_risks (
            project_id, control_id, title, category, rating, status, description,
            mitigation_plan, owner, target_date, review_frequency, source
          ) VALUES ($1, NULL, $2, $3, $4, 'Open', $5, $6, 'AI Wizard', NULL, 'Quarterly', 'Automated')`,
          [
            projectId,
            risk.title,
            risk.category,
            risk.rating,
            risk.description,
            risk.mitigation_plan,
          ]
        );
      }
    }

    // 6. Insert starter components if they don't conflict and are accepted by the user
    const suggestedComponents = outputs.suggested_components || [];
    const acceptedComponents = Array.isArray(req.body.acceptedComponents) ? req.body.acceptedComponents : null;

    for (const comp of suggestedComponents) {
      // Skip if user explicitly filtered/deselected this component
      if (acceptedComponents && !acceptedComponents.includes(comp.component_name)) {
        continue;
      }

      const dupeCheck = await client.query(
        "SELECT id FROM component_inventory WHERE project_id = $1 AND component_name = $2",
        [projectId, comp.component_name]
      );

      if (dupeCheck.rows.length === 0) {
        // Generate atomic CMP-XXX ID using db sequence
        const seqResult = await client.query("SELECT nextval('component_inventory_seq') as seq");
        const nextSeq = parseInt(seqResult.rows[0].seq, 10);
        const componentId = `CMP-${String(nextSeq).padStart(3, "0")}`;

        await client.query(
          `INSERT INTO component_inventory (
            project_id, component_id, component_name, component_type, provider, version,
            role_in_system, data_categories_sent, risk_tier, status, vendor_assessment_status
          ) VALUES ($1, $2, $3, $4, $5, 'v1.0.0', $6, $7::jsonb, $8, $9, 'Not Run')`,
          [
            projectId,
            componentId,
            comp.component_name,
            comp.component_type,
            comp.provider,
            comp.role_in_system,
            JSON.stringify(comp.data_categories_sent),
            comp.risk_tier,
            comp.status,
          ]
        );
      }
    }

    // 7. Update wizard_engine_outputs.applied_at
    await client.query(
      "UPDATE wizard_engine_outputs SET applied_at = CURRENT_TIMESTAMP WHERE project_id = $1",
      [projectId]
    );

    // 8. Record Event to Audit Log
    await recordEvent({
      projectId,
      actorId: userId,
      action: snapshot.applied_at ? "engine_rerun" : "profile_applied",
      objectType: "WIZARD_PROFILE",
      objectId: outputs.id,
      metadata: { before_snapshot: snapshot },
      client
    });

    await client.query("COMMIT");
    res.json({ success: true, message: "Profile applied to project successfully" });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("Error applying wizard profile:", error);
    res.status(500).json({ success: false, error: "Failed to apply wizard profile" });
  } finally {
    if (client) client.release();
  }
});

// PUT /wizard/:projectId/answers - Edit answers in Settings and re-run engine
router.put("/:projectId/answers", authenticateToken, loadProject, requireProjectRole(["OWNER", "EDITOR"]), async (req, res) => {
  const projectId = req.params.projectId;
  const userId = req.user!.id;
  const body = saveAnswersSchema.parse(req.body);

  try {
    // 1. Fetch current answers to log diff
    const currentResult = await pool.query(
      "SELECT * FROM wizard_profiles WHERE project_id = $1",
      [projectId]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "No profile found for project" });
    }

    const currentAnswers = currentResult.rows[0];

    // 2. Perform updates
    const updates: string[] = [];
    const values: any[] = [projectId];
    let valIdx = 2;

    const fields = [
      "governance_scope", "use_case", "regulatory_role", "scale", 
      "uses_third_party_models", "automation_level", "biometric_use", 
      "affects_children", "public_url"
    ];

    for (const field of fields) {
      if ((body as any)[field] !== undefined) {
        updates.push(`${field} = $${valIdx}`);
        values.push((body as any)[field]);
        valIdx++;
      }
    }

    const jsonFields = [
      "data_categories", "geographic_scope", "third_party_providers", 
      "existing_certifications", "annex_iii_domains"
    ];

    for (const field of jsonFields) {
      if ((body as any)[field] !== undefined) {
        updates.push(`${field} = $${valIdx}::jsonb`);
        values.push(JSON.stringify((body as any)[field]));
        valIdx++;
      }
    }

    if (updates.length > 0) {
      await pool.query(
        `UPDATE wizard_profiles SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE project_id = $1`,
        values
      );
    }

    // 3. Re-run rules engine
    const profileResult = await pool.query(
      "SELECT * FROM wizard_profiles WHERE project_id = $1",
      [projectId]
    );
    const answers = mapRowToAnswers(profileResult.rows[0]);

    // Fetch controls
    const controlsResult = await pool.query("SELECT id, control_id, compliance_mapping FROM crc_controls WHERE status = 'Published'");
    const controls = controlsResult.rows;

    const outputs = runRulesEngine(answers, controls);

    // Save updated outputs
    await pool.query(
      `UPDATE wizard_engine_outputs SET
        eu_risk_tier = $1,
        internal_risk_tier = $2,
        eu_risk_reason = $3,
        applicable_frameworks = $4::jsonb,
        control_flags = $5::jsonb,
        suggested_risks = $6::jsonb,
        suggested_components = $7::jsonb,
        vulnerability_scope = $8::jsonb,
        bias_scope = $9::jsonb,
        template_variables = $10::jsonb,
        copilot_context = $11,
        article5_warning = $12,
        article50_note = $13,
        gpai_warning = $14,
        informational_notes = $15::jsonb,
        updated_at = CURRENT_TIMESTAMP
       WHERE project_id = $16`,
      [
        outputs.eu_risk_tier,
        outputs.internal_risk_tier,
        outputs.eu_risk_reason,
        JSON.stringify(outputs.applicable_frameworks),
        JSON.stringify(outputs.control_flags),
        JSON.stringify(outputs.suggested_risks),
        JSON.stringify(outputs.suggested_components),
        JSON.stringify(outputs.vulnerability_scope),
        JSON.stringify(outputs.bias_scope),
        JSON.stringify(outputs.template_variables),
        outputs.copilot_context,
        outputs.article5_warning,
        outputs.article50_note,
        outputs.gpai_warning,
        JSON.stringify(outputs.informational_notes),
        projectId,
      ]
    );

    // 4. Log audit log diff
    const diff = {
      before: currentAnswers,
      after: profileResult.rows[0],
    };

    await recordEvent({
      projectId,
      actorId: userId,
      action: "answers_edited",
      objectType: "WIZARD_PROFILE",
      objectId: profileResult.rows[0].id,
      metadata: { diff }
    });

    res.json({
      success: true,
      outputs,
    });
  } catch (error) {
    console.error("Error editing wizard answers:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: "Failed to edit wizard answers" });
  }
});

// GET /wizard/:projectId/engine-output - Get latest engine output
router.get("/:projectId/engine-output", authenticateToken, loadProject, requireProjectRole(["OWNER", "EDITOR"]), async (req, res) => {
  try {
    const projectId = req.params.projectId;

    const result = await pool.query(
      "SELECT * FROM wizard_engine_outputs WHERE project_id = $1",
      [projectId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        outputs: null,
      });
    }

    res.json({
      success: true,
      outputs: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching engine outputs:", error);
    res.status(500).json({ success: false, error: "Failed to fetch engine outputs" });
  }
});

export default router;
