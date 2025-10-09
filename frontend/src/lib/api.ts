const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  subscription_status: string;
  organization?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
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
      throw new Error(error.error || `HTTP ${response.status}`);
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

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (response.token) {
      localStorage.setItem("auth_token", response.token);
    }

    return response;
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>("/auth/me");
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

  // AIMA Framework
  async getDomains(): Promise<{ domains: Domain[] }> {
    return this.request<{ domains: Domain[] }>("/aima/domains");
  }

  async getDomain(domainId: string): Promise<{
    id: string;
    title: string;
    description: string;
    practices: Record<string, Practice>;
  }> {
    return this.request<{
      id: string;
      title: string;
      description: string;
      practices: Record<string, Practice>;
    }>(`/aima/domains/${domainId}`);
  }

  async getPracticeQuestions(
    domainId: string,
    practiceId: string,
  ): Promise<{
    domainId: string;
    practiceId: string;
    title: string;
    description: string;
    levels: Record<string, Record<string, string[]>>;
  }> {
    return this.request<{
      domainId: string;
      practiceId: string;
      title: string;
      description: string;
      levels: Record<string, Record<string, string[]>>;
    }>(`/aima/domains/${domainId}/practices/${practiceId}`);
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

  async getAnswers(projectId: string): Promise<
    Array<{
      domain_id: string;
      practice_id: string;
      level: string;
      stream: string;
      question_index: number;
      value: number;
      created_at: string;
      updated_at: string;
    }>
  > {
    return this.request<
      Array<{
        domain_id: string;
        practice_id: string;
        level: string;
        stream: string;
        question_index: number;
        value: number;
        created_at: string;
        updated_at: string;
      }>
    >(`/answers/${projectId}`);
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
}

export const apiService = new ApiService();
