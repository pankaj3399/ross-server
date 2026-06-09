export const COMPONENT_TYPES = [
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
] as const;

export type ComponentType = typeof COMPONENT_TYPES[number];

export const DATA_CATEGORIES = [
  "Sensitive Personal Data (e.g. racial/ethnic origin, political opinions)",
  "Health Data",
  "Biometric / Genetic Data",
  "Children's Data",
  "Standard Personal Data (e.g. name, email, contact info)",
  "Financial Data (e.g. credit card, billing details)",
  "Internal/Confidential Business Data",
  "Public / Non-Sensitive Data",
  "No Data Processing"
] as const;

export type DataCategory = typeof DATA_CATEGORIES[number];

export const RISK_TIERS = ["Low", "Medium", "High", "Critical"] as const;
export type RiskTier = typeof RISK_TIERS[number];

export const COMPONENT_STATUSES = ["Active", "Evaluating", "Deprecated"] as const;
export type ComponentStatus = typeof COMPONENT_STATUSES[number];

// Pre-seeded vendor -> model mapping
export const VENDOR_CATALOG: Record<string, string[]> = {
  "OpenAI": [
    "GPT-4o",
    "GPT-4",
    "GPT-3.5-Turbo",
    "o1",
    "o1-mini",
    "Text-Embedding-3-Small",
    "Text-Embedding-3-Large"
  ],
  "Anthropic": [
    "Claude 3.5 Sonnet",
    "Claude 3 Opus",
    "Claude 3 Haiku",
    "Claude 2.1"
  ],
  "Google": [
    "Gemini 1.5 Pro",
    "Gemini 1.5 Flash",
    "Gemini 1.0 Pro",
    "Text-Gecko",
    "Vertex AI Embeddings"
  ],
  "Meta": [
    "Llama 3 8B",
    "Llama 3 70B",
    "Llama 3 405B",
    "Llama 2 13B"
  ],
  "Mistral": [
    "Mistral Large",
    "Mistral 8x22B",
    "Mixtral 8x7B"
  ],
  "Cohere": [
    "Command R+",
    "Command R",
    "Embed English v3",
    "Embed Multilingual v3"
  ],
  "AWS Bedrock": [
    "Claude 3.5 Sonnet (Bedrock)",
    "Llama 3 (Bedrock)",
    "Titan Embeddings"
  ],
  "Azure OpenAI": [
    "GPT-4 (Azure)",
    "GPT-3.5 (Azure)",
    "Ada-002 (Azure)"
  ],
  "Vertex AI": [
    "Gemini 1.5 Pro (Vertex)",
    "Gemini 1.5 Flash (Vertex)"
  ],
  "HuggingFace": [
    "Various Open Source Models"
  ],
  "Pinecone": [
    "Serverless Index",
    "Pod Index"
  ],
  "Weaviate": [
    "Cloud Service",
    "Self-Hosted"
  ],
  "ChromaDB": [
    "Local SQLite",
    "Docker"
  ],
  "Qdrant": [
    "Cloud Index",
    "Self-Hosted"
  ],
  "LangChain": [
    "Agent/Chain Pipeline"
  ],
  "LlamaIndex": [
    "RAG Pipeline"
  ],
  "Other": [
    "Custom Model/Service"
  ]
};

export const PROVIDERS = Object.keys(VENDOR_CATALOG);

export const VENDOR_COMPLIANCE_URLS: Record<string, string> = {
  "OpenAI": "https://trust.openai.com/",
  "Anthropic": "https://trust.anthropic.com/",
  "Google": "https://cloud.google.com/security/compliance",
  "AWS Bedrock": "https://aws.amazon.com/compliance",
  "Azure OpenAI": "https://learn.microsoft.com/en-us/azure/compliance/",
  "Cohere": "https://cohere.com/security",
  "Pinecone": "https://www.pinecone.io/security/",
  "Weaviate": "https://weaviate.io/security"
};

// Frontend client-side risk tier suggestion matching suggestRiskTier in backend
export function suggestRiskTierFrontend(componentType: string, categories: string[]): RiskTier {
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

// Linkages from Component Type to CRC Control IDs
export const CRC_CONTROL_LINKAGES: Record<string, string[]> = {
  "Internal Proprietary Model": ["GOV-3P-02", "RISK-EVAL-01", "RISK-ID-01", "RISK-IMPACT-01"],
  "Closed Foundation Model": ["GOV-3P-02", "RISK-COST-01", "RISK-IMPACT-02"],
  "Open Source Model": ["RISK-ALT-01", "RISK-EVAL-01", "RISK-IMPACT-01"],
  "Vector Database": ["RISK-EVAL-01", "RISK-ID-01"],
  "Embedding Model": ["RISK-ALT-01", "RISK-EVAL-01"],
  "Cloud AI Service": ["GOV-3P-02", "RISK-COST-01"],
  "Agent Framework": ["RISK-DECIDE-01", "RISK-EVAL-01"],
  "Guardrail Tool": ["RISK-EVAL-01", "RISK-ID-01"],
  "Inference Infrastructure": ["RISK-ALT-01", "RISK-EVAL-01"],
  "Training Dataset": ["RISK-ID-01", "RISK-IMPACT-02"],
  "Validation Dataset": ["RISK-ID-01", "RISK-IMPACT-02"],
  "API Service": ["GOV-3P-02", "RISK-ALT-01"],
  "AI Application UI": ["RISK-BEN-01", "RISK-DECIDE-01"],
  "Evaluation / Monitoring Tool": ["RISK-EVAL-01", "RISK-ID-01"]
};
