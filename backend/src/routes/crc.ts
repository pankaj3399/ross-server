import { Router } from "express";
import pool from "../config/database";
import { z } from "zod";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = Router();

// --- Validation Schemas ---

// Common reusable schemas
const implementationSchema = z.object({
  requirements: z.array(z.string()).optional().default([]),
  steps: z.array(z.string()).optional().default([]),
  timeline: z.string().optional().default(""),
});

const complianceMappingSchema = z.object({
  eu_ai_act: z.array(z.object({
    ref: z.string(),
    context: z.string(),
  })).optional().default([]),
  nist_ai_rmf: z.array(z.object({
    ref: z.string(),
    context: z.string(),
  })).optional().default([]),
  iso_42001: z.array(z.object({
    ref: z.string(),
    context: z.string(),
  })).optional().default([]),
});

const aimaMappingSchema = z.object({
  domain: z.string().optional().default(""),
  area: z.string().optional().default(""),
  maturity_enhancement: z.string().optional().default(""),
});

// Create/Update Control Schema
const controlSchema = z.object({
  control_id: z.string().min(1, "Control ID is required").max(20, "Control ID must be 20 chars max"),
  control_title: z.string().min(1, "Title is required").max(200, "Title must be 200 chars max"),
  category: z.string().min(1, "Category is required"),
  priority: z.string().min(1, "Priority is required"),
  status: z.enum(["Draft", "In Review", "Published", "Archived"]).optional().default("Draft"),
  applicable_to: z.array(z.string()).default([]),
  control_statement: z.string().optional().default(""),
  control_objective: z.string().optional().default(""),
  risk_description: z.string().optional().default(""),
  implementation: implementationSchema.optional().default({}),
  evidence_requirements: z.array(z.string()).optional().default([]),
  compliance_mapping: complianceMappingSchema.optional().default({}),
  aima_mapping: aimaMappingSchema.optional().default({}),
});

// Transition Schema
const transitionSchema = z.object({
  status: z.enum(["Draft", "In Review", "Published", "Archived"]),
  note: z.string().optional(),
});

// Export Schema
const exportSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one control must be selected"),
  format: z.enum(["json", "csv"]),
});

// --- Helper Functions ---

// Normalize values for insertion into JSONB columns
const normalizeJsonForInsert = (value: any): string => {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
};

// Generate a snapshot of the control
const createSnapshot = async (client: any, controlId: string, userId: string, statusFrom: string | null, statusTo: string, note?: string) => {
  // Fetch current control data
  const res = await client.query("SELECT * FROM crc_controls WHERE id = $1", [controlId]);
  const control = res.rows[0];

  if (!control) return;

  // Insert into versions table
  await client.query(
    `INSERT INTO crc_control_versions 
     (control_id, version, snapshot, status_from, status_to, changed_by, change_note)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      controlId,
      control.version,
      JSON.stringify(control),
      statusFrom,
      statusTo,
      userId,
      note || null
    ]
  );
};

// --- Routes ---

// GET /crc/controls - List all controls with filters
router.get("/controls", authenticateToken, requireRole(["ADMIN"]), async (req, res) => {
  try {
    const { category, priority, status, search } = req.query;
    
    let query = "SELECT * FROM crc_controls WHERE 1=1";
    const params: any[] = [];
    let paramCount = 1;

    if (category) {
      query += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (priority) {
      query += ` AND priority = $${paramCount}`;
      params.push(priority);
      paramCount++;
    }

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (search) {
      query += ` AND (control_title ILIKE $${paramCount} OR control_id ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += " ORDER BY control_id ASC";

    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error("Error fetching controls:", error);
    res.status(500).json({ success: false, error: "Failed to fetch controls" });
  }
});

// GET /crc/controls/:id - Get single control
router.get("/controls/:id", authenticateToken, requireRole(["ADMIN"]), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM crc_controls WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Control not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error fetching control:", error);
    res.status(500).json({ success: false, error: "Failed to fetch control" });
  }
});

