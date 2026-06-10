export interface Option {
  value: string;
  score: number;
  label: string;
}

export interface Question {
  id: string;
  section: "profile" | "data" | "governance" | "operational";
  text: string;
  options: Option[];
}

export interface PrefilledAnswer {
  optionValue: string;
  evidence: string;
  url: string;
}

export interface VendorPrefill {
  lastVerified: string;
  defaultRiskTierSuggestion: "Low" | "Medium" | "High" | "Critical";
  answers: Record<string, PrefilledAnswer>;
}

export const SECTIONS = [
  { id: "profile", label: "Vendor Profile" },
  { id: "data", label: "Data Processing" },
  { id: "governance", label: "AI-Specific Governance" },
  { id: "operational", label: "Operational Risk" }
] as const;

export const VENDOR_QUESTIONS: Question[] = [
  // Section 1: Vendor Profile
  {
    id: "VP-1",
    section: "profile",
    text: "Vendor Corporate Standing & Certifications",
    options: [
      { value: "0", score: 0, label: "ISO 27001 + SOC 2 Type II certified by reputable third-party auditors" },
      { value: "1", score: 1, label: "SOC 2 Type II or ISO 27001 only (lacks one of the two)" },
      { value: "2", score: 2, label: "SOC 2 Type I or self-assessment compliance questionnaire only" },
      { value: "3", score: 3, label: "No independent third-party security audits or certifications" }
    ]
  },
  {
    id: "VP-2",
    section: "profile",
    text: "Liability & Indemnification for AI Outputs",
    options: [
      { value: "0", score: 0, label: "Full intellectual property and copyright indemnification for generated outputs" },
      { value: "1", score: 1, label: "Limited liability or cap on IP/output indemnification" },
      { value: "2", score: 2, label: "Standard commercial liability with explicit disclaimers for AI outputs" },
      { value: "3", score: 3, label: "Total disclaimer of liability, placing all output risks on the customer" }
    ]
  },
  {
    id: "VP-3",
    section: "profile",
    text: "Regulatory Alignment & Compliance (GDPR, EU AI Act, HIPAA)",
    options: [
      { value: "0", score: 0, label: "Documented compliance program aligned with GDPR, EU AI Act, and HIPAA (if applicable)" },
      { value: "1", score: 1, label: "Partial alignment (GDPR compliant, EU AI Act readiness program in progress)" },
      { value: "2", score: 2, label: "General compliance statement with no specific AI regulatory frameworks addressed" },
      { value: "3", score: 3, label: "No stated commitments or alignment with AI or major data protection regulations" }
    ]
  },
  {
    id: "VP-4",
    section: "profile",
    text: "Subprocessor Risk & Downstream Auditing",
    options: [
      { value: "0", score: 0, label: "Zero third-party subprocessors used for core AI hosting or model execution" },
      { value: "1", score: 1, label: "Subprocessors used but subject to strict DPAs, security reviews, and audits" },
      { value: "2", score: 2, label: "Subprocessors used with minimal oversight or ad-hoc security reviews" },
      { value: "3", score: 3, label: "Subprocessors list is not disclosed, audited, or bound by strict DPAs" }
    ]
  },
  {
    id: "VP-5",
    section: "profile",
    text: "Financial Stability & Operational Track Record",
    options: [
      { value: "0", score: 0, label: "Established enterprise or public company with low default risk" },
      { value: "1", score: 1, label: "Growth-stage startup with major venture backing (e.g. Series C+)" },
      { value: "2", score: 2, label: "Early-stage startup with limited cash runway or funding disclosures" },
      { value: "3", score: 3, label: "Bootstrap entity or financially distressed vendor with high churn/discontinuation risk" }
    ]
  },
  // Section 2: Data Processing
  {
    id: "DP-1",
    section: "data",
    text: "Customer Data Usage for Model Training",
    options: [
      { value: "0", score: 0, label: "Default zero-usage policy: customer input data is never used to train models" },
      { value: "1", score: 1, label: "Opt-out available by default via API, but requires opt-out request for UI/Console" },
      { value: "2", score: 2, label: "Opt-out only available on custom enterprise plans or high-tier licensing" },
      { value: "3", score: 3, label: "Data is actively used for model training and improvement with no opt-out" }
    ]
  },
  {
    id: "DP-2",
    section: "data",
    text: "Data Encryption & Key Management",
    options: [
      { value: "0", score: 0, label: "Encryption in transit (TLS 1.3) & at rest (AES-256) with Customer-Managed Keys (BYOK)" },
      { value: "1", score: 1, label: "Encryption in transit & at rest using vendor-managed keys" },
      { value: "2", score: 2, label: "Encryption in transit only; at rest encryption is basic or unspecified" },
      { value: "3", score: 3, label: "No transit encryption standards or at-rest encryption enforced" }
    ]
  },
  {
    id: "DP-3",
    section: "data",
    text: "Data Retention & Zero Data Retention (ZDR)",
    options: [
      { value: "0", score: 0, label: "Zero Data Retention (ZDR) policy supported: inputs processed strictly in memory" },
      { value: "1", score: 1, label: "Short-term logging (<30 days) strictly for abuse detection and security reviews" },
      { value: "2", score: 2, label: "Retention of data up to 90 days before automated purge" },
      { value: "3", score: 3, label: "Indefinite data caching and logging with no clear automated purge policy" }
    ]
  },
  {
    id: "DP-4",
    section: "data",
    text: "Data Residency & Geographic Hosting Control",
    options: [
      { value: "0", score: 0, label: "Customer can fully pin data processing and storage to specific geo-regions (e.g. EU-only)" },
      { value: "1", score: 1, label: "Primary processing in selected region; backup or metadata stored globally" },
      { value: "2", score: 2, label: "Multi-region routing with Standard Contractual Clauses (SCCs) in place" },
      { value: "3", score: 3, label: "Undisclosed routing; data processed globally with no residency guarantees" }
    ]
  },
  // Section 3: AI-Specific Governance
  {
    id: "AG-1",
    section: "governance",
    text: "Model Robustness & Adversarial Testing",
    options: [
      { value: "0", score: 0, label: "Regular independent red-teaming, jailbreak resistance logs, and vulnerability disclosures published" },
      { value: "1", score: 1, label: "Internal red-teaming performed, reports/summaries available under NDA" },
      { value: "2", score: 2, label: "Ad-hoc internal testing only; no public security evaluations" },
      { value: "3", score: 3, label: "No adversarial testing or vulnerability metrics available" }
    ]
  },
  {
    id: "AG-2",
    section: "governance",
    text: "Bias, Fairness & Discrimination Mitigations",
    options: [
      { value: "0", score: 0, label: "Published model cards, bias evaluation datasets, and quantitative fairness logs" },
      { value: "1", score: 1, label: "Model cards published but lacking quantitative bias evaluation details" },
      { value: "2", score: 2, label: "Policy statements against bias with no empirical test reports or disclosures" },
      { value: "3", score: 3, label: "No bias evaluations or documentation provided" }
    ]
  },
  {
    id: "AG-3",
    section: "governance",
    text: "Model Explainability & Transparency",
    options: [
      { value: "0", score: 0, label: "Disclosures on model architecture, training datasources, and system limits published" },
      { value: "1", score: 1, label: "General system limits and prompt guidelines documented; internals fully blackboxed" },
      { value: "2", score: 2, label: "Minimal API documentation only; no model limitation logs" },
      { value: "3", score: 3, label: "Fully proprietary black-box system with zero training data or limitation disclosures" }
    ]
  },
  {
    id: "AG-4",
    section: "governance",
    text: "IP Infringement Filters & Training Provenance",
    options: [
      { value: "0", score: 0, label: "Automated copyright filters, licensed training data, and full IP infringement protection" },
      { value: "1", score: 1, label: "Copyright filters active on models, but limited IP legal protections" },
      { value: "2", score: 2, label: "General policies regarding training data compliance; no runtime IP filters" },
      { value: "3", score: 3, label: "Training data provenance and IP protection policies undisclosed" }
    ]
  },
  {
    id: "AG-5",
    section: "governance",
    text: "Content Moderation & Safety Guardrails",
    options: [
      { value: "0", score: 0, label: "Real-time safety moderation APIs, input/output content filters, and policy enforcement" },
      { value: "1", score: 1, label: "Opt-in safety filtering tools available on request" },
      { value: "2", score: 2, label: "Basic keyword blocking or system instructions only" },
      { value: "3", score: 3, label: "No moderation or content safety guardrails provided" }
    ]
  },
  // Section 4: Operational Risk
  {
    id: "OR-1",
    section: "operational",
    text: "Service Availability & SLA Commitments",
    options: [
      { value: "0", score: 0, label: "Contractual SLA committing to >=99.9% uptime with financial credits" },
      { value: "1", score: 1, label: "SLA committing to 99.0% - 99.9% uptime with no financial credits" },
      { value: "2", score: 2, label: "Best-effort uptime with a public status page" },
      { value: "3", score: 3, label: "No uptime SLA or status tracking page provided" }
    ]
  },
  {
    id: "OR-2",
    section: "operational",
    text: "Disaster Recovery & Business Continuity (BC/DR)",
    options: [
      { value: "0", score: 0, label: "Annual BC/DR testing, RTO < 4 hrs, RPO < 1 hr, and multi-region failover" },
      { value: "1", score: 1, label: "Documented BC/DR plan with RTO < 24 hrs and daily backups" },
      { value: "2", score: 2, label: "Daily backups performed, but no documented recovery test metrics" },
      { value: "3", score: 3, label: "No BC/DR policies or backup verification logs" }
    ]
  },
  {
    id: "OR-3",
    section: "operational",
    text: "Model Lifecycle & Deprecation Guarantees",
    options: [
      { value: "0", score: 0, label: "Minimum 12-month deprecation notice for model APIs with migration guides" },
      { value: "1", score: 1, label: "6-month deprecation notice policy" },
      { value: "2", score: 2, label: "Ad-hoc model updates and retirement notices (<60 days notice)" },
      { value: "3", score: 3, label: "Models retired or updated silently with zero customer notice" }
    ]
  },
  {
    id: "OR-4",
    section: "operational",
    text: "Incident Response & Data Breach Reporting SLA",
    options: [
      { value: "0", score: 0, label: "Contractual breach notification within 72 hours, backed by dedicated security team" },
      { value: "1", score: 1, label: "Breach notification within 72 hours under general terms" },
      { value: "2", score: 2, label: "Best-effort breach notification with no SLA commitments" },
      { value: "3", score: 3, label: "No commitments on breach notification timelines" }
    ]
  }
];

