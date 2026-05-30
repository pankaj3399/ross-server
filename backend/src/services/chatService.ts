import pool from "../config/database";
import { callClaude } from "./anthropicClient";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_HISTORY_MESSAGES = 20;
const MAX_TOKENS = 1500;

// ─── Base System Prompt ─────────────────────────────────────────────────────

const BASE_SYSTEM_PROMPT = `You are the MATUR.ai AI Copilot — an expert assistant specializing in AI governance, AI compliance, and the MATUR.ai platform. You are friendly, precise, and action-oriented.

## Your Expertise
- **CRC Framework**: MATUR.ai's Compliance Readiness Controls (CRC) — 137 controls across categories like Governance & Strategy, Operations & Monitoring, Risk Management, Data Management, and more. Each control has a control ID, title, priority, implementation requirements, evidence requirements, and compliance mappings.
- **EU AI Act**: Full knowledge of all articles, including risk classification (Article 6), high-risk system requirements (Articles 8-15), transparency obligations (Article 52), AI literacy (Article 4), serious incident reporting (Article 73), and conformity assessment procedures.
- **NIST AI RMF**: The Govern, Map, Measure, and Manage functions, including all sub-categories and their practical applications.
- **ISO 42001**: AI management system requirements, Annex A controls, and how they map to practical implementation.
- **MATUR.ai Platform**: The AI maturity assessment (AIMA) based on the OWASP framework, vulnerability assessment scanning, fairness & bias testing (API-based and dataset-based), CRC compliance assessments, risk registers, team collaboration, compliance document templates, and score reports.

## How You Respond
1. Be concise but thorough — aim for 2-4 paragraphs unless the user asks for a brief answer.
2. When referencing specific regulations, cite the article/clause number.
3. When a user has existing compliance programs (SOC 2, ISO 27001, etc.), acknowledge what they can reuse and focus on what additional AI-specific work is needed.
4. When discussing CRC controls, reference the control ID (e.g., OPS-INC-01) when known.
5. Use numbered lists for multi-step guidance.
6. If a question is ambiguous, give the most helpful answer and note any assumptions.
7. Never make up regulatory citations — if you're unsure, say so.
8. Format your responses in clean markdown with bold text for emphasis and bullet points for lists.

## Platform-Specific Guidance
- **Vulnerability Assessment**: Users connect their AI API endpoint and MATUR.ai runs automated security scanning with adversarial prompts across multiple categories.
- **Fairness & Bias Testing**: Two modes — (1) API endpoint testing where the platform sends test prompts to the user's AI and evaluates responses, and (2) dataset testing where users upload CSV data to analyze for statistical fairness across demographic groups.
- **CRC Assessment**: Users answer each of the 137 controls as Yes (fully implemented), Partially (in progress), No (not implemented), NA (not applicable), or Not Sure. Each control has a downloadable compliance document template.
- **Score Reports**: After completing assessments, users get detailed reports with scores per domain/category, compliance gap analysis, and downloadable PDFs.
- **Team Collaboration**: Project owners can invite team members as Editors or Viewers, and all team members can add comments on projects.`;

// ─── CRC Control Context Builder ────────────────────────────────────────────

