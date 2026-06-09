export interface WizardAnswers {
  name: string;
  description?: string;
  governance_scope?: "system" | "organization";
  use_case?: string;
  regulatory_role?: "provider" | "deployer" | "both";
  data_categories: string[];
  geographic_scope: string[];
  scale?: string;
  uses_third_party_models?: "yes" | "no" | "not_sure";
  third_party_providers: string[];
  automation_level?: string;
  existing_certifications: string[];
  annex_iii_domains: string[];
  biometric_use?: string;
  affects_children?: "yes" | "no" | "not_sure";
  public_url?: string;
}

export interface StarterRisk {
  title: string;
  category: string;
  rating: "Critical" | "High" | "Medium" | "Low";
  description: string;
  mitigation_plan: string;
}

export interface StarterComponent {
  component_name: string;
  component_type: string;
  provider: string;
  role_in_system: string;
  data_categories_sent: string[];
  risk_tier: "Low" | "Medium" | "High" | "Critical";
  status: "Active" | "Evaluating" | "Deprecated";
}

export interface ControlFlag {
  flag: "MANDATORY" | "RECOMMENDED" | "OPTIONAL";
  reason: string;
}

export interface WizardEngineOutput {
  eu_risk_tier: "UNACCEPTABLE" | "HIGH" | "LIMITED" | "MINIMAL" | "UNCLASSIFIED";
  internal_risk_tier: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  eu_risk_reason: string;
  applicable_frameworks: string[];
  control_flags: Record<string, ControlFlag>;
  suggested_risks: StarterRisk[];
  suggested_components: StarterComponent[];
  vulnerability_scope: string[];
  bias_scope: string[];
  template_variables: Record<string, string>;
  copilot_context: string;
  article5_warning: boolean;
  article50_note: boolean;
  gpai_warning: boolean;
  informational_notes: string[];
}

/**
 * Deterministic rules engine that processes wizard answers and returns compliance and risk outputs.
 * 
 * @param answers The 15 wizard answers
 * @param controls All available compliance controls (for Rule Set 3 flagging)
 */
