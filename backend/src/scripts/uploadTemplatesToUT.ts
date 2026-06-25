/**
 * uploadTemplatesToUT.ts
 *
 * Idempotent script that uploads CRC compliance templates to UploadThing.
 * Safe to run on every deploy — skips templates already uploaded.
 *
 * Usage:
 *   npx ts-node -r dotenv/config src/scripts/uploadTemplatesToUT.ts
 */

import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { UTApi } from "uploadthing/server";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const TEMPLATES_DIR = path.resolve(
  __dirname,
  "../../../files/CRC_Compliance_Templates_All_138_v3"
);
const DELAY_MS = 200; // delay between uploads to avoid rate limits

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  // 1. Check if templates folder exists
  if (!fs.existsSync(TEMPLATES_DIR)) {
    console.log(
      `[upload-templates] Templates folder not found at ${TEMPLATES_DIR}. Skipping.`
    );
    process.exit(0);
  }

  // 2. Gather all .docx files
  const allFiles = fs
    .readdirSync(TEMPLATES_DIR)
    .filter((f) => f.endsWith(".docx"));

  if (allFiles.length === 0) {
    console.log("[upload-templates] No .docx files found. Skipping.");
    process.exit(0);
  }

  console.log(
    `[upload-templates] Found ${allFiles.length} .docx files in ${TEMPLATES_DIR}`
  );

  // 3. Connect to DB
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // 4. Find which control_ids already have valid UploadThing URLs
    const existingResult = await pool.query(
      `SELECT control_id FROM crc_control_templates
       WHERE url IS NOT NULL AND url != 'embedded' AND url LIKE 'https://%'`
    );
    const alreadyUploaded = new Set<string>(
      existingResult.rows.map((r: { control_id: string }) => r.control_id)
    );

    // 5. Get all valid control_ids from crc_controls
    const controlsResult = await pool.query(
      "SELECT control_id FROM crc_controls"
    );
    const validControlIds = new Set<string>(
      controlsResult.rows.map((r: { control_id: string }) => r.control_id)
    );

    // 6. Filter files to upload
    const toUpload: { filename: string; controlId: string }[] = [];
    const skipped: string[] = [];
    const invalidControl: string[] = [];

    for (const filename of allFiles) {
      const controlId = filename.replace(/\.docx$/, "");
      if (alreadyUploaded.has(controlId)) {
        skipped.push(controlId);
        continue;
      }
      if (!validControlIds.has(controlId)) {
        invalidControl.push(controlId);
        continue;
      }
      toUpload.push({ filename, controlId });
    }

    if (invalidControl.length > 0) {
      console.warn(
        `[upload-templates] ${invalidControl.length} files have no matching control in DB: ${invalidControl.join(", ")}`
      );
    }

    if (toUpload.length === 0) {
      console.log(
        `[upload-templates] All ${skipped.length} templates already uploaded. Nothing to do.`
      );
      process.exit(0);
    }

    console.log(
      `[upload-templates] ${skipped.length} already uploaded, ${toUpload.length} to upload.`
    );

    // 7. Initialize UploadThing
    const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN });

    // 8. Upload sequentially
    let uploaded = 0;
    let errors = 0;

    for (let i = 0; i < toUpload.length; i++) {
      const { filename, controlId } = toUpload[i];
      const filePath = path.join(TEMPLATES_DIR, filename);

      try {
        // Read file
        const fileData = fs.readFileSync(filePath);
        const FileConstructor =
          typeof File !== "undefined"
            ? File
            : require("node:buffer").File;
        const file = new FileConstructor([fileData], filename, {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        // Upload to UploadThing
        const uploadResult = await utapi.uploadFiles(file);

        if (!uploadResult || !uploadResult.data) {
          const errorMsg =
            (uploadResult as any).error?.message ||
            "Unknown upload error";
          throw new Error(errorMsg);
        }

        const { url, key: fileKey } = uploadResult.data;
        const size = fileData.length;

        // Upsert into database
        await pool.query(
          `INSERT INTO crc_control_templates (control_id, url, file_key, filename, size, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (control_id)
           DO UPDATE SET url = $2, file_key = $3, filename = $4, size = $5, updated_at = NOW()`,
          [controlId, url, fileKey, filename, size]
        );

        uploaded++;
        console.log(
          `[upload-templates] [${uploaded + skipped.length}/${allFiles.length}] Uploaded ${controlId}`
        );

        // Delay between uploads
        if (i < toUpload.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
        }
      } catch (err: any) {
        errors++;
        console.error(
          `[upload-templates] ERROR uploading ${controlId}: ${err.message}`
        );
      }
    }

    // 9. Summary
    console.log("\n[upload-templates] ========== SUMMARY ==========");
    console.log(`  Uploaded:  ${uploaded}`);
    console.log(`  Skipped:   ${skipped.length} (already uploaded)`);
    console.log(`  Errors:    ${errors}`);
    console.log(`  Total:     ${uploaded + skipped.length + errors}/${allFiles.length}`);
    console.log("[upload-templates] ============================\n");

    if (errors > 0) {
      console.error(
        `[upload-templates] WARNING: ${errors} template(s) failed to upload.`
      );
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[upload-templates] Fatal error:", err);
  process.exit(1);
});