async function getCRCControlContext(controlId: string): Promise<string | null> {
  try {
    const result = await pool.query(
      `SELECT c.*, cat.name as category_name
       FROM crc_controls c
       LEFT JOIN crc_categories cat ON c.category_id = cat.id
       WHERE c.id = $1 AND c.status = 'Published'`,
      [controlId]
    );

    if (result.rows.length === 0) return null;

    const control = result.rows[0];

    // Parse JSON fields safely
    let implementation: any = {};
    if (typeof control.implementation === "string") {
      try {
        implementation = JSON.parse(control.implementation);
      } catch (e) {
        console.error(`[ChatService] Failed to parse control.implementation for control ID ${control.id}:`, e);
        implementation = {};
      }
    } else {
      implementation = control.implementation || {};
    }

    let evidenceRequirements: any = [];
    if (typeof control.evidence_requirements === "string") {
      try {
        evidenceRequirements = JSON.parse(control.evidence_requirements);
      } catch (e) {
        console.error(`[ChatService] Failed to parse control.evidence_requirements for control ID ${control.id}:`, e);
        evidenceRequirements = [];
      }
    } else {
      evidenceRequirements = control.evidence_requirements || [];
    }

    let complianceMapping: any = {};
    if (typeof control.compliance_mapping === "string") {
      try {
        complianceMapping = JSON.parse(control.compliance_mapping);
      } catch (e) {
        console.error(`[ChatService] Failed to parse control.compliance_mapping for control ID ${control.id}:`, e);
        complianceMapping = {};
      }
    } else {
      complianceMapping = control.compliance_mapping || {};
    }

    let context = `\n\n## Currently Viewing CRC Control\nThe user is currently on the page for this specific control. Use this information to give targeted, context-aware answers.\n\n`;
    context += `**Control ID**: ${control.control_id}\n`;
    context += `**Title**: ${control.control_title}\n`;
    context += `**Category**: ${control.category_name || "Unknown"}\n`;
    context += `**Priority**: ${control.priority}\n`;
    context += `**Expected Timeline**: ${control.expected_timeline || "Not specified"}\n\n`;

    if (control.control_statement) {
      // Strip HTML tags for the LLM
      const cleanStatement = control.control_statement.replace(/<[^>]*>/g, "");
      context += `**Control Statement**: ${cleanStatement}\n\n`;
    }

    if (control.control_objective) {
      const cleanObjective = control.control_objective.replace(/<[^>]*>/g, "");
      context += `**Objective**: ${cleanObjective}\n\n`;
    }

    if (control.risk_description) {
      const cleanRisk = control.risk_description.replace(/<[^>]*>/g, "");
      context += `**Risk Description**: ${cleanRisk}\n\n`;
    }

    if (implementation.requirements?.length > 0) {
      context += `**Implementation Requirements**:\n`;
      implementation.requirements
        .filter((r: string) => r)
        .forEach((req: string, i: number) => {
          context += `${i + 1}. ${req}\n`;
        });
      context += "\n";
    }

    if (implementation.steps?.length > 0) {
      context += `**Implementation Steps**:\n`;
      implementation.steps
        .filter((s: string) => s)
        .forEach((step: string, i: number) => {
          context += `${i + 1}. ${step}\n`;
        });
      context += "\n";
    }

    if (evidenceRequirements?.length > 0) {
      const filtered = evidenceRequirements.filter((e: string) => e);
      if (filtered.length > 0) {
        context += `**Evidence Requirements**:\n`;
        filtered.forEach((evidence: string, i: number) => {
          context += `- ${evidence}\n`;
        });
        context += "\n";
      }
    }

    // Compliance mappings
    const mappingParts: string[] = [];
    if (complianceMapping.eu_ai_act?.length > 0) {
      const refs = complianceMapping.eu_ai_act
        .map((m: { ref: string; context: string }) => `${m.ref}${m.context ? ` (${m.context})` : ""}`)
        .join(", ");
      mappingParts.push(`EU AI Act: ${refs}`);
    }
    if (complianceMapping.nist_ai_rmf?.length > 0) {
      const refs = complianceMapping.nist_ai_rmf
        .map((m: { ref: string; context: string }) => `${m.ref}${m.context ? ` (${m.context})` : ""}`)
        .join(", ");
      mappingParts.push(`NIST AI RMF: ${refs}`);
    }
    if (complianceMapping.iso_42001?.length > 0) {
      const refs = complianceMapping.iso_42001
        .map((m: { ref: string; context: string }) => `${m.ref}${m.context ? ` (${m.context})` : ""}`)
        .join(", ");
      mappingParts.push(`ISO 42001: ${refs}`);
    }
    if (mappingParts.length > 0) {
      context += `**Compliance Mapping**: ${mappingParts.join(" | ")}\n`;
    }

    return context;
  } catch (error) {
    console.error("[ChatService] Failed to fetch CRC control context:", error);
    return null;
  }
}

