import { Router } from "express";
import pool from "../config/database";
import { z } from "zod";
import { authenticateToken, requireRole } from "../middleware/auth";
import { getMembership } from "../services/projectMembershipService";
import { computeCrcResults, isCrcAssessmentComplete } from "../utils/crcScoring";
import { generateFullPdfData, generateSummaryPdfData } from "../services/pdfExportService";
import { recordEvent } from "../services/auditLogService";
import fs from "fs";
import path from "path";
import multer from "multer";
import AdmZip from "adm-zip";
import { syncRiskFromResponse } from "../services/crcRiskService";
import crypto from "crypto";
import { inngest } from "../inngest/client";
import { UTApi } from "uploadthing/server";

const router = Router();

const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN });

// --- Multer configuration for template uploads ---
const TEMPLATES_DIR = path.join(__dirname, "../../static/templates");

/**
 * Helper to securely resolve a template path against TEMPLATES_DIR
 * and verify that no path-traversal is possible.
 */
function resolveTemplatePath(controlShortId: string, ext: ".docx" | ".doc"): string {
  const whitelist = /^[A-Za-z0-9_-]+$/;
  if (!whitelist.test(controlShortId)) {
    throw new Error("Invalid control ID format");
  }
  const resolved = path.resolve(TEMPLATES_DIR, `${controlShortId}${ext}`);
  if (!resolved.startsWith(TEMPLATES_DIR)) {
    throw new Error("Directory traversal attempt detected");
  }
  return resolved;
}

function sanitizeDownloadFilename(controlTitle: string, ext: string): string {
  const sanitizedTitle = controlTitle.replace(/[\\/:*?"<>|]/g, "_").trim();
  return encodeURIComponent(`${sanitizedTitle}${ext}`);
}

const templateStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Ensure the templates directory exists
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
    cb(null, TEMPLATES_DIR);
  },
  filename: (req, _file, cb) => {
    // Will be renamed after validation; use a temp name with crypto to avoid collisions
    const uuid = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");
    cb(null, `upload_${Date.now()}_${uuid}.tmp`);
  },
});

const templateUpload = multer({
  storage: templateStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/msword", // .doc
    ];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith(".docx") || file.originalname.endsWith(".doc")) {
      cb(null, true);
    } else {
      cb(new Error("Only .doc and .docx files are allowed"));
    }
  },
});

const bulkTemplateUpload = multer({
  storage: templateStorage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max per file
    files: 160, // Max 160 files per request
  },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/msword", // .doc
      "application/zip", // .zip
      "application/x-zip-compressed", // .zip (Windows/some systems)
    ];
    if (
      allowed.includes(file.mimetype) ||
      file.originalname.endsWith(".docx") ||
      file.originalname.endsWith(".doc") ||
      file.originalname.endsWith(".zip")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only .doc, .docx, and .zip files are allowed"));
    }
  },
});

// --- Validation Schemas ---

// Common reusable schemas
const implementationSchema = z.object({
  requirements: z.array(z.string()).optional().default([]),
  steps: z.array(z.string()).optional().default([]),
  // Note: timeline is now stored as a top-level column expected_timeline
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
  control_id: z.preprocess((val) => (typeof val === "string" ? val.trim() : val),
    z.string().min(1, "Control ID is required").max(20, "Control ID must be 20 chars max")),
  control_title: z.preprocess((val) => (typeof val === "string" ? val.trim() : val),
    z.string().min(1, "Title is required").max(200, "Title must be 200 chars max")),
  category_id: z.number().int().min(1, "Category ID is required"),
  expected_timeline: z.string().optional().default(""),
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
  note: z.preprocess((val) => (typeof val === "string" ? val.trim() : val),
    z.string().optional()),
});

// Export Schema
const exportSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "At least one control must be selected"),
  format: z.enum(["json", "csv"]),
});

// Category Schema
const categoryNameSchema = z.object({
  name: z.preprocess((val) => (typeof val === "string" ? val.trim() : val), 
    z.string().min(1, "Category name is required").max(100, "Category name must be 100 chars max")),
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

// Verify if category_id exists
const validateCategoryId = async (client: any, categoryId: number) => {
  const res = await client.query("SELECT id FROM crc_categories WHERE id = $1", [categoryId]);
  return res.rows.length > 0;
};

// --- Routes ---

// GET /crc/categories - List all categories
router.get("/categories", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM crc_categories ORDER BY name ASC");
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ success: false, error: "Failed to fetch categories" });
  }
});

// POST /crc/categories - Create new category
router.post("/categories", authenticateToken, requireRole(["ADMIN"]), async (req, res) => {
  try {
    const { name } = categoryNameSchema.parse(req.body);
    
    // Check for duplicate name (case-insensitive)
    const existing = await pool.query("SELECT id FROM crc_categories WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))", [name]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: "Category already exists" });
    }

    const result = await pool.query(
      "INSERT INTO crc_categories (name) VALUES ($1) RETURNING *",
      [name.trim()]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error("Error creating category:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    if (error.code === "23505") {
      return res.status(400).json({ success: false, error: "Category already exists" });
    }
    res.status(500).json({ success: false, error: "Failed to create category" });
  }
});

// PUT /crc/categories/:id - Update category name
router.put("/categories/:id", authenticateToken, requireRole(["ADMIN"]), async (req, res) => {
  try {
    const categoryId = Number.parseInt(req.params.id);
    if (!Number.isInteger(categoryId)) {
      return res.status(400).json({ success: false, error: "Invalid category ID" });
    }
    const { name } = categoryNameSchema.parse(req.body);

    // Check for duplicate name (case-insensitive) excluding itself
    const existing = await pool.query(
      "SELECT id FROM crc_categories WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) AND id != $2",
      [name, categoryId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: "Category name already exists" });
    }

    const result = await pool.query(
      "UPDATE crc_categories SET name = $1 WHERE id = $2 RETURNING *",
      [name.trim(), categoryId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: "Category not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error("Error updating category:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    if (error.code === "23505") {
      return res.status(400).json({ success: false, error: "Category name already exists" });
    }
    res.status(500).json({ success: false, error: "Failed to update category" });
  }
});

// DELETE /crc/categories/:id - Delete category
router.delete("/categories/:id", authenticateToken, requireRole(["ADMIN"]), async (req, res) => {
  try {
    const categoryId = Number.parseInt(req.params.id);
    if (!Number.isInteger(categoryId)) {
      return res.status(400).json({ success: false, error: "Invalid category ID" });
    }

    // Check if category has associated controls
    const controls = await pool.query("SELECT id FROM crc_controls WHERE category_id = $1 LIMIT 1", [categoryId]);
    if (controls.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete category: It has associated controls. Please move or delete the controls first."
      });
    }

    const result = await pool.query("DELETE FROM crc_categories WHERE id = $1 RETURNING id", [categoryId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: "Category not found" });
    }

    res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ success: false, error: "Failed to delete category" });
  }
});

