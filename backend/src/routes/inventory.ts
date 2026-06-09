import { Router } from "express";
import { z } from "zod";
import pool from "../config/database";
import { authenticateToken } from "../middleware/auth";
import { getMembership } from "../services/projectMembershipService";
import { recordEvent } from "../services/auditLogService";

const router = Router();

// Loose URL validation regex or just string
const OptionalUrlSchema = z.string().trim().optional().nullable().transform(val => {
  if (!val) return null;
  if (!/^https?:\/\//i.test(val)) {
    return `https://${val}`;
  }
  return val;
});

const ComponentSchema = z.object({
  componentName: z.string().min(1).max(255),
  componentType: z.enum([
    "Internal Proprietary Model",
    "Closed Foundation Model",
    "Open Source Model",
    "Vector Database",
    "Embedding Model",
    "Cloud AI Service",
    "Agent Framework",
    "Guardrail Tool",
    "Inference Infrastructure",
    "Training Dataset",
    "Validation Dataset",
    "API Service",
    "AI Application UI",
    "Evaluation / Monitoring Tool"
  ]),
  provider: z.string().min(1).max(255),
  version: z.string().max(100).optional().nullable(),
  roleInSystem: z.string().min(1),
  dataCategoriesSent: z.array(z.string()).default([]),
  riskTier: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
  status: z.enum(["Active", "Evaluating", "Deprecated"]),
  modelCardUrl: OptionalUrlSchema,
  vendorComplianceUrl: OptionalUrlSchema,
  dpaUrl: OptionalUrlSchema,
  notes: z.string().optional().nullable(),
  vendorAssessmentStatus: z.string().default("Not Run")
});

const VENDOR_COMPLIANCE_URLS: Record<string, string> = {
  openai: "https://trust.openai.com/",
  anthropic: "https://trust.anthropic.com/",
  google: "https://cloud.google.com/security/compliance",
  aws: "https://aws.amazon.com/compliance",
  "aws bedrock": "https://aws.amazon.com/compliance",
  azure: "https://learn.microsoft.com/en-us/azure/compliance/",
  "azure openai": "https://learn.microsoft.com/en-us/azure/compliance/",
  microsoft: "https://learn.microsoft.com/en-us/azure/compliance/",
  cohere: "https://cohere.com/security",
  pinecone: "https://www.pinecone.io/security/",
  weaviate: "https://weaviate.io/security"
};

async function validateVendorComplianceUrls() {
  console.log("=== STARTING VENDOR COMPLIANCE URLS STATUS VALIDATOR ===");
  for (const [vendor, url] of Object.entries(VENDOR_COMPLIANCE_URLS)) {
    try {
      const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
      if (!response.ok) {
        console.warn(`[WARNING] Compliance URL for vendor "${vendor}" returned non-ok status: ${response.status} (${url})`);
      } else {
        console.log(`[OK] Compliance URL for vendor "${vendor}" is valid (${url})`);
      }
    } catch (error) {
      console.error(`[ERROR] Compliance URL check failed for vendor "${vendor}": ${error instanceof Error ? error.message : String(error)} (${url})`);
    }
  }
  console.log("=== VENDOR COMPLIANCE URLS STATUS VALIDATION COMPLETE ===");
}

// Run validation check 10 seconds after server startup, then every 24 hours
setTimeout(() => {
  validateVendorComplianceUrls().catch(err => console.error("Error in validateVendorComplianceUrls startup run:", err));
}, 10000);
setInterval(() => {
  validateVendorComplianceUrls().catch(err => console.error("Error in validateVendorComplianceUrls periodic run:", err));
}, 24 * 60 * 60 * 1000);

