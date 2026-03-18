import fs from "fs";
import path from "path";
import pool from "../config/database";
import { z } from "zod";
import { parseCSV } from "../utils/csv";

// --- Configuration ---
const fileArg = process.argv.find(arg => arg.startsWith("--file=") || arg.startsWith("-f="));
const CSV_PATH = fileArg 
  ? path.resolve(process.cwd(), fileArg.split("=")[1])
  : path.join(__dirname, "../../../csv/MATUR_AI_Controls_Master (2)_Controls.csv");

if (!fs.existsSync(CSV_PATH)) {
  console.error(`❌ CSV file not found at: ${CSV_PATH}`);
  process.exit(1);
}

const LOG_PATH = path.join(__dirname, "../../../upload_errors.log");

// --- Modes ---
const args = process.argv.slice(2);
const modeArg = args.find(arg => arg.startsWith("--mode="));
const mode = modeArg ? modeArg.split("=")[1] : "upsert"; // default to upsert

if (mode !== "upsert" && mode !== "reset") {
  console.error("❌ Invalid mode. Use --mode=upsert or --mode=reset");
  process.exit(1);
}

// --- Validation Schema ---
const implementationSchema = z.object({
  requirements: z.array(z.string()).default([]),
  steps: z.array(z.string()).default([]),
});

const complianceItemSchema = z.object({
  ref: z.string(),
  context: z.string(),
});

const complianceMappingSchema = z.object({
  eu_ai_act: z.array(complianceItemSchema).default([]),
  nist_ai_rmf: z.array(complianceItemSchema).default([]),
  iso_42001: z.array(complianceItemSchema).default([]),
});

const aimaMappingSchema = z.object({
  domain: z.string().default(""),
  area: z.string().default(""),
  maturity_enhancement: z.string().default(""),
});

const rowSchema = z.object({
  control_id: z.string().min(1).max(20),
  control_title: z.string().min(1).max(200),
  category_name: z.string().min(1),
  priority: z.string().min(1),
  expected_timeline: z.string().default(""),
  control_statement: z.string().default(""),
  control_objective: z.string().default(""),
  risk_description: z.string().default(""),
  implementation: implementationSchema.default({}),
  evidence_requirements: z.array(z.string()).default([]),
  compliance_mapping: complianceMappingSchema.default({}),
  aima_mapping: aimaMappingSchema.default({}),
});

type ControlRow = z.infer<typeof rowSchema>;

// --- Helper: Parse Implementation Guidance ---
function parseImplementation(text: string): { requirements: string[]; steps: string[] } {
  const requirements: string[] = [];
  const steps: string[] = [];
  
  const sections = text.split(/(Requirements:|Steps:)/i);
  let currentSection = "";
  
  for (const part of sections) {
    if (part.toLowerCase() === "requirements:") {
      currentSection = "req";
    } else if (part.toLowerCase() === "steps:") {
      currentSection = "steps";
    } else if (currentSection === "req") {
      requirements.push(...part.split(/\r?\n|•/).map(s => s.trim()).filter(s => s.length > 2));
    } else if (currentSection === "steps") {
      steps.push(...part.split(/\r?\n|\d+\./).map(s => s.trim()).filter(s => s.length > 2));
    }
  }
  
  return { requirements, steps };
}

// --- Helper: Parse Compliance Mapping ---
function parseCompliance(text: string): { ref: string; context: string }[] {
  if (!text || text.toLowerCase() === "n/a") return [];
  const parts = text.split(";").map(s => s.trim()).filter(Boolean);
  return parts.map(p => {
    const [ref, ...contextParts] = p.split(":");
    return {
      ref: ref ? ref.trim() : "N/A",
      context: contextParts.join(":").trim() || ""
    };
  });
}