// GET /crc/controls - List all controls with filters
router.get("/controls", authenticateToken, requireRole(["ADMIN"]), async (req, res) => {
  try {
    const { category_id, priority, status, search } = req.query;
    
    let query = `
      SELECT c.*, cat.name as category_name 
      FROM crc_controls c
      LEFT JOIN crc_categories cat ON c.category_id = cat.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (category_id) {
      query += ` AND c.category_id = $${paramCount}`;
      params.push(category_id);
      paramCount++;
    }

    if (priority) {
      query += ` AND c.priority = $${paramCount}`;
      params.push(priority);
      paramCount++;
    }

    if (status) {
      query += ` AND c.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (search) {
      query += ` AND (c.control_title ILIKE $${paramCount} OR c.control_id ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += " ORDER BY c.control_id ASC";

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
    const result = await pool.query(`
      SELECT c.*, cat.name as category_name 
      FROM crc_controls c
      LEFT JOIN crc_categories cat ON c.category_id = cat.id
      WHERE c.id = $1
    `, [id]);

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

    // Check category_id exists
    if (!(await validateCategoryId(client, data.category_id))) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, error: "Invalid category_id: Category does not exist" });
    }

    // Insert control
    const insertQuery = `
      INSERT INTO crc_controls (
        control_id, control_title, category_id, expected_timeline, priority, status, applicable_to,
        control_statement, control_objective, risk_description,
        implementation, evidence_requirements, compliance_mapping, aima_mapping,
        created_by, version
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13::jsonb, $14::jsonb, $15, 1)
      RETURNING *
    `;

    const values = [
      data.control_id, data.control_title, data.category_id, data.expected_timeline, data.priority, data.status, data.applicable_to,
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

// POST /crc/controls/bulk - Bulk create controls (all-or-nothing / upsert compatible)
router.post("/controls/bulk", authenticateToken, requireRole(["ADMIN"]), async (req, res) => {
  const client = await pool.connect();
  try {
    const raw = req.body;
    const overwrite = raw.overwrite === true;

    if (!Array.isArray(raw.controls)) {
      return res.status(400).json({ success: false, errors: [{ index: -1, message: "Request body must include a 'controls' array" }] });
    }
    if (raw.controls.length === 0) {
      return res.status(400).json({ success: false, errors: [{ index: -1, message: "Request body must include at least one control" }] });
    }
    const MAX_BATCH_SIZE = 500;
    if (raw.controls.length > MAX_BATCH_SIZE) {
      return res.status(400).json({ success: false, errors: [{ index: -1, message: `Batch size cannot exceed ${MAX_BATCH_SIZE} controls` }] });
    }

    const errors: { index: number; control_id?: string; message: string }[] = [];
    const parsedWithIndex: { data: z.infer<typeof controlSchema>; rawItem: any; originalIndex: number }[] = [];

    for (let i = 0; i < raw.controls.length; i++) {
      const item = raw.controls[i];
      const stripped = { ...item };
      delete stripped.id;
      delete stripped.created_at;
      delete stripped.updated_at;
      delete stripped.version;
      delete stripped.created_by;

      const result = controlSchema.safeParse(stripped);
      if (!result.success) {
        const first = result.error.errors[0];
        errors.push({ index: i, control_id: item?.control_id, message: first?.message || "Validation failed" });
        continue;
      }
      parsedWithIndex.push({ data: result.data, rawItem: item, originalIndex: i });
    }

    const idToIndices = new Map<string, number[]>();
    for (const { data, originalIndex } of parsedWithIndex) {
      const list = idToIndices.get(data.control_id) ?? [];
      list.push(originalIndex);
      idToIndices.set(data.control_id, list);
    }
    for (const [controlId, indices] of idToIndices) {
      if (indices.length > 1) {
        for (const idx of indices) {
          errors.push({ index: idx, control_id: controlId, message: "Control ID must be unique in this batch" });
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // Check all unique category_ids in the batch
    const uniqueCategoryIds = Array.from(new Set(parsedWithIndex.map(p => p.data.category_id)));
    const catCheck = await client.query("SELECT id FROM crc_categories WHERE id = ANY($1)", [uniqueCategoryIds]);
    const validCategoryIds = new Set(catCheck.rows.map((r: { id: number }) => r.id));
    
    for (const { data, originalIndex } of parsedWithIndex) {
      if (!validCategoryIds.has(data.category_id)) {
        errors.push({ index: originalIndex, control_id: data.control_id, message: `Invalid category_id: ${data.category_id}` });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    await client.query("BEGIN");
    const user = (req as any).user;

    const controlIds = parsedWithIndex.map((p) => p.data.control_id);
    const existingIds = await client.query(
      "SELECT * FROM crc_controls WHERE control_id = ANY($1) FOR UPDATE",
      [controlIds]
    );
    const existingMap = new Map<string, any>(
      existingIds.rows.map((r: any) => [r.control_id, r])
    );

    if (!overwrite) {
      for (const { data, originalIndex } of parsedWithIndex) {
        if (existingMap.has(data.control_id)) {
          errors.push({ index: originalIndex, control_id: data.control_id, message: "Control ID already exists" });
        }
      }
    }

    if (errors.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, errors });
    }

    const toInsert: typeof parsedWithIndex = [];
    const toUpdate: typeof parsedWithIndex = [];

    for (const item of parsedWithIndex) {
      if (existingMap.has(item.data.control_id)) {
        toUpdate.push(item);
      } else {
        toInsert.push(item);
      }
    }

    const processed: any[] = [];

    // 1. Process inserts
    if (toInsert.length > 0) {
      const cols = 15;
      const placeholders = toInsert.map((_, rowIdx) => {
        const start = rowIdx * cols + 1;
        return `($${start}, $${start + 1}, $${start + 2}, $${start + 3}, $${start + 4}, $${start + 5}, $${start + 6}, $${start + 7}, $${start + 8}, $${start + 9}, $${start + 10}::jsonb, $${start + 11}::jsonb, $${start + 12}::jsonb, $${start + 13}::jsonb, $${start + 14}, 1)`;
      }).join(", ");
      const batchInsertQuery = `
        INSERT INTO crc_controls (
          control_id, control_title, category_id, expected_timeline, priority, status, applicable_to,
          control_statement, control_objective, risk_description,
          implementation, evidence_requirements, compliance_mapping, aima_mapping,
          created_by, version
        )
        VALUES ${placeholders}
        RETURNING *
      `;
      const values: any[] = [];
      for (const { data } of toInsert) {
        values.push(
          data.control_id, data.control_title, data.category_id, data.expected_timeline, data.priority, data.status, data.applicable_to,
          data.control_statement, data.control_objective, data.risk_description,
          JSON.stringify(data.implementation), JSON.stringify(data.evidence_requirements),
          JSON.stringify(data.compliance_mapping), JSON.stringify(data.aima_mapping),
          user.id
        );
      }
      const result = await client.query(batchInsertQuery, values);
      const createdRows = result.rows;
      processed.push(...createdRows);

      if (createdRows.length > 0) {
        const snapshotCols = 7;
        const snapshotPlaceholders = createdRows.map((_: any, i: number) => {
          const base = i * snapshotCols + 1;
          return `($${base}, $${base + 1}, $${base + 2}::jsonb, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
        }).join(", ");
        const snapshotValues: any[] = [];
        for (const ctrl of createdRows) {
          snapshotValues.push(ctrl.id, ctrl.version, JSON.stringify(ctrl), null, ctrl.status, user.id, "Initial creation");
        }
        await client.query(
          `INSERT INTO crc_control_versions (control_id, version, snapshot, status_from, status_to, changed_by, change_note)
           VALUES ${snapshotPlaceholders}`,
          snapshotValues
        );
      }
    }

    // 2. Process updates (overwrites)
    if (toUpdate.length > 0) {
      for (const { data, rawItem } of toUpdate) {
        const existing = existingMap.get(data.control_id)!;
        const newVersion = existing.version + 1;
        
        // Preserve existing status to respect single update flow status transition restrictions
        const status = existing.status;

        let implementation = existing.implementation;
        if (Object.prototype.hasOwnProperty.call(rawItem, 'implementation') && rawItem.implementation && typeof rawItem.implementation === 'object') {
          const merged = { ...existing.implementation };
          for (const key of Object.keys(rawItem.implementation)) {
            if (data.implementation && Object.prototype.hasOwnProperty.call(data.implementation, key)) {
              merged[key] = (data.implementation as any)[key];
            }
          }
          implementation = merged;
        }

        let compliance_mapping = existing.compliance_mapping;
        if (Object.prototype.hasOwnProperty.call(rawItem, 'compliance_mapping') && rawItem.compliance_mapping && typeof rawItem.compliance_mapping === 'object') {
          const merged = { ...existing.compliance_mapping };
          for (const key of Object.keys(rawItem.compliance_mapping)) {
            if (data.compliance_mapping && Object.prototype.hasOwnProperty.call(data.compliance_mapping, key)) {
              merged[key] = (data.compliance_mapping as any)[key];
            }
          }
          compliance_mapping = merged;
        }

        let aima_mapping = existing.aima_mapping;
        if (Object.prototype.hasOwnProperty.call(rawItem, 'aima_mapping') && rawItem.aima_mapping && typeof rawItem.aima_mapping === 'object') {
          const merged = { ...existing.aima_mapping };
          for (const key of Object.keys(rawItem.aima_mapping)) {
            if (data.aima_mapping && Object.prototype.hasOwnProperty.call(data.aima_mapping, key)) {
              merged[key] = (data.aima_mapping as any)[key];
            }
          }
          aima_mapping = merged;
        }

        // Fall back to existing values for fields the UI/payload did not send (matching single PUT behavior)
        const updatedData = {
          control_title: Object.prototype.hasOwnProperty.call(rawItem, 'control_title') ? data.control_title : existing.control_title,
          category_id: Object.prototype.hasOwnProperty.call(rawItem, 'category_id') ? data.category_id : existing.category_id,
          expected_timeline: Object.prototype.hasOwnProperty.call(rawItem, 'expected_timeline') ? data.expected_timeline : existing.expected_timeline,
          priority: Object.prototype.hasOwnProperty.call(rawItem, 'priority') ? data.priority : existing.priority,
          applicable_to: Object.prototype.hasOwnProperty.call(rawItem, 'applicable_to') ? data.applicable_to : existing.applicable_to,
          control_statement: Object.prototype.hasOwnProperty.call(rawItem, 'control_statement') ? data.control_statement : existing.control_statement,
          control_objective: Object.prototype.hasOwnProperty.call(rawItem, 'control_objective') ? data.control_objective : existing.control_objective,
          risk_description: Object.prototype.hasOwnProperty.call(rawItem, 'risk_description') ? data.risk_description : existing.risk_description,
          implementation,
          evidence_requirements: Object.prototype.hasOwnProperty.call(rawItem, 'evidence_requirements') ? data.evidence_requirements : existing.evidence_requirements,
          compliance_mapping,
          aima_mapping,
        };

        const updateQuery = `
          UPDATE crc_controls SET
            control_title = $1, category_id = $2, expected_timeline = $3, priority = $4, status = $5, applicable_to = $6,
            control_statement = $7, control_objective = $8, risk_description = $9,
            implementation = $10::jsonb, evidence_requirements = $11::jsonb, compliance_mapping = $12::jsonb, aima_mapping = $13::jsonb,
            updated_at = CURRENT_TIMESTAMP, version = $14
          WHERE id = $15
          RETURNING *
        `;
        const values = [
          updatedData.control_title, updatedData.category_id, updatedData.expected_timeline, updatedData.priority, status, updatedData.applicable_to,
          updatedData.control_statement, updatedData.control_objective, updatedData.risk_description,
          JSON.stringify(updatedData.implementation), JSON.stringify(updatedData.evidence_requirements),
          JSON.stringify(updatedData.compliance_mapping), JSON.stringify(updatedData.aima_mapping),
          newVersion, existing.id
        ];
        const result = await client.query(updateQuery, values);
        const updatedRow = result.rows[0];
        processed.push(updatedRow);

        // Record a new version history snapshot
        await client.query(
          `INSERT INTO crc_control_versions (control_id, version, snapshot, status_from, status_to, changed_by, change_note)
           VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7)`,
          [existing.id, newVersion, JSON.stringify(updatedRow), existing.status, status, user.id, "Bulk import overwrite"]
        );
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ success: true, data: processed });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error bulk creating controls:", error);
    res.status(500).json({ success: false, error: "Failed to create controls" });
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

    // Check category_id exists if changed
    if (data.category_id !== currentControl.category_id) {
      if (!(await validateCategoryId(client, data.category_id))) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, error: "Invalid category_id: Category does not exist" });
      }
    }

    // Increment version
    const newVersion = currentControl.version + 1;

    // Preserve existing values for omitted fields
    const updatedData = {
      control_id: Object.prototype.hasOwnProperty.call(req.body, 'control_id') ? data.control_id : currentControl.control_id,
      control_title: Object.prototype.hasOwnProperty.call(req.body, 'control_title') ? data.control_title : currentControl.control_title,
      category_id: Object.prototype.hasOwnProperty.call(req.body, 'category_id') ? data.category_id : currentControl.category_id,
      expected_timeline: Object.prototype.hasOwnProperty.call(req.body, 'expected_timeline') ? data.expected_timeline : currentControl.expected_timeline,
      priority: Object.prototype.hasOwnProperty.call(req.body, 'priority') ? data.priority : currentControl.priority,
      status: newStatus,
      applicable_to: Object.prototype.hasOwnProperty.call(req.body, 'applicable_to') ? data.applicable_to : currentControl.applicable_to,
      control_statement: Object.prototype.hasOwnProperty.call(req.body, 'control_statement') ? data.control_statement : currentControl.control_statement,
      control_objective: Object.prototype.hasOwnProperty.call(req.body, 'control_objective') ? data.control_objective : currentControl.control_objective,
      risk_description: Object.prototype.hasOwnProperty.call(req.body, 'risk_description') ? data.risk_description : currentControl.risk_description,
      implementation: Object.prototype.hasOwnProperty.call(req.body, 'implementation') 
        ? { ...currentControl.implementation, ...req.body.implementation } 
        : currentControl.implementation,
      evidence_requirements: Object.prototype.hasOwnProperty.call(req.body, 'evidence_requirements') ? data.evidence_requirements : currentControl.evidence_requirements,
      compliance_mapping: Object.prototype.hasOwnProperty.call(req.body, 'compliance_mapping') 
        ? { ...currentControl.compliance_mapping, ...req.body.compliance_mapping } 
        : currentControl.compliance_mapping,
      aima_mapping: Object.prototype.hasOwnProperty.call(req.body, 'aima_mapping') 
        ? { ...currentControl.aima_mapping, ...req.body.aima_mapping } 
        : currentControl.aima_mapping,
    };

    // Update query
    const updateQuery = `
      UPDATE crc_controls SET
        control_id = $1, control_title = $2, category_id = $3, expected_timeline = $4, priority = $5, status = $6, applicable_to = $7,
        control_statement = $8, control_objective = $9, risk_description = $10,
        implementation = $11::jsonb, evidence_requirements = $12::jsonb, compliance_mapping = $13::jsonb, aima_mapping = $14::jsonb,
        updated_at = CURRENT_TIMESTAMP, version = $15
      WHERE id = $16
      RETURNING *
    `;

    const values = [
      updatedData.control_id, updatedData.control_title, updatedData.category_id, updatedData.expected_timeline, updatedData.priority, updatedData.status, updatedData.applicable_to,
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

// DELETE /crc/controls/bulk - Bulk delete controls
router.delete("/controls/bulk", authenticateToken, requireRole(["ADMIN"]), async (req, res) => {
  try {
    const MAX_BATCH_SIZE = 500;
    const { ids } = z.object({ 
      ids: z.array(z.string().uuid()).min(1).max(MAX_BATCH_SIZE) 
    }).parse(req.body);

    const result = await pool.query(
      "DELETE FROM crc_controls WHERE id = ANY($1) RETURNING id",
      [ids]
    );

    res.json({
      success: true,
      message: `${result.rowCount} controls deleted successfully`,
      deletedCount: result.rowCount
    });
  } catch (error) {
    console.error("Error bulk deleting controls:", error);
    if (error instanceof z.ZodError) {
      const isTooLarge = error.errors.some(e => e.code === "too_big");
      return res.status(400).json({ 
        success: false, 
        error: isTooLarge ? "Batch size cannot exceed 500 controls" : "Invalid control IDs" 
      });
    }
    res.status(500).json({ success: false, error: "Failed to bulk delete controls" });
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
        control_id, control_title, category_id, expected_timeline, priority, status, applicable_to,
        control_statement, control_objective, risk_description,
        implementation, evidence_requirements, compliance_mapping, aima_mapping,
        created_by, version
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13::jsonb, $14::jsonb, $15, $16)
      RETURNING *
    `;

    const values = [
      newControlId, `${source.control_title} (Clone)`, source.category_id, source.expected_timeline, source.priority, "Draft", source.applicable_to,
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
      const headers = ["control_id", "control_title", "category_id", "priority", "status", "version", "created_at"];
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
      SELECT c.id, c.control_id, c.control_title, cat.name as category_name, c.category_id,
             c.priority, c.status, c.version, c.expected_timeline,
             c.applicable_to, c.control_statement, c.control_objective, c.risk_description,
             c.implementation, c.evidence_requirements, c.compliance_mapping, c.aima_mapping,
             c.existing_certification_relevance,
             c.created_at, c.updated_at
      FROM crc_controls c
      LEFT JOIN crc_categories cat ON c.category_id = cat.id
      WHERE c.status = 'Published'
      ORDER BY cat.name, c.control_id ASC
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

const BLOCKED_DOMAINS = [
  'google.com', 'example.com', 'example.org', 'example.net',
  'localhost', '127.0.0.1', '0.0.0.0', 'test.com', 'foo.com', 'bar.com',
  'facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'youtube.com',
  'linkedin.com', 'reddit.com', 'amazon.com'
];

const VALID_EVIDENCE_DOMAINS = [
  'docs.google.com', 'drive.google.com',
  'sharepoint.com', 'onedrive.live.com', 'office.com', 'office365.com',
  'notion.so', 'notion.site',
  'atlassian.net', 'confluence.atlassian.net',
  'github.com', 'gitlab.com',
  'dropbox.com', 'box.com'
];

const VALID_DOCUMENT_EXTENSIONS = [
  '.pdf', '.docx', '.doc', '.xlsx', '.xls', '.csv', '.txt', '.png', '.jpg', '.jpeg'
];

export function validateEvidenceUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { valid: false, error: 'Evidence URL is required.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return { valid: false, error: 'Invalid URL format. Please enter a complete HTTPS URL.' };
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'Evidence URL must use secure HTTPS protocol.' };
  }

  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();
  const hasPath = pathname !== '/' && pathname.trim().length > 1;

  // Evaluate recognized evidence platforms first
  if (VALID_EVIDENCE_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`))) {
    if (!hasPath) {
      return { 
        valid: false, 
        error: 'Please provide a direct link to the specific evidence artifact rather than a home page.' 
      };
    }
    return { valid: true };
  }

  // Rejection check for blocked root domains
  if (BLOCKED_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`))) {
    return { 
      valid: false, 
      error: 'This URL appears to be a generic domain rather than a specific evidence document. Please provide a link to your compliance artifact (e.g. Google Doc, PDF, Word doc, SharePoint, or Notion page).' 
    };
  }

  // Accepted if pathname ends with a supported document extension
  if (VALID_DOCUMENT_EXTENSIONS.some(ext => pathname.endsWith(ext))) {
    return { valid: true };
  }

  // If path contains document-like subpaths (e.g. /documents/, /files/, /pdf/, /evidence/)
  if (/\/(document|documents|file|files|evidence|report|reports|pdf|view|share|d|s)\//i.test(pathname)) {
    return { valid: true };
  }

  return { 
    valid: false, 
    error: 'Evidence URL must point to a recognized document source (e.g., Google Doc, PDF, Word doc, SharePoint, Notion, GitHub, or direct file download).' 
  };
}

const crcResponseSchema = z.object({
  controlId: z.string().uuid(),
  value: z.union([z.literal(0), z.literal(0.5), z.literal(1), z.literal(2), z.literal(3)]),
  notes: z.string().max(5000).optional().default(""),
  evidenceStatus: z.enum(["No Evidence", "Template Downloaded", "Evidence in Progress", "Evidence Complete"]).optional(),
  evidenceUrl: z.string().max(2048).optional().nullable(),
  auditReady: z.boolean().optional(),
});

// POST /crc/assess/:projectId - Save CRC assessment response
router.post("/assess/:projectId", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;
    const data = crcResponseSchema.parse(req.body);

    // Verify user is a member of the project with write access
    const membership = await getMembership(projectId, userId);
    if (!membership) {
      return res
        .status(403)
        .json({ success: false, error: "Project not found or access denied" });
    }
    if (!["OWNER", "EDITOR"].includes(membership.role)) {
      return res
        .status(403)
        .json({ success: false, error: "Insufficient project role" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Verify control exists and is published
      const controlCheck = await client.query(
        "SELECT id FROM crc_controls WHERE id = $1 AND status = 'Published'",
        [data.controlId]
      );
      if (controlCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ success: false, error: "Control not found or not published" });
      }

      // Fetch existing response to handle partial updates or merge fields
      const currentResponseQuery = await client.query(
        `SELECT evidence_status, evidence_url, audit_ready 
         FROM crc_assessment_responses 
         WHERE project_id = $1 AND control_id = $2
         FOR UPDATE`,
        [projectId, data.controlId]
      );
      const existing = currentResponseQuery.rows[0];

      let currentStatus = data.evidenceStatus !== undefined ? data.evidenceStatus : (existing ? existing.evidence_status : 'No Evidence');
      
      let inputUrl = data.evidenceUrl;
      if (inputUrl === "") {
        inputUrl = null;
      }
      let currentUrl = inputUrl !== undefined ? inputUrl : (existing ? existing.evidence_url : null);
      let currentAuditReady = data.auditReady !== undefined ? data.auditReady : (existing ? existing.audit_ready : false);

      // Force reset evidence tracker fields if answer is Not Applicable (NA = 2)
      if (data.value === 2) {
        currentStatus = 'No Evidence';
        currentUrl = null;
        currentAuditReady = false;
      }

      // Validate evidence fields
      if (currentStatus === 'Evidence Complete') {
        if (!currentUrl) {
          await client.query("ROLLBACK");
          return res.status(400).json({ 
            success: false, 
            error: "A valid evidence URL is required to set Evidence Status to 'Evidence Complete'." 
          });
        }
        const validation = validateEvidenceUrl(currentUrl);
        if (!validation.valid) {
          await client.query("ROLLBACK");
          return res.status(400).json({ success: false, error: validation.error });
        }
      } else if (currentUrl) {
        const validation = validateEvidenceUrl(currentUrl);
        if (!validation.valid) {
          await client.query("ROLLBACK");
          return res.status(400).json({ success: false, error: validation.error });
        }
      }

      if (currentAuditReady && !currentUrl) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          error: "Evidence URL is required when marking as audit ready"
        });
      }

      // Upsert response
      const result = await client.query(
        `INSERT INTO crc_assessment_responses (project_id, control_id, user_id, value, notes, evidence_status, evidence_url, audit_ready)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (project_id, control_id)
         DO UPDATE SET value = $4, notes = $5, user_id = $3, evidence_status = $6, evidence_url = $7, audit_ready = $8, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [projectId, data.controlId, userId, data.value, data.notes, currentStatus, currentUrl, currentAuditReady]
      );

      await client.query("COMMIT");

      // Sync risk row for this control (fire-and-forget; non-blocking)
      syncRiskFromResponse(projectId, data.controlId).catch((err) =>
        console.error("Risk sync failed for control", data.controlId, err)
      );

      const saved = result.rows[0];
      res.json({ 
        success: true, 
        data: {
          id: saved.id,
          projectId: saved.project_id,
          controlId: saved.control_id,
          userId: saved.user_id,
          value: parseFloat(saved.value),
          notes: saved.notes || "",
          evidenceStatus: saved.evidence_status,
          evidenceUrl: saved.evidence_url,
          auditReady: saved.audit_ready,
          createdAt: saved.created_at,
          updatedAt: saved.updated_at
        }
      });
    } catch (txError) {
      await client.query("ROLLBACK");
      throw txError;
    } finally {
      client.release();
    }
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

    // Verify user is a member of the project
    const membership = await getMembership(projectId, userId);
    if (!membership) {
      return res
        .status(403)
        .json({ success: false, error: "Project not found or access denied" });
    }

    const result = await pool.query(
      `SELECT control_id, value, notes, evidence_status, evidence_url, audit_ready, updated_at
       FROM crc_assessment_responses
       WHERE project_id = $1`,
      [projectId]
    );

    // Build a map: controlId -> { value, notes, evidenceStatus, evidenceUrl, auditReady, updatedAt }
    const responses: Record<string, { 
      value: number; 
      notes: string; 
      evidenceStatus: string; 
      evidenceUrl: string | null; 
      auditReady: boolean; 
      updatedAt: string 
    }> = {};
    result.rows.forEach((row: any) => {
      responses[row.control_id] = {
        value: parseFloat(row.value),
        notes: row.notes || "",
        evidenceStatus: row.evidence_status,
        evidenceUrl: row.evidence_url,
        auditReady: row.audit_ready,
        updatedAt: row.updated_at,
      };
    });

    res.json({ success: true, responses, count: result.rowCount });
  } catch (error) {
    console.error("Error fetching CRC responses:", error);
    res.status(500).json({ success: false, error: "Failed to fetch responses" });
  }
});

