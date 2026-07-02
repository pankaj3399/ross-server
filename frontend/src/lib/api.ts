export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
import { FullPdfData, SummaryPdfData } from "./pdfExport/pdfExportTypes";

export interface User {
  id: string;
  email: string;
  name: string;
  lastName?: string;
  role: string;
  subscription_status: string;
  organization?: string;
  email_verified?: boolean;
  mfa_enabled?: boolean;
  updated_at?: string;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  trial_used?: boolean;
  free_path_chosen_at?: string | null;
}

export interface PreviewData {
  headers: string[];
  rows: (string[] | Record<string, string>)[];
}

export type MetricLabel = "low" | "moderate" | "high";

export interface DatasetMetric {
  score: number;
  label: MetricLabel;
  explanation: string[];
  isEstimated?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  verificationToken: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ai_system_type?: string;
  industry?: string;
  status: string;
  user_id: string;
  role?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  path_choice?: "aima" | "premium" | null;
}

export interface InventoryComponent {
  id: string;
  projectId: string;
  componentId: string;
  componentName: string;
  componentType: string;
  provider: string;
  version?: string | null;
  roleInSystem: string;
  dataCategoriesSent: string[];
  riskTier: "Low" | "Medium" | "High" | "Critical";
  status: "Active" | "Evaluating" | "Deprecated";
  modelCardUrl?: string | null;
  vendorComplianceUrl?: string | null;
  dpaUrl?: string | null;
  notes?: string | null;
  vendorAssessmentStatus: "Not Run" | "In Progress" | "Completed";
  vendorRiskTier?: "Low" | "Medium" | "High" | "Critical" | null;
  vendorAssessmentCompletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VendorAssessmentAnswer {
  optionValue: string;
  evidence?: string;
  url?: string;
}

export interface VendorAssessment {
  id: string | null;
  projectId: string;
  componentId: string;
  vendorName: string;
  answers: Record<string, VendorAssessmentAnswer>;
  score: number;
  riskTier: "Low" | "Medium" | "High" | "Critical";
  status: "In Progress" | "Completed";
  completedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Domain {
  id: string;
  title: string;
  description: string;
  is_premium?: boolean;
  practices: string[];
}

export interface Practice {
  title: string;
  description: string;
  levels?: PracticeQuestionLevels;
  questionsAnswered?: number;
  totalQuestions?: number;
  isCompleted?: boolean;
  isInProgress?: boolean;
}

export interface Question {
  level: string;
  stream: string;
  question_index: number;
  question_text: string;
  description?: string | null;
}

export interface PracticeQuestionDetail {
  question_text: string;
  description?: string | null;
}

export type PracticeQuestionLevels = Record<
  string,
  Record<string, PracticeQuestionDetail[]>
>;

export interface AssessmentAnswer {
  domainId: string;
  practiceId: string;
  level: string;
  stream: string;
  questionIndex: number;
  value: number;
}

export interface QuestionNote {
  domainId: string;
  practiceId: string;
  level: string;
  stream: string;
  questionIndex: number;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionInvoice {
  id: string;
  number: string;
  amount_paid: number;
  currency: string;
  status: string;
  created: string | null;
  hosted_invoice_url: string | null;
}

export interface SubscriptionPlanDetails {
  id: string | null;
  name: string;
  status: string | null;
  cancel_at_period_end: boolean;
  current_period_start: string | null;
  current_period_end: string | null;
  start_date: string | null;
  trial_end: string | null;
  days_remaining: number | null;
  renewal_date: string | null;
  cancel_effective_date: string | null;
  next_payment_amount: number | null;
  is_downgrading?: boolean;
}

export interface SubscriptionDetailsResponse {
  subscription_status: string;
  signup_date: string | null;
  plan: SubscriptionPlanDetails | null;
  invoices?: SubscriptionInvoice[]; // Optional - only included when includeInvoices=true
}

export interface Thresholds {
  FAIRNESS: { HIGH: number; MODERATE: number };
  BIAS: { LOW: number; MODERATE: number };
  TOXICITY: { LOW: number; MODERATE: number };
  POSITIVE: { HIGH: number; MODERATE: number };
}

export type CRCControlStatus = "Draft" | "In Review" | "Published" | "Archived";
export type CRCEvidenceStatus = 'No Evidence' | 'Template Downloaded' | 'Evidence in Progress' | 'Evidence Complete';

export interface CRCCategory {
  id: number;
  name: string;
}

export interface CRCControl {
  id: string;
  control_id: string;
  control_title: string;
  category_id: number;
  category_name: string;
  priority: string;
  status: CRCControlStatus;
  version: number;
  applicable_to: string[];
  expected_timeline: string;
  control_statement: string;
  control_objective: string;
  risk_description: string;
  implementation: {
    requirements: string[];
    steps: string[];
  };
  evidence_requirements: string[];
  compliance_mapping: {
    eu_ai_act: Array<{ ref: string; context: string }>;
    nist_ai_rmf: Array<{ ref: string; context: string }>;
    iso_42001: Array<{ ref: string; context: string }>;
  };
  aima_mapping: {
    domain: string;
    area: string;
    maturity_enhancement: string;
  };
  existing_certification_relevance?: string;
  created_at: string;
  updated_at: string;
}

export interface WizardAnswers {
  name: string;
  description: string;
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
  public_url: string;
  wizard_step?: number;
}

export interface WizardOutputs {
  id?: string;
  project_id?: string;
  eu_risk_tier: string;
  internal_risk_tier: string;
  eu_risk_reason: string;
  applicable_frameworks: string[];
  control_flags: Record<string, { flag: string; reason: string }>;
  suggested_risks: Array<{
    title: string;
    description: string;
    risk_category: string;
    potential_impact: string;
    likelihood: string;
    impact_level: string;
    mitigation_strategy: string;
  }>;
  suggested_components: Array<{
    component_name: string;
    component_type: string;
    provider: string;
    role_in_system: string;
    data_categories_sent: string[];
    risk_tier: string;
    status: string;
  }>;
  vulnerability_scope: string[];
  bias_scope: string[];
  template_variables: Record<string, string>;
  copilot_context: string;
  article5_warning: boolean;
  article50_note: boolean;
  gpai_warning: boolean;
  informational_notes: string[];
}

export interface WizardApplyPayload {
  acceptedRisks?: string[];
  acceptedComponents?: string[];
}

export interface WizardAnswersResponse {
  success: boolean;
  answers: WizardAnswers;
}

export interface WizardOutputsResponse {
  success: boolean;
  outputs: WizardOutputs | null;
}

export interface WizardStatusResponse {
  success: boolean;
  status: string;
  step: number;
  completedAt: string | null;
  appliedAt: string | null;
}

export interface WizardSaveResponse {
  success: boolean;
  profileId: string;
}

export interface WizardApplyResponse {
  success: boolean;
  message: string;
}

export interface ChatbotInstruction {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface CRCCategoryResult {
  categoryId: number | null;
  categoryName: string;
  totalControls: number;
  answeredControls: number;
  scoredControls: number;
  naCount: number;
  applicableControls: number;
  averageScore: number | null;
  percentage: number | null;
}

export interface CRCFrameworkResult {
  totalControls: number;
  scoredControls: number;
  naCount: number;
  applicableControls: number;
  points: number;
  percentage: number | null;
}

export interface RiskSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface CRCResults {
  overall: {
    totalControls: number;
    answeredControls: number;
    scoredControls: number;
    naCount: number;
    applicableControls: number;
    averageScore: number | null;
    percentage: number | null;
  };
  categories: CRCCategoryResult[];
  breakdown: {
    yes: number;
    partial: number;
    no: number;
    na: number;
    notSure: number;
  };
  frameworks: {
    eu_ai_act: CRCFrameworkResult;
    nist_ai_rmf: CRCFrameworkResult;
    iso_42001: CRCFrameworkResult;
  };
  riskSummary?: RiskSummary;
  evidenceProgress?: {
    complete: number;
    total: number;
    percentage: number;
    breakdown: {
      noEvidence: number;
      templateDownloaded: number;
      inProgress: number;
      evidenceComplete: number;
    };
  };
}

export interface CRCRisk {
  id: string;
  project_id: string;
  control_id: string | null;
  risk_code: string;
  title: string;
  category: string;
  rating: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Closed';
  description: string;
  mitigation_plan: string;
  owner: string;
  target_date: string | null;
  review_frequency: string;
  source: 'Automated' | 'Manual';
  created_at: string;
  updated_at: string;
  system_control_id?: string | null;
  compliance_mapping?: {
    eu_ai_act?: Array<{ ref: string; context: string }>;
    nist_ai_rmf?: Array<{ ref: string; context: string }>;
    iso_42001?: Array<{ ref: string; context: string }>;
  };
  implementation?: {
    requirements?: string[];
    steps?: string[];
  };
}

export interface CRCControlVersion {
  id: string;
  version: number;
  status_from: string;
  status_to: string;
  change_note: string;
  changed_by_name: string;
  created_at: string;
}

export interface QuickWinItem {
  controlId: string;
  controlShortId: string;
  controlTitle: string;
  effortBadge: string;
  effortTier: 'Low' | 'Medium' | 'High';
  whyItMatters: string;
  flag: 'MANDATORY' | 'RECOMMENDED';
  isDocumentationQuickWin: boolean;
  categoryName: string;
}

export interface QuickWinsResponse {
  success: boolean;
  wizardRequired: boolean;
  items: QuickWinItem[];
}

export type InsightsJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

class ApiService {
  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth_token");
  }