// Risk tier auto-suggestion rules
export function suggestRiskTier(componentType: string, categories: string[]): "Low" | "Medium" | "High" | "Critical" {
  if (categories.includes("No Data Processing") || categories.length === 0) {
    return "Low";
  }

  const hasCategory = (cats: string[]) => 
    cats.some(c => categories.some(cat => cat.toLowerCase().includes(c.toLowerCase())));

  const hasHighlySensitive = hasCategory(["sensitive personal", "health", "biometric", "children"]);
  const hasPersonalOrFinancial = hasCategory(["personal", "financial"]);
  const hasInternalConfidential = hasCategory(["internal", "confidential"]);
  const hasSensitive = hasHighlySensitive || hasPersonalOrFinancial || hasInternalConfidential;

  if (componentType === "Internal Proprietary Model") {
    if (hasSensitive) {
      return "Critical";
    }
    return "Medium";
  }

  if (componentType === "Closed Foundation Model") {
    if (hasHighlySensitive || hasPersonalOrFinancial) {
      return "High";
    }
    if (hasInternalConfidential) {
      return "Medium";
    }
    return "Medium";
  }

  if (componentType === "Open Source Model") {
    if (hasSensitive) {
      return "High";
    }
    return "Medium";
  }

  if (["Vector Database", "Embedding Model", "Cloud AI Service"].includes(componentType)) {
    if (hasSensitive) {
      return "High";
    }
    return "Medium";
  }

  if (["Agent Framework", "Guardrail Tool", "Inference Infrastructure"].includes(componentType)) {
    if (hasHighlySensitive) {
      return "High";
    }
    if (hasSensitive) {
      return "Medium";
    }
    return "Low";
  }

  // Fallback for datasets, API services, etc.
  if (hasHighlySensitive) {
    return "High";
  }
  if (hasSensitive) {
    return "Medium";
  }
  return "Low";
}

// Map db row to camelCase api response
function mapRowToResponse(row: any) {
  return {
    id: row.id,
    projectId: row.project_id,
    componentId: row.component_id,
    componentName: row.component_name,
    componentType: row.component_type,
    provider: row.provider,
    version: row.version,
    roleInSystem: row.role_in_system,
    dataCategoriesSent: row.data_categories_sent,
    riskTier: row.risk_tier,
    status: row.status,
    modelCardUrl: row.model_card_url,
    vendorComplianceUrl: row.vendor_compliance_url,
    dpaUrl: row.dpa_url,
    notes: row.notes,
    vendorAssessmentStatus: row.vendor_assessment_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// GET /inventory/:projectId - List components with filters
router.get("/:projectId", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;

    const membership = await getMembership(projectId, userId);
    if (!membership) {
      return res.status(403).json({ error: "Project not found or access denied" });
    }

    const { type, provider, risk_tier, status } = req.query;

    let queryText = `SELECT * FROM component_inventory WHERE project_id = $1`;
    const queryParams: any[] = [projectId];

    if (type) {
      queryParams.push(type);
      queryText += ` AND component_type = $${queryParams.length}`;
    }
    if (provider) {
      queryParams.push(`%${provider}%`);
      queryText += ` AND provider ILIKE $${queryParams.length}`;
    }
    if (risk_tier) {
      queryParams.push(risk_tier);
      queryText += ` AND risk_tier = $${queryParams.length}`;
    }
    if (status) {
      queryParams.push(status);
      queryText += ` AND status = $${queryParams.length}`;
    }

    queryText += ` ORDER BY component_id ASC`;

    const result = await pool.query(queryText, queryParams);
    res.json(result.rows.map(mapRowToResponse));
  } catch (error) {
    console.error("Error listing components:", error);
    res.status(500).json({ error: "Failed to list components" });
  }
});