// POST /crc/submit/:projectId - Finalize CRC assessment and return scored results
router.post("/submit/:projectId", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;

    const membership = await getMembership(projectId, userId);
    if (!membership) {
      return res.status(403).json({ success: false, error: "Project not found or access denied" });
    }
    if (!["OWNER", "EDITOR"].includes(membership.role)) {
      return res.status(403).json({ success: false, error: "Insufficient project role" });
    }

    const results = await computeCrcResults(projectId);

    if (!isCrcAssessmentComplete(results)) {
      return res.status(400).json({
        success: false,
        error: "Cannot submit: not all controls have been answered.",
        errorCode: "INCOMPLETE_ASSESSMENT",
        progress: {
          answered: results.overall.answeredControls,
          total: results.overall.totalControls,
        },
      });
    }

    await recordEvent({
      projectId,
      actorId: userId,
      action: "crc.submitted",
      objectType: "PROJECT",
      objectId: projectId,
      metadata: {
        overallPercentage: results.overall.percentage,
        totalControls: results.overall.totalControls,
        scoredControls: results.overall.scoredControls,
      },
    });

    res.json({ success: true, results });
  } catch (error) {
    console.error("Error submitting CRC assessment:", error);
    res.status(500).json({ success: false, error: "Failed to submit CRC assessment" });
  }
});

// GET /crc/results/:projectId - Read computed CRC results (recomputed on demand)
router.get("/results/:projectId", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;

    const membership = await getMembership(projectId, userId);
    if (!membership) {
      return res.status(403).json({ success: false, error: "Project not found or access denied" });
    }

    const results = await computeCrcResults(projectId);
    res.json({
      success: true,
      results,
      complete: isCrcAssessmentComplete(results),
    });
  } catch (error) {
    console.error("Error fetching CRC results:", error);
    res.status(500).json({ success: false, error: "Failed to fetch CRC results" });
  }
});

// POST /crc/pdf-data/:projectId/full - Aggregate data + narratives for Full PDF
router.post("/pdf-data/:projectId/full", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;

    // Verify project membership
    const membership = await getMembership(projectId, userId);
    if (!membership) {
      return res.status(403).json({ success: false, error: "Project not found or access denied" });
    }

    // Check for in-flight wizard transactions using advisory lock check
    const client = await pool.connect();
    let locked = false;
    try {
      await client.query("BEGIN");
      const lockCheck = await client.query(
        "SELECT pg_try_advisory_xact_lock(hashtext($1)) as locked",
        [projectId]
      );
      locked = !lockCheck.rows[0]?.locked;
      await client.query("COMMIT");
    } catch (lockError) {
      await client.query("ROLLBACK");
      console.error("Lock check error:", lockError);
    } finally {
      client.release();
    }

    if (locked) {
      return res.status(409).json({
        success: false,
        error: "LOCKED",
        message: "Preparing your dashboard data..."
      });
    }

    const { success, anyFailed, payload } = await generateFullPdfData(projectId);
    
    res.json({
      success,
      anyFailed,
      payload
    });
  } catch (error) {
    console.error("Error generating Full PDF data:", error);
    res.status(500).json({ success: false, error: "Failed to generate Full PDF data" });
  }
});

