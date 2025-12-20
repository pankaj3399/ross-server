import pool from "../config/database";
import jwt from "jsonwebtoken";

type EvaluationStatusRow = {
  id: number;
  user_id: string;
  project_id: string;
  job_id: string;
  payload: any;
  total_prompts: number | null;
  status: string;
  progress: string | null;
  last_processed_prompt: string | null;
  percent: number | null;
  job_type: string;
};

type ApiKeyPlacement = "none" | "auth_header" | "x_api_key" | "query_param" | "body_field";

type FairnessApiJobConfigStored = {
  projectId: string;
  apiUrl: string;
  requestTemplate: string;
  responseKey: string;
  apiKeyPlacement?: ApiKeyPlacement;
  apiKey?: string | null;
  apiKeyFieldName?: string | null;
};

type FairnessApiJobConfig = {
  projectId: string;
  apiUrl: string;
  requestTemplate: string;
  responseKey: string;
  apiKeyPlacement: ApiKeyPlacement;
  apiKey: string | null;
  apiKeyFieldName: string | null;
};

type FairnessApiJobPayload = {
  type: "FAIRNESS_API";
  config: FairnessApiJobConfigStored;
  summary?: JobSummary;
  results?: JobResult[];
  errors?: JobError[];
  error?: string;
};