export function runRulesEngine(answers: WizardAnswers, controls: any[] = []): WizardEngineOutput {
  const data_categories = answers.data_categories || [];
  const geographic_scope = answers.geographic_scope || [];
  const third_party_providers = answers.third_party_providers || [];
  const annex_iii_domains = answers.annex_iii_domains || [];
  const existing_certifications = answers.existing_certifications || [];

  // ==========================================
  // RULE SET 1: EU AI Act & Internal Risk Tiers
  // ==========================================
  let eu_risk_tier: WizardEngineOutput["eu_risk_tier"] = "MINIMAL";
  let eu_risk_reason = "System has minimal exposure to high-risk domains under the EU AI Act.";
  let article5_warning = false;
  let article50_note = false;
  let gpai_warning = false;
  const informational_notes: string[] = [];

  // 1.1 Prohibited Practices (Article 5) -> UNACCEPTABLE
  const isEmotionInWorkplace = answers.biometric_use === "emotion_recognition" && 
    (answers.use_case === "employment_hr" || annex_iii_domains.includes("employment_hr") || annex_iii_domains.includes("education_vocational"));
  
  const isPublicBiometricSpace = answers.biometric_use === "public_spaces_identification";
  const isSocialScoring = answers.use_case === "social_scoring";
  const isCognitiveManipulation = answers.use_case === "cognitive_behavioral_manipulation";

  if (isEmotionInWorkplace || isPublicBiometricSpace || isSocialScoring || isCognitiveManipulation) {
    eu_risk_tier = "UNACCEPTABLE";
    article5_warning = true;
    if (isEmotionInWorkplace) {
      eu_risk_reason = "Prohibited practice under EU AI Act Article 5: Emotion recognition in workplace or educational environments.";
    } else if (isPublicBiometricSpace) {
      eu_risk_reason = "Prohibited practice under EU AI Act Article 5: Real-time remote biometric identification in publicly accessible spaces.";
    } else if (isSocialScoring) {
      eu_risk_reason = "Prohibited practice under EU AI Act Article 5: Social scoring systems by public authorities or private entities.";
    } else {
      eu_risk_reason = "Prohibited practice under EU AI Act Article 5: Cognitive behavioral manipulation systems causing physical or psychological harm.";
    }
  }
  // 1.2 High-Risk AI Systems (Annex III / Annex I) -> HIGH
  else {
    const hasAnnexIIIDomains = annex_iii_domains.length > 0 && !annex_iii_domains.includes("none");
    const isCriticalUseCase = answers.use_case === "medical_diagnosis" || answers.use_case === "employment_hr" || answers.use_case === "critical_infrastructure";
    const isSensitiveBiometrics = answers.biometric_use === "biometric_categorization" || answers.biometric_use === "verification_authentication";
    const affectsVulnerable = answers.affects_children === "yes";

    if (hasAnnexIIIDomains || isCriticalUseCase || isSensitiveBiometrics || affectsVulnerable) {
      eu_risk_tier = "HIGH";
      if (hasAnnexIIIDomains) {
        eu_risk_reason = `Classified as High-Risk under EU AI Act Annex III due to deployment in sensitive domain: ${annex_iii_domains.filter(d => d !== "none").join(", ")}.`;
      } else if (isCriticalUseCase) {
        eu_risk_reason = `Classified as High-Risk due to critical use case: ${answers.use_case}.`;
      } else if (isSensitiveBiometrics) {
        eu_risk_reason = `Classified as High-Risk due to biometric processing: ${answers.biometric_use}.`;
      } else {
        eu_risk_reason = "Classified as High-Risk due to direct interaction or impact on children (vulnerable groups).";
      }
    }
    // 1.3 Transparency Obligations (Article 50 / GPAI) -> LIMITED
    else {
      const usesGenAI = answers.uses_third_party_models === "yes" || answers.use_case === "customer_service_chatbot" || answers.use_case === "synthetic_media";
      if (usesGenAI) {
        eu_risk_tier = "LIMITED";
        article50_note = true;
        eu_risk_reason = "Subject to EU AI Act Article 50 transparency obligations (general purpose AI / generative chatbot interface).";
      } else if (geographic_scope.includes("eu_eea")) {
        eu_risk_tier = "MINIMAL";
        eu_risk_reason = "Classified as Minimal Risk under the EU AI Act (standard application with no high-risk characteristics).";
      } else {
        eu_risk_tier = "UNCLASSIFIED";
        eu_risk_reason = "Project falls outside direct EU AI Act risk classification triggers (no EU/EEA geographic scope).";
      }
    }
  }

  // 1.4 Internal Risk Tier Calculation
  let internal_risk_tier: WizardEngineOutput["internal_risk_tier"] = "LOW";
  if (eu_risk_tier === "UNACCEPTABLE") internal_risk_tier = "CRITICAL";
  else if (eu_risk_tier === "HIGH") internal_risk_tier = "HIGH";
  else if (eu_risk_tier === "LIMITED") internal_risk_tier = "MEDIUM";
  else internal_risk_tier = "LOW";

  // Modifier adjustments
  if (answers.scale === "global_massive" && internal_risk_tier === "MEDIUM") {
    internal_risk_tier = "HIGH";
    informational_notes.push("Internal risk tier upgraded to HIGH due to global/massive deployment scale.");
  }
  if (answers.automation_level === "autonomous" && internal_risk_tier === "MEDIUM") {
    internal_risk_tier = "HIGH";
    informational_notes.push("Internal risk tier upgraded to HIGH due to autonomous operating model.");
  }
  if ((data_categories.includes("sensitive") || data_categories.includes("biometric")) && internal_risk_tier === "LOW") {
    internal_risk_tier = "MEDIUM";
    informational_notes.push("Internal risk tier upgraded to MEDIUM due to sensitive/biometric data processing.");
  }

  // GPAI provider warning trigger
  if (answers.uses_third_party_models === "yes" && third_party_providers.length > 0) {
    gpai_warning = true;
    informational_notes.push(`GPAI Warning: Using third-party model providers (${third_party_providers.join(", ")}) requires verifying model cards and ensuring DPA compliance.`);
  }

  // Article 50 extraterritorial note
  if (article50_note && !geographic_scope.includes("eu_eea")) {
    informational_notes.push("Article 50 Extraterritorial Note: Although project scope is external to EU/EEA, serving EU residents triggers Article 50 transparency requirements.");
  }

  // ==========================================
  // RULE SET 2: Framework Applicability
  // ==========================================
  const applicable_frameworks: string[] = [];
  if (geographic_scope.includes("eu_eea") || geographic_scope.includes("global") || answers.scale === "global_massive") {
    applicable_frameworks.push("EU AI Act");
  }
  if (geographic_scope.includes("us") || geographic_scope.includes("global")) {
    applicable_frameworks.push("NIST AI RMF");
  }
  applicable_frameworks.push("ISO/IEC 42001"); // Always applicable for premium projects

  // ==========================================
  // RULE SET 3: CRC Control Flagging
  // ==========================================
  const control_flags: Record<string, ControlFlag> = {};
  
  for (const control of controls) {
    const cid = control.control_id;
    const mapping = control.compliance_mapping || {};
    
    const hasEU = mapping.eu_ai_act && Array.isArray(mapping.eu_ai_act) && mapping.eu_ai_act.length > 0;
    const hasNIST = mapping.nist_ai_rmf && Array.isArray(mapping.nist_ai_rmf) && mapping.nist_ai_rmf.length > 0;
    const hasISO = mapping.iso_42001 && Array.isArray(mapping.iso_42001) && mapping.iso_42001.length > 0;

    let flag: ControlFlag["flag"] = "OPTIONAL";
    let reason = "Control is optional based on current system profile.";

    // ISO 42001 rules
    if (hasISO && applicable_frameworks.includes("ISO/IEC 42001")) {
      if (answers.governance_scope === "organization") {
        flag = "MANDATORY";
        reason = "Mandatory for organizational AI management systems under ISO/IEC 42001.";
      } else {
        flag = "RECOMMENDED";
        reason = "Recommended best practice for system-level AI governance under ISO/IEC 42001.";
      }
    }

    // NIST AI RMF rules
    if (hasNIST && applicable_frameworks.includes("NIST AI RMF")) {
      if (internal_risk_tier === "HIGH" || internal_risk_tier === "CRITICAL") {
        flag = "MANDATORY";
        reason = "Mandatory control under NIST AI RMF for High or Critical risk profiles.";
      } else if (flag !== "MANDATORY") {
        flag = "RECOMMENDED";
        reason = "Recommended control under NIST AI RMF risk management guidelines.";
      }
    }

    // EU AI Act rules (takes precedence)
    if (hasEU && applicable_frameworks.includes("EU AI Act")) {
      if (eu_risk_tier === "HIGH" || eu_risk_tier === "UNACCEPTABLE") {
        flag = "MANDATORY";
        reason = "Mandatory regulatory obligation for High-Risk AI systems under the EU AI Act.";
      } else if (eu_risk_tier === "LIMITED") {
        // Limited risk systems require transparency
        if (cid.includes("COMM") || cid.includes("TRN") || cid.includes("GOV-CUST")) {
          flag = "MANDATORY";
          reason = "Mandatory Article 50 transparency control for Limited Risk systems under the EU AI Act.";
        } else if (flag !== "MANDATORY") {
          flag = "RECOMMENDED";
          reason = "Recommended compliance alignment under the EU AI Act.";
        }
      } else if (flag !== "MANDATORY") {
        flag = "RECOMMENDED";
        reason = "Recommended general risk alignment under the EU AI Act framework.";
      }
    }

    control_flags[cid] = { flag, reason };
  }

  // ==========================================
  // RULE SET 4: Risk Register Pre-Population
  // ==========================================
  const candidateRisks: StarterRisk[] = [];

  if (eu_risk_tier === "UNACCEPTABLE" || eu_risk_tier === "HIGH") {
    candidateRisks.push({
      title: "Regulatory Non-Compliance with EU AI Act High-Risk/Prohibited Obligations",
      category: "Compliance",
      rating: eu_risk_tier === "UNACCEPTABLE" ? "Critical" : "High",
      description: "The system triggers critical high-risk or prohibited criteria under the EU AI Act, risking massive regulatory fines (up to 7% of global turnover) and forced system deactivation.",
      mitigation_plan: "Conduct a formal conformity assessment, designate a named representative in the EU, establish logged human oversight, and compile complete technical documentation."
    });
  }

  if (answers.uses_third_party_models === "yes") {
    candidateRisks.push({
      title: "Third-Party Foundation Model API Dependency and Operational Service Disruption",
      category: "Operational",
      rating: "Medium",
      description: `Dependency on third-party model providers (${third_party_providers.join(", ")}) exposes the platform to provider outages, sudden API deprecations, rate limits, and latency spikes.`,
      mitigation_plan: "Implement local semantic caching, set up fallback API routes to alternative providers, establish circuit breakers, and monitor API consumption thresholds."
    });
  }

  if (answers.biometric_use && answers.biometric_use !== "none") {
    candidateRisks.push({
      title: "Biometric Data Processing Privacy Violation and Algorithmic Misidentification",
      category: "Privacy",
      rating: "High",
      description: `Processing biometric data (${answers.biometric_use}) carries severe privacy compliance risks under GDPR/CCPA and algorithmic misidentification liability.`,
      mitigation_plan: "Execute a full Data Protection Impact Assessment (DPIA), enforce end-to-end encryption for biometric vectors, implement explicit user opt-in, and provide manual override bypasses."
    });
  }

  if (answers.affects_children === "yes") {
    candidateRisks.push({
      title: "Ethical Concerns and Child Safety Safeguard Failures",
      category: "Ethics & Fairness",
      rating: "High",
      description: "System interactions directly impact children, risking exposure to inappropriate generated content or non-compliant data collection of minors.",
      mitigation_plan: "Deploy strict age-gating mechanisms, implement double-moderation guardrails for generated outputs, and strictly isolate minor data with zero-retention policies."
    });
  }

  if (answers.automation_level === "autonomous") {
    candidateRisks.push({
      title: "Unintended Autonomous System Actions and Lack of Human Override Safeguards",
      category: "Safety",
      rating: "High",
      description: "The system is configured to execute autonomous decisions without real-time human validation, risking unmitigated cascading logical errors or harmful system outputs.",
      mitigation_plan: "Designate real-time Human-in-the-loop (HITL) gates for critical decision endpoints, implement a central kill switch, and log all autonomous decisions with detailed audit logs."
    });
  }

  if (data_categories.includes("sensitive")) {
    candidateRisks.push({
      title: "Sensitive Personal Data Leakage and Unauthorized Data Access",
      category: "Privacy",
      rating: "High",
      description: "Processing sensitive attributes (e.g. political opinions, health data, financial status) increases risk of target identification, privacy leaks, or model extraction attacks.",
      mitigation_plan: "Apply strict Row-Level Security (RLS) on DB tables, restrict training data, sanitize input prompts, and utilize differential privacy constraints."
    });
  }

  if (answers.use_case === "employment_hr" || answers.use_case === "education_vocational") {
    candidateRisks.push({
      title: "Algorithmic Bias and Demographic Parity Failures in Screening Decisions",
      category: "Ethics & Fairness",
      rating: "High",
      description: "AI-driven screening in employment/education can codify historical systemic bias, violating non-discrimination laws and leading to litigation.",
      mitigation_plan: "Establish a baseline bias assessment using demographic parity, implement continuous fairness monitoring, and enforce mandatory human review of all negative determinations."
    });
  }

  if (answers.scale === "global_massive") {
    candidateRisks.push({
      title: "Infrastructure Scalability Bottlenecks and API Cost Overruns",
      category: "Operational",
      rating: "Medium",
      description: "Deploying to a global, massive scale without rate limiting or cost controls can lead to exponential operational costs and service denial under high load.",
      mitigation_plan: "Establish automated budget alerts, implement global Content Delivery Networks (CDNs), set up request throttling, and optimize system prompt token lengths."
    });
  }

  // Always add governance baseline risk if we have space
  candidateRisks.push({
    title: "Lack of Formal AI Governance Structure and Accountability RACI Mapping",
    category: "Compliance",
    rating: "Medium",
    description: "Operating AI without clear organizational lines of ownership and operating procedures leads to compliance gaps and uncoordinated incident response.",
    mitigation_plan: "Appoint a designated AI System Owner, establish an AI Governance Committee, and draft a project accountability RACI matrix."
  });

  // Sort: Critical -> High -> Medium -> Low
  const priorityMap = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  candidateRisks.sort((a, b) => priorityMap[b.rating] - priorityMap[a.rating]);

  // Cap at 10
  const suggested_risks = candidateRisks.slice(0, 10);

  // ==========================================
  // RULE SET 5: Component Inventory Pre-Population
  // ==========================================
  const suggested_components: StarterComponent[] = [];
  const riskMapping: Record<string, StarterComponent["risk_tier"]> = {
    CRITICAL: "Critical",
    HIGH: "High",
    MEDIUM: "Medium",
    LOW: "Low"
  };
  const componentRiskTier = riskMapping[internal_risk_tier] || "Low";

  if (answers.uses_third_party_models === "yes" && third_party_providers.length > 0) {
    for (const provider of third_party_providers) {
      if (provider === "openai") {
        suggested_components.push({
          component_name: "OpenAI GPT-4 API Connection",
          component_type: "Closed Foundation Model",
          provider: "OpenAI",
          role_in_system: "Primary large language model used for text generation, semantic reasoning, and conversational features.",
          data_categories_sent: data_categories,
          risk_tier: componentRiskTier,
          status: "Active"
        });
      } else if (provider === "anthropic") {
        suggested_components.push({
          component_name: "Anthropic Claude API Connection",
          component_type: "Closed Foundation Model",
          provider: "Anthropic",
          role_in_system: "Large language model utilized for complex document processing, reasoning, and context window operations.",
          data_categories_sent: data_categories,
          risk_tier: componentRiskTier,
          status: "Active"
        });
      } else if (provider === "google") {
        suggested_components.push({
          component_name: "Google Gemini API Connection",
          component_type: "Closed Foundation Model",
          provider: "Google",
          role_in_system: "Multimodal language model used for general semantic generation and multimedia processing.",
          data_categories_sent: data_categories,
          risk_tier: componentRiskTier,
          status: "Active"
        });
      } else if (provider === "meta") {
        suggested_components.push({
          component_name: "Meta LLaMA Model Instance",
          component_type: "Open Source Model",
          provider: "Meta",
          role_in_system: "Self-hosted open source language model used for localized data processing and custom fine-tuning.",
          data_categories_sent: data_categories,
          risk_tier: componentRiskTier,
          status: "Active"
        });
      } else if (provider === "huggingface") {
        suggested_components.push({
          component_name: "HuggingFace Transformers / Embeddings",
          component_type: "Embedding Model",
          provider: "HuggingFace",
          role_in_system: "Open source embedding models used for local text vectorization and semantic search.",
          data_categories_sent: data_categories,
          risk_tier: componentRiskTier,
          status: "Active"
        });
      }
    }
  }

  // ==========================================
  // RULE SET 6: Vendor Assessment Auto-Queueing
  // ==========================================
  // Return the list of vendors that should be queued for assessment

  // ==========================================
  // RULE SET 7: Vulnerability Assessment Scope
  // ==========================================
  let vulnerability_scope: string[] = [];
  if (answers.uses_third_party_models === "yes" || answers.use_case === "customer_service_chatbot") {
    vulnerability_scope = [
      "LLM01: Prompt Injection",
      "LLM02: Insecure Output Handling",
      "LLM06: Sensitive Information Disclosure",
      "LLM09: Overreliance"
    ];
  } else {
    vulnerability_scope = [
      "Model Evasion (Adversarial)",
      "Data Poisoning",
      "Insecure Input / Output Validation"
    ];
  }

  // ==========================================
  // RULE SET 8: Bias Testing Scope
  // ==========================================
  const bias_scope_set = new Set<string>();
  if (answers.use_case === "employment_hr" || annex_iii_domains.includes("employment_hr")) {
    bias_scope_set.add("Gender");
    bias_scope_set.add("Age");
    bias_scope_set.add("Race/Ethnicity");
  }
  if (answers.biometric_use && answers.biometric_use !== "none") {
    bias_scope_set.add("Race/Ethnicity");
    bias_scope_set.add("Gender");
  }
  if (answers.affects_children === "yes") {
    bias_scope_set.add("Age");
  }
  // Fallbacks
  if (bias_scope_set.size === 0) {
    bias_scope_set.add("Gender");
    bias_scope_set.add("Race/Ethnicity");
  }
  const bias_scope = Array.from(bias_scope_set);

  // ==========================================
  // RULE SET 9: Executive Summary Narrative
  // ==========================================
  const govScopeText = answers.governance_scope === "organization" ? "organization-wide compliance program" : "standalone AI system";
  const providersText = third_party_providers.length > 0 ? `integrating third-party services from ${third_party_providers.join(", ")}` : "relying on fully internal or open-source infrastructure";
  const geoText = geographic_scope.join(" and ");

  const copilotSummary = `This project represents a ${govScopeText}. Under the EU AI Act, it is classified as a ${eu_risk_tier} Risk profile because: ${eu_risk_reason} Internally, the project is rated at a ${internal_risk_tier} Risk tier. The system operates under a ${answers.regulatory_role || "deployer"} role, using ${answers.automation_level || "semi-autonomous"} automation, and is deployed within the ${geoText} geography, ${providersText}.`;

  // ==========================================
  // RULE SET 10: Template Pre-Fill Variables
  // ==========================================
  const template_variables: Record<string, string> = {
    system_name: answers.name,
    system_description: answers.description || "No description provided.",
    risk_tier: eu_risk_tier,
    internal_risk_tier: internal_risk_tier,
    regulatory_role: answers.regulatory_role || "deployer",
    governance_scope: answers.governance_scope || "system",
    primary_use_case: answers.use_case || "general_utility",
    geographic_scope: geographic_scope.join(", "),
    public_url: answers.public_url || "None",
    uses_third_party: answers.uses_third_party_models || "no",
    providers: third_party_providers.join(", ") || "None",
    scale: answers.scale || "local"
  };

  // ==========================================
  // RULE SET 11: Mira Copilot Context Injection
  // ==========================================
  const copilot_context = `[AI System Profile Context]
System/Program Name: ${answers.name}
Governance Scope: ${answers.governance_scope}
EU AI Act Risk Tier: ${eu_risk_tier}
Internal Risk Tier: ${internal_risk_tier}
Risk Justification: ${eu_risk_reason}
Regulatory Role: ${answers.regulatory_role}
Automation Level: ${answers.automation_level}
Geographic Scope: ${geographic_scope.join(", ")}
Data Categories Processed: ${data_categories.join(", ")}
Primary Use Case: ${answers.use_case}
Third-Party Providers: ${third_party_providers.join(", ") || "None"}
Sensitive Domains: ${annex_iii_domains.join(", ")}
Biometric Use: ${answers.biometric_use || "None"}
Child Safety Impact: ${answers.affects_children}
Active Frameworks: ${applicable_frameworks.join(", ")}`;

  return {
    eu_risk_tier,
    internal_risk_tier,
    eu_risk_reason,
    applicable_frameworks,
    control_flags,
    suggested_risks,
    suggested_components,
    vulnerability_scope,
    bias_scope,
    template_variables,
    copilot_context,
    article5_warning,
    article50_note,
    gpai_warning,
    informational_notes
  };
}