export const VENDOR_PREFILLS: Record<string, VendorPrefill> = {
  openai: {
    lastVerified: "2026-05-15",
    defaultRiskTierSuggestion: "Low",
    answers: {
      "VP-1": { optionValue: "0", evidence: "OpenAI maintains ISO 27001, ISO 27017, ISO 27018, and SOC 2 Type II compliance audits.", url: "https://trust.openai.com/" },
      "VP-2": { optionValue: "1", evidence: "OpenAI offers IP indemnification for Business and API customers under specific terms of service, with liability caps.", url: "https://openai.com/policies/business-terms" },
      "VP-3": { optionValue: "0", evidence: "OpenAI is fully aligned with GDPR, CCPA, HIPAA (under BAA), and has active EU AI Act compliance programs.", url: "https://trust.openai.com/" },
      "VP-4": { optionValue: "1", evidence: "OpenAI shares subprocessors (like Microsoft Azure) which meet equivalent SOC 2/ISO standards.", url: "https://openai.com/subprocessors" },
      "VP-5": { optionValue: "0", evidence: "OpenAI is backed by multibillion-dollar investments (Microsoft) and enterprise revenues, ensuring stability.", url: "https://openai.com/about" },
      "DP-1": { optionValue: "0", evidence: "By default, customer data submitted via the OpenAI API is never used to train or improve models.", url: "https://openai.com/enterprise-privacy" },
      "DP-2": { optionValue: "1", evidence: "Data is encrypted in transit using TLS 1.2+ and at rest using AES-256 with OpenAI-managed KMS.", url: "https://trust.openai.com/" },
      "DP-3": { optionValue: "1", evidence: "API data is cached temporarily (up to 30 days) strictly for safety/abuse inspection before purge.", url: "https://openai.com/enterprise-privacy" },
      "DP-4": { optionValue: "0", evidence: "Enterprise/API users can pin data processing to specific regions (e.g. EU regions on Azure).", url: "https://trust.openai.com/" },
      "AG-1": { optionValue: "0", evidence: "OpenAI releases System Cards documenting extensive red-teaming and safety testing before publishing models.", url: "https://openai.com/research" },
      "AG-2": { optionValue: "0", evidence: "OpenAI model cards contain quantitative benchmark logs for bias, hallucination, and safety evaluations.", url: "https://openai.com/research" },
      "AG-3": { optionValue: "1", evidence: "OpenAI documents training bounds and parameters but model weights remain closed.", url: "https://openai.com/research" },
      "AG-4": { optionValue: "0", evidence: "OpenAI uses filtering heuristics to remove copyrighted text from training inputs, and covers IP infringement.", url: "https://trust.openai.com/" },
      "AG-5": { optionValue: "0", evidence: "OpenAI provides free access to Moderation API and implements severe safety system prompts.", url: "https://openai.com/policies/usage-policies" },
      "OR-1": { optionValue: "1", evidence: "OpenAI offers 99.5% uptime commitments for enterprise customers; status page tracks all outages.", url: "https://status.openai.com" },
      "OR-2": { optionValue: "1", evidence: "Disaster recovery, data replication, and regular drills are maintained by OpenAI security engineers.", url: "https://trust.openai.com/" },
      "OR-3": { optionValue: "0", evidence: "OpenAI provides deprecation schedules for legacy models, typically giving at least 12 months notice.", url: "https://platform.openai.com/docs/deprecations" },
      "OR-4": { optionValue: "0", evidence: "OpenAI contractually commits to notifying customers of data breach incidents within 72 hours.", url: "https://openai.com/policies/business-terms" }
    }
  },
  anthropic: {
    lastVerified: "2026-05-01",
    defaultRiskTierSuggestion: "Low",
    answers: {
      "VP-1": { optionValue: "0", evidence: "Anthropic is certified SOC 2 Type II, ISO 27001, and HIPAA compliant.", url: "https://trust.anthropic.com/" },
      "VP-2": { optionValue: "0", evidence: "Anthropic Commercial Terms include full copyright indemnity for generated output claims.", url: "https://www.anthropic.com/legal/commercial-terms" },
      "VP-3": { optionValue: "0", evidence: "Anthropic maintains GDPR compliance and has released detailed materials regarding EU AI Act alignment.", url: "https://trust.anthropic.com/" },
      "VP-4": { optionValue: "1", evidence: "Core models run on AWS Bedrock and Google Cloud Vertex AI, complying with SOC 2/ISO standards.", url: "https://www.anthropic.com/subprocessors" },
      "VP-5": { optionValue: "1", evidence: "Anthropic is a well-funded AI safety startup with over $7B raised from Google, Amazon, etc.", url: "https://www.anthropic.com/about" },
      "DP-1": { optionValue: "0", evidence: "Customer prompts and outputs submitted via Anthropic APIs are not used for model training.", url: "https://www.anthropic.com/consumer-privacy" },
      "DP-2": { optionValue: "1", evidence: "All transit data is encrypted via TLS 1.3; data is encrypted at rest using AES-256.", url: "https://trust.anthropic.com/" },
      "DP-3": { optionValue: "1", evidence: "Anthropic retains API logs for up to 30 days for safety reviews, then automatically deletes them.", url: "https://www.anthropic.com/consumer-privacy" },
      "DP-4": { optionValue: "0", evidence: "Through AWS Bedrock or Vertex AI integrations, customers can pin data to EU/US sovereign zones.", url: "https://trust.anthropic.com/" },
      "AG-1": { optionValue: "0", evidence: "Anthropic has a dedicated Red Teaming team and publishes comprehensive model safety evaluations.", url: "https://www.anthropic.com/news/constitutional-ai" },
      "AG-2": { optionValue: "0", evidence: "Anthropic publishes model cards detailing fairness, bias, and toxic output mitigation assessments.", url: "https://www.anthropic.com/news/constitutional-ai" },
      "AG-3": { optionValue: "0", evidence: "Detailed explanations of Constitutional AI policies and dataset curation details are public.", url: "https://www.anthropic.com/index/constitutional-ai-harmlessness-from-ai-feedback" },
      "AG-4": { optionValue: "0", evidence: "Anthropic implements strict filters to omit copyrighted materials and protects commercial users legally.", url: "https://www.anthropic.com/legal/commercial-terms" },
      "AG-5": { optionValue: "0", evidence: "Constitutional AI principles guide safety and filter outputs directly at the architecture level.", url: "https://www.anthropic.com/news/constitutional-ai" },
      "OR-1": { optionValue: "1", evidence: "99.5% uptime target with status page tracking API reliability.", url: "https://status.anthropic.com" },
      "OR-2": { optionValue: "1", evidence: "Maintains business continuity policies backed by AWS/GCP infrastructure resiliency.", url: "https://trust.anthropic.com/" },
      "OR-3": { optionValue: "1", evidence: "API terms guarantee deprecation timelines of at least 6 months for legacy models.", url: "https://www.anthropic.com/legal/commercial-terms" },
      "OR-4": { optionValue: "0", evidence: "Anthropic commits to notifying enterprise clients of any security incident within 72 hours.", url: "https://www.anthropic.com/legal/commercial-terms" }
    }
  },
  google: {
    lastVerified: "2026-05-20",
    defaultRiskTierSuggestion: "Low",
    answers: {
      "VP-1": { optionValue: "0", evidence: "Google Cloud is audited under ISO 27001, 27017, 27018, and SOC 2 Type II standard programs.", url: "https://cloud.google.com/security/compliance" },
      "VP-2": { optionValue: "0", evidence: "Google Cloud offers generous IP indemnification including copyright protection for Gemini outputs.", url: "https://cloud.google.com/terms/generative-ai-indemnification" },
      "VP-3": { optionValue: "0", evidence: "Google is aligned with global regulations including GDPR, HIPAA, and the EU AI Act compliance program.", url: "https://cloud.google.com/security/compliance" },
      "VP-4": { optionValue: "1", evidence: "Subprocessors are vetted and audited under Google Cloud standard compliance agreements.", url: "https://cloud.google.com/terms/subprocessors" },
      "VP-5": { optionValue: "0", evidence: "Backed by Alphabet Inc., one of the largest public technology companies globally.", url: "https://abc.xyz" },
      "DP-1": { optionValue: "0", evidence: "Google Cloud Vertex AI guarantees that customer data is never used to train base models.", url: "https://cloud.google.com/vertex-ai/docs/generative-ai/data-governance" },
      "DP-2": { optionValue: "0", evidence: "Supports Customer Managed Encryption Keys (CMEK) at rest and TLS 1.3 in transit.", url: "https://cloud.google.com/security/encryption" },
      "DP-3": { optionValue: "0", evidence: "Data is processed strictly in-memory or stored transiently for Gemini API calls if configured.", url: "https://cloud.google.com/vertex-ai/docs/generative-ai/data-governance" },
      "DP-4": { optionValue: "0", evidence: "Vertex AI allows complete pinning of models and data to regional zones (e.g. Frankfurt, Iowa).", url: "https://cloud.google.com/vertex-ai/docs/general/locations" },
      "AG-1": { optionValue: "0", evidence: "Google maintains an AI Safety Red Team and publishes extensive vulnerability analysis logs.", url: "https://safety.google/principles/" },
      "AG-2": { optionValue: "0", evidence: "Provides model cards detailing fairness, bias evaluations, and safety limits for Gemini.", url: "https://ai.google/responsibility/" },
      "AG-3": { optionValue: "1", evidence: "Documents general limitations, tuning datasets, but weights remain proprietary.", url: "https://ai.google/responsibility/" },
      "AG-4": { optionValue: "0", evidence: "Uses active filters to block copyrighted code/text generations, and defends customers legally.", url: "https://cloud.google.com/terms/generative-ai-indemnification" },
      "AG-5": { optionValue: "0", evidence: "Google Cloud provides built-in safety attributes to filter hate speech, harassment, etc.", url: "https://cloud.google.com/vertex-ai/docs/generative-ai/safety-attributes" },
      "OR-1": { optionValue: "0", evidence: "Google Cloud Vertex AI SLA commits to >=99.9% availability, backed by financial credits.", url: "https://cloud.google.com/vertex-ai/sla" },
      "OR-2": { optionValue: "0", evidence: "Enterprise class BC/DR with automated geographical failover options.", url: "https://cloud.google.com/security/disaster-recovery" },
      "OR-3": { optionValue: "0", evidence: "Google commits to a minimum of 12 months notice for model retirement via Vertex deprecations.", url: "https://cloud.google.com/vertex-ai/docs/general/deprecation" },
      "OR-4": { optionValue: "0", evidence: "Under Google Cloud Data Processing Addendum, breach notifications occur within 72 hours.", url: "https://cloud.google.com/terms/data-processing-terms" }
    }
  },
  "aws bedrock": {
    lastVerified: "2026-05-18",
    defaultRiskTierSuggestion: "Low",
    answers: {
      "VP-1": { optionValue: "0", evidence: "AWS Bedrock is fully compliant with SOC 2 Type II, ISO 27001, and HIPAA.", url: "https://aws.amazon.com/compliance" },
      "VP-2": { optionValue: "0", evidence: "AWS provides standard intellectual property protection, which extends to generative AI outputs under Bedrock.", url: "https://aws.amazon.com/agreement" },
      "VP-3": { optionValue: "0", evidence: "Aligned with GDPR, HIPAA, and has released detailed guides on EU AI Act readiness.", url: "https://aws.amazon.com/compliance" },
      "VP-4": { optionValue: "1", evidence: "AWS manages all infrastructure; third-party base model providers (e.g. Anthropic) are bound by AWS's standard subprocessor rules.", url: "https://aws.amazon.com/compliance" },
      "VP-5": { optionValue: "0", evidence: "Amazon Web Services (AWS) is the largest cloud provider globally, backed by Amazon.com Inc.", url: "https://aws.amazon.com" },
      "DP-1": { optionValue: "0", evidence: "AWS Bedrock guarantees that customer prompts and completions are never used to train base models.", url: "https://aws.amazon.com/bedrock/security-privacy" },
      "DP-2": { optionValue: "0", evidence: "Supports AWS KMS keys for full BYOK data encryption at rest, and TLS 1.3 in transit.", url: "https://aws.amazon.com/bedrock/security-privacy" },
      "DP-3": { optionValue: "0", evidence: "Data is not stored or cached by AWS; processing is transient unless customers explicitly enable logs.", url: "https://aws.amazon.com/bedrock/security-privacy" },
      "DP-4": { optionValue: "0", evidence: "AWS Bedrock allows customers to pin workloads to selected AWS Availability Zones globally.", url: "https://aws.amazon.com/about-aws/global-infrastructure" },
      "AG-1": { optionValue: "0", evidence: "Bedrock features extensive red-teaming checks and model compliance certifications.", url: "https://aws.amazon.com/bedrock/security-privacy" },
      "AG-2": { optionValue: "0", evidence: "AWS requires base model providers on Bedrock to publish model cards detailing evaluation metrics.", url: "https://aws.amazon.com/bedrock/security-privacy" },
      "AG-3": { optionValue: "1", evidence: "Explainability guides document baseline parameters and tokens; weights remain closed.", url: "https://aws.amazon.com/bedrock" },
      "AG-4": { optionValue: "0", evidence: "AWS provides intellectual property indemnity for the use of standard Bedrock models.", url: "https://aws.amazon.com/agreement" },
      "AG-5": { optionValue: "0", evidence: "Guardrails for Amazon Bedrock allows real-time content filtering and PII redaction.", url: "https://aws.amazon.com/bedrock/guardrails" },
      "OR-1": { optionValue: "0", evidence: "SLA commits to >=99.9% availability, backed by Amazon service credits.", url: "https://aws.amazon.com/compute/sla" },
      "OR-2": { optionValue: "0", evidence: "Enterprise cloud backup, disaster recovery, and multi-region routing capabilities.", url: "https://aws.amazon.com/disaster-recovery" },
      "OR-3": { optionValue: "0", evidence: "AWS provides long-term deprecation notices for APIs and models in Bedrock, typically >=12 months.", url: "https://docs.aws.amazon.com/bedrock/latest/userguide" },
      "OR-4": { optionValue: "0", evidence: "AWS security incident response guarantees customer notifications within 72 hours.", url: "https://aws.amazon.com/agreement" }
    }
  },
  "azure openai": {
    lastVerified: "2026-05-15",
    defaultRiskTierSuggestion: "Low",
    answers: {
      "VP-1": { optionValue: "0", evidence: "Microsoft Azure maintains extensive compliance certifications including SOC 2 Type II, ISO 27001, and FedRAMP.", url: "https://learn.microsoft.com/en-us/azure/compliance/" },
      "VP-2": { optionValue: "0", evidence: "Microsoft provides the Customer Copyright Commitment, which fully indemnifies users against copyright output claims.", url: "https://www.microsoft.com/licensing/news/customer-copyright-commitment" },
      "VP-3": { optionValue: "0", evidence: "Fully compliant with GDPR, HIPAA, and has active EU AI Act compliance programs.", url: "https://learn.microsoft.com/en-us/azure/compliance/" },
      "VP-4": { optionValue: "1", evidence: "Subprocessors are vetted and audited under Microsoft's standard commercial contracts.", url: "https://learn.microsoft.com/en-us/legal/intellectual-property/subprocessors" },
      "VP-5": { optionValue: "0", evidence: "Microsoft Corporation is one of the most stable technology firms globally.", url: "https://www.microsoft.com" },
      "DP-1": { optionValue: "0", evidence: "Azure OpenAI guarantees customer prompts and generations are never used for model training.", url: "https://learn.microsoft.com/en-us/legal/cognitive-services/openai/data-privacy" },
      "DP-2": { optionValue: "0", evidence: "Supports Customer-Managed Keys (BYOK) via Azure Key Vault, and TLS 1.2/1.3 encryption.", url: "https://learn.microsoft.com/en-us/legal/cognitive-services/openai/data-privacy" },
      "DP-3": { optionValue: "1", evidence: "Azure OpenAI caches data transiently for up to 30 days for abuse detection, with an opt-out available for eligible enterprise customers.", url: "https://learn.microsoft.com/en-us/legal/cognitive-services/openai/data-privacy" },
      "DP-4": { optionValue: "0", evidence: "Azure OpenAI runs strictly in designated regional Azure datacenters chosen by the customer.", url: "https://learn.microsoft.com/en-us/legal/cognitive-services/openai/data-privacy" },
      "AG-1": { optionValue: "0", evidence: "Microsoft conducts extensive red-teaming and publishes Detailed Safety evaluations for Azure OpenAI.", url: "https://learn.microsoft.com/en-us/legal/cognitive-services/openai/data-privacy" },
      "AG-2": { optionValue: "0", evidence: "Provides Transparency Notes and Model Cards details for cognitive services.", url: "https://learn.microsoft.com/en-us/legal/cognitive-services/openai/transparency-note" },
      "AG-3": { optionValue: "1", evidence: "Documents architecture limitations and moderation thresholds; model weights are closed.", url: "https://learn.microsoft.com/en-us/legal/cognitive-services/openai/transparency-note" },
      "AG-4": { optionValue: "0", evidence: "Protected by Microsoft copyright commitments; incorporates filters to detect IP infringement.", url: "https://www.microsoft.com/licensing/news/customer-copyright-commitment" },
      "AG-5": { optionValue: "0", evidence: "Built-in content safety filters hate speech, self-harm, sexual, and violence content by default.", url: "https://learn.microsoft.com/en-us/azure/ai-services/content-safety" },
      "OR-1": { optionValue: "0", evidence: "Azure SLA commits to 99.9% availability for Cognitive Services.", url: "https://azure.microsoft.com/en-us/support/legal/sla/cognitive-services" },
      "OR-2": { optionValue: "0", evidence: "Enterprise class BC/DR backed by Microsoft Azure global disaster recovery policies.", url: "https://learn.microsoft.com/en-us/azure/reliability/" },
      "OR-3": { optionValue: "0", evidence: "Microsoft commits to deprecated model versions remaining active for at least 12 months.", url: "https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models" },
      "OR-4": { optionValue: "0", evidence: "Breach notification commitment within 72 hours under Azure Security Terms.", url: "https://learn.microsoft.com/en-us/azure/security/" }
    }
  },
  microsoft: {
    lastVerified: "2026-05-15",
    defaultRiskTierSuggestion: "Low",
    answers: {
      "VP-1": { optionValue: "0", evidence: "Microsoft maintains SOC 2 Type II and ISO 27001 certifications across all enterprise SaaS/PaaS systems.", url: "https://trustportal.microsoft.com" },
      "VP-2": { optionValue: "0", evidence: "Microsoft offers Customer Copyright Commitment, which fully indemnifies users against copyright output claims.", url: "https://www.microsoft.com/licensing/news/customer-copyright-commitment" },
      "VP-3": { optionValue: "0", evidence: "Fully compliant with GDPR, HIPAA, and has active EU AI Act compliance programs.", url: "https://trustportal.microsoft.com" },
      "VP-4": { optionValue: "1", evidence: "Subprocessors are vetted and audited under Microsoft's standard commercial contracts.", url: "https://learn.microsoft.com/en-us/legal/intellectual-property/subprocessors" },
      "VP-5": { optionValue: "0", evidence: "Microsoft Corporation is one of the most stable technology firms globally.", url: "https://www.microsoft.com" },
      "DP-1": { optionValue: "0", evidence: "Microsoft enterprise offerings guarantee customer prompts and generations are never used for model training.", url: "https://learn.microsoft.com/en-us/legal/cognitive-services/openai/data-privacy" },
      "DP-2": { optionValue: "0", evidence: "Supports Customer-Managed Keys (BYOK) via Azure Key Vault, and TLS 1.2/1.3 encryption.", url: "https://learn.microsoft.com/en-us/legal/cognitive-services/openai/data-privacy" },
      "DP-3": { optionValue: "1", evidence: "Caches data transiently for up to 30 days for abuse detection, with an opt-out available for eligible enterprise customers.", url: "https://learn.microsoft.com/en-us/legal/cognitive-services/openai/data-privacy" },
      "DP-4": { optionValue: "0", evidence: "Data runs strictly in designated regional Azure datacenters chosen by the customer.", url: "https://learn.microsoft.com/en-us/legal/cognitive-services/openai/data-privacy" },
      "AG-1": { optionValue: "0", evidence: "Microsoft conducts extensive red-teaming and publishes Detailed Safety evaluations for Microsoft Copilot/AI.", url: "https://learn.microsoft.com/en-us/legal/cognitive-services/openai/data-privacy" },
      "AG-2": { optionValue: "0", evidence: "Provides Transparency Notes and Model Cards details for cognitive services.", url: "https://learn.microsoft.com/en-us/legal/cognitive-services/openai/transparency-note" },
      "AG-3": { optionValue: "1", evidence: "Documents architecture limitations and moderation thresholds; model weights are closed.", url: "https://learn.microsoft.com/en-us/legal/cognitive-services/openai/transparency-note" },
      "AG-4": { optionValue: "0", evidence: "Protected by Microsoft copyright commitments; incorporates filters to detect IP infringement.", url: "https://www.microsoft.com/licensing/news/customer-copyright-commitment" },
      "AG-5": { optionValue: "0", evidence: "Built-in content safety filters hate speech, self-harm, sexual, and violence content by default.", url: "https://learn.microsoft.com/en-us/azure/ai-services/content-safety" },
      "OR-1": { optionValue: "0", evidence: "SLA commits to 99.9% availability for enterprise Microsoft 365 / Azure services.", url: "https://azure.microsoft.com/en-us/support/legal/sla/cognitive-services" },
      "OR-2": { optionValue: "0", evidence: "Enterprise class BC/DR backed by Microsoft Azure global disaster recovery policies.", url: "https://learn.microsoft.com/en-us/azure/reliability/" },
      "OR-3": { optionValue: "0", evidence: "Microsoft commits to deprecated model versions remaining active for at least 12 months.", url: "https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models" },
      "OR-4": { optionValue: "0", evidence: "Breach notification commitment within 72 hours under Microsoft Security Terms.", url: "https://learn.microsoft.com/en-us/azure/security/" }
    }
  },
  cohere: {
    lastVerified: "2026-05-10",
    defaultRiskTierSuggestion: "Medium",
    answers: {
      "VP-1": { optionValue: "0", evidence: "Cohere is certified SOC 2 Type II compliant and conducts annual audits.", url: "https://cohere.com/security" },
      "VP-2": { optionValue: "1", evidence: "Cohere legal terms offer standard IP protections and limited output liabilities.", url: "https://cohere.com/terms-of-use" },
      "VP-3": { optionValue: "1", evidence: "GDPR compliant, actively aligning documentation with EU AI Act frameworks.", url: "https://cohere.com/security" },
      "VP-4": { optionValue: "1", evidence: "Cohere runs on AWS, OCI, and GCP, matching standard enterprise subprocessors.", url: "https://cohere.com/subprocessors" },
      "VP-5": { optionValue: "1", evidence: "Backed by $270M+ Series C funding from Nvidia, Oracle, and Salesforce.", url: "https://cohere.com/about" },
      "DP-1": { optionValue: "0", evidence: "Cohere does not use data submitted to its production APIs to train models.", url: "https://cohere.com/security" },
      "DP-2": { optionValue: "1", evidence: "All connections use TLS 1.3; data is encrypted at rest using AES-256 with AWS/GCP KMS.", url: "https://cohere.com/security" },
      "DP-3": { optionValue: "1", evidence: "Default API data is cached temporarily (up to 30 days) for abuse checking, then deleted.", url: "https://cohere.com/security" },
      "DP-4": { optionValue: "0", evidence: "Enterprise contracts support hosting on localized AWS/OCI regions (e.g. EU region).", url: "https://cohere.com/security" },
      "AG-1": { optionValue: "1", evidence: "Cohere conducts internal red-teaming; details are provided to enterprise clients under NDA.", url: "https://cohere.com/responsibility" },
      "AG-2": { optionValue: "0", evidence: "Cohere publishes model cards detailing bias and toxic evaluations for Command models.", url: "https://cohere.com/responsibility" },
      "AG-3": { optionValue: "1", evidence: "Explainability notes are provided, but weights and datasets remain closed.", url: "https://cohere.com/responsibility" },
      "AG-4": { optionValue: "1", evidence: "Applies filters to omit copyrighted material from models; provides standard commercial IP protections.", url: "https://cohere.com/terms-of-use" },
      "AG-5": { optionValue: "0", evidence: "Offers built-in safety configurations for toxicity filtering on responses.", url: "https://cohere.com/responsibility" },
      "OR-1": { optionValue: "1", evidence: "Uptime targets of 99.5% with status checking portal.", url: "https://status.cohere.com" },
      "OR-2": { optionValue: "1", evidence: "Continuity plans are maintained by Cohere security teams; databases are backed up daily.", url: "https://cohere.com/security" },
      "OR-3": { optionValue: "1", evidence: "Guarantees at least 6 months notice prior to model API sunsetting.", url: "https://cohere.com/terms-of-use" },
      "OR-4": { optionValue: "1", evidence: "Commits to notifying customers of confirmed data breaches in a timely manner (72-hour notification targets).", url: "https://cohere.com/security" }
    }
  }
};

export function calculateAssessmentScore(answers: Record<string, { optionValue: string }>): { score: number; riskTier: "Low" | "Medium" | "High" | "Critical" } {
  let score = 0;
  let answeredCount = 0;

  for (const q of VENDOR_QUESTIONS) {
    const answer = answers[q.id];
    if (answer) {
      const opt = q.options.find(o => o.value === answer.optionValue);
      if (opt) {
        score += opt.score;
        answeredCount++;
      }
    }
  }

  // Calculate default tier
  let riskTier: "Low" | "Medium" | "High" | "Critical" = "Low";
  if (score >= 41) riskTier = "Critical";
  else if (score >= 26) riskTier = "High";
  else if (score >= 11) riskTier = "Medium";

  return { score, riskTier };
}
