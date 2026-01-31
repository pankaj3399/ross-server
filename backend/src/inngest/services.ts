import pool from "../config/database";
import type { EvaluationPayload } from "../services/evaluateFairness";

// Types 
// Extended payload types that include runtime fields added during job processing
export type FairnessApiJobPayloadExtended = FairnessApiJobPayload & {
  userApiResponses?: UserApiResponse[];
  userApiCallStatuses?: Record<string, "success" | "failed">;
  responses?: Array<{
    category: string;
    prompt: string;
    response: string;
  }>;
  itemStatuses?: Record<string, "success" | "failed">;
  _currentApiCall?: {
    jobId: string;
    promptIndex: number;
  };
};

export type FairnessPromptsJobPayloadExtended = FairnessPromptsJobPayload & {
  itemStatuses?: Record<string, "success" | "failed">;
};

// Discriminated union of all possible payload shapes
export type EvaluationStatusPayload = 
  | FairnessApiJobPayloadExtended
  | FairnessPromptsJobPayloadExtended;

// Discriminated union for EvaluationStatusRow, discriminated by job_type
export type EvaluationStatusRow = 
  | {
      id: number;
      user_id: string;
      project_id: string;
      job_id: string;
      payload: FairnessApiJobPayloadExtended;
      total_prompts: number | null;
      status: string;
      progress: string | null;
      last_processed_prompt: string | null;
      percent: number | null;
      job_type: "AUTOMATED_API_TEST";
    }
  | {
      id: number;
      user_id: string;
      project_id: string;
      job_id: string;
      payload: FairnessPromptsJobPayloadExtended;
      total_prompts: number | null;
      status: string;
      progress: string | null;
      last_processed_prompt: string | null;
      percent: number | null;
      job_type: "MANUAL_PROMPT_TEST";
    };

export type ApiKeyPlacement = "none" | "auth_header" | "x_api_key" | "query_param" | "body_field";

export type FairnessApiJobConfigStored = {
  projectId: string;
  apiUrl: string;
  requestTemplate: string;
  responseKey: string;
  apiKeyPlacement?: ApiKeyPlacement;
  apiKey?: string | null;
  apiKeyFieldName?: string | null;
};

export type FairnessApiJobConfig = {
  projectId: string;
  apiUrl: string;
  requestTemplate: string;
  responseKey: string;
  apiKeyPlacement: ApiKeyPlacement;
  apiKey: string | null;
  apiKeyFieldName: string | null;
};

export type FairnessApiJobPayload = {
  type: "FAIRNESS_API";
  config: FairnessApiJobConfigStored;
  summary?: JobSummary;
  results?: JobResult[];
  errors?: JobError[];
  error?: string;
};

export type FairnessPromptsJobPayload = {
  type: "FAIRNESS_PROMPTS";
  responses: Array<{
    category: string;
    prompt: string;
    response: string;
  }>;
  summary?: JobSummary;
  results?: JobResult[];
  errors?: JobError[];
  error?: string;
};

export type JobSummary = {
  total: number;
  successful: number;
  failed: number;
  averageOverallScore: number;
  averageBiasScore: number;
  averageToxicityScore: number;
};

export type JobResult = {
  category: string;
  prompt: string;
  success: true;
  evaluation: EvaluationPayload;
  message: string;
};

export type JobError = {
  category: string;
  prompt: string;
  success: false;
  error: string;
  message: string;
};

export type UserApiResponse = {
  promptIndex: number;
  category: string;
  prompt: string;
  success: true;
  response: string;
} | {
  promptIndex: number;
  category: string;
  prompt: string;
  success: false;
  error: string;
};

// Constants
export const MIN_REQUEST_INTERVAL_MS = Number(process.env.EVALUATION_MIN_REQUEST_INTERVAL_MS || 45000);

export const VALID_API_KEY_PLACEMENTS: ApiKeyPlacement[] = [
  "none",
  "auth_header",
  "x_api_key",
  "query_param",
  "body_field",
];