// ─── Main Chat Handler ──────────────────────────────────────────────────────

export async function handleChatMessage(
  messages: ChatMessage[],
  controlId?: string
): Promise<string> {
  // Trim history to last N messages
  const trimmedMessages = messages.slice(-MAX_HISTORY_MESSAGES);

  // Build system prompt
  let systemPrompt = BASE_SYSTEM_PROMPT;

  // Fetch and append custom admin instructions if any are active
  try {
    const MAX_INSTRUCTIONS_LIMIT = 10;
    const MAX_ADDITIONAL_PROMPT_CHARS = 4000; // ~1000 tokens limit for custom prompts combined
    const MAX_SINGLE_INSTRUCTION_CHARS = 1000; // ~250 tokens per single instruction

    const instructionsResult = await pool.query(
      `SELECT title, content FROM chatbot_instructions 
       WHERE is_active = true 
       ORDER BY created_at ASC 
       LIMIT $1`,
      [MAX_INSTRUCTIONS_LIMIT]
    );

    if (instructionsResult.rows.length > 0) {
      let additionalPrompt = `\n\n## Additional Instructions\nAdhere strictly to the following administrative instructions and context:`;
      let characterCapReached = false;

      for (const row of instructionsResult.rows) {
        let content = row.content || "";
        
        // Truncate single instruction content if it exceeds the limit
        if (content.length > MAX_SINGLE_INSTRUCTION_CHARS) {
          content = content.substring(0, MAX_SINGLE_INSTRUCTION_CHARS) + "... [truncated]";
          console.warn(`[ChatService] Individual chatbot instruction "${row.title}" content truncated because it exceeded ${MAX_SINGLE_INSTRUCTION_CHARS} characters.`);
        }

        const block = `\n\n### ${row.title}\n${content}`;
        
        // Stop appending if we would exceed the combined character threshold
        if (additionalPrompt.length + block.length > MAX_ADDITIONAL_PROMPT_CHARS) {
          characterCapReached = true;
          console.warn(`[ChatService] Chatbot instructions append capped: adding "${row.title}" would exceed the combined threshold of ${MAX_ADDITIONAL_PROMPT_CHARS} characters.`);
          break;
        }

        additionalPrompt += block;
      }

      if (characterCapReached) {
        additionalPrompt += `\n\n... [Some administrative instructions truncated due to token size limits]`;
      }

      systemPrompt += additionalPrompt;
    }

    // Log the resulting system prompt length and token estimate
    const estimatedTokens = Math.ceil(systemPrompt.length / 4);
    console.log(`[ChatService] Assembled systemPrompt length: ${systemPrompt.length} chars (Estimated ${estimatedTokens} tokens)`);

  } catch (error) {
    console.error("[ChatService] Failed to fetch active chatbot instructions:", error);
  }

  // Inject CRC control context if the user is on a control page
  if (controlId) {
    const controlContext = await getCRCControlContext(controlId);
    if (controlContext) {
      systemPrompt += controlContext;
    }
  }

  // Build the user prompt from conversation history
  // Claude requires alternating user/assistant messages
  // We send the full history as a structured conversation in the user prompt
  const conversationParts = trimmedMessages.map((msg) => {
    const roleLabel = msg.role === "user" ? "User" : "Assistant";
    return `${roleLabel}: ${msg.content}`;
  });

  const userPrompt = conversationParts.join("\n\n");

  const reply = await callClaude({
    systemPrompt,
    userPrompt,
    maxTokens: MAX_TOKENS,
    label: "AI Copilot",
  });

  return reply;
}