// POST /crc/pdf-data/:projectId/summary - Aggregate data + narratives for Summary PDF
router.post("/pdf-data/:projectId/summary", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;

    // Verify project membership
    const membership = await getMembership(projectId, userId);
    if (!membership) {
      return res.status(403).json({ success: false, error: "Project not found or access denied" });
    }

    // Check for in-flight wizard transactions using advisory lock check
    const client = await pool.connect();
    let locked = false;
    try {
      await client.query("BEGIN");
      const lockCheck = await client.query(
        "SELECT pg_try_advisory_xact_lock(hashtext($1)) as locked",
        [projectId]
      );
      locked = !lockCheck.rows[0]?.locked;
      await client.query("COMMIT");
    } catch (lockError) {
      await client.query("ROLLBACK");
      console.error("Lock check error:", lockError);
    } finally {
      client.release();
    }

    if (locked) {
      return res.status(409).json({
        success: false,
        error: "LOCKED",
        message: "Preparing your dashboard data..."
      });
    }

    const { success, anyFailed, payload } = await generateSummaryPdfData(projectId);
    
    res.json({
      success,
      anyFailed,
      payload
    });
  } catch (error) {
    console.error("Error generating Summary PDF data:", error);
    res.status(500).json({ success: false, error: "Failed to generate Summary PDF data" });
  }
});


// GET /crc/risks/:projectId/summary - Get risk counts by rating for the dashboard
router.get("/risks/:projectId/summary", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;

    // Verify user is a member of the project
    const membership = await getMembership(projectId, userId);
    if (!membership) {
      return res
        .status(403)
        .json({ success: false, error: "Project not found or access denied" });
    }

    const result = await pool.query(
      `SELECT rating, COUNT(*)::int as count
       FROM crc_risks
       WHERE project_id = $1 AND status = 'Open'
       GROUP BY rating`,
      [projectId]
    );

    const summary = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const row of result.rows) {
      const key = (row.rating as string).toLowerCase() as keyof typeof summary;
      if (key in summary) {
        summary[key] = row.count;
      }
    }

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error("Error fetching risk summary:", error);
    res.status(500).json({ success: false, error: "Failed to fetch risk summary" });
  }
});

// --- Feature 3: Risk Register CRUD Endpoints ---

const targetDateSchema = z.preprocess((val) => {
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed === "" ? null : trimmed;
  }
  return val;
}, z.string().nullable().optional().refine((val) => {
  if (val === null || val === undefined) return true;
  const parsed = Date.parse(val);
  return !isNaN(parsed);
}, {
  message: "Invalid target date format"
}));

const manualRiskSchema = z.object({
  title: z.preprocess((val) => (typeof val === "string" ? val.trim() : val),
    z.string().min(1, "Risk title is required").max(300, "Title must be 300 characters max")),
  category: z.preprocess((val) => (typeof val === "string" ? val.trim() : val),
    z.string().min(1, "Category is required").max(100, "Category must be 100 characters max")),
  rating: z.enum(["Critical", "High", "Medium", "Low"]),
  description: z.string().optional().default(""),
  mitigation_plan: z.string().optional().default(""),
  owner: z.string().max(200).optional().default(""),
  target_date: targetDateSchema,
  review_frequency: z.string().max(50).optional().default("Quarterly"),
});

const updateRiskSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  category: z.string().min(1).max(100).optional(),
  rating: z.enum(["Critical", "High", "Medium", "Low"]).optional(),
  description: z.string().optional(),
  mitigation_plan: z.string().optional(),
  owner: z.string().max(200).optional(),
  target_date: targetDateSchema,
  review_frequency: z.string().max(50).optional(),
  status: z.enum(["Open", "Closed"]).optional(),
});

// GET /crc/risks/:projectId - Fetch all risks for a project
router.get("/risks/:projectId", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;

    // Verify user membership
    const membership = await getMembership(projectId, userId);
    if (!membership) {
      return res.status(403).json({ success: false, error: "Project not found or access denied" });
    }

    const result = await pool.query(
      `SELECT r.*, c.control_id as system_control_id, c.compliance_mapping, c.implementation
       FROM crc_risks r
       LEFT JOIN crc_controls c ON r.control_id = c.id
       WHERE r.project_id = $1
       ORDER BY CASE LOWER(r.rating) WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END, r.created_at DESC`,
      [projectId]
    );

    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error) {
    console.error("Error fetching project risks:", error);
    res.status(500).json({ success: false, error: "Failed to fetch risks" });
  }
});

// POST /crc/risks/:projectId - Create a manual risk
router.post("/risks/:projectId", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;
    const data = manualRiskSchema.parse(req.body);

    // Verify OWNER or EDITOR role
    const membership = await getMembership(projectId, userId);
    if (!membership) {
      return res.status(403).json({ success: false, error: "Project not found or access denied" });
    }
    if (!["OWNER", "EDITOR"].includes(membership.role)) {
      return res.status(403).json({ success: false, error: "Insufficient project role" });
    }

    const targetDate = data.target_date ? new Date(data.target_date) : null;

    const result = await pool.query(
      `INSERT INTO crc_risks (
        project_id, control_id, title, category, rating, status, description,
        mitigation_plan, owner, target_date, review_frequency, source
      )
      VALUES ($1, NULL, $2, $3, $4, 'Open', $5, $6, $7, $8, $9, 'Manual')
      RETURNING *`,
      [
        projectId,
        data.title,
        data.category,
        data.rating,
        data.description,
        data.mitigation_plan,
        data.owner,
        targetDate,
        data.review_frequency
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error creating manual risk:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: "Failed to create manual risk" });
  }
});