type FairnessPromptsJobPayload = {
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

type JobSummary = {
  total: number;
  successful: number;
  failed: number;
  averageOverallScore: number;
  averageBiasScore: number;
  averageToxicityScore: number;
};

type JobResult = {
  category: string;
  prompt: string;
  success: true;
  evaluation: EvaluationPayload;
  message: string;
};

type JobError = {
  category: string;
  prompt: string;
  success: false;
  error: string;
  message: string;
};

type EvaluationPayload = {
  id: string;
  biasScore: number;
  toxicityScore: number;
  relevancyScore: number;
  faithfulnessScore: number;
  overallScore: number;
  verdicts: Record<
    "bias" | "toxicity" | "relevancy" | "faithfulness",
    { score: number; verdict: string }
  >;
  reasoning: string;
  createdAt: string;
};

const MIN_REQUEST_INTERVAL_MS = Number(process.env.EVALUATION_MIN_REQUEST_INTERVAL_MS || 20000);
const USER_API_MAX_ATTEMPTS = Math.max(
  1,
  Number(process.env.EVALUATION_USER_API_MAX_ATTEMPTS || 3),
);
const USER_API_BACKOFF_BASE_MS = Math.max(
  100,
  Number(process.env.EVALUATION_USER_API_BACKOFF_BASE_MS || 1000),
);
const USER_API_BACKOFF_MAX_MS = Math.max(
  USER_API_BACKOFF_BASE_MS,
  Number(process.env.EVALUATION_USER_API_BACKOFF_MAX_MS || 30000),
);


const VALID_API_KEY_PLACEMENTS: ApiKeyPlacement[] = [
  "none",
  "auth_header",
  "x_api_key",
  "query_param",
  "body_field",
];

const DEFAULT_API_KEY_FIELD_NAMES: Record<ApiKeyPlacement, string | null> = {
  none: null,
  auth_header: "Authorization",
  x_api_key: "x-api-key",
  query_param: "key",
  body_field: "api_key",
};

export async function fetchNextJob(): Promise<EvaluationStatusRow | null> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query<EvaluationStatusRow>(
      `SELECT *
       FROM evaluation_status
       WHERE status = 'queued'
       ORDER BY created_at ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED`,
    );

    if (result.rowCount === 0) {
      await client.query("COMMIT");
      return null;
    }

    const job = result.rows[0];

    if (job.status !== "running") {
      await client.query("UPDATE evaluation_status SET status = 'running' WHERE id = $1", [job.id]);
      job.status = "running";
    }

    await client.query("COMMIT");
    return job;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function processJob(job: EvaluationStatusRow) {
  const payload: any =
    job.payload && typeof job.payload === "object"
      ? job.payload
      : job.payload
        ? JSON.parse(job.payload)
        : null;

  if (!payload) {
    await failJob(job.id, "Missing job payload");
    return;
  }

  try {
    // Route by job_type
    switch (job.job_type) {
      case "AUTOMATED_API_TEST":
        await processAutomatedApiTest(job, payload);
        break;
      case "MANUAL_PROMPT_TEST":
        await processManualPromptTest(job, payload);
        break;
      default:
        throw new Error(`Unknown job type: ${job.job_type}`);
    }
  } catch (error: any) {
    console.error(`Fairness job ${job.job_id} failed:`, error);
    await failJob(job.id, error?.message || "Unknown worker failure");
  }
}



function normalizeFairnessApiJobConfig(config: FairnessApiJobConfigStored): FairnessApiJobConfig {
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

function resolveApiKeyFieldName(placement: ApiKeyPlacement, provided?: string | null): string | null {
  const trimmed = typeof provided === "string" ? provided.trim() : null;
  if (trimmed && trimmed.length > 0) {
    return trimmed;
  }
  return DEFAULT_API_KEY_FIELD_NAMES[placement] || null;
}

async function processAutomatedApiTest(job: EvaluationStatusRow, payload: FairnessApiJobPayload) {
  if (payload.type !== "FAIRNESS_API") {
    throw new Error("Invalid payload type for AUTOMATED_API_TEST job");
  }
  await runFairnessApiJob(job, payload);
}

async function processManualPromptTest(job: EvaluationStatusRow, payload: FairnessPromptsJobPayload) {
  if (payload.type !== "FAIRNESS_PROMPTS") {
    throw new Error("Invalid payload type for MANUAL_PROMPT_TEST job");
  }

  const projectCheck = await pool.query(
    "SELECT id, version_id FROM projects WHERE id = $1 AND user_id = $2",
    [job.project_id, job.user_id],
  );

  if (projectCheck.rowCount === 0) {
    throw new Error("Project not found or access denied for this job");
  }

  const responses = payload.responses || [];
  if (responses.length === 0) {
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
    return;
  }

  await pool.query(
    `UPDATE evaluation_status
     SET total_prompts = $1,
         progress = $2,
         percent = 0
     WHERE id = $3`,
    [responses.length, `0/${responses.length}`, job.id],
  );

  const jobResults: JobResult[] = [];
  const jobErrors: JobError[] = [];

  for (let i = 0; i < responses.length; i += 1) {
    const { category, prompt, response: userResponse } = responses[i];
    try {
      const evaluation = await callEvaluationService(
        job.project_id,
        job.user_id,
        category,
        prompt,
        userResponse,
      );
      const successMessage = `Prompt processed successfully. Overall score ${(evaluation.overallScore * 100).toFixed(1)}%.`;

      jobResults.push({
        category,
        prompt,
        success: true,
        evaluation,
        message: successMessage,
      });
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error";
      jobErrors.push({
        category,
        prompt,
        success: false,
        error: errorMessage,
        message: errorMessage,
      });
    }

    const completed = jobResults.length + jobErrors.length;
    const percent = Math.round((completed / responses.length) * 100);

    await pool.query(
      `UPDATE evaluation_status
       SET progress = $1,
           percent = $2,
           last_processed_prompt = $3
       WHERE id = $4`,
      [`${completed}/${responses.length}`, percent, prompt, job.id],
    );
  }

  const summary = buildSummary(responses.length, jobResults, jobErrors);
  await markJobCompleted(job.id, payload, { summary, results: jobResults, errors: jobErrors });
}

async function runFairnessApiJob(job: EvaluationStatusRow, payload: FairnessApiJobPayload) {
  let lastRequestTimestamp = 0;

  const enforceRequestGap = async () => {
    const now = Date.now();
    const elapsed = now - lastRequestTimestamp;
    if (lastRequestTimestamp && elapsed < MIN_REQUEST_INTERVAL_MS) {
      await delay(MIN_REQUEST_INTERVAL_MS - elapsed);
    }
    lastRequestTimestamp = Date.now();
  };
  const config = normalizeFairnessApiJobConfig(payload.config);

  const projectCheck = await pool.query(
    "SELECT id, version_id FROM projects WHERE id = $1 AND user_id = $2",
    [config.projectId, job.user_id],
  );

  if (projectCheck.rowCount === 0) {
    throw new Error("Project not found or access denied for this job");
  }

  const prompts = await fetchFairnessPrompts();
  if (prompts.length === 0) {
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
    return;
  }

  await pool.query(
    `UPDATE evaluation_status
     SET total_prompts = $1,
         progress = $2,
         percent = 0
     WHERE id = $3`,
    [prompts.length, `0/${prompts.length}`, job.id],
  );

  const jobResults: JobResult[] = [];
  const jobErrors: JobError[] = [];

  for (let i = 0; i < prompts.length; i += 1) {
    const { category, prompt } = prompts[i];
    try {
      await enforceRequestGap();
      const userResponse = await callUserApi(config, prompt);
      const evaluation = await callEvaluationService(
        config.projectId,
        job.user_id,
        category,
        prompt,
        userResponse,
      );
      const successMessage = `Prompt processed successfully. Overall score ${(evaluation.overallScore * 100).toFixed(1)}%.`;

      jobResults.push({
        category,
        prompt,
        success: true,
        evaluation,
        message: successMessage,
      });
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error";
      jobErrors.push({
        category,
        prompt,
        success: false,
        error: errorMessage,
        message: errorMessage,
      });
    }

    const completed = jobResults.length + jobErrors.length;
    const percent = Math.round((completed / prompts.length) * 100);

    await pool.query(
      `UPDATE evaluation_status
       SET progress = $1,
           percent = $2,
           last_processed_prompt = $3
       WHERE id = $4`,
      [`${completed}/${prompts.length}`, percent, prompt, job.id],
    );
  }

  const summary = buildSummary(prompts.length, jobResults, jobErrors);
  await markJobCompleted(job.id, payload, { summary, results: jobResults, errors: jobErrors });
}

async function failJob(jobInternalId: number, message: string) {
  await pool.query(
    `UPDATE evaluation_status
     SET status = 'failed',
         payload = COALESCE(payload, '{}'::jsonb) || $1::jsonb
     WHERE id = $2`,
    [JSON.stringify({ error: message }), jobInternalId],
  );
}

export async function checkAndFailStaleJobs() {
  try {
    const result = await pool.query(
      `UPDATE evaluation_status
       SET status = 'failed',
           payload = COALESCE(payload, '{}'::jsonb) || $1::jsonb
       WHERE status = 'running'
       AND NOW() - updated_at > INTERVAL '24 hours'
       RETURNING id, job_id`,
      [JSON.stringify({ error: "Job failed due to exceeding maximum execution time (24 hours)." })],
    );

    if (result.rowCount && result.rowCount > 0) {
      console.log(`Auto-failed ${result.rowCount} stale job(s) that exceeded 24-hour timeout`);
      result.rows.forEach((row: { id: number; job_id: string }) => {
        console.log(`  - Job ${row.job_id} (id: ${row.id})`);
      });
    }
  } catch (error: any) {
    console.error("Error checking for stale jobs:", error);
  }
}

async function markJobCompleted(
  jobInternalId: number,
  payload: FairnessApiJobPayload | FairnessPromptsJobPayload,
  data: { summary: JobSummary; results: JobResult[]; errors: JobError[] },
) {
  await pool.query(
    `UPDATE evaluation_status
     SET status = 'completed',
         progress = $1,
         percent = 100,
         payload = COALESCE(payload, '{}'::jsonb) || $2::jsonb
     WHERE id = $3`,
    [
      `${data.summary.total}/${data.summary.total}`,
      JSON.stringify({
        summary: data.summary,
        results: data.results,
        errors: data.errors,
      }),
      jobInternalId,
    ],
  );
}

async function fetchFairnessPrompts(): Promise<Array<{ category: string; prompt: string }>> {
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

async function callUserApi(config: FairnessApiJobConfig, prompt: string): Promise<string> {
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

  for (let attempt = 1; attempt <= USER_API_MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 429 && attempt < USER_API_MAX_ATTEMPTS) {
          const retryAfter = parseRetryAfter(response.headers.get("retry-after"));
          await delay(computeBackoffDelay(attempt, retryAfter));
          continue;
        }

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
    } catch (error: any) {
      const isRateLimit = /429/.test(error?.message || "");
      const shouldRetry = isRateLimit && attempt < USER_API_MAX_ATTEMPTS;

      if (shouldRetry) {
        await delay(computeBackoffDelay(attempt));
        continue;
      }

      throw new Error(`Failed to call user API: ${error.message}`);
    }
  }

  throw new Error("Failed to call user API after maximum retry attempts");
}

function prepareRequestOptions(
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
      case "body_field":
        if (body === null || typeof body !== "object" || Array.isArray(body)) {
          throw new Error("Request template must resolve to an object to inject the API key into the body");
        }
        const bodyField = fieldName || "api_key";
        body = {
          ...body,
          [bodyField]: config.apiKey,
        };
        break;
      default:
        break;
    }

    if (shouldMirrorGoogleHeader) {
      headers["x-goog-api-key"] = config.apiKey;
    }
  }

  return { url, headers, body };
}