// --- Helper: Parse AIMA Mapping ---
function parseAima(text: string): { domain: string; area: string; maturity_enhancement: string } {
  // Example: Maps to: AI Risk Management Domain - Third-Party Risk (Level 3)
  const result = { domain: "", area: "", maturity_enhancement: "" };
  if (!text) return result;
  
  const mappingMatch = text.match(/Maps to:\s*([^-\n]+)\s*-\s*([^( \n]+(?:\s+[^( \n]+)*)\s*(?:\(([^)]+)\))?/i);
  if (mappingMatch) {
    result.domain = mappingMatch[1].trim();
    result.area = mappingMatch[2].trim();
    result.maturity_enhancement = mappingMatch[3] ? mappingMatch[3].trim() : "";
  }
  return result;
}

// --- Main Execution ---
async function uploadControls() {
  console.log(`🚀 Starting bulk upload in [${mode.toUpperCase()}] mode...`);
  
  // 1. Preload categories
  const catResult = await pool.query("SELECT id, name FROM crc_categories");
  const categoryMap = new Map<string, number>(); // lowercase name -> id
  catResult.rows.forEach(row => {
    categoryMap.set(row.name.toLowerCase().trim(), row.id);
  });
  
  // 2. Read and parse CSV
  const csvContent = fs.readFileSync(CSV_PATH, "utf8");
  const allRows = parseCSV(csvContent);
  if (allRows.length < 2) {
    console.error("❌ CSV file is empty or malformed.");
    process.exit(1);
  }
  
  const headers = allRows[0];
  const dataRows = allRows.slice(1);
  
  const validRows: ControlRow[] = [];
  const invalidRows: { index: number; data: any; errors: any }[] = [];
  
  console.log(`📊 Processing ${dataRows.length} rows...`);
  
  dataRows.forEach((row, index) => {
    try {
      if (row.length < 5) return; // Skip empty/incomplete rows
      
      const rawData = {
        control_id: row[1],
        control_title: row[2],
        category_name: row[3],
        priority: row[4],
        control_statement: row[5],
        control_objective: row[6],
        implementation: parseImplementation(row[7] || ""),
        evidence_requirements: (row[8] || "").split(/\r?\n|☐/).map(s => s.trim()).filter(s => s.length > 2),
        compliance_mapping: {
          eu_ai_act: parseCompliance(row[9] || ""),
          nist_ai_rmf: parseCompliance(row[10] || ""),
          iso_42001: parseCompliance(row[11] || ""),
        },
        risk_description: row[12],
        aima_mapping: parseAima(row[13] || ""),
        expected_timeline: row[16],
      };
      
      const validation = rowSchema.safeParse(rawData);
      if (!validation.success) {
        invalidRows.push({ index: index + 2, data: row[1] || `Row ${index + 2}`, errors: validation.error.flatten() });
        return;
      }
      
      // Check category
      const catId = categoryMap.get(validation.data.category_name.toLowerCase().trim());
      if (!catId) {
        invalidRows.push({ index: index + 2, data: row[1] || `Row ${index + 2}`, errors: { fieldErrors: { category: [`Category "${validation.data.category_name}" not found in database`] } } });
        return;
      }
      
      validRows.push(validation.data);
    } catch (err) {
      invalidRows.push({ index: index + 2, data: row[1] || `Row ${index + 2}`, errors: { message: "Unexpected parsing error" } });
    }
  });
  
  // Guard: For 'reset' mode, require zero validation errors before proceeding
  if (mode === "reset" && invalidRows.length > 0) {
    console.error(`\n❌ [ABORT] Reset mode requires all rows to be valid. Found ${invalidRows.length} errors.`);
    console.error(`Check the log file for details: ${LOG_PATH}\n`);
    
    const errorLog = invalidRows.map(inv => `[Row ${inv.index}] ${inv.data}: ${JSON.stringify(inv.errors)}`).join("\n");
    fs.writeFileSync(LOG_PATH, errorLog);
    
    process.exit(1);
  }

  // 3. Database Operations
  const client = await pool.connect();
  let successCount = 0;
  
  try {
    await client.query("BEGIN");
    
    if (mode === "reset") {
      if (process.env.FORCE_RESET !== "true") {
        console.error("\n⚠️  [DANGER] Reset mode will TRUNCATE crc_control_versions, crc_controls AND their dependents (e.g. crc_assessment_responses).");
        console.error("To proceed, set FORCE_RESET=true environment variable.\n");
        await client.query("ROLLBACK");
        process.exit(1);
      }
      console.log("🧨 Reset mode: Truncating crc_control_versions and crc_controls...");
      await client.query("TRUNCATE crc_control_versions, crc_controls RESTART IDENTITY CASCADE");
    }
    
    console.log(`💾 Saving ${validRows.length} valid rows to database...`);
    
    for (const row of validRows) {
      const catId = categoryMap.get(row.category_name.toLowerCase().trim())!;
      
      const query = `
        INSERT INTO crc_controls (
          control_id, control_title, category_id, expected_timeline, priority, status, applicable_to,
          control_statement, control_objective, risk_description,
          implementation, evidence_requirements, compliance_mapping, aima_mapping,
          version
        )
        VALUES ($1, $2, $3, $4, $5, 'Published', $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12::jsonb, $13::jsonb, 1)
        ON CONFLICT (control_id) DO UPDATE SET
          control_title = EXCLUDED.control_title,
          category_id = EXCLUDED.category_id,
          expected_timeline = EXCLUDED.expected_timeline,
          priority = EXCLUDED.priority,
          control_statement = EXCLUDED.control_statement,
          control_objective = EXCLUDED.control_objective,
          risk_description = EXCLUDED.risk_description,
          implementation = EXCLUDED.implementation,
          evidence_requirements = EXCLUDED.evidence_requirements,
          compliance_mapping = EXCLUDED.compliance_mapping,
          aima_mapping = EXCLUDED.aima_mapping,
          status = EXCLUDED.status,
          version = crc_controls.version + 1,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id, version
      `;
      
      const values = [
        row.control_id, row.control_title, catId, row.expected_timeline, row.priority,
        [], // applicable_to (not in CSV, defaulting to empty array)
        row.control_statement, row.control_objective, row.risk_description,
        JSON.stringify(row.implementation), JSON.stringify(row.evidence_requirements),
        JSON.stringify(row.compliance_mapping), JSON.stringify(row.aima_mapping)
      ];
      
      await client.query(query, values);
      successCount++;
    }
    
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Database transaction failed:", error);
    process.exit(1);
  } finally {
    client.release();
  }
  
  // 4. Reporting
  console.log("\n✨ Upload Summary:");
  console.log(`  - Total processed: ${dataRows.length}`);
  console.log(`  - Successfully ${mode === 'reset' ? 'inserted' : 'upserted'}: ${successCount}`);
  console.log(`  - Failed/Invalid: ${invalidRows.length}`);
  
  if (invalidRows.length > 0) {
    const errorLog = invalidRows.map(inv => `[Row ${inv.index}] ${inv.data}: ${JSON.stringify(inv.errors)}`).join("\n");
    fs.writeFileSync(LOG_PATH, errorLog);
    console.log(`\n⚠️  Found ${invalidRows.length} errors. Details written to: ${LOG_PATH}`);
  }
  
  process.exit(0);
}

uploadControls().catch(err => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