// POST /crc/controls - Create new control
router.post("/controls", authenticateToken, requireRole(["ADMIN"]), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const user = (req as any).user;
    const data = controlSchema.parse(req.body);

    // Check unique control_id
    const existing = await client.query("SELECT id FROM crc_controls WHERE control_id = $1", [data.control_id]);
    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, error: "Control ID must be unique" });
    }

    // Insert control
    const insertQuery = `
      INSERT INTO crc_controls (
        control_id, control_title, category, priority, status, applicable_to,
        control_statement, control_objective, risk_description,
        implementation, evidence_requirements, compliance_mapping, aima_mapping,
        created_by, version
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12::jsonb, $13::jsonb, $14, 1)
      RETURNING *
    `;

    const values = [
      data.control_id, data.control_title, data.category, data.priority, data.status, data.applicable_to,
      data.control_statement, data.control_objective, data.risk_description,
      JSON.stringify(data.implementation), JSON.stringify(data.evidence_requirements),
      JSON.stringify(data.compliance_mapping), JSON.stringify(data.aima_mapping),
      user.id
    ];

    const result = await client.query(insertQuery, values);
    const newControl = result.rows[0];

    // Create initial version snapshot
    await createSnapshot(client, newControl.id, user.id, null, data.status, "Initial creation");

    await client.query("COMMIT");
    
    res.status(201).json({ success: true, data: newControl });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating control:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: "Failed to create control" });
  } finally {
    client.release();
  }
});

// PUT /crc/controls/:id - Update control
router.put("/controls/:id", authenticateToken, requireRole(["ADMIN"]), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const { id } = req.params;
    const user = (req as any).user;
    const data = controlSchema.parse(req.body);

    // Check existence
    const existing = await client.query("SELECT * FROM crc_controls WHERE id = $1 FOR UPDATE", [id]);
    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, error: "Control not found" });
    }

    const currentControl = existing.rows[0];

    // Determine effective status:
    // If request body omitted status, data.status is 'Draft' from default, which might not match DB.
    // So we check if the raw body had it.
    const hasStatus = Object.prototype.hasOwnProperty.call(req.body, 'status');
    const newStatus = hasStatus ? data.status : currentControl.status;

    // Block direct status changes to preserve workflow rules
    if (newStatus !== currentControl.status) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        error: "Use the transition endpoint to change status",
      });
    }

    // Check unique control_id if changed
    if (data.control_id !== currentControl.control_id) {
      const duplicate = await client.query("SELECT id FROM crc_controls WHERE control_id = $1 AND id != $2", [data.control_id, id]);
      if (duplicate.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, error: "Control ID already exists" });
      }
    }

    // Increment version
    const newVersion = currentControl.version + 1;

    // Preserve existing values for omitted fields
    const updatedData = {
      control_id: Object.prototype.hasOwnProperty.call(req.body, 'control_id') ? data.control_id : currentControl.control_id,
      control_title: Object.prototype.hasOwnProperty.call(req.body, 'control_title') ? data.control_title : currentControl.control_title,
      category: Object.prototype.hasOwnProperty.call(req.body, 'category') ? data.category : currentControl.category,
      priority: Object.prototype.hasOwnProperty.call(req.body, 'priority') ? data.priority : currentControl.priority,
      status: newStatus,
      applicable_to: Object.prototype.hasOwnProperty.call(req.body, 'applicable_to') ? data.applicable_to : currentControl.applicable_to,
      control_statement: Object.prototype.hasOwnProperty.call(req.body, 'control_statement') ? data.control_statement : currentControl.control_statement,
      control_objective: Object.prototype.hasOwnProperty.call(req.body, 'control_objective') ? data.control_objective : currentControl.control_objective,
      risk_description: Object.prototype.hasOwnProperty.call(req.body, 'risk_description') ? data.risk_description : currentControl.risk_description,
      implementation: Object.prototype.hasOwnProperty.call(req.body, 'implementation') ? data.implementation : currentControl.implementation,
      evidence_requirements: Object.prototype.hasOwnProperty.call(req.body, 'evidence_requirements') ? data.evidence_requirements : currentControl.evidence_requirements,
      compliance_mapping: Object.prototype.hasOwnProperty.call(req.body, 'compliance_mapping') ? data.compliance_mapping : currentControl.compliance_mapping,
      aima_mapping: Object.prototype.hasOwnProperty.call(req.body, 'aima_mapping') ? data.aima_mapping : currentControl.aima_mapping,
    };

    // Update query
    const updateQuery = `
      UPDATE crc_controls SET
        control_id = $1, control_title = $2, category = $3, priority = $4, status = $5, applicable_to = $6,
        control_statement = $7, control_objective = $8, risk_description = $9,
        implementation = $10::jsonb, evidence_requirements = $11::jsonb, compliance_mapping = $12::jsonb, aima_mapping = $13::jsonb,
        updated_at = CURRENT_TIMESTAMP, version = $14
      WHERE id = $15
      RETURNING *
    `;

    const values = [
      updatedData.control_id, updatedData.control_title, updatedData.category, updatedData.priority, updatedData.status, updatedData.applicable_to,
      updatedData.control_statement, updatedData.control_objective, updatedData.risk_description,
      JSON.stringify(updatedData.implementation), JSON.stringify(updatedData.evidence_requirements),
      JSON.stringify(updatedData.compliance_mapping), JSON.stringify(updatedData.aima_mapping),
      newVersion, id
    ];

    const result = await client.query(updateQuery, values);
    const updatedControl = result.rows[0];

    // Create version snapshot
    await createSnapshot(client, id, user.id, currentControl.status, currentControl.status, "Update control details");

    await client.query("COMMIT");

    res.json({ success: true, data: updatedControl });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating control:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: "Failed to update control" });
  } finally {
    client.release();
  }
});

