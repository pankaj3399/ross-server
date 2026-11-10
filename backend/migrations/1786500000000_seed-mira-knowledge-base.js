/* eslint-disable camelcase */

exports.shorthands = undefined;

const KNOWLEDGE_BASE_ENTRIES = [
  {
    title: "Platform Overview",
    category: "Product & Architecture",
    content: "MATUR.ai is an enterprise AI Governance and Compliance SaaS platform designed to help organizations assess, document, and monitor AI systems against leading global standards: EU AI Act, NIST AI RMF, and ISO/IEC 42001. It brings together risk classification, readiness controls, vulnerability testing, and bias audits into one unified workflow."
  },
  {
    title: "AI System Profile & Classification Wizard",
    category: "Core Features",
    content: "The AI System Profile Wizard is a 6-section guided questionnaire that analyzes system characteristics (intended purpose, deployment territory, data categories, and biometrics). It automatically classifies the AI system into EU AI Act risk tiers (Article 5 Prohibited, Annex III High-Risk, or Limited/Minimal) and dynamically tailors governance requirements."
  },
  {
    title: "Comprehensive Readiness Controls (CRC)",
    category: "Core Features",
    content: "The CRC framework contains 138 governance and operational controls spanning 8 operational domains. Every control is cross-mapped to EU AI Act Annex IV, NIST AI RMF MAP/GOV/MEASURE/MANAGE functions, and ISO 42001 clauses. Users can track implementation status, attach evidence URLs, assign owners, and track completion progress."
  },
  {
    title: "Living Risk Register",
    category: "Core Features",
    content: "The Living Risk Register automatically creates, prioritizes, and updates operational and regulatory risks based on answers in the CRC assessment and wizard outputs. Risks are dynamically updated as controls are satisfied, tracking risk ratings (Critical, High, Medium, Low), owners, and mitigation actions."
  },
  {
    title: "AI Component & Model Inventory",
    category: "Core Features",
    content: "The AI Component Inventory is a centralized asset repository tracking models, foundational APIs, datasets, and pipelines. It categorizes personal and sensitive data usage, third-party vendor dependencies, and computes component risk tiers based on operational criticality."
  },
  {
    title: "Third-Party Vendor Assessments",
    category: "Core Features",
    content: "MATUR.ai includes an 18-question vendor assessment workflow specifically built for third-party AI model providers (e.g., OpenAI, Anthropic, Google). Completing an assessment satisfies third-party supplier governance controls (GOV-3P-01, GOV-3P-02, GOV-3P-03) and assigns a vendor risk rating."
  },
  {
    title: "AI Vulnerability Assessment",
    category: "Core Features",
    content: "The AI Vulnerability Assessment tool executes automated security probes against user-configured LLM endpoints. Probes test against OWASP LLM Top 10 vectors including prompt injection, jailbreaks, data leakage, SSRF/SSTI, indirect injection, and DoS resilience. Full prompt payloads and sanitized responses are retained for auditability."
  },
  {
    title: "Automated Bias & Fairness Testing",
    category: "Core Features",
    content: "Fairness evaluation evaluates datasets and live models across key demographic attributes (gender, age, ethnicity) using the four-fifths (80%) disparate impact rule and demographic parity difference (DPD). Subgroups with sample sizes under 5 are protected against small-sample noise."
  },
  {
    title: "Testing Options Hub",
    category: "Core Features",
    content: "The Testing Options Hub centralizes all technical AI evaluation modules: Manual Prompt Testing, Automated API Security Scans, and CSV Dataset Fairness Analysis. It guides teams on selecting the appropriate evaluation method depending on development lifecycle phase."
  },
  {
    title: "AIMA Assessment (AI Maturity)",
    category: "Core Features",
    content: "The AI Maturity Assessment (AIMA) provides qualitative baseline scoring across foundational organizational dimensions (Strategy, Governance, Data, Technology, and Culture). It is available on the free Seed tier to help organizations understand baseline maturity."
  },
  {
    title: "Executive Reports & Audit Documentation",
    category: "Reporting",
    content: "One-click audit documentation generates comprehensive executive summaries, domain scorecards, and regulatory compliance evidence packages suitable for board review, external auditors, and regulatory submissions under EU AI Act and ISO 42001."
  },
  {
    title: "PDF & Excel Exports",
    category: "Reporting",
    content: "MATUR.ai allows full exports of assessment data into client-ready PDFs (Executive Summary, Full CRC Audit Package, AIMA Scorecard) and structured Excel workbooks for internal compliance records."
  },
  {
    title: "Team Collaboration & Read-Only Viewer Seats",
    category: "Platform & Access",
    content: "Workspaces support multi-user team collaboration. Organizations can invite team members to review assessment findings, audit trails, and security reports. In v1, team invitations grant free, unlimited Read-Only Viewer seats."
  },
  {
    title: "SEED Plan (Free Tier)",
    category: "Pricing & Plans",
    content: "The SEED Plan is MATUR.ai's free tier. It includes 1 project workspace, full baseline AIMA assessment, free-tier system profiling, and 10 messages per day with Mira AI Copilot. It is designed for initial exploratory assessment."
  },
  {
    title: "BLOOM Plan ($100/month)",
    category: "Pricing & Plans",
    content: "The BLOOM Plan is $100/month per active AI system. It includes the complete compliance suite: full AI System Profile with EU AI Act classification, all 138 CRC controls across 3 frameworks, Living Risk Register, Component Inventory, Third-Party Vendor Assessments, Vulnerability Assessment & Automated Bias Testing, Executive PDF & Excel exports, and unlimited Read-Only Viewer seats."
  },
  {
    title: "BLOOM PLUS Plan ($1,000/month & Consulting)",
    category: "Pricing & Plans",
    content: "The BLOOM PLUS Plan is $1,000/month. It includes everything in BLOOM plus 10 hours per month of direct consultation with MATUR.ai AI compliance and regulatory experts (policy authoring, score interpretation, regulator audit preparation, and priority direct support). Interested users can contact hello@matur.ai."
  },
  {
    title: "Consultative Upsell & Upgrade Guidance",
    category: "Guidance & Rules",
    content: "When users on the free Seed tier inquire about premium features (138-control CRC audit readiness, running vulnerability scans, exporting client PDFs, or adding team members), explain how the feature addresses their compliance needs and recommend upgrading to BLOOM ($100/mo) via Project Settings or Compare Plans with a consultative tone."
  }
];

exports.up = (pgm) => {
  for (const entry of KNOWLEDGE_BASE_ENTRIES) {
    const escapedTitle = entry.title.replace(/'/g, "''");
    const escapedContent = entry.content.replace(/'/g, "''");
    const escapedCategory = entry.category.replace(/'/g, "''");

    pgm.sql(`
      INSERT INTO chatbot_instructions (title, content, is_active, category)
      SELECT '${escapedTitle}', '${escapedContent}', true, '${escapedCategory}'
      WHERE NOT EXISTS (
        SELECT 1 FROM chatbot_instructions WHERE title = '${escapedTitle}'
      );
    `);
  }
};

exports.down = (pgm) => {
  const titles = KNOWLEDGE_BASE_ENTRIES.map(e => `'${e.title.replace(/'/g, "''")}'`).join(", ");
  pgm.sql(`DELETE FROM chatbot_instructions WHERE title IN (${titles});`);
};
