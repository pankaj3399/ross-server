// Risk tier auto-suggestion rules based on component type and data categories
export function suggestRiskTier(componentType: string, categories: string[]): "Low" | "Medium" | "High" | "Critical" {
  if (categories.includes("No Data Processing") || categories.length === 0) {
    return "Low";
  }

  const hasCategory = (cats: string[]) => 
    cats.some(c => categories.some(cat => cat.toLowerCase().includes(c.toLowerCase())));

  const hasHighlySensitive = hasCategory(["sensitive personal", "health", "biometric", "children", "sensitive"]);
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