export const DEFAULT_API_KEY_FIELD_NAMES: Record<ApiKeyPlacement, string | null> = {
  none: null,
  auth_header: "Authorization",
  x_api_key: "x-api-key",
  query_param: "key",
  body_field: "api_key",
};

const PROMPT_PLACEHOLDER_REGEX = /{{\s*prompt\s*}}/gi;

// Helper functions 
export function normalizeFairnessApiJobConfig(config: FairnessApiJobConfigStored): FairnessApiJobConfig {
  const placement: ApiKeyPlacement = VALID_API_KEY_PLACEMENTS.includes(
    (config.apiKeyPlacement as ApiKeyPlacement) || "none",
  )
    ? ((config.apiKeyPlacement as ApiKeyPlacement) || "none")
    : "none";

  return {
    projectId: config.projectId,
    apiUrl: config.apiUrl,
    requestTemplate: config.requestTemplate,
    responseKey: config.responseKey,
    apiKeyPlacement: placement,
    apiKey: config.apiKey ?? null,
    apiKeyFieldName: resolveApiKeyFieldName(placement, config.apiKeyFieldName),
  };
}

export function resolveApiKeyFieldName(placement: ApiKeyPlacement, provided?: string | null): string | null {
  const trimmed = typeof provided === "string" ? provided.trim() : null;
  if (trimmed && trimmed.length > 0) {
    return trimmed;
  }
  return DEFAULT_API_KEY_FIELD_NAMES[placement] || null;
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildSummary(total: number, results: JobResult[], errors: JobError[]): JobSummary {
  // Ensure we don't count the same prompt multiple times if results/errors arrays are somehow messy
  // Although the aggregator should prevent this, this is a defensive measure.
  const successCount = Math.min(results.length, total);
  const failureCount = Math.min(errors.length, total - successCount);

  const average = (arr: number[]) =>
    arr.length === 0 ? 0 : arr.reduce((sum, value) => sum + value, 0) / arr.length;

  // Filter out null scores - only include successful evaluations in averaging
  const overallScores = results
    .slice(0, successCount) // Only take up to 'total' items
    .map((r) => r.evaluation.overallScore)
    .filter((score): score is number => score !== null);
  const biasScores = results
    .slice(0, successCount)
    .map((r) => r.evaluation.biasScore)
    .filter((score): score is number => score !== null);
  const toxicityScores = results
    .slice(0, successCount)
    .map((r) => r.evaluation.toxicityScore)
    .filter((score): score is number => score !== null);

  return {
    total,
    successful: successCount,
    failed: failureCount,
    averageOverallScore: parseFloat(average(overallScores).toFixed(3)),
    averageBiasScore: parseFloat(average(biasScores).toFixed(3)),
    averageToxicityScore: parseFloat(average(toxicityScores).toFixed(3)),
  };
}

export async function fetchFairnessPrompts(): Promise<Array<{ category: string; prompt: string }>> {
  const questionsResult = await pool.query(
    `SELECT label, prompt
     FROM fairness_questions
     ORDER BY label, created_at`,
  );

  return questionsResult.rows.map((row: { label: string; prompt: string }) => ({
    category: row.label,
    prompt: row.prompt,
  }));
}

export async function callEvaluationService(
  projectId: string,
  userId: string,
  category: string,
  questionText: string,
  userResponse: string,
  step: any,
): Promise<EvaluationPayload> {
  const evaluationId = `${projectId}-${category}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  await step.sendEvent(`trigger-evaluation-${evaluationId}`, {
    name: "evaluation/single.requested",
    data: {
      projectId,
      userId,
      category,
      questionText,
      userResponse,
      evaluationId,
    },
  });

  const result = await step.waitForEvent(`wait-for-evaluation-${evaluationId}`, {
    event: "evaluation/single.completed",
    timeout: "10m",
    if: `async.data.evaluationId == "${evaluationId}"`,
  });

  if (!result) {
    throw new Error("Evaluation timed out or failed");
  }

  return result.data.evaluation;
}

function replaceTemplatePlaceholders(value: any, prompt: string): { value: any; replaced: boolean } {
  if (typeof value === "string") {
    const replacedValue = value.replace(PROMPT_PLACEHOLDER_REGEX, prompt);
    const hasPlaceholder = replacedValue !== value;
    if (!hasPlaceholder) {
      return { value, replaced: false };
    }
    return { value: replacedValue, replaced: true };
  }

  if (Array.isArray(value)) {
    let replaced = false;
    const next = value.map((item) => {
      const result = replaceTemplatePlaceholders(item, prompt);
      if (result.replaced) {
        replaced = true;
      }
      return result.value;
    });
    return { value: next, replaced };
  }

  if (value && typeof value === "object") {
    let replaced = false;
    const next: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      const result = replaceTemplatePlaceholders(val, prompt);
      if (result.replaced) {
        replaced = true;
      }
      next[key] = result.value;
    }
    return { value: next, replaced };
  }

  return { value, replaced: false };
}

export function buildRequestBodyFromTemplate(templateString: string, prompt: string) {
  let parsed: any;

  try {
    parsed = JSON.parse(templateString);
  } catch (error: any) {
    throw new Error(`Request template is not valid JSON: ${error.message}`);
  }

  const { value: hydrated, replaced } = replaceTemplatePlaceholders(parsed, prompt);

  if (!replaced) {
    throw new Error('Request template must include the "{{prompt}}" placeholder at least once');
  }

  return hydrated;
}

export function appendQueryParam(urlString: string, param: string, value: string): string {
  try {
    const parsed = new URL(urlString);
    parsed.searchParams.set(param, value);
    return parsed.toString();
  } catch {
    const separator = urlString.includes("?") ? "&" : "?";
    return `${urlString}${separator}${encodeURIComponent(param)}=${encodeURIComponent(value)}`;
  }
}

export function getNestedValue(obj: any, path: string): any {
  if (!path) return obj;

  const normalizedPath = path.replace(/\[(\d+)\]/g, ".$1");
  const keys = normalizedPath.split(".").filter((key) => key.length > 0);

  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }

    const numKey = Number(key);
    if (!Number.isNaN(numKey) && Array.isArray(current)) {
      current = current[numKey];
    } else if (typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return current;
}

export function prepareRequestOptions(
  config: FairnessApiJobConfig,
  requestPayload: any,
): { url: string; headers: Record<string, string>; body: any } {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  let url = config.apiUrl;
  let body = requestPayload;

  if (config.apiKeyPlacement !== "none" && config.apiKey) {
    const fieldName = resolveApiKeyFieldName(config.apiKeyPlacement, config.apiKeyFieldName) || undefined;
    const normalizedFieldName = fieldName?.toLowerCase();
    const shouldMirrorGoogleHeader = normalizedFieldName === "x-goog-api-key";

    switch (config.apiKeyPlacement) {
      case "auth_header":
        headers.Authorization = `Bearer ${config.apiKey}`;
        break;
      case "x_api_key":
        headers[fieldName || "x-api-key"] = config.apiKey;
        break;
      case "query_param":
        url = appendQueryParam(url, fieldName || "key", config.apiKey);
        break;
      case "body_field": {
        if (body === null || typeof body !== "object" || Array.isArray(body)) {
          throw new Error("Request template must resolve to an object to inject the API key into the body");
        }
        const bodyField = fieldName || "api_key";
        body = {
          ...body,
          [bodyField]: config.apiKey,
        };
        break;
      }
      default:
        break;
    }

    if (shouldMirrorGoogleHeader) {
      headers["x-goog-api-key"] = config.apiKey;
    }
  }

  return { url, headers, body };
}

export async function callUserApi(config: FairnessApiJobConfig, prompt: string): Promise<string> {
  const trimmedTemplate = config.requestTemplate.trim();
  const trimmedResponsePath = config.responseKey.trim();

  if (!trimmedResponsePath) {
    throw new Error("Response key is required to extract the model output");
  }

  if (!trimmedTemplate) {
    throw new Error("Request template cannot be empty");
  }

  const requestPayload = buildRequestBodyFromTemplate(trimmedTemplate, prompt);
  const { url, headers, body } = prepareRequestOptions(config, requestPayload);

  const controller = new AbortController();
  const timeoutMs = 10000; // 10 seconds timeout
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError" || controller.signal.aborted) {
      throw new Error(`Request to user API timed out after ${timeoutMs}ms`);
    }
    throw error;
  }

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => `API returned status ${response.status}`);
    throw new Error(
      errorText?.trim() ? errorText : `API returned status ${response.status}`,
    );
  }

  const data = await response.json();
  const value = getNestedValue(data, trimmedResponsePath);

  if (value === undefined) {
    throw new Error(`Response path "${trimmedResponsePath}" not found in API response`);
  }

  if (typeof value !== "string") {
    throw new Error(`Response path "${trimmedResponsePath}" must resolve to a string value`);
  }

  return value;
}

// Updates job progress based on weighted two-phase system or single-phase system
export async function updateJobProgress(jobId: string): Promise<{
  percent: number;
  progress: string;
  status: string;
}> {
  const jobResult = await pool.query(
    `SELECT id, status, payload, total_prompts FROM evaluation_status WHERE job_id = $1`,
    [jobId]
  );

  if (jobResult.rows.length === 0) {
    throw new Error(`Job ${jobId} not found`);
  }

  const job = jobResult.rows[0];
  const payload = (job.payload || {}) as EvaluationStatusPayload;
  const totalCount = job.total_prompts || 0;
  
  const userApiCallStatuses = ("userApiCallStatuses" in payload ? payload.userApiCallStatuses : undefined) || {};
  const itemStatuses = ("itemStatuses" in payload ? payload.itemStatuses : undefined) || {};
  
  const collectedCount = Object.keys(userApiCallStatuses).length;
  const evaluatedCount = Object.keys(itemStatuses).length;
  
  let percent: number;
  let progress: string;
  let status: string = job.status || "collecting_responses";
  
  const hasUserApiCallStatuses = userApiCallStatuses && Object.keys(userApiCallStatuses).length > 0;
  const isTwoPhaseMode = status === "collecting_responses" || hasUserApiCallStatuses;
  
  if (totalCount === 0) {
    percent = 0;
    progress = "0/0";
  } else {
    if (isTwoPhaseMode) {
      if (status === "collecting_responses") {
        percent = Math.round((collectedCount / totalCount) * 50);
        progress = `${collectedCount}/${totalCount}`;
        
        if (collectedCount >= totalCount) {
          const allFailed = Object.values(userApiCallStatuses).every(
            (statusValue) => statusValue === "failed"
          );
          
          if (allFailed && collectedCount > 0) {
            status = "failed";
            percent = 50;
            progress = `${collectedCount}/${totalCount}`;
          } else {
            status = "evaluating";
            percent = 50;
          }
        }
      }
      else if (status === "evaluating") {
        percent = Math.round(50 + (evaluatedCount / totalCount) * 50);
        progress = `${evaluatedCount}/${totalCount}`;
      }
      else {
        const currentPercent = job.percent || 0;
        percent = currentPercent;
        progress = job.progress || "0/0";
      }
    } else {
      if (status === "evaluating") {
        percent = Math.round((evaluatedCount / totalCount) * 100);
        progress = `${evaluatedCount}/${totalCount}`;
      }
      else {
        const currentPercent = job.percent || 0;
        percent = currentPercent;
        progress = job.progress || "0/0";
      }
    }
  }
  
    percent = Math.max(0, Math.min(100, percent));
  
  await pool.query(
    `UPDATE evaluation_status
     SET status = $1,
         progress = $2,
         percent = $3
     WHERE job_id = $4`,
    [status, progress, percent, jobId]
  );
  
  return { percent, progress, status };
}

export async function markJobCompleted(
  jobInternalId: number,
  payload: FairnessApiJobPayloadExtended | FairnessPromptsJobPayloadExtended,
  data: { summary: JobSummary; results: JobResult[]; errors: JobError[] },
) {
  const total = data.summary.total;
  const successful = data.results.length;
  const failed = data.errors.length;
  
  let finalStatus: string;
  if (total === 0) {
    finalStatus = "success";
  } else if (successful === 0 && failed > 0) {
    finalStatus = "failed";
  } else if (failed === 0) {
    finalStatus = "success";
  } else {
    finalStatus = "partial_success";
  }
  
  const sanitizeConfigForStorage = (config: any): any => {
    if (!config || typeof config !== 'object') return config;
    const sensitivePattern = /api[-_]?key|token|secret|password|access[-_]?token/i;
    const sanitized = { ...config };
    for (const key of Object.keys(sanitized)) {
      if (sensitivePattern.test(key)) {
        sanitized[key] = "[REDACTED]";
      }
    }
    return sanitized;
  };

  const updatedPayload = {
    ...payload,
    summary: data.summary,
    results: data.results,
    errors: data.errors,
  };

  await pool.query(
    `UPDATE evaluation_status
     SET status = $1,
         progress = $2,
         percent = 100,
         payload = $3
     WHERE id = $4`,
    [
      finalStatus,
      `${data.summary.total}/${data.summary.total}`,
      JSON.stringify(updatedPayload),
      jobInternalId,
    ],
  );

  // If this is an API test, save to persistent history table
  if (payload.type === "FAIRNESS_API") {
    try {
        // Need to fetch user_id, project_id, job_id from the job record first to be safe,
        // or we can rely on what we have if we passed it in. 
        // But `jobInternalId` is just the ID.
        // Let's fetch the full job details to ensure we have user_id/project_id
        const jobResult = await pool.query(
            `SELECT user_id, project_id, job_id FROM evaluation_status WHERE id = $1`,
            [jobInternalId]
        );
        
        if (jobResult.rows.length > 0) {
            const { user_id, project_id, job_id } = jobResult.rows[0];
            
            await pool.query(
                `INSERT INTO api_test_reports 
                 (user_id, project_id, job_id, total_prompts, success_count, failure_count, average_scores, results, errors, config)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT (job_id) DO UPDATE SET
                   total_prompts = EXCLUDED.total_prompts,
                   success_count = EXCLUDED.success_count,
                   failure_count = EXCLUDED.failure_count,
                   average_scores = EXCLUDED.average_scores,
                   results = EXCLUDED.results,
                   errors = EXCLUDED.errors,
                   config = EXCLUDED.config,
                   updated_at = CURRENT_TIMESTAMP`,
                [
                    user_id,
                    project_id,
                    job_id,
                    data.summary.total,
                    data.summary.successful,
                    data.summary.failed,
                    JSON.stringify({
                        averageOverallScore: data.summary.averageOverallScore,
                        averageBiasScore: data.summary.averageBiasScore,
                        averageToxicityScore: data.summary.averageToxicityScore
                    }),
                    JSON.stringify(data.results),
                    JSON.stringify(data.errors),
                    JSON.stringify(sanitizeConfigForStorage(payload.config) || {})
                ]
            );
        }
    } catch (err) {
        console.error("Failed to save API test report history:", err);
        // Don't fail the job if history save fails
    }
  }
}

export async function failJob(jobInternalId: number, message: string) {
  await pool.query(
    `UPDATE evaluation_status
     SET status = 'failed',
     payload = COALESCE(payload, '{}'::jsonb) || $1::jsonb
     WHERE id = $2`,
    [JSON.stringify({ error: message }), jobInternalId],
  );
}

export async function processAutomatedApiTest(
  job: EvaluationStatusRow & { job_type: "AUTOMATED_API_TEST" },
  payload: FairnessApiJobPayloadExtended,
  step: any
) {
  if (payload.type !== "FAIRNESS_API") {
    throw new Error("Invalid payload type for AUTOMATED_API_TEST job");
  }

  const config = normalizeFairnessApiJobConfig(payload.config);

  await step.run("verify-project", async () => {
    const projectCheck = await pool.query(
      "SELECT id, version_id FROM projects WHERE id = $1 AND user_id = $2",
      [config.projectId, job.user_id],
    );

    if (projectCheck.rowCount === 0) {
      throw new Error("Project not found or access denied for this job");
    }
  });

  const prompts = await step.run("fetch-prompts", async () => {
    return await fetchFairnessPrompts();
  });

  if (prompts.length === 0) {
    await step.run("mark-empty-completed", async () => {
      await markJobCompleted(job.id, payload, {
        summary: {
          total: 0,
          successful: 0,
          failed: 0,
          averageOverallScore: 0,
          averageBiasScore: 0,
          averageToxicityScore: 0,
        },
        results: [],
        errors: [],
      });
    });
    return;
  }

  // Initialize job progress - start in collecting_responses phase
  await step.run("initialize-progress", async () => {
    await pool.query(
      `UPDATE evaluation_status
       SET status = 'collecting_responses',
           total_prompts = $1,
           progress = $2,
           percent = 0
       WHERE id = $3`,
      [prompts.length, `0/${prompts.length}`, job.id],
    );
  });

  await step.run("initialize-user-api-responses", async () => {
    await pool.query(
      `UPDATE evaluation_status
       SET payload = COALESCE(payload, '{}'::jsonb) || '{"userApiResponses": []}'::jsonb
       WHERE id = $1`,
      [job.id]
    );
  });

  for (let i = 0; i < prompts.length; i += 1) {
    const { category, prompt } = prompts[i];
    
    if (i > 0) {
      await step.run(`delay-before-user-api-${i}`, async () => {
        await delay(MIN_REQUEST_INTERVAL_MS);
      });
    }
    
    await step.sendEvent(`trigger-user-api-${i}`, {
      name: "user-api/call.requested",
      data: {
        jobId: job.job_id,
        promptIndex: i,
        category,
        prompt,
        config: payload.config,
      },
    });
  }

  await step.waitForEvent("wait-for-all-user-api-complete", {
    event: "user-api/all-completed",
    timeout: `${prompts.length * 2}m`,
    if: `async.data.jobId == "${job.job_id}"`,
  });

  const finalJobData = await step.run("read-collected-responses", async () => {
    const jobData = await pool.query(
      `SELECT payload FROM evaluation_status WHERE id = $1`,
      [job.id]
    );
    
    return jobData.rows[0]?.payload || {};
  });
  
  const userApiResponses: UserApiResponse[] = finalJobData.userApiResponses || [];
  
  const successfulResponses = userApiResponses
    .filter((r) => r.success)
    .sort((a, b) => a.promptIndex - b.promptIndex)
    .map((r) => ({
      category: r.category,
      prompt: r.prompt,
      response: (r as { success: true; response: string }).response,
    }));

  const failedResponses: JobError[] = userApiResponses
    .filter((r) => !r.success)
    .map((r) => ({
      category: r.category,
      prompt: r.prompt,
      success: false as const,
      error: (r as { success: false; error: string }).error,
      message: (r as { success: false; error: string }).error,
    }));

  await step.run("initialize-evaluation-tracking", async () => {
    await pool.query(
      `UPDATE evaluation_status
       SET payload = jsonb_set(
         jsonb_set(
           jsonb_set(
             COALESCE(payload, '{}'::jsonb),
             '{responses}',
             $1::jsonb
           ),
           '{itemStatuses}',
           '{}'::jsonb
         ),
         '{errors}',
         $2::jsonb
       )
       WHERE id = $3`,
      [
        JSON.stringify(successfulResponses),
        JSON.stringify(failedResponses),
        job.id,
      ],
    );
  });

  if (successfulResponses.length === 0) {
    await step.run("mark-all-failed-completed", async () => {
      // Check current status - if already failed from updateJobProgress, just finalize
      const jobCheck = await pool.query(
        `SELECT status FROM evaluation_status WHERE id = $1`,
        [job.id]
      );
      const currentStatus = jobCheck.rows[0]?.status;
      
      if (currentStatus === "failed") {
        // Status already set to failed by updateJobProgress, just finalize with summary
        const summary = buildSummary(userApiResponses.length, [], failedResponses);
        await pool.query(
          `UPDATE evaluation_status
           SET progress = $1,
               percent = 50,
               payload = COALESCE(payload, '{}'::jsonb) || $2::jsonb
           WHERE id = $3`,
          [
            `${userApiResponses.length}/${userApiResponses.length}`,
            JSON.stringify({
              summary,
              results: [],
              errors: failedResponses,
            }),
            job.id,
          ],
        );
      } else {
        // Status not yet set to failed, use markJobCompleted to set it properly
        const summary = buildSummary(userApiResponses.length, [], failedResponses);
        await markJobCompleted(job.id, payload, {
          summary,
          results: [],
          errors: failedResponses,
        });
      }
    });
    return;
  }
  
  // Transition to evaluating phase when we have successful responses
  await step.run("transition-to-evaluating-phase", async () => {
    await pool.query(
      `UPDATE evaluation_status
       SET status = 'evaluating',
           progress = $1,
           percent = 50
       WHERE id = $2`,
      [`0/${successfulResponses.length}`, job.id]
    );
  });

  for (let i = 0; i < successfulResponses.length; i += 1) {
    const { category, prompt, response: userResponse } = successfulResponses[i];
    
    if (i > 0) {
      await step.run(`delay-before-evaluation-${i}`, async () => {
        await delay(MIN_REQUEST_INTERVAL_MS);
      });
    }
    
    await step.sendEvent(`trigger-evaluation-${i}`, {
      name: "evaluation/single.requested",
      data: {
        jobId: job.job_id,
        responseIndex: i,
        projectId: job.project_id,
        userId: job.user_id,
        category,
        questionText: prompt,
        userResponse,
      },
    });
  }
}

export async function processManualPromptTest(
  job: EvaluationStatusRow & { job_type: "MANUAL_PROMPT_TEST" },
  payload: FairnessPromptsJobPayloadExtended,
  step: any
) {
  if (payload.type !== "FAIRNESS_PROMPTS") {
    throw new Error("Invalid payload type for MANUAL_PROMPT_TEST job");
  }

  await step.run("verify-project", async () => {
    const projectCheck = await pool.query(
      "SELECT id, version_id FROM projects WHERE id = $1 AND user_id = $2",
      [job.project_id, job.user_id],
    );

    if (projectCheck.rowCount === 0) {
      throw new Error("Project not found or access denied for this job");
    }
  });

  const responses = payload.responses || [];
  if (responses.length === 0) {
    await step.run("mark-empty-completed", async () => {
      await markJobCompleted(job.id, payload, {
        summary: {
          total: 0,
          successful: 0,
          failed: 0,
          averageOverallScore: 0,
          averageBiasScore: 0,
          averageToxicityScore: 0,
        },
        results: [],
        errors: [],
      });
    });
    return;
  }

  // Initialize job progress - MANUAL_PROMPT_TEST starts directly in EVALUATING phase
  await step.run("initialize-progress", async () => {
    await pool.query(
      `UPDATE evaluation_status
       SET status = 'evaluating',
           total_prompts = $1,
           progress = $2,
           percent = 0
       WHERE id = $3`,
      [responses.length, `0/${responses.length}`, job.id],
    );
  });

  await step.run("initialize-results", async () => {
    await pool.query(
      `UPDATE evaluation_status
       SET payload = COALESCE(payload, '{}'::jsonb) || '{"results": [], "errors": [], "itemStatuses": {}}'::jsonb
       WHERE id = $1`,
      [job.id]
    );
  });

  for (let i = 0; i < responses.length; i += 1) {
    const { category, prompt, response: userResponse } = responses[i];
    
    if (i > 0) {
      await step.run(`delay-before-evaluation-${i}`, async () => {
        await delay(MIN_REQUEST_INTERVAL_MS);
      });
    }
    
    await step.sendEvent(`trigger-evaluation-${i}`, {
      name: "evaluation/single.requested",
      data: {
        jobId: job.job_id,
        responseIndex: i,
        projectId: job.project_id,
        userId: job.user_id,
        category,
        questionText: prompt,
        userResponse,
      },
    });
  }
}