// PUT /crc/risks/:projectId/:riskId - Update risk details
router.put("/risks/:projectId/:riskId", authenticateToken, async (req, res) => {
  try {
    const { projectId, riskId } = req.params;
    const userId = (req as any).user.id;
    const data = updateRiskSchema.parse(req.body);

    // Verify OWNER or EDITOR role
    const membership = await getMembership(projectId, userId);
    if (!membership) {
      return res.status(403).json({ success: false, error: "Project not found or access denied" });
    }
    if (!["OWNER", "EDITOR"].includes(membership.role)) {
      return res.status(403).json({ success: false, error: "Insufficient project role" });
    }

    // Check if risk exists
    const riskCheck = await pool.query(
      "SELECT * FROM crc_risks WHERE id = $1 AND project_id = $2",
      [riskId, projectId]
    );
    if (riskCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Risk not found" });
    }

    const currentRisk = riskCheck.rows[0];
    const isManual = currentRisk.source === "Manual";

    // Validate update fields (only allow title/category/rating/description updates on manual risks)
    if (!isManual && (data.title || data.category || data.rating || data.description)) {
      return res.status(400).json({
        success: false,
        error: "System-generated risks cannot have their title, category, rating, or description updated manually. These are controlled by the corresponding assessment answers."
      });
    }

    const title = data.title !== undefined ? data.title : currentRisk.title;
    const category = data.category !== undefined ? data.category : currentRisk.category;
    const rating = data.rating !== undefined ? data.rating : currentRisk.rating;
    const description = data.description !== undefined ? data.description : currentRisk.description;
    
    const mitigationPlan = data.mitigation_plan !== undefined ? data.mitigation_plan : currentRisk.mitigation_plan;
    const owner = data.owner !== undefined ? data.owner : currentRisk.owner;
    const targetDate = data.target_date !== undefined 
      ? (data.target_date ? (data.target_date === null ? null : new Date(data.target_date)) : null) 
      : currentRisk.target_date;
    const reviewFrequency = data.review_frequency !== undefined ? data.review_frequency : currentRisk.review_frequency;
    const status = data.status !== undefined ? data.status : currentRisk.status;

    const result = await pool.query(
      `UPDATE crc_risks SET
        title = $1, category = $2, rating = $3, description = $4,
        mitigation_plan = $5, owner = $6, target_date = $7,
        review_frequency = $8, status = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 AND project_id = $11
       RETURNING *`,
      [
        title,
        category,
        rating,
        description,
        mitigationPlan,
        owner,
        targetDate,
        reviewFrequency,
        status,
        riskId,
        projectId
      ]
    );

    const updatedRisk = result.rows[0];

    // Trigger critical risk alert if transitioning to Critical
    if (updatedRisk.rating === "Critical" && currentRisk.rating !== "Critical") {
      void inngest.send({
        name: "notification/critical-risk.triggered",
        data: { projectId, riskId },
      }).catch((err) => {
        console.error("Failed to emit Inngest critical risk event on PUT:", err);
      });
    }

    res.json({ success: true, data: updatedRisk });
  } catch (error) {
    console.error("Error updating risk:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: "Failed to update risk" });
  }
});

// DELETE /crc/risks/:projectId/:riskId - Delete a manual risk
router.delete("/risks/:projectId/:riskId", authenticateToken, async (req, res) => {
  try {
    const { projectId, riskId } = req.params;
    const userId = (req as any).user.id;

    // Verify OWNER or EDITOR role
    const membership = await getMembership(projectId, userId);
    if (!membership) {
      return res.status(403).json({ success: false, error: "Project not found or access denied" });
    }
    if (!["OWNER", "EDITOR"].includes(membership.role)) {
      return res.status(403).json({ success: false, error: "Insufficient project role" });
    }

    // Fetch risk and confirm source
    const riskCheck = await pool.query(
      "SELECT source FROM crc_risks WHERE id = $1 AND project_id = $2",
      [riskId, projectId]
    );
    if (riskCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Risk not found" });
    }

    if (riskCheck.rows[0].source !== "Manual") {
      return res.status(400).json({
        success: false,
        error: "System-generated risks cannot be manually deleted. They are managed through your assessment responses."
      });
    }

    await pool.query(
      "DELETE FROM crc_risks WHERE id = $1 AND project_id = $2",
      [riskId, projectId]
    );

    res.json({ success: true, message: "Risk deleted successfully" });
  } catch (error) {
    console.error("Error deleting risk:", error);
    res.status(500).json({ success: false, error: "Failed to delete risk" });
  }
});

// --- Feature 6: Compliance Template Endpoints ---

// GET /crc/templates/status - Get template upload status for all controls (Admin only)
// NOTE: This must be defined BEFORE the :controlId param routes to avoid matching "status" as a controlId
router.get("/templates/status", authenticateToken, requireRole(["ADMIN"]), async (_req, res) => {
  try {
    const templateMap: Record<string, { filename: string; size: number; updatedAt: string; url?: string }> = {};

    // 1. Fetch templates from database (UploadThing storage)
    const dbTemplates = await pool.query(
      "SELECT control_id, url, filename, size, updated_at FROM crc_control_templates"
    );
    for (const row of dbTemplates.rows) {
      templateMap[row.control_id] = {
        filename: row.filename,
        size: row.size,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
        url: row.url,
      };
    }

    // 2. Scan and merge legacy static template files from local disk
    try {
      if (fs.existsSync(TEMPLATES_DIR)) {
        const files = fs.readdirSync(TEMPLATES_DIR);
        for (const file of files) {
          if (file.endsWith(".docx") || file.endsWith(".doc")) {
            const controlId = file.replace(/\.(docx|doc)$/, "");
            if (!templateMap[controlId]) {
              const filePath = path.join(TEMPLATES_DIR, file);
              const stats = fs.statSync(filePath);
              templateMap[controlId] = {
                filename: file,
                size: stats.size,
                updatedAt: stats.mtime.toISOString(),
              };
            }
          }
        }
      }
    } catch (diskErr) {
      console.error("Error reading legacy templates from disk:", diskErr);
    }

    res.json({ success: true, data: templateMap });
  } catch (error) {
    console.error("Error fetching template statuses:", error);
    res.status(500).json({ success: false, error: "Failed to fetch template statuses" });
  }
});

// POST /crc/templates/bulk-upload - Bulk upload compliance template documents (Admin only)
router.post("/templates/bulk-upload", authenticateToken, requireRole(["ADMIN"]), (req, res, next) => {
  bulkTemplateUpload.array("files", 140)(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, error: "File size exceeds 25MB limit" });
      }
      return res.status(400).json({ success: false, error: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
}, async (req, res) => {
  const uploadedFiles = req.files as Express.Multer.File[] | undefined;
  if (!uploadedFiles || uploadedFiles.length === 0) {
    return res.status(400).json({ success: false, error: "No files uploaded." });
  }

  // Temporary folders created for extracting ZIP files
  const tempFolders: string[] = [];
  // All template files to process (either direct uploads or extracted from ZIPs)
  const templatesToProcess: { filePath: string; originalname: string; mimetype: string; size: number; isTemp: boolean }[] = [];

  try {
    // 1. Fetch all valid control IDs from database to match against filenames
    const controlsResult = await pool.query("SELECT control_id FROM crc_controls");
    const validControlIds = controlsResult.rows.map((r: { control_id: string }) => r.control_id);
    
    // Sort control IDs by length in descending order to match the longest (most specific) first
    // E.g., match "GOV-3P-010" before "GOV-3P-01"
    validControlIds.sort((a, b) => b.length - a.length);

    // Cumulative safety counters across all ZIPs in the request
    let totalExtractedFileCount = 0;
    let totalExtractedBytes = 0;

    // 2. Classify and process each uploaded file
    for (const file of uploadedFiles) {
      const isZip = file.mimetype === "application/zip" || 
                    file.mimetype === "application/x-zip-compressed" || 
                    file.originalname.toLowerCase().endsWith(".zip");

      if (isZip) {
        // Extract ZIP contents
        const zipPath = file.path;
        const extractDir = path.join(TEMPLATES_DIR, `bulk_extract_${Date.now()}_${crypto.randomUUID()}`);
        fs.mkdirSync(extractDir, { recursive: true });
        tempFolders.push(extractDir);

        const zip = new AdmZip(zipPath);
        const entries = zip.getEntries();
        
        // Safety limits to prevent ZIP bombs or excessive uncompressed extraction (cumulative)
        const MAX_ZIP_ENTRIES = 150;
        const MAX_ZIP_UNCOMPRESSED_SIZE = 100 * 1024 * 1024; // 100MB
        
        for (const entry of entries) {
          if (!entry.isDirectory) {
            totalExtractedFileCount++;
            totalExtractedBytes += entry.header.size;
          }
        }
        
        if (totalExtractedFileCount > MAX_ZIP_ENTRIES) {
          throw new Error(`Total files across all ZIP archives exceeds limit (max: ${MAX_ZIP_ENTRIES})`);
        }
        if (totalExtractedBytes > MAX_ZIP_UNCOMPRESSED_SIZE) {
          throw new Error(`Total uncompressed size across all ZIP archives exceeds limit (max: 100MB)`);
        }

        // Pre-scan, filter and extract only allowed .doc/.docx template files
        for (const entry of entries) {
          if (entry.isDirectory) continue;
          
          const nameLower = entry.name.toLowerCase();
          const isAllowedTemplate = nameLower.endsWith(".docx") || nameLower.endsWith(".doc");
          
          if (isAllowedTemplate) {
            zip.extractEntryTo(entry, extractDir, true, true);
          }
        }

        // Recursively read extracted files
        const readFilesRecursively = (dir: string) => {
          const entriesInDir = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entriesInDir) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              readFilesRecursively(fullPath);
            } else if (entry.isFile() && (entry.name.toLowerCase().endsWith(".docx") || entry.name.toLowerCase().endsWith(".doc"))) {
              const stats = fs.statSync(fullPath);
              const isDoc = entry.name.toLowerCase().endsWith(".doc");
              templatesToProcess.push({
                filePath: fullPath,
                originalname: entry.name,
                mimetype: isDoc ? "application/msword" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                size: stats.size,
                isTemp: true, // We need to delete this file later because it was extracted
              });
            }
          }
        };
        readFilesRecursively(extractDir);
      } else {
        // Direct .docx / .doc file
        templatesToProcess.push({
          filePath: file.path,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          isTemp: false, // Will be deleted at the end as part of standard multer file cleanups
        });
      }
    }

    if (templatesToProcess.length === 0) {
      return res.status(400).json({ success: false, error: "No valid .doc or .docx template files found in the upload." });
    }

    // 3. Precompute and validate template-to-control ID matches
    // Require bounded token-style matches and reject any ambiguous or duplicate template-to-control assignments
    const templateMappings = new Map<string, { filename: string; templateIdx: number }>();
    const validationErrors: string[] = [];
    const matchedControlIdsForTemplates = new Map<number, string>(); // index in templatesToProcess -> control_id

    for (let i = 0; i < templatesToProcess.length; i++) {
      const template = templatesToProcess[i];
      const matchedControls: string[] = [];

      for (const controlId of validControlIds) {
        // Bounded token-style match to prevent matching partial substrings (e.g. matching GOV-3P-01 inside GOV-3P-010)
        const escaped = controlId.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(?:^|[^A-Z0-9])${escaped}(?:$|[^A-Z0-9])`, 'i');
        if (regex.test(template.originalname)) {
          matchedControls.push(controlId);
        }
      }

      if (matchedControls.length > 1) {
        validationErrors.push(`Ambiguous match: File "${template.originalname}" matches multiple control IDs (${matchedControls.join(", ")})`);
      } else if (matchedControls.length === 1) {
        const matchedId = matchedControls[0];
        const existing = templateMappings.get(matchedId);
        if (existing) {
          validationErrors.push(`Duplicate template assignment: Both "${existing.filename}" and "${template.originalname}" map to control ID "${matchedId}"`);
        } else {
          templateMappings.set(matchedId, { filename: template.originalname, templateIdx: i });
          matchedControlIdsForTemplates.set(i, matchedId);
        }
      }
      // If matchedControls.length === 0, it is unmatched, which we report as unmatched in the response details list
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Validation failed: " + validationErrors.join("; ")
      });
    }

    // 4. Process each template file after passing pre-validation
    const results: { filename: string; status: "success" | "unmatched" | "failed"; controlId?: string; error?: string }[] = [];
    const FileConstructor = typeof File !== "undefined" ? File : require("node:buffer").File;
    const user = (req as any).user;

    for (let i = 0; i < templatesToProcess.length; i++) {
      const template = templatesToProcess[i];
      const matchedControlId = matchedControlIdsForTemplates.get(i);

      if (!matchedControlId) {
        results.push({
          filename: template.originalname,
          status: "unmatched",
          error: "Filename does not match any valid control ID in the database.",
        });
        continue;
      }

      try {
        const fileData = fs.readFileSync(template.filePath);
        const webFile = new FileConstructor([fileData], template.originalname, { type: template.mimetype });

        // Upload to UploadThing
        const uploadResult = await utapi.uploadFiles(webFile);

        if (!uploadResult || !uploadResult.data) {
          const errorMsg = (uploadResult as any).error?.message || "Failed to upload file to cloud storage";
          throw new Error(errorMsg);
        }

        const { url, key: fileKey } = uploadResult.data;

        // Check for existing database record to clean up superseded files from UploadThing
        const existingResult = await pool.query(
          "SELECT file_key FROM crc_control_templates WHERE control_id = $1",
          [matchedControlId]
        );
        const oldKey = existingResult.rows.length > 0 ? existingResult.rows[0].file_key : null;

        // Save or update mapping in database
        await pool.query(
          `INSERT INTO crc_control_templates (control_id, url, file_key, filename, size, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (control_id)
           DO UPDATE SET url = $2, file_key = $3, filename = $4, size = $5, updated_at = NOW()`,
          [matchedControlId, url, fileKey, template.originalname, template.size]
        );

        // Delete superseded file from UploadThing only AFTER database upsert succeeds
        if (oldKey) {
          try {
            await utapi.deleteFiles(oldKey);
          } catch (deleteErr) {
            console.error(`Failed to delete superseded template from UploadThing: ${oldKey}`, deleteErr);
          }
        }

        // Try to remove local legacy files for this control to keep the local filesystem pristine
        for (const legacyExt of [".docx", ".doc"] as const) {
          try {
            const legacyPath = resolveTemplatePath(matchedControlId, legacyExt);
            if (fs.existsSync(legacyPath)) {
              fs.unlinkSync(legacyPath);
            }
          } catch (resolveErr) {
            console.error(`Skipping legacy file cleanup for ${matchedControlId} with extension ${legacyExt}:`, resolveErr);
          }
        }

        // Log audit log event separately wrapped in its own try/catch to not block the request outcome
        try {
          await recordEvent({
            projectId: null,
            actorId: user?.id,
            action: "UPLOAD_CRC_TEMPLATE",
            objectType: "CRC_CONTROL",
            objectId: matchedControlId,
            metadata: { filename: template.originalname, source: "bulk-uploadthing" },
          });
        } catch (auditErr) {
          console.error(`Failed to log audit event for template upload of control ${matchedControlId}:`, auditErr);
        }

        results.push({
          filename: template.originalname,
          status: "success",
          controlId: matchedControlId,
        });

      } catch (uploadErr: any) {
        console.error(`Error processing template ${template.originalname} for control ${matchedControlId}:`, uploadErr);
        results.push({
          filename: template.originalname,
          status: "failed",
          controlId: matchedControlId,
          error: uploadErr.message || "Failed during upload or database save",
        });
      }
    }

    const summary = {
      total: templatesToProcess.length,
      success: results.filter(r => r.status === "success").length,
      unmatched: results.filter(r => r.status === "unmatched").length,
      failed: results.filter(r => r.status === "failed").length,
    };

    res.json({
      success: true,
      message: `Bulk template upload finished. Success: ${summary.success}, Unmatched: ${summary.unmatched}, Failed: ${summary.failed}`,
      summary,
      details: results,
    });

  } catch (error) {
    console.error("Fatal error in bulk template upload:", error);
    res.status(500).json({ success: false, error: "Fatal error processing bulk templates" });
  } finally {
    // 4. Cleanup all temporary files and extracted directories
    if (uploadedFiles) {
      for (const file of uploadedFiles) {
        if (fs.existsSync(file.path)) {
          try { fs.unlinkSync(file.path); } catch {}
        }
      }
    }

    for (const folder of tempFolders) {
      if (fs.existsSync(folder)) {
        try {
          fs.rmSync(folder, { recursive: true, force: true });
        } catch (rmErr) {
          console.error(`Failed to clean up temporary folder: ${folder}`, rmErr);
        }
      }
    }
  }
});

export async function handleTemplateDownloadAutoflip(projectId: string, controlShortId: string, userId: string) {
  try {
    // 1. Find the control UUID using controlShortId (it could be control_id like 'OPS-INC-01')
    const controlResult = await pool.query(
      "SELECT id FROM crc_controls WHERE control_id = $1",
      [controlShortId]
    );
    if (controlResult.rows.length === 0) return;
    const controlUuid = controlResult.rows[0].id;

    // 2. Fetch existing response
    const existingResult = await pool.query(
      "SELECT id, evidence_status FROM crc_assessment_responses WHERE project_id = $1 AND control_id = $2",
      [projectId, controlUuid]
    );

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      if (existing.evidence_status === 'No Evidence') {
        await pool.query(
          `UPDATE crc_assessment_responses 
           SET evidence_status = 'Template Downloaded', updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [existing.id]
        );
      }
    }
  } catch (err) {
    console.error("Error auto-flipping template download evidence status:", err);
  }
}