// GET /inventory/:projectId/summary - Get stats card data
router.get("/:projectId/summary", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;

    const membership = await getMembership(projectId, userId);
    if (!membership) {
      return res.status(403).json({ error: "Project not found or access denied" });
    }

    const countResult = await pool.query(
      `SELECT 
        COUNT(*) as total_count,
        COUNT(CASE WHEN provider NOT ILIKE 'internal' AND provider NOT ILIKE 'proprietary' THEN 1 END) as third_party_count,
        ARRAY_AGG(risk_tier) as risk_tiers
       FROM component_inventory 
       WHERE project_id = $1`,
      [projectId]
    );

    const { total_count = 0, third_party_count = 0, risk_tiers = [] } = countResult.rows[0] || {};
    
    // Determine highest risk tier (Critical > High > Medium > Low)
    let highestRiskTier = "Low";
    if (risk_tiers && risk_tiers.length > 0) {
      const tiers = new Set(risk_tiers);
      if (tiers.has("Critical")) highestRiskTier = "Critical";
      else if (tiers.has("High")) highestRiskTier = "High";
      else if (tiers.has("Medium")) highestRiskTier = "Medium";
    }

    res.json({
      totalCount: parseInt(total_count, 10),
      thirdPartyCount: parseInt(third_party_count, 10),
      highestRiskTier
    });
  } catch (error) {
    console.error("Error fetching inventory summary:", error);
    res.status(500).json({ error: "Failed to fetch inventory summary" });
  }
});

