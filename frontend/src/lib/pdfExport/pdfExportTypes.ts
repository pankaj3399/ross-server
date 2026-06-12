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