// GET /crc/templates/:controlId/download - Download compliance template document
router.get("/templates/:controlId/download", authenticateToken, async (req, res) => {
  try {
    const { controlId } = req.params; // UUID or control short ID
    
    // Fetch control details
    const controlResult = await pool.query(
      "SELECT control_id, control_title, status FROM crc_controls WHERE id::text = $1 OR control_id = $1",
      [controlId]
    );

    if (controlResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Compliance control not found" });
    }

    const { control_id: controlShortId, control_title: controlTitle, status } = controlResult.rows[0];

    const user = (req as any).user;
    if (status !== "Published" && user?.role !== "ADMIN") {
      return res.status(403).json({ success: false, error: "Access denied: Compliance control template is not published" });
    }

    // Call autoflip if projectId query parameter is provided
    const { projectId } = req.query;
    if (projectId && typeof projectId === "string" && user?.id) {
      handleTemplateDownloadAutoflip(projectId, controlShortId, user.id).catch((err) =>
        console.error("Failed to auto-flip evidence status on download:", err)
      );
    }

    // 1. Check for template in database (UploadThing storage)
    const dbTemplate = await pool.query(
      "SELECT url, filename FROM crc_control_templates WHERE control_id = $1",
      [controlShortId]
    );

    if (dbTemplate.rows.length > 0) {
      const templateRecord = dbTemplate.rows[0];

      try {
        // Fetch the file securely from UploadThing and stream to client
        const fileResponse = await fetch(templateRecord.url);
        if (fileResponse.ok) {
          // Log event
          await recordEvent({
            projectId: null,
            actorId: user?.id,
            action: "DOWNLOAD_CRC_TEMPLATE",
            objectType: "CRC_CONTROL",
            objectId: controlShortId,
            metadata: { format: templateRecord.filename.endsWith(".docx") ? "docx" : "doc", source: "uploadthing" }
          });

          const contentType = fileResponse.headers.get("content-type") || "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          const arrayBuffer = await fileResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          const ext = path.extname(templateRecord.filename) || ".docx";
          const encodedFilename = sanitizeDownloadFilename(controlTitle, ext);

          res.setHeader("Content-Type", contentType);
          res.setHeader("Content-Disposition", `attachment; filename="${encodedFilename}"`);
          return res.send(buffer);
        } else {
          console.error(`Failed to fetch from uploadthing (non-ok response): ${fileResponse.statusText}. Falling back to disk/HTML.`);
        }
      } catch (fetchErr) {
        console.error("Failed to fetch template from UploadThing, falling back to disk/HTML:", fetchErr);
      }
    }

    // 2. Fall back to legacy local filesystem static files
    let chosenPath = "";
    let format = "";
    let docxPath = "";
    let docPath = "";
    
    try {
      docxPath = resolveTemplatePath(controlShortId, ".docx");
      docPath = resolveTemplatePath(controlShortId, ".doc");
    } catch (err: any) {
      console.error(`Path validation error for legacy files: ${err.message}. Falling back to HTML fallback.`);
    }

    if (docxPath) {
      try {
        await fs.promises.access(docxPath);
        chosenPath = docxPath;
        format = "docx";
      } catch {
        if (docPath) {
          try {
            await fs.promises.access(docPath);
            chosenPath = docPath;
            format = "doc";
          } catch {
            // neither exists
          }
        }
      }
    }

    if (chosenPath) {
      // Log event
      await recordEvent({
        projectId: null,
        actorId: user?.id,
        action: "DOWNLOAD_CRC_TEMPLATE",
        objectType: "CRC_CONTROL",
        objectId: controlShortId,
        metadata: { format, source: "disk" }
      });

      const encodedFilename = sanitizeDownloadFilename(controlTitle, `.${format}`);
      res.setHeader("Content-Disposition", `attachment; filename="${encodedFilename}"`);
      return res.sendFile(chosenPath, (err) => {
        if (err) {
          console.error("Error streaming template file:", err);
          if (!res.headersSent) {
            res.status(500).json({ success: false, error: "Failed to stream template file" });
          }
        }
      });
    }

    let templateHtml = "";
    if (controlShortId === "OPS-INC-01") {
      templateHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <title>CRC Compliance Template - OPS-INC-01</title>
          <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333333; margin: 40px; }
            h1 { color: #0284c7; font-size: 24px; border-bottom: 2px solid #0284c7; padding-bottom: 5px; margin-top: 30px; }
            h2 { color: #0f172a; font-size: 18px; margin-top: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; }
            h3 { color: #334155; font-size: 15px; margin-top: 20px; }
            p { font-size: 13px; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; }
            th { background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 12px; font-weight: bold; }
            td { border: 1px solid #cbd5e1; padding: 10px; font-size: 12px; vertical-align: top; }
            .badge { display: inline-block; padding: 3px 8px; font-size: 10px; font-weight: bold; border-radius: 4px; background-color: #e0f2fe; color: #0369a1; }
            .alert { background-color: #fffbeb; border-left: 4px solid #d97706; padding: 15px; margin-top: 15px; margin-bottom: 15px; border-radius: 4px; }
            .checklist { list-style-type: none; padding-left: 0; }
            .checklist li { margin-bottom: 8px; font-size: 13px; }
            .checklist-box { display: inline-block; width: 15px; height: 15px; border: 1px solid #64748b; margin-right: 10px; vertical-align: middle; }
          </style>
        </head>
        <body>
          <div style='text-align: center; margin-bottom: 30px;'>
            <span style='font-size: 12px; font-weight: bold; text-transform: uppercase; color: #0284c7;'>MATUR.ai Compliance Framework</span>
            <h1 style='margin-top: 5px; border-bottom: none;'>CRC COMPLIANCE TEMPLATE</h1>
            <span class='badge'>Control ID: OPS-INC-01</span>
            <h2 style='border-bottom: none; margin-top: 5px;'>Incident Detection and Response</h2>
          </div>

          <h2>Framework Alignment</h2>
          <table>
            <tr>
              <th style='width: 30%;'>Framework</th>
              <th>Applicable Requirements</th>
            </tr>
            <tr>
              <td><b>EU AI Act</b></td>
              <td>Article 17(1)(i): QMS procedures for reporting serious incidents | Article 16(j): Corrective actions | Article 73: Serious incident reporting to market surveillance authorities</td>
            </tr>
            <tr>
              <td><b>NIST AI RMF</b></td>
              <td>GOVERN.4.3: Enable AI testing and incident identification | MANAGE.2.3: Respond to and recover from previously unknown risks</td>
            </tr>
            <tr>
              <td><b>ISO 42001</b></td>
              <td>Clause 10.2: Nonconformity response, control, and correction | Annex A.8.4: AI system incident communication plan</td>
            </tr>
          </table>

          <div class='alert'>
            <b>💡 ALREADY HAVE SOC 2 OR ISO 27001?</b><br/>
            If your organization already has an Incident Response Plan under SOC 2 (CC7.4, CC7.5) or ISO 27001 (A.16), you do not need to create a new one from scratch. Use this template as an AI-specific supplement. Review each section below and add the AI-specific elements (marked with 🛡️) to your existing documentation. Your current plan likely covers general IT incidents but may not address AI-specific scenarios such as model drift, adversarial attacks, bias incidents, or EU AI Act Article 73 serious incident reporting.
          </div>

          <h2>Document Information</h2>
          <table>
            <tr><td style='width: 40%; font-weight: bold;'>Organization Name</td><td>[Enter Organization Name]</td></tr>
            <tr><td style='font-weight: bold;'>Document Owner</td><td>[Enter Document Owner Name and Title]</td></tr>
            <tr><td style='font-weight: bold;'>Version</td><td>1.0</td></tr>
            <tr><td style='font-weight: bold;'>Date Created</td><td>[DD/MM/YYYY]</td></tr>
            <tr><td style='font-weight: bold;'>Last Reviewed</td><td>[DD/MM/YYYY]</td></tr>
            <tr><td style='font-weight: bold;'>Next Review Date</td><td>[DD/MM/YYYY]</td></tr>
            <tr><td style='font-weight: bold;'>Approved By</td><td>[Name, Title, and Signature]</td></tr>
          </table>

          <h1>Section 1: AI Incident Response Plan</h1>
          <p>This section defines the end-to-end procedures for detecting, managing, and resolving AI system incidents. 🛡️ indicates AI-specific elements that may need to be added to your existing incident response plan.</p>
          
          <h3>1.1 Purpose and Scope</h3>
          <p>Define the purpose of this plan and which AI systems it covers:</p>
          <div style='border: 1px dashed #cbd5e1; padding: 15px; color: #64748b;'>[Enter details here]</div>

          <h3>1.2 🛡️ AI-Specific Incident Definitions</h3>
          <p>Define what constitutes an AI incident in your organization. Consider the following AI-specific scenarios:</p>
          <table>
            <tr>
              <th style='width: 30%;'>AI Incident Type</th>
              <th style='width: 40%;'>Definition</th>
              <th>Example</th>
            </tr>
            <tr>
              <td><b>Model performance degradation</b></td>
              <td>[Define threshold that triggers an incident]</td>
              <td>e.g., Accuracy drops below 85% on production data</td>
            </tr>
            <tr>
              <td><b>Bias or discrimination event</b></td>
              <td>[Define what constitutes a bias incident]</td>
              <td>e.g., Disparate rejection rates detected across demographic groups</td>
            </tr>
            <tr>
              <td><b>Adversarial attack or manipulation</b></td>
              <td>[Define attack scenarios]</td>
              <td>e.g., Prompt injection causing data exfiltration</td>
            </tr>
            <tr>
              <td><b>Data integrity compromise</b></td>
              <td>[Define data-related incidents]</td>
              <td>e.g., Training data poisoning discovered</td>
            </tr>
            <tr>
              <td><b>Unintended autonomous behavior</b></td>
              <td>[Define scope of unintended actions]</td>
              <td>e.g., AI system taking actions outside defined boundaries</td>
            </tr>
          </table>

          <h3>1.3 🛡️ Detection Sources</h3>
          <p>List the mechanisms through which AI incidents are detected in your organization:</p>
          <div style='border: 1px dashed #cbd5e1; padding: 15px; color: #64748b;'>
            List detection sources (e.g., automated monitoring dashboards, model performance alerts, user complaints, bias detection tools, security scanning, manual review)
          </div>

          <h3>1.4 Response Procedures</h3>
          <p>Document your step-by-step response procedure from initial detection through resolution, including: who is notified first, containment actions (e.g., taking model offline), investigation steps, resolution and remediation, post-incident review.</p>
          <div style='border: 1px dashed #cbd5e1; padding: 15px; color: #64748b;'>[Enter details here]</div>

          <h1>Section 2: Incident Classification Matrix</h1>
          <p>Define severity levels for AI incidents so responders can quickly determine appropriate response actions and escalation.</p>
          <table>
            <tr>
              <th>Severity</th>
              <th>Criteria</th>
              <th>Response Time</th>
              <th>Escalation</th>
              <th>Example</th>
            </tr>
            <tr>
              <td><b>Critical</b></td>
              <td>[Define criteria]</td>
              <td>[e.g., 1 hour]</td>
              <td>[e.g., CEO, Board]</td>
              <td>AI causing physical harm or major rights violation</td>
            </tr>
            <tr>
              <td><b>High</b></td>
              <td>[Define criteria]</td>
              <td>[e.g., 4 hours]</td>
              <td>[e.g., CTO, Legal]</td>
              <td>Significant bias detected affecting decisions</td>
            </tr>
            <tr>
              <td><b>Medium</b></td>
              <td>[Define criteria]</td>
              <td>[e.g., 24 hours]</td>
              <td>[e.g., AI Lead]</td>
              <td>Performance degradation within tolerance</td>
            </tr>
            <tr>
              <td><b>Low</b></td>
              <td>[Define criteria]</td>
              <td>[e.g., 72 hours]</td>
              <td>[e.g., Team Lead]</td>
              <td>Minor logging anomaly, no user impact</td>
            </tr>
          </table>

          <h1>Section 3: Incident Reporting Procedure</h1>
          <p>Standardize how AI incidents are documented from initial detection through resolution.</p>
          <h3>3.1 Incident Report Form</h3>
          <table>
            <tr><th style='width: 40%;'>Field</th><th>Value</th></tr>
            <tr><td><b>Incident ID</b></td><td>[Auto-generated or manual]</td></tr>
            <tr><td><b>Date/Time Detected</b></td><td>[DD/MM/YYYY HH:MM]</td></tr>
            <tr><td><b>Reported By</b></td><td>[Name and role]</td></tr>
            <tr><td><b>Affected AI System(s)</b></td><td>[List systems impacted]</td></tr>
            <tr><td><b>Severity Classification</b></td><td>[Critical / High / Medium / Low]</td></tr>
            <tr><td><b>🛡️ AI-Specific Category</b></td><td>[Model failure / Bias event / Adversarial attack / Data issue / Other]</td></tr>
            <tr><td><b>Description of Incident</b></td><td>[Detailed narrative of what happened]</td></tr>
            <tr><td><b>🛡️ Impact on AI Outputs</b></td><td>[What decisions or outputs were affected]</td></tr>
            <tr><td><b>Immediate Actions Taken</b></td><td>[Containment steps performed]</td></tr>
            <tr><td><b>Root Cause (if known)</b></td><td>[Preliminary or confirmed root cause]</td></tr>
            <tr><td><b>Corrective Actions</b></td><td>[Planned or completed remediation]</td></tr>
            <tr><td><b>🛡️ Regulatory Notification Required?</b></td><td>[Yes/No - if Yes, see Section 5]</td></tr>
            <tr><td><b>Status</b></td><td>[Open / Investigating / Resolved / Closed]</td></tr>
            <tr><td><b>Resolution Date</b></td><td>[DD/MM/YYYY]</td></tr>
            <tr><td><b>Lessons Learned</b></td><td>[Key takeaways for future prevention]</td></tr>
          </table>

          <h1>Section 4: Root Cause Analysis Template</h1>
          <p>Use this template for all Critical and High severity AI incidents. Structured analysis prevents recurrence.</p>
          <h3>4.1 5-Why Analysis</h3>
          <table>
            <tr><th style='width: 30%;'>Step</th><th>Question / Finding</th></tr>
            <tr><td><b>Problem Statement</b></td><td>[What happened?]</td></tr>
            <tr><td><b>Why #1</b></td><td>[Why did this happen?]</td></tr>
            <tr><td><b>Why #2</b></td><td>[Why did that happen?]</td></tr>
            <tr><td><b>Why #3</b></td><td>[Why did that happen?]</td></tr>
            <tr><td><b>Why #4</b></td><td>[Why did that happen?]</td></tr>
            <tr><td><b>Why #5 (Root Cause)</b></td><td>[The underlying root cause]</td></tr>
            <tr><td><b>Corrective Action</b></td><td>[What will be done to prevent recurrence?]</td></tr>
            <tr><td><b>Owner</b></td><td>[Who is responsible?]</td></tr>
            <tr><td><b>Target Date</b></td><td>[DD/MM/YYYY]</td></tr>
          </table>

          <h1>Section 5: 🛡️ Serious Incident Notification Form (EU AI Act Article 73)</h1>
          <p>Complete this form when an AI incident meets the threshold for "serious incident" under EU AI Act Article 73. Providers of high-risk AI systems must report serious incidents to the market surveillance authorities of the Member State where the incident occurred.</p>
          <table>
            <tr><th style='width: 40%;'>Field</th><th>Value</th></tr>
            <tr><td><b>Provider Name</b></td><td>[Your organization name]</td></tr>
            <tr><td><b>Provider Contact</b></td><td>[Name, email, phone]</td></tr>
            <tr><td><b>AI System Name & Version</b></td><td>[System identifier and version number]</td></tr>
            <tr><td><b>EU Database Registration #</b></td><td>[If applicable]</td></tr>
            <tr><td><b>Date/Time of Incident</b></td><td>[DD/MM/YYYY HH:MM]</td></tr>
            <tr><td><b>Member State(s) Affected</b></td><td>[Country/countries where incident occurred]</td></tr>
            <tr><td><b>Description of Serious Incident</b></td><td>[Detailed account of what happened]</td></tr>
            <tr><td><b>Nature of Harm</b></td><td>[Death / Serious damage to health / Serious damage to property / Environment / Fundamental rights]</td></tr>
            <tr><td><b>Number of Persons Affected</b></td><td>[Known or estimated count]</td></tr>
            <tr><td><b>Immediate Measures Taken</b></td><td>[Actions to contain harm]</td></tr>
            <tr><td><b>Corrective Actions Planned</b></td><td>[Remediation steps with timeline]</td></tr>
            <tr><td><b>Contact for Follow-up</b></td><td>[Designated liaison for authority inquiries]</td></tr>
            <tr><td><b>Date of This Notification</b></td><td>[DD/MM/YYYY]</td></tr>
            <tr><td><b>Submitted By</b></td><td>[Name, title, signature]</td></tr>
          </table>
          <p><b>Note:</b> Under EU AI Act Article 73, this notification must be submitted immediately after the provider has established a causal link between the AI system and the serious incident, and in any event not later than 15 days after the provider becomes aware of the serious incident.</p>

          <h2>Evidence Checklist</h2>
          <p>The following evidence items are required to demonstrate compliance with this control:</p>
          <ul class='checklist'>
            <li><span class='checklist-box'></span> Completed Incident Response Plan (Section 1)</li>
            <li><span class='checklist-box'></span> Incident Classification Matrix (Section 2)</li>
            <li><span class='checklist-box'></span> Incident Reporting Procedure and blank report form (Section 3)</li>
            <li><span class='checklist-box'></span> Root Cause Analysis Template (Section 4)</li>
            <li><span class='checklist-box'></span> Serious Incident Notification Form (Section 5)</li>
          </ul>
        </body>
        </html>
      `;
    } else {
      templateHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <title>CRC Compliance Template - ${controlShortId}</title>
          <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333333; margin: 40px; }
            h1 { color: #0284c7; font-size: 24px; border-bottom: 2px solid #0284c7; padding-bottom: 5px; margin-top: 30px; }
            h2 { color: #0f172a; font-size: 18px; margin-top: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; }
            p { font-size: 13px; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 12px; font-weight: bold; }
            td { border: 1px solid #cbd5e1; padding: 10px; font-size: 12px; }
            .badge { display: inline-block; padding: 3px 8px; font-size: 10px; font-weight: bold; border-radius: 4px; background-color: #e0f2fe; color: #0369a1; }
          </style>
        </head>
        <body>
          <div style='text-align: center; margin-bottom: 30px;'>
            <span style='font-size: 12px; font-weight: bold; text-transform: uppercase; color: #0284c7;'>MATUR.ai Compliance Framework</span>
            <h1 style='margin-top: 5px; border-bottom: none;'>CRC COMPLIANCE EVIDENCE TEMPLATE</h1>
            <span class='badge'>Control ID: ${controlShortId}</span>
            <h2 style='border-bottom: none; margin-top: 5px;'>${controlTitle}</h2>
          </div>

          <h2>Evidence Template Overview</h2>
          <p>Use this template as compliance documentation and audit evidence for <b>${controlShortId}</b>. Review the controls statement and objective on your MATUR.ai project to complete the details below.</p>

          <h2>Document Information</h2>
          <table>
            <tr><td style='width: 40%; font-weight: bold;'>Organization Name</td><td>[Enter Organization Name]</td></tr>
            <tr><td style='font-weight: bold;'>Document Owner</td><td>[Enter Document Owner Name and Title]</td></tr>
            <tr><td style='font-weight: bold;'>Version</td><td>1.0</td></tr>
            <tr><td style='font-weight: bold;'>Date Created</td><td>[DD/MM/YYYY]</td></tr>
            <tr><td style='font-weight: bold;'>Last Reviewed</td><td>[DD/MM/YYYY]</td></tr>
          </table>

          <h1>Section 1: Implementation Strategy</h1>
          <p>Describe how your organization satisfies this control. Detail any policies, processes, tools, or automated guardrails that have been deployed.</p>
          <div style='border: 1px dashed #cbd5e1; padding: 20px; color: #64748b;'>[Enter details here]</div>

          <h1>Section 2: Verification and Testing</h1>
          <p>Detail how this control is verified and tested. Include testing schedules, validation methods, and the staff responsible for verification.</p>
          <div style='border: 1px dashed #cbd5e1; padding: 20px; color: #64748b;'>[Enter details here]</div>

          <h1>Section 3: Evidence References</h1>
          <p>List references, system logs, code paths, or dashboards that act as objective evidence of implementation.</p>
          <div style='border: 1px dashed #cbd5e1; padding: 20px; color: #64748b;'>[Enter details here]</div>
        </body>
        </html>
      `;
    }

    const encodedFilename = sanitizeDownloadFilename(controlTitle, ".doc");
    res.header("Content-Type", "application/vnd.ms-word");
    res.setHeader("Content-Disposition", `attachment; filename="${encodedFilename}"`);
    
    // Log event for fallback
    await recordEvent({
      projectId: null,
      actorId: user?.id,
      action: "DOWNLOAD_CRC_TEMPLATE",
      objectType: "CRC_CONTROL",
      objectId: controlShortId,
      metadata: { format: "doc_html_fallback" }
    });

    return res.send(templateHtml);
  } catch (error) {
    console.error("Error downloading template:", error);
    res.status(500).json({ success: false, error: "Failed to download template" });
  }
});

// POST /crc/templates/:controlId/upload - Upload compliance template document (Admin only)
router.post("/templates/:controlId/upload", authenticateToken, requireRole(["ADMIN"]), (req, res, next) => {
  templateUpload.single("template")(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, error: "File size exceeds 25MB limit" });
      }
      return res.status(400).json({ success: false, error: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
}, async (req, res) => {
  const tmpFile = req.file;
  try {
    if (!tmpFile) {
      return res.status(400).json({ success: false, error: "No file uploaded. Please select a .docx file." });
    }

    const { controlId } = req.params; // UUID or control short ID

    // Fetch control details
    const controlResult = await pool.query(
      "SELECT control_id, control_title FROM crc_controls WHERE id::text = $1 OR control_id = $1",
      [controlId]
    );

    if (controlResult.rows.length === 0) {
      // Clean up tmp file
      fs.unlinkSync(tmpFile.path);
      return res.status(404).json({ success: false, error: "Compliance control not found" });
    }

    const { control_id: controlShortId } = controlResult.rows[0];

    // Enforce strict whitelist to block path-traversal or directory escaping
    const whitelist = /^[A-Za-z0-9_-]+$/;
    if (!whitelist.test(controlShortId)) {
      if (tmpFile && fs.existsSync(tmpFile.path)) {
        try { fs.unlinkSync(tmpFile.path); } catch {}
      }
      return res.status(400).json({ success: false, error: "Invalid control ID format" });
    }

    // Read the multer temp file and convert it into a web-standard File object
    const fileData = fs.readFileSync(tmpFile.path);
    const FileConstructor = typeof File !== "undefined" ? File : require("node:buffer").File;
    const file = new FileConstructor([fileData], tmpFile.originalname, { type: tmpFile.mimetype });

    // Programmatically upload file to UploadThing
    const uploadResult = await utapi.uploadFiles(file);

    if (!uploadResult || !uploadResult.data) {
      const errorMsg = (uploadResult as any).error?.message || "Failed to upload file to cloud storage";
      throw new Error(errorMsg);
    }

    const { url, key: fileKey } = uploadResult.data;

    // Check for existing database record to clean up superseded files from UploadThing
    const existingResult = await pool.query(
      "SELECT file_key FROM crc_control_templates WHERE control_id = $1",
      [controlShortId]
    );
    const oldKey = existingResult.rows.length > 0 ? existingResult.rows[0].file_key : null;

    // Save or update mapping in database
    await pool.query(
      `INSERT INTO crc_control_templates (control_id, url, file_key, filename, size, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (control_id)
       DO UPDATE SET url = $2, file_key = $3, filename = $4, size = $5, updated_at = NOW()`,
      [controlShortId, url, fileKey, tmpFile.originalname, tmpFile.size]
    );

    // Delete superseded file from UploadThing only AFTER database upsert succeeds
    if (oldKey) {
      try {
        await utapi.deleteFiles(oldKey);
      } catch (deleteErr) {
        console.error(`Failed to delete superseded template from UploadThing: ${oldKey}`, deleteErr);
      }
    }

    // Clean up local temp file
    if (tmpFile && fs.existsSync(tmpFile.path)) {
      try { fs.unlinkSync(tmpFile.path); } catch {}
    }

    // Try to remove local legacy files for this control to keep the local filesystem pristine
    for (const legacyExt of [".docx", ".doc"] as const) {
      try {
        const legacyPath = resolveTemplatePath(controlShortId, legacyExt);
        if (fs.existsSync(legacyPath)) {
          fs.unlinkSync(legacyPath);
        }
      } catch (resolveErr) {
        console.error(`Skipping legacy file cleanup for ${controlShortId} with extension ${legacyExt}:`, resolveErr);
      }
    }

    const user = (req as any).user;
    try {
      await recordEvent({
        projectId: null,
        actorId: user?.id,
        action: "UPLOAD_CRC_TEMPLATE",
        objectType: "CRC_CONTROL",
        objectId: controlShortId,
        metadata: { filename: tmpFile.originalname, source: "uploadthing" },
      });
    } catch (auditErr) {
      console.error(`Failed to log audit event for template upload of control ${controlShortId}:`, auditErr);
    }

    res.json({
      success: true,
      message: `Template uploaded for ${controlShortId}`,
      data: { controlId: controlShortId, filename: tmpFile.originalname },
    });
  } catch (error) {
    // Clean up tmp file on error
    if (tmpFile && fs.existsSync(tmpFile.path)) {
      try { fs.unlinkSync(tmpFile.path); } catch {}
    }
    console.error("Error uploading template:", error);
    res.status(500).json({ success: false, error: "Failed to upload template" });
  }
});

// DELETE /crc/templates/:controlId/template - Delete a compliance template (Admin only)
router.delete("/templates/:controlId/template", authenticateToken, requireRole(["ADMIN"]), async (req, res) => {
  try {
    const { controlId } = req.params;

    const controlResult = await pool.query(
      "SELECT control_id FROM crc_controls WHERE id::text = $1 OR control_id = $1",
      [controlId]
    );

    if (controlResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Compliance control not found" });
    }

    const { control_id: controlShortId } = controlResult.rows[0];
    let deleted = false;

    // Check database for cloud-stored template first
    const dbRecord = await pool.query(
      "SELECT file_key FROM crc_control_templates WHERE control_id = $1",
      [controlShortId]
    );

    if (dbRecord.rows.length > 0) {
      const fileKey = dbRecord.rows[0].file_key;
      try {
        await utapi.deleteFiles(fileKey);
        await pool.query(
          "DELETE FROM crc_control_templates WHERE control_id = $1",
          [controlShortId]
        );
        deleted = true;
      } catch (deleteErr) {
        console.error(`Error deleting template from UploadThing: ${fileKey}`, deleteErr);
        return res.status(500).json({ success: false, error: "Failed to delete template from cloud storage. Database record was preserved." });
      }
    }

    // Check and remove any legacy local files on disk
    for (const ext of [".docx", ".doc"] as const) {
      try {
        const filePath = resolveTemplatePath(controlShortId, ext);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          deleted = true;
        }
      } catch (diskErr) {
        console.error(`Error validating/deleting legacy local file: ${controlShortId}${ext}`, diskErr);
      }
    }

    if (!deleted) {
      return res.status(404).json({ success: false, error: "No template found for this control" });
    }

    const user = (req as any).user;
    await recordEvent({
      projectId: null,
      actorId: user?.id,
      action: "DELETE_CRC_TEMPLATE",
      objectType: "CRC_CONTROL",
      objectId: controlShortId,
    });

    res.json({ success: true, message: `Template deleted for ${controlShortId}` });
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({ success: false, error: "Failed to delete template" });
  }
});

// GET /crc/quick-wins/:projectId - Recommends 3-5 specific controls to complete this week
router.get("/quick-wins/:projectId", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;

    // Verify user is a member of the project
    const membership = await getMembership(projectId, userId);
    if (!membership) {
      return res
        .status(403)
        .json({ success: false, error: "Project not found or access denied" });
    }

    // Check if wizard is applied
    const wizardRes = await pool.query(
      `SELECT control_flags, applied_at 
       FROM wizard_engine_outputs 
       WHERE project_id = $1`,
      [projectId]
    );

    if (wizardRes.rows.length === 0 || !wizardRes.rows[0].applied_at) {
      return res.json({ success: true, wizardRequired: true, items: [] });
    }

    const controlFlags = wizardRes.rows[0].control_flags || {};

    // Get all published controls, categories and responses
    const controlsRes = await pool.query(
      `SELECT c.id AS control_uuid,
              c.control_id AS control_short_id,
              c.control_title,
              c.control_objective,
              c.expected_timeline,
              c.compliance_mapping,
              c.category_id,
              cat.name AS category_name,
              r.value AS response_value,
              r.evidence_status
       FROM crc_controls c
       LEFT JOIN crc_categories cat ON cat.id = c.category_id
       LEFT JOIN crc_assessment_responses r
              ON r.control_id = c.id AND r.project_id = $1
       WHERE c.status = 'Published'`,
      [projectId]
    );

    // Get overall CRC results to get category readiness scores
    const crcResults = await computeCrcResults(projectId);
    const categoryReadiness = new Map<number | null, number>();
    for (const cat of crcResults.categories) {
      categoryReadiness.set(cat.categoryId, cat.percentage ?? 0);
    }

    // Helper to parse effort
    const parseEffort = (expectedTimeline: string | null): { tier: "Low" | "Medium" | "High"; minutes: number } => {
      if (!expectedTimeline) {
        return { tier: "Medium", minutes: 60 };
      }
      const clean = expectedTimeline.toLowerCase().trim();
      const minMatch = clean.match(/^(\d+(?:\.\d+)?)\s*m/);
      const hrMatch = clean.match(/^(\d+(?:\.\d+)?)\s*h/);
      const dayMatch = clean.match(/^(\d+(?:\.\d+)?)\s*d/);

      let minutes = 60;
      if (minMatch) {
        minutes = parseFloat(minMatch[1]);
      } else if (hrMatch) {
        minutes = parseFloat(hrMatch[1]) * 60;
      } else if (dayMatch) {
        minutes = parseFloat(dayMatch[1]) * 24 * 60;
      } else {
        const numMatch = clean.match(/^(\d+(?:\.\d+)?)$/);
        if (numMatch) {
          minutes = parseFloat(numMatch[1]);
        }
      }

      let tier: "Low" | "Medium" | "High" = "Medium";
      if (minutes <= 30) {
        tier = "Low";
      } else if (minutes > 120) {
        tier = "High";
      }
      return { tier, minutes };
    };

    const items: any[] = [];

    for (const row of controlsRes.rows) {
      const shortId = row.control_short_id;
      const flagInfo = controlFlags[shortId];
      if (!flagInfo || (flagInfo.flag !== "MANDATORY" && flagInfo.flag !== "RECOMMENDED")) {
        continue;
      }

      const val = row.response_value === null ? null : parseFloat(row.response_value);
      const isDocQuickWin = val === 1 && row.evidence_status === "No Evidence";
      const isIncomplete = val === null || val === 0 || val === 3;

      if (!isIncomplete && !isDocQuickWin) {
        continue;
      }

      // Parse effort
      const effort = parseEffort(row.expected_timeline);

      // Parse compliance mapping to count frameworks
      let mapping: any = {};
      if (row.compliance_mapping) {
        try {
          mapping = typeof row.compliance_mapping === "string" ? JSON.parse(row.compliance_mapping) : row.compliance_mapping;
        } catch (e) {
          mapping = {};
        }
      }
      let impactCount = 0;
      if (mapping.eu_ai_act && Array.isArray(mapping.eu_ai_act) && mapping.eu_ai_act.length > 0) impactCount++;
      if (mapping.nist_ai_rmf && Array.isArray(mapping.nist_ai_rmf) && mapping.nist_ai_rmf.length > 0) impactCount++;
      if (mapping.iso_42001 && Array.isArray(mapping.iso_42001) && mapping.iso_42001.length > 0) impactCount++;

      // Category readiness
      const readiness = categoryReadiness.get(row.category_id) ?? 0;

      items.push({
        controlId: row.control_uuid,
        controlShortId: shortId,
        controlTitle: row.control_title,
        effortBadge: row.expected_timeline || "Medium effort",
        effortTier: effort.tier,
        whyItMatters: row.control_objective || "",
        flag: flagInfo.flag,
        isDocumentationQuickWin: isDocQuickWin,
        categoryName: row.category_name || "Uncategorized",
        // Helper sort keys
        impactCount,
        categoryReadiness: readiness,
      });
    }

    // Sort items
    const tierOrder = { Low: 1, Medium: 2, High: 3 };
    items.sort((a, b) => {
      // 1. Effort tier (Low < Medium < High)
      const effortA = tierOrder[a.effortTier as keyof typeof tierOrder];
      const effortB = tierOrder[b.effortTier as keyof typeof tierOrder];
      if (effortA !== effortB) {
        return effortA - effortB;
      }

      // 2. Doc quick win boost (true comes first)
      if (a.isDocumentationQuickWin !== b.isDocumentationQuickWin) {
        return a.isDocumentationQuickWin ? -1 : 1;
      }

      // 3. Framework impact count (higher impactCount first)
      if (a.impactCount !== b.impactCount) {
        return b.impactCount - a.impactCount;
      }

      // 4. Category readiness (lower readiness first)
      if (a.categoryReadiness !== b.categoryReadiness) {
        return a.categoryReadiness - b.categoryReadiness;
      }

      // 5. Fallback deterministic sort by short ID
      return a.controlShortId.localeCompare(b.controlShortId);
    });

    // Remove sorting helpers and take top 5
    const top5 = items.slice(0, 5).map(item => ({
      controlId: item.controlId,
      controlShortId: item.controlShortId,
      controlTitle: item.controlTitle,
      effortBadge: item.effortBadge,
      effortTier: item.effortTier,
      whyItMatters: item.whyItMatters,
      flag: item.flag,
      isDocumentationQuickWin: item.isDocumentationQuickWin,
      categoryName: item.categoryName,
    }));

    res.json({
      success: true,
      wizardRequired: false,
      items: top5,
    });
  } catch (error) {
    console.error("Error fetching CRC quick wins:", error);
    res.status(500).json({ success: false, error: "Failed to fetch quick wins" });
  }
});

export default router;