function appendQueryParam(urlString: string, param: string, value: string): string {
  try {
    const parsed = new URL(urlString);
    parsed.searchParams.set(param, value);
    return parsed.toString();
  } catch {
    const separator = urlString.includes("?") ? "&" : "?";
    return `${urlString}${separator}${encodeURIComponent(param)}=${encodeURIComponent(value)}`;
  }
}

function getNestedValue(obj: any, path: string): any {
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

function buildRequestBodyFromTemplate(templateString: string, prompt: string) {
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

const PROMPT_PLACEHOLDER_REGEX = /{{\s*prompt\s*}}/gi;

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

async function callEvaluationService(
  projectId: string,
  userId: string,
  category: string,
  questionText: string,
  userResponse: string,
): Promise<EvaluationPayload> {
  const serviceUrl = process.env.API_URL || "http://localhost:4000";
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT secret is not configured on the server");
  }

  const authToken = jwt.sign({ userId }, jwtSecret, { expiresIn: "10m" });

  try {
    const response = await fetch(`${serviceUrl}/fairness/evaluate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        projectId,
        category,
        questionText,
        userResponse,
      }),
    });

    const payload = await response.json().catch(async () => {
      const fallbackText = await response.text();
      throw new Error(fallbackText || "Evaluation service returned a non-JSON response");
    });

    if (!response.ok) {
      throw new Error(
        `Evaluation service returned status ${response.status}: ${payload?.error || "Unknown error"}`,
      );
    }

    if (!payload?.success || !payload?.evaluation) {
      throw new Error("Evaluation service returned an unexpected payload");
    }

    return payload.evaluation as EvaluationPayload;
  } catch (error: any) {
    throw new Error(`Failed to call evaluation service: ${error.message}`);
  }
}



function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfter(headerValue: string | null): number | null {
  if (!headerValue) {
    return null;
  }

  const numericSeconds = Number(headerValue);
  if (!Number.isNaN(numericSeconds) && numericSeconds >= 0) {
    return numericSeconds * 1000;
  }

  const dateTime = Date.parse(headerValue);
  if (!Number.isNaN(dateTime)) {
    const diff = dateTime - Date.now();
    return diff > 0 ? diff : 0;
  }

  return null;
}

function computeBackoffDelay(attempt: number, retryAfterMs?: number | null): number {
  if (retryAfterMs && retryAfterMs > 0) {
    return retryAfterMs;
  }

  const exponent = attempt - 1;
  const nextDelay = USER_API_BACKOFF_BASE_MS * 2 ** exponent;
  return Math.min(nextDelay, USER_API_BACKOFF_MAX_MS);
}

function buildSummary(total: number, results: JobResult[], errors: JobError[]): JobSummary {
  const successCount = results.length;
  const failureCount = errors.length;

  const average = (arr: number[]) =>
    arr.length === 0 ? 0 : arr.reduce((sum, value) => sum + value, 0) / arr.length;

  const overallScores = results.map((r) => r.evaluation.overallScore);
  const biasScores = results.map((r) => r.evaluation.biasScore);
  const toxicityScores = results.map((r) => r.evaluation.toxicityScore);

  return {
    total,
    successful: successCount,
    failed: failureCount,
    averageOverallScore: parseFloat(average(overallScores).toFixed(3)),
    averageBiasScore: parseFloat(average(biasScores).toFixed(3)),
    averageToxicityScore: parseFloat(average(toxicityScores).toFixed(3)),
  };
}

