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
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Domain {
  id: string;
  title: string;
  description: string;
  practices: string[];
}

export interface Practice {
  title: string;
  description: string;
}

export interface Question {
  level: string;
  stream: string;
  question_index: number;
  question_text: string;
}

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

    if (response.token) {
      localStorage.setItem("auth_token", response.token);
    }

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
    levels: Record<string, Record<string, string[]>>;
  }> {
    const url = projectId 
      ? `/aima/domains/${domainId}/practices/${practiceId}?project_id=${projectId}` 
      : `/aima/domains/${domainId}/practices/${practiceId}`;
    return this.request<{
      domainId: string;
      practiceId: string;
      title: string;
      description: string;
      levels: Record<string, Record<string, string[]>>;
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

  async evaluateFairnessResponse(data: {
    projectId: string;
    category: string;
    questionText: string;
    userResponse: string;
  }): Promise<{
    success: boolean;
    evaluation: {
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
  }> {
    return this.request<{
      success: boolean;
      evaluation: {
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
    }>("/fairness/evaluate", {
      method: "POST",
      body: JSON.stringify(data),
    });
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
        groups: Array<{
          value: string;
          rows: number;
          positive: number;
          positiveRate: number;
        }>;
      }>;
    };
    fairnessResult: { score: number; label: "low" | "moderate" | "high"; explanation: string };
    biasness: { score: number; label: "low" | "moderate" | "high"; explanation: string };
    toxicity: { score: number; label: "low" | "moderate" | "high"; explanation: string };
    relevance: { score: number; label: "low" | "moderate" | "high"; explanation: string };
    faithfulness: { score: number; label: "low" | "moderate" | "high"; explanation: string };
  }> {
    return this.request("/fairness/dataset-evaluate", {
      method: "POST",
      body: JSON.stringify(data),
    });
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

  async getFairnessJob(jobId: string): Promise<{
    jobId: string;
    status: "queued" | "running" | "completed" | "failed";
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
      status: "queued" | "running" | "completed" | "failed";
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

  // // Email Verification
  // async verifyEmail(token: string): Promise<AuthResponse> {
  //   return this.request<AuthResponse>("/auth/verify-email", {
  //     method: "POST",
  //     body: JSON.stringify({ token }),
  //   });
  // }

  async resendVerification(): Promise<{ message: string; emailSent: boolean }> {
    return this.request<{ message: string; emailSent: boolean }>(
      "/auth/resend-verification",
      {
        method: "POST",
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
}

export const apiService = new ApiService();