  private getHeaders(): HeadersInit {
    const token = this.getAuthToken();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      let errorMessage = error.error || `HTTP ${response.status}`;
      if (typeof errorMessage === "object") {
        errorMessage = JSON.stringify(errorMessage);
      }
      const errorWithStatus = new Error(errorMessage) as Error & {
        status?: number;
        errorCode?: string;
        progress?: unknown;
        body?: unknown;
      };
      errorWithStatus.status = response.status;
      if (typeof error?.errorCode === "string") errorWithStatus.errorCode = error.errorCode;
      if (error?.progress !== undefined) errorWithStatus.progress = error.progress;
      errorWithStatus.body = error;
      throw errorWithStatus;
    }

    return response.json();
  }

  // Authentication
  async register(data: {
    email: string;
    password: string;
    name: string;
    lastName?: string;
    organization?: string;
  }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });

    return response;
  }

  async login(
    email: string,
    password: string,
    mfaCode?: string,
    backupCode?: string,
  ): Promise<AuthResponse | { requiresMFA: boolean; message: string }> {
    const response = await this.request<
      AuthResponse | { requiresMFA: boolean; message: string }
    >("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, mfaCode, backupCode }),
    });

    if ("token" in response && response.token) {
      localStorage.setItem("auth_token", response.token);
    }

