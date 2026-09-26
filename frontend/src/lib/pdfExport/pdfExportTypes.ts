export interface FullPdfData {
  projectName: string;
  projectDescription: string;
  timestamp: string;
  systemProfile: {
    narrative: string;
    data: {
      name: string;
      description: string;
      governanceScope: string;
      useCase: string;
      regulatoryRole: string;
      scale: string;
      usesThirdPartyModels: string;
      automationLevel: string;
      biometricUse: string;
      affectsChildren: string;
      euRiskTier: string;
      internalRiskTier: string;
      euRiskReason: string;
      dataCategories: string[];
      geographicScope: string[];
      thirdPartyProviders: string[];
      existingCertifications: string[];
      annexIDomains: string[];
    };
  };
  heroMetrics: {
    narrative: string;
    overallPercentage: number | null;
    totalControls: number;
    answeredControls: number;
    scoredControls: number;
    naCount: number;
    applicableControls: number;
    averageScore: number | null;
    evidencePercentage: number;
    openRisksCount: number;
  };
  frameworkReadiness: {
    narrative: string;
    euAiAct: { percentage: number | null; applicable: number; scored: number };
    nistAiRmf: { percentage: number | null; applicable: number; scored: number };
    iso42001: { percentage: number | null; applicable: number; scored: number };
  };
  categoryBreakdown: {
    narrative: string;
    categories: Array<{
      categoryName: string;
      percentage: number | null;
      totalControls: number;
      answeredControls: number;
    }>;
  };
  controlList: Array<{
    controlId: string;
    controlTitle: string;
    categoryName: string;
    flag: "MANDATORY" | "RECOMMENDED" | "OPTIONAL";
    answer: string;
    evidenceStatus: string;
    auditReady: boolean;
    notes: string;
  }>;
  riskRegister: {
    narrative: string;
    risks: Array<{
      title: string;
      category: string;
      rating: string;
      status: string;
      owner: string;
      description: string;
      mitigationPlan: string;
    }>;
  };
  componentInventory: {
    narrative: string;
    components: Array<{
      componentName: string;
      componentType: string;
      provider: string;
      roleInSystem: string;
      dataCategoriesSent: string[];
      riskTier: string;
      status: string;
    }>;
  };
  vendorAssessments: {
    narrative: string;
    vendors: Array<{
      vendorName: string;
      componentName: string;
      score: number;
      riskTier: string;
      status: string;
    }>;
  };
  biasAndVulnerability: {
    narrative: string;
    evaluationsCount: number;
    datasetReportsCount: number;
    apiReportsCount: number;
    averageScores: {
      bias: number | null;
      toxicity: number | null;
      relevancy: number | null;
      faithfulness: number | null;
      overall: number | null;
    };
  };
}

export interface SummaryPdfData {
  projectName: string;
  projectDescription: string;
  timestamp: string;
  systemProfile: {
    narrative: string;
    euRiskTier: string;
    internalRiskTier: string;
    governanceScope: string;
    regulatoryRole: string;
  };
  heroMetrics: {
    narrative: string;
    overallPercentage: number | null;
    applicableControls: number;
    answeredControls: number;
    evidencePercentage: number;
    openRisksCount: number;
  };
  frameworkReadiness: {
    narrative: string;
    euAiAct: number | null;
    nistAiRmf: number | null;
    iso42001: number | null;
  };
  strengthsAndGaps: {
    strengths: Array<{ categoryName: string; percentage: number; narrative: string }>;
    gaps: Array<{ categoryName: string; percentage: number; narrative: string }>;
  };
  riskRegisterSnapshot: {
    narrative: string;
    counts: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      total: number;
    };
  };
  componentSnapshot: {
    narrative: string;
    totalComponents: number;
    criticalRiskComponents: number;
    highRiskComponents: number;
  };
}

export function humanize(val?: string | null): string {
  if (!val) return "—";
  const str = String(val).trim();
  if (!str) return "—";
  if (str === "none" || str === "None") return "None";
  if (str === "eu_eea") return "EU / EEA";
  if (str === "us") return "United States";
  if (str === "global") return "Global";
  if (str === "public_spaces_identification") return "Remote Identification in Public Spaces";
  if (str === "verification_authentication") return "Verification & Authentication";
  if (str === "biometric_identification") return "Biometric Identification";
  if (str === "biometric_categorization") return "Biometric Categorization";
  if (str === "emotion_recognition") return "Emotion Recognition";
  if (str === "human_in_the_loop") return "Human-in-the-Loop";
  if (str === "human_over_the_loop") return "Human-over-the-Loop";
  if (str === "semi_autonomous") return "Semi-Autonomous";
  if (str === "autonomous") return "Autonomous";
  if (str === "single_system") return "Single System";
  if (str === "ai_program") return "AI Program";
  if (str === "UNACCEPTABLE") return "Unacceptable";
  if (str === "HIGH") return "High";
  if (str === "LIMITED") return "Limited";
  if (str === "MINIMAL") return "Minimal";
  if (str === "TIER_1") return "Tier 1";
  if (str === "TIER_2") return "Tier 2";
  if (str === "TIER_3") return "Tier 3";
  if (str === "TIER_4") return "Tier 4";

  return str
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)(?=[A-Z][a-z])/g, "$1 ")
    .split(" ")
    .map(word => {
      const lower = word.toLowerCase();
      if (["ai", "hr", "poc", "api", "url", "dpa", "dpia", "soc", "nist", "iso", "eu", "eea", "llm", "saas"].includes(lower)) {
        return lower.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