// DELETE /crc/controls/:id - Delete control
router.delete("/controls/:id", authenticateToken, requireRole(["ADMIN"]), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM crc_controls WHERE id = $1 RETURNING id", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: "Control not found" });
    }

    res.json({ success: true, message: "Control deleted successfully" });
  } catch (error) {
    console.error("Error deleting control:", error);
    res.status(500).json({ success: false, error: "Failed to delete control" });
  }
});

// POST /crc/controls/:id/clone - Clone control
router.post("/controls/:id/clone", authenticateToken, requireRole(["ADMIN"]), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const { id } = req.params;
    const user = (req as any).user;

    // Fetch source control
    const sourceRes = await client.query("SELECT * FROM crc_controls WHERE id = $1", [id]);
    if (sourceRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, error: "Source control not found" });
    }
    const source = sourceRes.rows[0];

    // Generate new control ID
    const MAX_CLONE_ATTEMPTS = 1000;
    let suffix = 1;
    let newControlId = `${source.control_id}-CLONE-${suffix}`;
    while (true) {
      const check = await client.query("SELECT id FROM crc_controls WHERE control_id = $1", [newControlId]);
      if (check.rows.length === 0) break;
      suffix++;
      if (suffix > MAX_CLONE_ATTEMPTS) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, error: "Too many clones, could not generate unique ID" });
      }
      newControlId = `${source.control_id}-CLONE-${suffix}`;
    }

    // Insert cloned control
    const insertQuery = `
      INSERT INTO crc_controls (
        control_id, control_title, category, priority, status, applicable_to,
        control_statement, control_objective, risk_description,
        implementation, evidence_requirements, compliance_mapping, aima_mapping,
        created_by, version
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12::jsonb, $13::jsonb, $14, $15)
      RETURNING *
    `;

    const values = [
      newControlId, `${source.control_title} (Clone)`, source.category, source.priority, "Draft", source.applicable_to,
      source.control_statement, source.control_objective, source.risk_description,
      normalizeJsonForInsert(source.implementation), 
      normalizeJsonForInsert(source.evidence_requirements), 
      normalizeJsonForInsert(source.compliance_mapping), 
      normalizeJsonForInsert(source.aima_mapping),
      user.id, 1
    ];

    // Insert cloned control
    const result = await client.query(insertQuery, values);
    const newControl = result.rows[0];

    // Snapshot for clone
    await createSnapshot(client, newControl.id, user.id, null, "Draft", `Cloned from ${source.control_id}`);

    await client.query("COMMIT");
    
    res.status(201).json({ success: true, data: newControl });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error cloning control:", error);
    res.status(500).json({ success: false, error: "Failed to clone control" });
  } finally {
    client.release();
  }
});

// POST /crc/controls/:id/transition - Workflow validation
router.post("/controls/:id/transition", authenticateToken, requireRole(["ADMIN"]), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const { id } = req.params;
    const user = (req as any).user;
    const { status, note } = transitionSchema.parse(req.body);

    const existing = await client.query("SELECT * FROM crc_controls WHERE id = $1 FOR UPDATE", [id]);
    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, error: "Control not found" });
    }

    const currentControl = existing.rows[0];
    const currentStatus = currentControl.status;

    // Validate transitions
    let isValid = false;
    if (currentStatus === "Draft" && status === "In Review") isValid = true;
    if (currentStatus === "In Review" && (status === "Published" || status === "Draft")) isValid = true;
    
    // Transitions Published -> Draft and Archived -> Draft are intentional business rules
    // to permit quick reactivation/edits for existing controls. 
    // Snapshots preserve the audit history of previous versions.
    if (currentStatus === "Published" && (status === "Archived" || status === "Draft")) isValid = true;
    if (currentStatus === "Archived" && status === "Draft") isValid = true;
    
    // Allow staying in same status (e.g. just updating note/version)
    if (currentStatus === status) isValid = true;

    if (!isValid) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, error: `Invalid transition from ${currentStatus} to ${status}` });
    }

    const newVersion = currentControl.version + 1;

    // Update status and version
    const updateQuery = `
      UPDATE crc_controls 
      SET status = $1, version = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;

    const result = await client.query(updateQuery, [status, newVersion, id]);
    const updatedControl = result.rows[0];

    // Create snapshot
    await createSnapshot(client, id, user.id, currentStatus, status, note || `Status transition`);

    await client.query("COMMIT");

    res.json({ success: true, data: updatedControl });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error transitioning control:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: "Failed to transition control" });
  } finally {
    client.release();
  }
});

// GET /crc/controls/:id/versions - Get version history
router.get("/controls/:id/versions", authenticateToken, requireRole(["ADMIN"]), async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT v.*, u.name as changed_by_name
      FROM crc_control_versions v
      LEFT JOIN users u ON v.changed_by = u.id
      WHERE v.control_id = $1
      ORDER BY v.version DESC
    `;

    const result = await pool.query(query, [id]);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching versions:", error);
    res.status(500).json({ success: false, error: "Failed to fetch version history" });
  }
});