    return response;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<{ user: User }>("/auth/me");
    return response.user;
  }

  async updateProfile(data: {
    name?: string;
    lastName?: string;
    email?: string;
  }): Promise<{
    user: User;
    message: string;
    emailVerificationSent?: boolean;
  }> {
    return this.request<{
      user: User;
      message: string;
      emailVerificationSent?: boolean;
    }>("/auth/update-profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  logout(): void {
    localStorage.removeItem("auth_token");
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    const response = await this.request<{ projects: Project[] }>("/projects");
    return response.projects;
  }

  async createProject(data: {
    name: string;
    description?: string;
    aiSystemType?: string;
    industry?: string;
  }): Promise<{ project: Project }> {
    return this.request<{ project: Project }>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getProject(id: string): Promise<Project> {
    const response = await this.request<{ project: Project }>(`/projects/${id}`);
    return response.project;
  }

  async updateProject(
    id: string,
    data: {
      name?: string;
      description?: string;
      aiSystemType?: string;
      industry?: string;
      status?: string;
      pathChoice?: string;
    },
  ): Promise<{ project: Project }> {
    return this.request<{ project: Project }>(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/projects/${id}`, {
      method: "DELETE",
    });
  }

  async getDeletedProjects(): Promise<{ projects: Project[] }> {
    return this.request<{ projects: Project[] }>("/projects/deleted");
  }

  async restoreProject(id: string): Promise<{ message: string; project: Project }> {
    return this.request<{ message: string; project: Project }>(`/projects/${id}/restore`, {
      method: "POST",
    });
  }

  async submitProject(id: string, changedDomainIds?: string[]): Promise<{ message: string; project: Project; results: any; capabilities?: { premiumInsights?: boolean; canGenerateInsights?: boolean } }> {
    return this.request<{ message: string; project: Project; results: any; capabilities?: { premiumInsights?: boolean; canGenerateInsights?: boolean } }>(`/projects/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ changedDomainIds }),
    });
  }

  // AIMA Framework
  async getDomains(projectId?: string): Promise<{ domains: Domain[] }> {
    const url = projectId ? `/aima/domains?project_id=${projectId}` : "/aima/domains";
    return this.request<{ domains: Domain[] }>(url);
  }

  async getDomainsFull(projectId?: string): Promise<{
    domains: Array<{
      id: string;
      title: string;
      description: string;
      is_premium?: boolean;
      practices: Record<string, Practice>;
    }>;
  }> {
    const url = projectId ? `/aima/domains-full?project_id=${projectId}` : `/aima/domains-full`;
    return this.request<{
      domains: Array<{
        id: string;
        title: string;
        description: string;
        is_premium?: boolean;
        practices: Record<string, Practice>;
      }>;
    }>(url);
  }

  async getDomain(domainId: string, projectId?: string): Promise<{
    id: string;
    title: string;
    description: string;
    practices: Record<string, Practice>;
  }> {
    const url = projectId 
      ? `/aima/domains/${domainId}?project_id=${projectId}` 
      : `/aima/domains/${domainId}`;
    return this.request<{
      id: string;
      title: string;
      description: string;
      practices: Record<string, Practice>;
    }>(url);
  }

  async getPracticeQuestions(
    domainId: string,
    practiceId: string,
    projectId?: string,
  ): Promise<{
    domainId: string;
    practiceId: string;
    title: string;
    description: string;
    levels: PracticeQuestionLevels;
  }> {
    const url = projectId 
      ? `/aima/domains/${domainId}/practices/${practiceId}?project_id=${projectId}` 
      : `/aima/domains/${domainId}/practices/${practiceId}`;
    return this.request<{
      domainId: string;
      practiceId: string;
      title: string;
      description: string;
      levels: PracticeQuestionLevels;
    }>(url);
  }

  async getFairnessQuestions(): Promise<{
    questions: Array<{
      label: string;
      prompts: string[];
    }>;
  }> {
    return this.request<{
      questions: Array<{
        label: string;
        prompts: string[];
      }>;
    }>("/fairness/prompts");
  }

  async getFairnessEvaluations(projectId: string): Promise<{
    success: boolean;
    evaluations: Array<{
      id: string;
      category: string;
      questionText: string;
      userResponse: string;
      biasScore: number;
      toxicityScore: number;
      relevancyScore: number;
      faithfulnessScore: number;
      overallScore: number;
      verdicts: {
        bias: { score: number; verdict: string };
        toxicity: { score: number; verdict: string };
        relevancy: { score: number; verdict: string };
        faithfulness: { score: number; verdict: string };
      };
      reasoning: string;
      createdAt: string;
    }>;
  }> {
    return this.request<{
      success: boolean;
      evaluations: Array<{
        id: string;
        category: string;
        questionText: string;
        userResponse: string;
        biasScore: number;
        toxicityScore: number;
        relevancyScore: number;
        faithfulnessScore: number;
        overallScore: number;
        verdicts: {
          bias: { score: number; verdict: string };
          toxicity: { score: number; verdict: string };
          relevancy: { score: number; verdict: string };
          faithfulness: { score: number; verdict: string };
        };
        reasoning: string;
        createdAt: string;
      }>;
    }>(`/fairness/evaluations/${projectId}`);
  }

  async evaluateDatasetFairness(data: {
    projectId: string;
    fileName: string;
    csvText: string;
  }): Promise<{
    fairness: {
      overallVerdict: "pass" | "caution" | "fail" | "insufficient";
      sensitiveColumns: Array<{
        column: string;
        verdict: "pass" | "caution" | "fail" | "insufficient";
        disparity: number;
        disparateImpactRatio: number;
        totalRows: number;
        totalPositives: number;
        explanation: string[];
        groups: Array<{
          value: string;
          rows: number;
          positive: number;
          positiveRate: number;
          distribution: number;
          outcomeShare: number;
        }>;
      }>;
      outcomeColumn: string | null;
      positiveOutcome: string | null;
      datasetStats: {
        totalRows: number;
        totalPositives: number;
        overallPositiveRate: number;
      };
      metricDefinitions: {
        selectionRate: { name: string; formula: string; description: string; interpretation: string; threshold: string };
        demographicParityDifference: { name: string; formula: string; description: string; interpretation: string; threshold: string };
        disparateImpactRatio: { name: string; formula: string; description: string; interpretation: string; threshold: string };
        groupDistribution: { name: string; formula: string; description: string; interpretation: string; threshold: string };
      };
    };
    fairnessResult: { score: number; label: "low" | "moderate" | "high"; explanation: string[] };
    biasness: { score: number; label: "low" | "moderate" | "high"; explanation: string[] };
    toxicity: { score: number; label: "low" | "moderate" | "high"; explanation: string[] };
    relevance: { score: number; label: "low" | "moderate" | "high"; explanation: string[] };
    faithfulness: { score: number; label: "low" | "moderate" | "high"; explanation: string[] };
  }> {
    return this.request("/fairness/dataset-evaluate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getDatasetReports(projectId: string): Promise<{
    success: boolean;
    reports: Array<{
      id: string;
      file_name: string;
      file_size: number;
      uploaded_at: string;
      fairness_data: any;
      fairness_result: DatasetMetric;
      biasness_result: DatasetMetric;
      toxicity_result: DatasetMetric;
      relevance_result: DatasetMetric;
      faithfulness_result: DatasetMetric;
      csv_preview: PreviewData;
      selections: any;
      created_at: string;
    }>;
  }> {
    return this.request<{
      success: boolean;
      reports: Array<{
        id: string;
        file_name: string;
        file_size: number;
        uploaded_at: string;
        fairness_data: any;
        fairness_result: DatasetMetric;
        biasness_result: DatasetMetric;
        toxicity_result: DatasetMetric;
        relevance_result: DatasetMetric;
        faithfulness_result: DatasetMetric;
        csv_preview: PreviewData;
        selections: any;
        created_at: string;
      }>;
    }>(`/fairness/dataset-reports/${projectId}`);
  }

  async getThresholds(): Promise<Thresholds> {
    return this.request<Thresholds>("/fairness/thresholds");
  }

  async startFairnessEvaluationJob(data: {
    projectId: string;
    apiUrl: string;
    requestTemplate: string;
    responseKey: string;
    apiKey?: string | null;
    apiKeyPlacement: "none" | "auth_header" | "x_api_key" | "query_param" | "body_field";
    apiKeyFieldName?: string | null;
  }): Promise<{
    jobId: string;
    totalPrompts: number;
    message: string;
  }> {
    return this.request<{
      jobId: string;
      totalPrompts: number;
      message: string;
    }>("/fairness/evaluate-api", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async startSecurityScan(data: {
    projectId: string;
    apiUrl: string;
    requestTemplate: string;
    responseKey: string;
    apiKey?: string | null;
    apiKeyPlacement: "none" | "auth_header" | "x_api_key" | "query_param" | "body_field";
    apiKeyFieldName?: string | null;
  }): Promise<{
    jobId: string;
    totalPrompts: number;
    message: string;
  }> {
    return this.request<{
      jobId: string;
      totalPrompts: number;
      message: string;
    }>("/fairness/security-scan", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async evaluatePrompts(data: {
    projectId: string;
    responses: Array<{
      category: string;
      prompt: string;
      response: string;
    }>;
  }): Promise<{
    jobId: string;
    totalPrompts: number;
    message: string;
  }> {
    return this.request<{
      jobId: string;
      totalPrompts: number;
      message: string;
    }>("/fairness/evaluate-prompts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getFairnessJob(jobId: string): Promise<{
    jobId: string;
    status: "queued" | "processing" | "running" | "completed" | "failed" | "collecting_responses" | "evaluating" | "success" | "partial_success";
    progress: string;
    percent: number;
    lastProcessedPrompt?: string | null;
    totalPrompts: number;
    summary: {
      total: number;
      successful: number;
      failed: number;
      averageOverallScore: number;
      averageBiasScore: number;
      averageToxicityScore: number;
    } | null;
    results: Array<{
      category: string;
      prompt: string;
      success: boolean;
      message?: string;
      evaluation?: {
        id: string;
        biasScore: number;
        toxicityScore: number;
        relevancyScore: number;
        faithfulnessScore: number;
        overallScore: number;
        verdicts: {
          bias: { score: number; verdict: string };
          toxicity: { score: number; verdict: string };
          relevancy: { score: number; verdict: string };
          faithfulness: { score: number; verdict: string };
        };
        reasoning: string;
        createdAt: string;
      };
    }>;
    errors: Array<{
      category: string;
      prompt: string;
      success: boolean;
      error: string;
      message?: string;
    }>;
    errorMessage?: string | null;
  }> {
    return this.request<{
      jobId: string;
      status: "queued" | "processing" | "running" | "completed" | "failed";
      progress: string;
      percent: number;
      lastProcessedPrompt?: string | null;
      totalPrompts: number;
      summary: {
        total: number;
        successful: number;
        failed: number;
        averageOverallScore: number;
        averageBiasScore: number;
        averageToxicityScore: number;
      } | null;
      results: Array<{
        category: string;
        prompt: string;
        success: boolean;
        message: string;
        evaluation?: {
          id: string;
          biasScore: number;
          toxicityScore: number;
          relevancyScore: number;
          faithfulnessScore: number;
          overallScore: number;
          verdicts: {
            bias: { score: number; verdict: string };
            toxicity: { score: number; verdict: string };
            relevancy: { score: number; verdict: string };
            faithfulness: { score: number; verdict: string };
          };
          reasoning: string;
          createdAt: string;
        };
      }>;
      errors: Array<{
        category: string;
        prompt: string;
        success: boolean;
        error: string;
        message: string;
      }>;
      errorMessage?: string | null;
    }>(`/fairness/jobs/${jobId}`);
  }

  async getJobs(projectId: string): Promise<{
    success: boolean;
    jobs: Array<{
      jobId: string;
      status: "queued" | "running" | "completed";
      progress: string;
      percent: number;
      lastProcessedPrompt: string | null;
      totalPrompts: number;
      createdAt: string;
      updatedAt: string;
    }>;
    count: number;
  }> {
    return this.request<{
      success: boolean;
      jobs: Array<{
        jobId: string;
        status: "queued" | "running" | "completed";
        progress: string;
        percent: number;
        lastProcessedPrompt: string | null;
        totalPrompts: number;
        createdAt: string;
        updatedAt: string;
      }>;
      count: number;
    }>(`/fairness/jobs/project/${projectId}`);
  }

  async getApiReportByJobId(jobId: string): Promise<{ success: boolean; reportId: string }> {
    return this.request<{ success: boolean; reportId: string }>(`/fairness/api-reports/job/${jobId}`);
  }

  // Assessment Answers
  async saveAnswers(
    projectId: string,
    answers: AssessmentAnswer[],
  ): Promise<{
    message: string;
    savedCount: number;
  }> {
    return this.request<{ message: string; savedCount: number }>("/answers", {
      method: "POST",
      body: JSON.stringify({ projectId, answers }),
    });
  }

  async getAnswers(projectId: string): Promise<{
    projectId: string;
    answers: Record<string, number>;
  }> {
    return this.request<{ projectId: string; answers: Record<string, number> }>(
      `/answers/${projectId}`
    );
  }

  // Subscriptions
  async getSubscriptionStatus(): Promise<{
    subscription_status: string;
    hasStripeCustomer: boolean;
  }> {
    return this.request<{
      subscription_status: string;
      hasStripeCustomer: boolean;
    }>("/subscriptions/status");
  }

  async getSubscriptionDetails(includeInvoices: boolean = false): Promise<SubscriptionDetailsResponse> {
    const url = includeInvoices 
      ? "/subscriptions/details?includeInvoices=true"
      : "/subscriptions/details";
    return this.request<SubscriptionDetailsResponse>(url);
  }

  async getInvoices(limit: number = 10, startingAfter?: string): Promise<{
    invoices: SubscriptionInvoice[];
    has_more: boolean;
    last_invoice_id: string | null;
  }> {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    if (startingAfter) {
      params.append("startingAfter", startingAfter);
    }
    return this.request<{
      invoices: SubscriptionInvoice[];
      has_more: boolean;
      last_invoice_id: string | null;
    }>(`/subscriptions/invoices?${params.toString()}`);
  }

  async createCheckoutSession(priceId: string): Promise<{
    sessionId: string;
    url: string;
  }> {
    return this.request<{ sessionId: string; url: string }>(
      "/subscriptions/create-checkout-session",
      {
        method: "POST",
        body: JSON.stringify({ priceId }),
      },
    );
  }

  async createPortalSession(): Promise<{ url: string }> {
    return this.request<{ url: string }>(
      "/subscriptions/create-portal-session",
      {
        method: "POST",
      },
    );
  }

  async upgradeToPro(): Promise<{ sessionId: string; url: string }> {
    return this.request<{ sessionId: string; url: string }>(
      "/subscriptions/upgrade-to-pro",
      {
        method: "POST",
      },
    );
  }

  async downgradeToBasic(): Promise<{
    message: string;
    current_period_end?: string | null;
    days_remaining?: number | null;
  }> {
    return this.request<{
      message: string;
      current_period_end?: string | null;
      days_remaining?: number | null;
    }>(
      "/subscriptions/downgrade-to-basic",
      {
        method: "POST",
      },
    );
  }

  async cancelSubscription(): Promise<{
    message: string;
    cancel_at_period_end?: boolean;
    current_period_end?: string | null;
    days_remaining?: number | null;
  }> {
    return this.request<{
      message: string;
      cancel_at_period_end?: boolean;
      current_period_end?: string | null;
      days_remaining?: number | null;
    }>(
      "/subscriptions/cancel-subscription",
      {
        method: "POST",
      },
    );
  }


  async resendVerification(email?: string): Promise<{ message: string; emailSent: boolean; alreadySent?: boolean }> {
    return this.request<{ message: string; emailSent: boolean; alreadySent?: boolean }>(
      "/auth/resend-verification",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      },
    );
  }

  // Password Reset
  async forgotPassword(
    email: string,
  ): Promise<{ message: string; emailSent: boolean }> {
    return this.request<{ message: string; emailSent: boolean }>(
      "/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      },
    );
  }

  async resetPassword(
    token: string,
    password: string,
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // MFA
  async setupMFA(): Promise<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
    message: string;
  }> {
    return this.request<{
      secret: string;
      qrCodeUrl: string;
      backupCodes: string[];
      message: string;
    }>("/auth/setup-mfa", {
      method: "POST",
    });
  }

  async verifyMFASetup(mfaCode: string): Promise<{ message: string }> {
    return this.request<{ message: string }>("/auth/verify-mfa-setup", {
      method: "POST",
      body: JSON.stringify({ mfaCode }),
    });
  }

  async disableMFA(): Promise<{ message: string }> {
    return this.request<{ message: string }>("/auth/disable-mfa", {
      method: "POST",
    });
  }

  async getBackupCodes(): Promise<{ backupCodes: string[] }> {
    return this.request<{ backupCodes: string[] }>("/auth/backup-codes");
  }

  async regenerateBackupCodes(): Promise<{
    backupCodes: string[];
    message: string;
  }> {
    return this.request<{ backupCodes: string[]; message: string }>(
      "/auth/regenerate-backup-codes",
      {
        method: "POST",
      },
    );
  }

  // Enhanced Login with MFA
  async loginWithMFA(
    email: string,
    password: string,
    mfaCode?: string,
    backupCode?: string,
  ): Promise<AuthResponse | { requiresMFA: boolean; message: string }> {
    return this.request<
      AuthResponse | { requiresMFA: boolean; message: string }
    >("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, mfaCode, backupCode }),
    });
  }

  // Question Notes
  async saveQuestionNote(
    projectId: string,
    note: {
      domainId: string;
      practiceId: string;
      level: string;
      stream: string;
      questionIndex: number;
      note: string;
    },
  ): Promise<{ message: string; note: QuestionNote }> {
    return this.request<{ message: string; note: QuestionNote }>("/notes", {
      method: "POST",
      body: JSON.stringify({ projectId, ...note }),
    });
  }

  async getQuestionNotes(projectId: string): Promise<QuestionNote[]> {
    return this.request<QuestionNote[]>(`/notes/${projectId}`);
  }

  async deleteQuestionNote(
    projectId: string,
    domainId: string,
    practiceId: string,
    level: string,
    stream: string,
    questionIndex: number,
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/notes/${projectId}`, {
      method: "DELETE",
      body: JSON.stringify({
        domainId,
        practiceId,
        level,
        stream,
        questionIndex,
      }),
    });
  }

  // Admin - Waitlist Emails
  async getWaitlistEmails(): Promise<{
    success: boolean;
    data: {
      emails: Array<{
        id: string;
        email: string;
        source: string | null;
        user_agent: string | null;
        ip: string | null;
        created_at: string;
      }>;
      count: number;
    };
  }> {
    return this.request<{
      success: boolean;
      data: {
        emails: Array<{
          id: string;
          email: string;
          source: string | null;
          user_agent: string | null;
          ip: string | null;
          created_at: string;
        }>;
        count: number;
      };
    }>("/admin/waitlist-emails");
  }

  // Admin - Chatbot Custom Instructions
  async getChatbotInstructions(): Promise<{
    success: boolean;
    data: ChatbotInstruction[];
  }> {
    return this.request<{
      success: boolean;
      data: ChatbotInstruction[];
    }>("/admin/chatbot-instructions");
  }

  async createChatbotInstruction(data: {
    title: string;
    content: string;
    is_active?: boolean;
    category?: string;
  }): Promise<{
    success: boolean;
    data: ChatbotInstruction;
    message: string;
  }> {
    return this.request<{
      success: boolean;
      data: ChatbotInstruction;
      message: string;
    }>("/admin/chatbot-instructions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateChatbotInstruction(
    id: string,
    data: {
      title?: string;
      content?: string;
      is_active?: boolean;
      category?: string;
    }
  ): Promise<{
    success: boolean;
    data: ChatbotInstruction;
    message: string;
  }> {
    return this.request<{
      success: boolean;
      data: ChatbotInstruction;
      message: string;
    }>(`/admin/chatbot-instructions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteChatbotInstruction(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/admin/chatbot-instructions/${id}`, {
      method: "DELETE",
    });
  }

  // Admin - Industry Analytics
  async getIndustryAnalytics(): Promise<{
    success: boolean;
    data: {
      industries: Array<{
        industry: string;
        count: string;
        percentage: string;
      }>;
      summary: {
        total_projects: string;
        projects_with_industry: string;
        projects_without_industry: string;
      };
    };
  }> {
    return this.request<{
      success: boolean;
      data: {
        industries: Array<{
          industry: string;
          count: string;
          percentage: string;
        }>;
        summary: {
          total_projects: string;
          projects_with_industry: string;
          projects_without_industry: string;
        };
      };
    }>("/admin/analytics/industries");
  }

  async generateDomainInsights(projectId: string): Promise<{
    success: boolean;
    insights?: Record<string, string>; // domainId -> insights text
    existingInsights?: Record<string, string>; // cached insights when a new job is kicked off
    jobId?: string;
    status?: InsightsJobStatus;
    message?: string;
    cached?: boolean;
  }> {
    return this.request<{
      success: boolean;
      insights?: Record<string, string>;
      existingInsights?: Record<string, string>;
      jobId?: string;
      status?: InsightsJobStatus;
      message?: string;
      cached?: boolean;
    }>(`/projects/${projectId}/generate-insights`, {
      method: "POST",
    });
  }

  async getProjectReport(projectId: string): Promise<{
    project: any;
    results: {
      domains: Array<{
        domainId: string;
        domainTitle: string;
        maturityScore: number;
        practiceScores: Array<{
          practiceId: string;
          practiceTitle: string;
          maturityScore: number;
          totalQuestions: number;
        }>;
        totalQuestions: number;
        isPremium?: boolean;
        percentage: number;
        insights?: string;
      }>;
      overall: {
        overallMaturityScore: number;
        totalQuestions: number;
        overallPercentage: number;
      };
    };
    insights: Record<string, string>;
    submittedAt: string | null;
    capabilities?: {
      premiumInsights?: boolean;
      canGenerateInsights?: boolean;
    };
  }> {
    return this.request(`/projects/${projectId}/results`);
  }

  async getInsightsJobStatus(projectId: string, jobId: string): Promise<{
    jobId: string;
    status: InsightsJobStatus;
    insights?: Record<string, string>;
    error?: string;
  }> {
    return this.request<{
        jobId: string;
        status: InsightsJobStatus;
        insights?: Record<string, string>;
        error?: string;
    }>(`/projects/${projectId}/insights/status/${jobId}`);
  }

  // CRC Controls
  async getCRCCategories(signal?: AbortSignal): Promise<{ data: CRCCategory[] }> {
    return this.request<{ data: CRCCategory[] }>("/crc/categories", { signal });
  }

  async createCRCCategory(name: string): Promise<{ data: CRCCategory }> {
    return this.request<{ data: CRCCategory }>("/crc/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  async updateCRCCategory(id: number, name: string): Promise<{ data: CRCCategory }> {
    return this.request<{ data: CRCCategory }>(`/crc/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
  }

  async deleteCRCCategory(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/crc/categories/${id}`, {
      method: "DELETE",
    });
  }

  async getCRCControls(params?: URLSearchParams): Promise<{ data: CRCControl[]; count: number }> {
    const qs = params ? `?${params.toString()}` : "";
    return this.request<{ data: CRCControl[]; count: number }>(`/crc/controls${qs}`);
  }

  async getCRCControl(id: string): Promise<{ data: CRCControl }> {
    return this.request<{ data: CRCControl }>(`/crc/controls/${id}`);
  }

  async createCRCControl(data: Partial<CRCControl>): Promise<{ data: CRCControl }> {
    return this.request<{ data: CRCControl }>("/crc/controls", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /** Bulk create CRC controls. On 400, throws an error with .status and .errors: { index, control_id?, message }[] */
  async createCRCBulk(controls: Partial<CRCControl>[], overwrite?: boolean): Promise<{ data: CRCControl[] }> {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/crc/controls/bulk`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ controls, overwrite }),
      });
    } catch (networkError) {
      const err = new Error("Network error") as Error & { status?: number; errors?: Array<{ index: number; control_id?: string; message: string }> };
      err.status = 0;
      err.errors = [];
      throw err;
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error(body.error || "Bulk import failed") as Error & { status?: number; errors?: Array<{ index: number; control_id?: string; message: string }> };
      err.status = response.status;
      err.errors = body.errors;
      throw err;
    }
    return { data: Array.isArray(body.data) ? body.data : [] };
  }

  async updateCRCControl(id: string, data: Partial<CRCControl>): Promise<{ data: CRCControl }> {
    return this.request<{ data: CRCControl }>(`/crc/controls/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCRCControl(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/crc/controls/${id}`, {
      method: "DELETE",
    });
  }

  async deleteCRCControlsBulk(ids: string[]): Promise<{ message: string; deletedCount: number }> {
    return this.request<{ message: string; deletedCount: number }>("/crc/controls/bulk", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    });
  }

  async cloneCRCControl(id: string): Promise<{ data: CRCControl }> {
    return this.request<{ data: CRCControl }>(`/crc/controls/${id}/clone`, {
      method: "POST",
    });
  }

  async transitionCRCControl(id: string, data: { status: CRCControlStatus; note?: string }): Promise<{ data: CRCControl }> {
    return this.request<{ data: CRCControl }>(`/crc/controls/${id}/transition`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async exportControls(ids: string[], format: "json" | "csv"): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/crc/controls/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify({ ids, format }),
    });

    if (!response.ok) {
      throw new Error("Export failed");
    }

    return response.blob();
  }

  async getCRCControlVersions(id: string): Promise<{ data: CRCControlVersion[] }> {
    return this.request<{ data: CRCControlVersion[] }>(`/crc/controls/${id}/versions`);
  }

  async getPublishedCRCControls(): Promise<{ data: CRCControl[]; count: number }> {
    return this.request<{ data: CRCControl[]; count: number }>("/crc/public/controls");
  }

  // CRC Assessment (user-facing)
  async saveCRCResponse(
    projectId: string, 
    data: { 
      controlId: string; 
      value: number; 
      notes?: string;
      evidenceStatus?: CRCEvidenceStatus;
      evidenceUrl?: string | null;
      auditReady?: boolean;
    }
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/crc/assess/${projectId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getCRCResponses(projectId: string): Promise<{ 
    responses: Record<string, { 
      value: number; 
      notes: string; 
      evidenceStatus: CRCEvidenceStatus;
      evidenceUrl: string | null;
      auditReady: boolean;
      updatedAt: string;
    }>; 
    count: number;
  }> {
    return this.request<{ 
      responses: Record<string, { 
        value: number; 
        notes: string; 
        evidenceStatus: CRCEvidenceStatus;
        evidenceUrl: string | null;
        auditReady: boolean;
        updatedAt: string;
      }>; 
      count: number;
    }>(`/crc/assess/${projectId}`);
  }

  async submitCRCAssessment(projectId: string): Promise<{ success: boolean; results: CRCResults }> {
    return this.request<{ success: boolean; results: CRCResults }>(`/crc/submit/${projectId}`, {
      method: "POST",
    });
  }

  async getCRCResults(projectId: string): Promise<{ success: boolean; results: CRCResults; complete: boolean }> {
    return this.request<{ success: boolean; results: CRCResults; complete: boolean }>(`/crc/results/${projectId}`);
  }

  async getFullPdfData(projectId: string): Promise<{ success: boolean; anyFailed: boolean; payload: FullPdfData }> {
    return this.request<{ success: boolean; anyFailed: boolean; payload: FullPdfData }>(`/crc/pdf-data/${projectId}/full`, {
      method: "POST"
    });
  }

  async getSummaryPdfData(projectId: string): Promise<{ success: boolean; anyFailed: boolean; payload: SummaryPdfData }> {
    return this.request<{ success: boolean; anyFailed: boolean; payload: SummaryPdfData }>(`/crc/pdf-data/${projectId}/summary`, {
      method: "POST"
    });
  }

  async getQuickWins(projectId: string): Promise<QuickWinsResponse> {
    return this.request<QuickWinsResponse>(`/crc/quick-wins/${projectId}`);
  }

  // CRC Risks CRUD
  async getCRCRisks(projectId: string): Promise<{ success: boolean; data: CRCRisk[]; count: number }> {
    return this.request<{ success: boolean; data: CRCRisk[]; count: number }>(`/crc/risks/${projectId}`);
  }

  async createCRCRisk(projectId: string, data: Partial<CRCRisk>): Promise<{ success: boolean; data: CRCRisk }> {
    return this.request<{ success: boolean; data: CRCRisk }>(`/crc/risks/${projectId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCRCRisk(projectId: string, riskId: string, data: Partial<CRCRisk>): Promise<{ success: boolean; data: CRCRisk }> {
    return this.request<{ success: boolean; data: CRCRisk }>(`/crc/risks/${projectId}/${riskId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCRCRisk(projectId: string, riskId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/crc/risks/${projectId}/${riskId}`, {
      method: "DELETE",
    });
  }

  // CRC Templates
  downloadCRCTemplateUrl(controlId: string, projectId?: string): string {
    return `${API_BASE_URL}/crc/templates/${controlId}/download${projectId ? `?projectId=${projectId}` : ''}`;
  }

  async downloadCRCTemplate(controlId: string, projectId?: string): Promise<{ blob: Blob; filename: string }> {
    const token = this.getAuthToken();
    const url = `${API_BASE_URL}/crc/templates/${controlId}/download${projectId ? `?projectId=${projectId}` : ''}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        ...(token && { "Authorization": `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Download failed" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = `MATUR-CRC-${controlId}-Template.docx`;
    
    if (contentDisposition && contentDisposition.includes("filename=")) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }
    
    return { blob, filename };
  }

  async uploadCRCTemplate(controlId: string, file: File): Promise<{ success: boolean; message: string; data: { controlId: string; filename: string } }> {
    const formData = new FormData();
    formData.append("template", file);

    const token = this.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/crc/templates/${controlId}/upload`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async uploadCRCTemplatesBulk(files: File[]): Promise<{
    success: boolean;
    message: string;
    summary: { total: number; success: number; unmatched: number; failed: number };
    details: Array<{ filename: string; status: 'success' | 'unmatched' | 'failed'; controlId?: string; error?: string }>;
  }> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const token = this.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/crc/templates/bulk-upload`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Bulk upload failed" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async deleteCRCTemplate(controlId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/crc/templates/${controlId}/template`, {
      method: "DELETE",
    });
  }

  async getCRCTemplateStatuses(): Promise<{ success: boolean; data: Record<string, { filename: string; size: number; updatedAt: string }> }> {
    return this.request<{ success: boolean; data: Record<string, { filename: string; size: number; updatedAt: string }> }>("/crc/templates/status");
  }

  // ==========================================
  // INVITATION METHODS
  // ==========================================

  public async getInvitationByToken(token: string): Promise<any> {
    return this.request(`/auth/invitations/${token}`);
  }

  public async acceptInvitation(token: string): Promise<any> {
    return this.request(`/auth/invitations/${token}/accept`, {
      method: "POST",
    });
  }

  public async signupViaInvitation(token: string, data: { name: string; password: string }): Promise<any> {
    const response = await this.request<any>(`/auth/invitations/${token}/signup`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.token) {
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", response.token);
      }
    }
    return response;
  }

  public async declineInvitation(token: string): Promise<any> {
    return this.request(`/auth/invitations/${token}/decline`, {
      method: "POST",
    });
  }

  // ==========================================
  // MEMBER MANAGEMENT METHODS
  // ==========================================

  public async getProjectMembers(projectId: string): Promise<any> {
    return this.request(`/projects/${projectId}/members`);
  }

  public async updateProjectMember(projectId: string, userId: string, data: { role: string }): Promise<any> {
    return this.request(`/projects/${projectId}/members/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  public async removeProjectMember(projectId: string, userId: string): Promise<any> {
    return this.request(`/projects/${projectId}/members/${userId}`, {
      method: "DELETE",
    });
  }

  public async inviteToProject(projectId: string, data: { email: string; role: string }): Promise<any> {
    return this.request(`/projects/${projectId}/invitations`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public async getProjectInvitations(projectId: string): Promise<any> {
    return this.request(`/projects/${projectId}/invitations`);
  }

  public async revokeProjectInvitation(projectId: string, invitationId: string): Promise<any> {
    return this.request(`/projects/${projectId}/invitations/${invitationId}`, {
      method: "DELETE",
    });
  }

  // ==========================================
  // COMMENTS METHODS
  // ==========================================

  public async getProjectComments(projectId: string, params?: { objectType?: string; objectId?: string }): Promise<any> {
    let endpoint = `/projects/${projectId}/comments`;
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.objectType) searchParams.append("objectType", params.objectType);
      if (params.objectId) searchParams.append("objectId", params.objectId);
      endpoint += `?${searchParams.toString()}`;
    }
    return this.request(endpoint);
  }

  public async createProjectComment(projectId: string, data: { objectType: string; objectId: string; body: string; parentCommentId?: string }): Promise<any> {
    return this.request(`/projects/${projectId}/comments`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public async updateComment(commentId: string, body: string): Promise<any> {
    return this.request(`/projects/comments/${commentId}`, {
      method: "PATCH",
      body: JSON.stringify({ body }),
    });
  }

  public async deleteComment(commentId: string): Promise<any> {
    return this.request(`/projects/comments/${commentId}`, {
      method: "DELETE",
    });
  }
  public async getMyInvitations(): Promise<{ invitations: any[] }> {
    return this.request<{ invitations: any[] }>("/auth/invitations/me");
  }

  // ==========================================
  // TRIAL METHODS
  // ==========================================

  public async startTrial(): Promise<{ message: string; trial_started_at: string; trial_ends_at: string; days_remaining: number }> {
    return this.request("/subscriptions/start-trial", {
      method: "POST",
    });
  }

  public async getTrialStatus(): Promise<{ isOnTrial: boolean; trialUsed: boolean; trialStartedAt: string | null; trialEndsAt: string | null; daysRemaining: number; isExpired: boolean }> {
    return this.request("/subscriptions/trial-status");
  }

  public async getTrialSummary(): Promise<{ projectsCreated: number; assessmentsCompleted: number; teamMembersInvited: number; questionsAnswered: number }> {
    return this.request("/subscriptions/trial-summary");
  }

  public async recordPathChoice(choice: "aima" | "premium"): Promise<{ success: boolean }> {
    return this.request("/subscriptions/record-path-choice", {
      method: "POST",
      body: JSON.stringify({ choice }),
    });
  }

  // ==========================================
  // AI COPILOT CHAT
  // ==========================================

  async sendChatMessage(data: {
    messages: { role: "user" | "assistant"; content: string }[];
    controlId?: string;
    projectId?: string;
  }): Promise<{ reply: string }> {
    return this.request<{ reply: string }>("/chat", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  public async getNotificationPreferences(): Promise<{
    weekly_digest: boolean;
    critical_alerts: boolean;
    vendor_reassessment: boolean;
    email_undeliverable: boolean;
    marketing_emails: boolean;
    timezone: string;
  }> {
    return this.request("/notifications/preferences");
  }

  public async updateNotificationPreferences(prefs: {
    weekly_digest?: boolean;
    critical_alerts?: boolean;
    vendor_reassessment?: boolean;
    marketing_emails?: boolean;
    timezone?: string;
  }): Promise<{
    weekly_digest: boolean;
    critical_alerts: boolean;
    vendor_reassessment: boolean;
    email_undeliverable: boolean;
    marketing_emails: boolean;
    timezone: string;
  }> {
    return this.request("/notifications/preferences", {
      method: "PUT",
      body: JSON.stringify(prefs),
    });
  }

  public async getNotificationHistory(page = 1, limit = 10): Promise<{
    history: NotificationHistoryItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    return this.request(`/notifications/history?page=${page}&limit=${limit}`);
  }

  // ==========================================
  // AI COMPONENT INVENTORY
  // ==========================================

  async getComponents(
    projectId: string,
    filters?: { type?: string; provider?: string; risk_tier?: string; status?: string }
  ): Promise<InventoryComponent[]> {
    const queryParams = new URLSearchParams();
    if (filters) {
      if (filters.type) queryParams.append("type", filters.type);
      if (filters.provider) queryParams.append("provider", filters.provider);
      if (filters.risk_tier) queryParams.append("risk_tier", filters.risk_tier);
      if (filters.status) queryParams.append("status", filters.status);
    }
    const queryString = queryParams.toString();
    return this.request<InventoryComponent[]>(`/inventory/${projectId}${queryString ? `?${queryString}` : ""}`);
  }

  async getComponent(projectId: string, id: string): Promise<InventoryComponent> {
    return this.request<InventoryComponent>(`/inventory/${projectId}/${id}`);
  }

  async createComponent(projectId: string, data: Partial<InventoryComponent>): Promise<InventoryComponent> {
    return this.request<InventoryComponent>(`/inventory/${projectId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateComponent(projectId: string, id: string, data: Partial<InventoryComponent>): Promise<InventoryComponent> {
    return this.request<InventoryComponent>(`/inventory/${projectId}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteComponent(projectId: string, id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/inventory/${projectId}/${id}`, {
      method: "DELETE",
    });
  }

  async getInventorySummary(projectId: string): Promise<{ totalCount: number; thirdPartyCount: number; highestRiskTier: string }> {
    return this.request<{ totalCount: number; thirdPartyCount: number; highestRiskTier: string }>(`/inventory/${projectId}/summary`);
  }

  async exportInventoryCsv(
    projectId: string,
    filters?: { type?: string; provider?: string; risk_tier?: string; status?: string }
  ): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/inventory/${projectId}/export`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(filters || {}),
    });

    if (!response.ok) {
      throw new Error("Export failed");
    }

    return response.blob();
  }

  // ==========================================
  // VENDOR RISK ASSESSMENT (FEATURE C)
  // ==========================================

  async getVendorAssessmentSchema(): Promise<{ success: boolean; questions: any[] }> {
    return this.request<{ success: boolean; questions: any[] }>("/vendor-assessments/schema");
  }

  async getVendorAssessment(projectId: string, componentId: string): Promise<{ success: boolean; data: VendorAssessment }> {
    return this.request<{ success: boolean; data: VendorAssessment }>(`/vendor-assessments/${projectId}/component/${componentId}`);
  }

  async saveVendorAssessment(
    projectId: string,
    componentId: string,
    answers: Record<string, VendorAssessmentAnswer>
  ): Promise<{ success: boolean; data: VendorAssessment }> {
    return this.request<{ success: boolean; data: VendorAssessment }>(`/vendor-assessments/${projectId}/component/${componentId}/save`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    });
  }

  async completeVendorAssessment(
    projectId: string,
    componentId: string,
    answers: Record<string, VendorAssessmentAnswer>
  ): Promise<{ success: boolean; data: VendorAssessment }> {
    return this.request<{ success: boolean; data: VendorAssessment }>(`/vendor-assessments/${projectId}/component/${componentId}/complete`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    });
  }

  // AI System Profile Wizard
  async getWizardStatus(projectId: string): Promise<WizardStatusResponse> {
    return this.request<WizardStatusResponse>(`/wizard/${projectId}/status`);
  }

  async getWizardAnswers(projectId: string): Promise<WizardAnswersResponse> {
    return this.request<WizardAnswersResponse>(`/wizard/${projectId}/answers`);
  }

  async saveWizardAnswers(projectId: string, answers: Partial<WizardAnswers>): Promise<WizardSaveResponse> {
    return this.request<WizardSaveResponse>(`/wizard/${projectId}/save`, {
      method: "POST",
      body: JSON.stringify(answers),
    });
  }

  async completeWizard(projectId: string): Promise<WizardOutputsResponse> {
    return this.request<WizardOutputsResponse>(`/wizard/${projectId}/complete`, {
      method: "POST",
    });
  }

  async applyWizardProfile(projectId: string, payload?: WizardApplyPayload): Promise<WizardApplyResponse> {
    return this.request<WizardApplyResponse>(`/wizard/${projectId}/apply`, {
      method: "POST",
      body: payload ? JSON.stringify(payload) : undefined,
    });
  }

  async editWizardAnswers(projectId: string, answers: Partial<WizardAnswers>): Promise<WizardOutputsResponse> {
    return this.request<WizardOutputsResponse>(`/wizard/${projectId}/answers`, {
      method: "PUT",
      body: JSON.stringify(answers),
    });
  }

  async getWizardEngineOutput(projectId: string): Promise<WizardOutputsResponse> {
    return this.request<WizardOutputsResponse>(`/wizard/${projectId}/engine-output`);
  }
}

export interface NotificationHistoryItem {
  id: string;
  project_id: string | null;
  notification_type: "weekly_digest" | "critical_alerts" | "vendor_reassessment";
  subject: string;
  status: "sent" | "failed" | "queued" | "bounced";
  metadata: Record<string, any> | null;
  sent_at: string | null;
  created_at: string;
}

export const apiService = new ApiService();
