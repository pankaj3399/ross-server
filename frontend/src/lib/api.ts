export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  subscription_status: string;
  organization?: string;
  email_verified?: boolean;
  mfa_enabled?: boolean;
  updated_at?: string;
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
  created_at: string;
  updated_at: string;
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
      const errorMessage = error.error || `HTTP ${response.status}`;
      const errorWithStatus = new Error(errorMessage) as Error & { status?: number };
      errorWithStatus.status = response.status;
      throw errorWithStatus;
    }

    return response.json();
  }

  // Authentication
  async register(data: {
    email: string;
    password: string;
    name: string;
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
    return this.request<Project>(`/projects/${id}`);
  }

  async updateProject(
    id: string,
    data: {
      name?: string;
      description?: string;
      aiSystemType?: string;
      industry?: string;
      status?: string;
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

  async submitProject(id: string): Promise<{ message: string; project: Project; results: any }> {
    return this.request<{ message: string; project: Project; results: any }>(`/projects/${id}/submit`, {
      method: "POST",
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
    if (!projectId) {
      throw new Error("Project ID is required");
    }
    const url = `/aima/domains-full?project_id=${projectId}`;
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
    insights: Record<string, string>; // domainId -> insights text
  }> {
    return this.request<{
      success: boolean;
      insights: Record<string, string>;
    }>(`/projects/${projectId}/generate-insights`, {
      method: "POST",
    });
  }
}

export const apiService = new ApiService();
