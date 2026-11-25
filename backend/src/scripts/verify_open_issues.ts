import assert from "assert";
import dotenv from "dotenv";
dotenv.config();

import pool from "../config/database";
import { computeFinalScore } from "../security/scoring";
import { sanitizeConfig } from "../utils/sanitize";
import { BASE_SYSTEM_PROMPT, scrubMiraResponse, cleanPunctuationDashes } from "../services/chatService";
import { renderBrandedEmail } from "../services/emailService";

async function runVerifications() {
  console.log("==========================================================");
  console.log("       VERIFYING MIRA KNOWLEDGE BASE & OPEN ISSUES        ");
  console.log("==========================================================\n");

  // --- 1. Testing F42: Security Scan Scoring & Category Weighting ---
  console.log("--- 1. Testing F42: Security Scan Scoring & Category Weighting ---");
  const categoryScores: Record<string, number> = {
    jailbreak: 100,
    prompt_injection: 100,
    leakage: 100,
    injection: 100,
    output_policy: 100,
    tool_abuse: 100,
    authz_tenant_escape: 100,
    indirect_injection: 100,
    cost_dos: 75, // 1 failure out of 4 tests in cost_dos
    output_channel_injection: 100,
    hallucinated_capability: 100,
    refusal_robustness: 100,
    sensitive_pii_exfiltration: 100,
  };

  const finalScore = computeFinalScore(categoryScores);
  console.log(`Computed final score for 12@100% + 1@75% across 13 categories: ${finalScore}%`);
  assert.strictEqual(finalScore, 98.1, "Expected score to accurately equal 98.1%");
  console.log("✓ PASS: Score accurately computes to 98.1% reflecting the single failed test in cost_dos.\n");

  // --- 2. Testing F42: sanitizeConfig Preserves Authentication Strategy Metadata ---
  console.log("--- 2. Testing F42: sanitizeConfig Preserves Authentication Strategy Metadata ---");
  const rawConfig = {
    endpointUrl: "https://api.example.com/v1/chat",
    apiKey: "sk-live-secret-key-12345",
    apiKeyPlacement: "auth_header",
    apiKeyFieldName: "Authorization",
  };
  const sanitized = sanitizeConfig(rawConfig);
  console.log("Sanitized apiKey:", sanitized.apiKey);
  console.log("Sanitized apiKeyPlacement:", sanitized.apiKeyPlacement);
  console.log("Sanitized apiKeyFieldName:", sanitized.apiKeyFieldName);
  assert.strictEqual(sanitized.apiKey, "[REDACTED]");
  assert.strictEqual(sanitized.apiKeyPlacement, "auth_header");
  assert.strictEqual(sanitized.apiKeyFieldName, "Authorization");
  console.log("✓ PASS: Raw API key is securely redacted while authentication strategy metadata is preserved.\n");

  // --- 3. Testing Mira Knowledge Base Database Ingestion ---
  console.log("--- 3. Testing Mira Knowledge Base Database Ingestion ---");
  const seededTitles = [
    "MATUR Platform Overview",
    "Plans, Pricing and Upgrading",
    "Writing style and formatting",
    "CRC Compliance Readiness Controls",
    "AI Vulnerability Assessment",
    "Fairness and Bias Testing",
    "AI Component Inventory",
    "AI Risk Register",
    "AI System Profile Setup Wizard",
    "AIMA AI Maturity Assessment",
    "Testing Options Hub and how features connect",
    "Evidence status and attaching evidence",
    "EU AI Act risk tiers",
    "Reports and exports",
    "Vendor Risk Assessment",
    "Common questions about controls",
    "Mira capabilities and limits",
  ];

  const dbResult = await pool.query(
    "SELECT title, category, is_active, length(content) as char_len FROM chatbot_instructions WHERE title = ANY($1)",
    [seededTitles]
  );
  console.log(`Found ${dbResult.rows.length} of ${seededTitles.length} seeded rows in chatbot_instructions table.`);
  assert.strictEqual(dbResult.rows.length, seededTitles.length, "All 17 seeded instructions must be present");

  // Check active status without failing if an admin intentionally disabled a row
  const activeCount = dbResult.rows.filter((r) => r.is_active).length;
  console.log(`Active seeded instructions: ${activeCount}/${dbResult.rows.length}`);

  // Verify all seeded titles are accounted for
  const fetchedTitles = new Set(dbResult.rows.map((r) => r.title));
  for (const title of seededTitles) {
    assert(fetchedTitles.has(title), `Expected seeded title "${title}" to exist in chatbot_instructions`);
  }
  console.log("✓ PASS: All 17 expected knowledge base titles exist in chatbot_instructions.");

  // Verify total character footprint against caps
  const totalChars = dbResult.rows.reduce((sum, r) => sum + parseInt(r.char_len, 10), 0);
  console.log(`Total seeded knowledge base content: ${totalChars} characters.`);
  assert(totalChars <= 25000, `Total characters (${totalChars}) must fit within MAX_ADDITIONAL_PROMPT_CHARS (25000)`);
  console.log("✓ PASS: All 17 entries fit safely within the 25,000 character prompt budget.\n");

  // --- 4. Testing Mira Style & Punctuation Enforcement ---
  console.log("--- 4. Testing Mira Style & Punctuation Enforcement ---");
  assert(
    BASE_SYSTEM_PROMPT.includes("Do not use em dashes, en dashes, or hyphens as punctuation."),
    "BASE_SYSTEM_PROMPT must forbid em/en dashes and punctuation hyphens"
  );
  assert(
    BASE_SYSTEM_PROMPT.includes("Avoid hyphenated compound words where a short phrase works."),
    "BASE_SYSTEM_PROMPT must instruct avoiding hyphenated compound words"
  );
  assert(
    BASE_SYSTEM_PROMPT.includes("Prefer short sentences and bullet lists"),
    "BASE_SYSTEM_PROMPT must mandate bullet lists and short sentences"
  );
  assert(
    BASE_SYSTEM_PROMPT.includes("Do not use emoji in compliance answers."),
    "BASE_SYSTEM_PROMPT must forbid emojis"
  );
  assert(
    BASE_SYSTEM_PROMPT.includes("Lead with the direct answer, then give the detail."),
    "BASE_SYSTEM_PROMPT must require leading with direct answer"
  );
  console.log("✓ PASS: BASE_SYSTEM_PROMPT strictly enforces Ross's professional formatting rules.");

  // Test scrubMiraResponse and cleanPunctuationDashes
  const rawResponseWithDashes = "Here is the guidance — it covers the 2024 – 2026 roadmap – from Seed to Bloom.";
  const scrubbedResponse = scrubMiraResponse(rawResponseWithDashes);
  console.log(`Original: "${rawResponseWithDashes}"`);
  console.log(`Scrubbed: "${scrubbedResponse}"`);
  assert(!scrubbedResponse.includes("—"), "Scrubbed response must not contain em dash");
  assert(scrubbedResponse.includes("2024–2026"), "Range dash between digits (with or without spaces) must be preserved as a range");
  assert(!scrubbedResponse.includes("roadmap – from"), "Punctuation en dash must be cleanly replaced");
  console.log("✓ PASS: cleanPunctuationDashes cleanly strips punctuation dashes while preserving numeric ranges.\n");

  // --- 5. Testing F17: Branded Email Service Generation ---
  console.log("--- 5. Testing F17: Branded Email Service Generation ---");
  const sampleEmail = renderBrandedEmail({
    title: "Test Email",
    preheader: "Test Preheader",
    headline: "Welcome to MATUR.ai",
    contentHtml: "<p>Test content</p>",
    ctaText: "Enter Verification Code",
    ctaUrl: "https://matur.ai/verify",
  });
  assert(sampleEmail.includes("2026 MATUR.ai"), "Email must include 2026 copyright");
  assert(sampleEmail.includes("hello@matur.ai"), "Email must reference hello@matur.ai");
  assert(sampleEmail.includes("Enter Verification Code"), "Email must include CTA text");
  console.log("✓ PASS: emailService renders unified branded layout with 2026 copyright and clear CTA.\n");

  console.log("==========================================================");
  console.log("         ALL MIRA KNOWLEDGE BASE CHECKS PASSED!           ");
  console.log("==========================================================");
}

runVerifications()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  });