// POST /crc/controls/export - Export controls
router.post("/controls/export", authenticateToken, requireRole(["ADMIN"]), async (req, res) => {
  try {
    const { ids, format } = exportSchema.parse(req.body);

    const query = `SELECT * FROM crc_controls WHERE id = ANY($1)`;
    const result = await pool.query(query, [ids]);
    const controls = result.rows;

    if (format === "json") {
      res.header("Content-Type", "application/json");
      res.attachment("crc_controls_export.json");
      return res.send(JSON.stringify(controls, null, 2));
    }

    if (format === "csv") {
      // Basic CSV flattening
      const headers = ["control_id", "control_title", "category", "priority", "status", "version", "created_at"];
      const rows = controls.map((c: any) => headers.map(h => JSON.stringify(c[h] ?? "")).join(","));
      const csv = [headers.join(","), ...rows].join("\n");
      
      res.header("Content-Type", "text/csv");
      res.attachment("crc_controls_export.csv");
      return res.send(csv);
    }
    
    res.status(400).json({ success: false, error: "Invalid format" });
  } catch (error) {
    console.error("Error exporting controls:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: "Failed to export controls" });
  }
});

// GET /crc/public/controls - Get all published CRC controls for users
router.get("/public/controls", authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT id, control_id, control_title, category, priority, status, version,
             applicable_to, control_statement, control_objective, risk_description,
             implementation, evidence_requirements, compliance_mapping, aima_mapping,
             created_at, updated_at
      FROM crc_controls
      WHERE status = 'Published'
      ORDER BY category, control_id ASC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error("Error fetching published controls:", error);
    res.status(500).json({ success: false, error: "Failed to fetch controls" });
  }
});

// --- User CRC Assessment Endpoints ---

const crcResponseSchema = z.object({
  controlId: z.string().uuid(),
  value: z.union([z.literal(0), z.literal(0.5), z.literal(1)]),
  notes: z.string().max(5000).optional().default(""),
});

// POST /crc/assess/:projectId - Save CRC assessment response
router.post("/assess/:projectId", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;
    const data = crcResponseSchema.parse(req.body);

    // Verify project belongs to user
    const projectCheck = await pool.query(
      "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
      [projectId, userId]
    );
    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ success: false, error: "Project not found or access denied" });
    }

    // Verify control exists and is published
    const controlCheck = await pool.query(
      "SELECT id FROM crc_controls WHERE id = $1 AND status = 'Published'",
      [data.controlId]
    );
    if (controlCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Control not found or not published" });
    }

    // Upsert response
    const result = await pool.query(
      `INSERT INTO crc_assessment_responses (project_id, control_id, user_id, value, notes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (project_id, control_id, user_id)
       DO UPDATE SET value = $4, notes = $5, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [projectId, data.controlId, userId, data.value, data.notes]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error saving CRC response:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: "Failed to save response" });
  }
});

// GET /crc/assess/:projectId - Get all CRC responses for a project
router.get("/assess/:projectId", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;

    // Verify project belongs to user
    const projectCheck = await pool.query(
      "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
      [projectId, userId]
    );
    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ success: false, error: "Project not found or access denied" });
    }

    const result = await pool.query(
      `SELECT control_id, value, notes, updated_at
       FROM crc_assessment_responses
       WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    // Build a map: controlId -> { value, notes }
    const responses: Record<string, { value: number; notes: string; updatedAt: string }> = {};
    result.rows.forEach((row: any) => {
      responses[row.control_id] = {
        value: parseFloat(row.value),
        notes: row.notes || "",
        updatedAt: row.updated_at,
      };
    });

    res.json({ success: true, responses, count: result.rowCount });
  } catch (error) {
    console.error("Error fetching CRC responses:", error);
    res.status(500).json({ success: false, error: "Failed to fetch responses" });
  }
});

export default router;