// GET /inventory/:projectId/:id - Get single component
router.get("/:projectId/:id", authenticateToken, async (req, res) => {
  try {
    const { projectId, id } = req.params;
    const userId = req.user!.id;

    const membership = await getMembership(projectId, userId);
    if (!membership) {
      return res.status(403).json({ error: "Project not found or access denied" });
    }

    const result = await pool.query(
      `SELECT * FROM component_inventory WHERE id = $1 AND project_id = $2`,
      [id, projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Component not found" });
    }

    res.json(mapRowToResponse(result.rows[0]));
  } catch (error) {
    console.error("Error fetching component details:", error);
    res.status(500).json({ error: "Failed to fetch component details" });
  }
});

// POST /inventory/:projectId - Create component
router.post("/:projectId", authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user!.id;

  const membership = await getMembership(projectId, userId);
  if (!membership) {
    return res.status(403).json({ error: "Project not found or access denied" });
  }
  if (!["OWNER", "EDITOR"].includes(membership.role)) {
    return res.status(403).json({ error: "Insufficient project permissions" });
  }

  const parsed = ComponentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const data = parsed.data;

  // Auto-suggest risk tier if not provided
  const riskTier = data.riskTier || suggestRiskTier(data.componentType, data.dataCategoriesSent);

  // Pre-fill vendor compliance URL if vendor is known and compliance URL not supplied
  let complianceUrl = data.vendorComplianceUrl;
  if (!complianceUrl) {
    const providerKey = data.provider.toLowerCase().trim();
    if (VENDOR_COMPLIANCE_URLS[providerKey]) {
      complianceUrl = VENDOR_COMPLIANCE_URLS[providerKey];
    }
  }

  const client = await pool.connect();
  let beganTxn = false;
  try {
    await client.query("BEGIN");
    beganTxn = true;

    // Generate next sequential component_id (CMP-XXX) atomically using db sequence
    const seqResult = await client.query("SELECT nextval('component_inventory_seq') as seq");
    const nextSeq = parseInt(seqResult.rows[0].seq, 10);
    const componentId = `CMP-${String(nextSeq).padStart(3, "0")}`;

    const insertResult = await client.query(
      `INSERT INTO component_inventory (
        project_id, component_id, component_name, component_type, provider, version, 
        role_in_system, data_categories_sent, risk_tier, status, model_card_url, 
        vendor_compliance_url, dpa_url, notes, vendor_assessment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        projectId,
        componentId,
        data.componentName,
        data.componentType,
        data.provider,
        data.version || null,
        data.roleInSystem,
        JSON.stringify(data.dataCategoriesSent),
        riskTier,
        data.status,
        data.modelCardUrl || null,
        complianceUrl || null,
        data.dpaUrl || null,
        data.notes || null,
        data.vendorAssessmentStatus
      ]
    );

    const created = mapRowToResponse(insertResult.rows[0]);

    // Record audit log event in the same transaction
    await recordEvent({
      projectId,
      actorId: userId,
      action: "CREATE",
      objectType: "COMPONENT_INVENTORY",
      objectId: created.id,
      metadata: { componentId, componentName: created.componentName },
      client
    });

    await client.query("COMMIT");
    beganTxn = false;

    res.status(201).json(created);
  } catch (error) {
    if (client && beganTxn) {
      await client.query("ROLLBACK");
    }
    console.error("Error creating component:", error);
    res.status(500).json({ error: "Failed to create component" });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// PUT /inventory/:projectId/:id - Update component
router.put("/:projectId/:id", authenticateToken, async (req, res) => {
  const { projectId, id } = req.params;
  const userId = req.user!.id;

  const membership = await getMembership(projectId, userId);
  if (!membership) {
    return res.status(403).json({ error: "Project not found or access denied" });
  }
  if (!["OWNER", "EDITOR"].includes(membership.role)) {
    return res.status(403).json({ error: "Insufficient project permissions" });
  }

  const parsed = ComponentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const data = parsed.data;

  // Prefill compliance URL if vendor changed and url is not set
  let complianceUrl = data.vendorComplianceUrl;
  if (!complianceUrl) {
    const providerKey = data.provider.toLowerCase().trim();
    if (VENDOR_COMPLIANCE_URLS[providerKey]) {
      complianceUrl = VENDOR_COMPLIANCE_URLS[providerKey];
    }
  }

  const client = await pool.connect();
  let beganTxn = false;
  try {
    await client.query("BEGIN");
    beganTxn = true;

    const updateResult = await client.query(
      `UPDATE component_inventory SET
        component_name = $3,
        component_type = $4,
        provider = $5,
        version = $6,
        role_in_system = $7,
        data_categories_sent = $8::jsonb,
        risk_tier = $9,
        status = $10,
        model_card_url = $11,
        vendor_compliance_url = $12,
        dpa_url = $13,
        notes = $14,
        vendor_assessment_status = $15
      WHERE id = $1 AND project_id = $2
      RETURNING *`,
      [
        id,
        projectId,
        data.componentName,
        data.componentType,
        data.provider,
        data.version || null,
        data.roleInSystem,
        JSON.stringify(data.dataCategoriesSent),
        data.riskTier || suggestRiskTier(data.componentType, data.dataCategoriesSent),
        data.status,
        data.modelCardUrl || null,
        complianceUrl || null,
        data.dpaUrl || null,
        data.notes || null,
        data.vendorAssessmentStatus
      ]
    );

    if (updateResult.rows.length === 0) {
      await client.query("ROLLBACK");
      beganTxn = false;
      return res.status(404).json({ error: "Component not found" });
    }

    const updated = mapRowToResponse(updateResult.rows[0]);

    // Record audit log event in the same transaction
    await recordEvent({
      projectId,
      actorId: userId,
      action: "UPDATE",
      objectType: "COMPONENT_INVENTORY",
      objectId: updated.id,
      metadata: { componentId: updated.componentId, componentName: updated.componentName },
      client
    });

    await client.query("COMMIT");
    beganTxn = false;

    res.json(updated);
  } catch (error) {
    if (client && beganTxn) {
      await client.query("ROLLBACK");
    }
    console.error("Error updating component:", error);
    res.status(500).json({ error: "Failed to update component" });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// DELETE /inventory/:projectId/:id - Delete component
router.delete("/:projectId/:id", authenticateToken, async (req, res) => {
  const { projectId, id } = req.params;
  const userId = req.user!.id;

  const membership = await getMembership(projectId, userId);
  if (!membership) {
    return res.status(403).json({ error: "Project not found or access denied" });
  }
  if (!["OWNER", "EDITOR"].includes(membership.role)) {
    return res.status(403).json({ error: "Insufficient project permissions" });
  }

  const client = await pool.connect();
  let beganTxn = false;
  try {
    await client.query("BEGIN");
    beganTxn = true;

    const fetchResult = await client.query(
      `SELECT component_id, component_name FROM component_inventory WHERE id = $1 AND project_id = $2 FOR UPDATE`,
      [id, projectId]
    );

    if (fetchResult.rows.length === 0) {
      await client.query("ROLLBACK");
      beganTxn = false;
      return res.status(404).json({ error: "Component not found" });
    }

    const { component_id, component_name } = fetchResult.rows[0];

    await client.query(
      `DELETE FROM component_inventory WHERE id = $1 AND project_id = $2`,
      [id, projectId]
    );

    // Record audit log event in same transaction
    await recordEvent({
      projectId,
      actorId: userId,
      action: "DELETE",
      objectType: "COMPONENT_INVENTORY",
      objectId: id,
      metadata: { componentId: component_id, componentName: component_name },
      client
    });

    await client.query("COMMIT");
    beganTxn = false;

    res.json({ message: "Component deleted successfully" });
  } catch (error) {
    if (client && beganTxn) {
      await client.query("ROLLBACK");
    }
    console.error("Error deleting component:", error);
    res.status(500).json({ error: "Failed to delete component" });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// POST /inventory/:projectId/export - CSV Export (POST allows filter state in body)
router.post("/:projectId/export", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;

    const membership = await getMembership(projectId, userId);
    if (!membership) {
      return res.status(403).json({ error: "Project not found or access denied" });
    }

    const { type, provider, risk_tier, status } = req.body || {};

    let queryText = `SELECT * FROM component_inventory WHERE project_id = $1`;
    const queryParams: any[] = [projectId];

    if (type) {
      queryParams.push(type);
      queryText += ` AND component_type = $${queryParams.length}`;
    }
    if (provider) {
      queryParams.push(`%${provider}%`);
      queryText += ` AND provider ILIKE $${queryParams.length}`;
    }
    if (risk_tier) {
      queryParams.push(risk_tier);
      queryText += ` AND risk_tier = $${queryParams.length}`;
    }
    if (status) {
      queryParams.push(status);
      queryText += ` AND status = $${queryParams.length}`;
    }

    queryText += ` ORDER BY component_id ASC`;

    const result = await pool.query(queryText, queryParams);
    const components = result.rows;

    // Generate CSV content
    const headers = [
      "Component ID",
      "Name",
      "Type",
      "Provider",
      "Version",
      "Role in System",
      "Data Categories Sent",
      "Risk Tier",
      "Status",
      "Model Card URL",
      "Compliance URL",
      "DPA URL",
      "Notes",
      "Vendor Assessment Status"
    ];

    const csvRows = [headers.join(",")];

    for (const comp of components) {
      const dataCatsStr = Array.isArray(comp.data_categories_sent)
        ? comp.data_categories_sent.join("; ")
        : "";

      const values = [
        comp.component_id,
        comp.component_name,
        comp.component_type,
        comp.provider,
        comp.version || "",
        comp.role_in_system,
        dataCatsStr,
        comp.risk_tier,
        comp.status,
        comp.model_card_url || "",
        comp.vendor_compliance_url || "",
        comp.dpa_url || "",
        comp.notes || "",
        comp.vendor_assessment_status
      ];

      // Escape quotes and wrap in quotes if has comma, mitigating formula injection
      const escaped = values.map(val => {
        let str = String(val ?? "");
        const trimmed = str.trimStart();
        if (trimmed.startsWith("=") || trimmed.startsWith("+") || trimmed.startsWith("-") || trimmed.startsWith("@")) {
          str = `'${str}`;
        }
        const escapedVal = str.replace(/"/g, '""');
        return escapedVal.includes(",") || escapedVal.includes("\n") || escapedVal.includes('"')
          ? `"${escapedVal}"`
          : escapedVal;
      });

      csvRows.push(escaped.join(","));
    }

    const csvContent = csvRows.join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=component_inventory.csv");
    res.send(csvContent);
  } catch (error) {
    console.error("Error exporting components CSV:", error);
    res.status(500).json({ error: "Failed to export components CSV" });
  }
});

export default router;
