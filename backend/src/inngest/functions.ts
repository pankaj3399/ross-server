import { inngest } from "./client";
import pool from "../config/database";
import { evaluateFairnessResponse } from "../services/evaluateFairness";
import {
  type EvaluationStatusRow,
  type FairnessApiJobPayload,
  type FairnessApiJobPayloadExtended,
  type FairnessPromptsJobPayload,
  type FairnessPromptsJobPayloadExtended,
  type EvaluationStatusPayload,
  type JobResult,
  type JobError,
  type UserApiResponse,
  failJob,
  buildSummary,
  markJobCompleted,
  processAutomatedApiTest,
  processManualPromptTest,
  normalizeFairnessApiJobConfig,
  callUserApi,
  updateJobProgress,
} from "./services";

export const evaluateSingleResponse = inngest.createFunction(
  { 
    id: "evaluate-single-response", 
    name: "Evaluate Single Response",
    onFailure: async ({ event, error }: { event: any; error: Error }) => {
      const { jobId, responseIndex } = event.data;
      await inngest.send({
        name: "evaluation/single.completed",
        data: {
          jobId,
          responseIndex,
          result: null,
          error: error.message || "Unknown error",
        },
      });
    },
  },
  { event: "evaluation/single.requested" },
  async ({ event, step }) => {
    const { 
      jobId, 
      responseIndex, 
      projectId, 
      userId, 
      category, 
      questionText, 
      userResponse 
    } = event.data;

    const evaluation = await step.run("evaluate-fairness", async () => {
      try {
        return await evaluateFairnessResponse(
          projectId,
          userId,
          category,
          questionText,
          userResponse,
        );
      } catch (error: any) {
        throw new Error(`Failed to evaluate fairness: ${error.message}`);
      }
    });

    await step.sendEvent("send-completion", {
      name: "evaluation/single.completed",
      data: {
        jobId,
        responseIndex,
        result: evaluation,
        error: null,
      },
    });

    return evaluation;
  }
);

export const evaluationJobProcessor = inngest.createFunction(
  { id: "evaluation-job-processor", name: "Evaluation Job Processor" },
  { event: "evaluation/job.created" },
  async ({ event, step }) => {
    const { jobId } = event.data;

    const job = await step.run("load-job", async () => {
      const result = await pool.query<EvaluationStatusRow>(
        `SELECT * FROM evaluation_status WHERE job_id = $1`,
        [jobId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Job ${jobId} not found`);
      }

      const jobRow = result.rows[0];
      
      // Set initial status to COLLECTING_RESPONSES for automated API tests
      // (MANUAL_PROMPT_TEST will override this to evaluating in processManualPromptTest)
      await pool.query(
        `UPDATE evaluation_status SET status = 'collecting_responses' WHERE id = $1`,
        [jobRow.id]
      );

      return jobRow;
    });

    const payload: EvaluationStatusPayload | null =
      job.payload && typeof job.payload === "object"
        ? (job.payload as EvaluationStatusPayload)
        : job.payload
          ? (JSON.parse(job.payload) as EvaluationStatusPayload)
          : null;

    if (!payload) {
      await step.run("fail-job", async () => {
        await failJob(job.id, "Missing job payload");
      });
      return;
    }

    try {
      const jobType = job.job_type;
      if (jobType === "AUTOMATED_API_TEST") {
        // TypeScript narrows job.payload to FairnessApiJobPayloadExtended here
        await processAutomatedApiTest(job, payload as FairnessApiJobPayloadExtended, step);
      } else if (jobType === "MANUAL_PROMPT_TEST") {
        // TypeScript narrows job.payload to FairnessPromptsJobPayloadExtended here
        await processManualPromptTest(job, payload as FairnessPromptsJobPayloadExtended, step);
      } else {
        // This should never happen with our discriminated union, but handle it defensively
        throw new Error(`Unknown job type: ${jobType}`);
      }
    } catch (error: any) {
      await step.run("fail-job-on-error", async () => {
        console.error(`Fairness job ${job.job_id} failed:`, error);
        await failJob(job.id, error?.message || "Unknown worker failure");
      });
    }
  }
);

/**
 * Defensively extracts jobId and promptIndex from various Inngest event shapes.
 * Tries canonical paths in order and logs a warning with raw event JSON if extraction fails.
 */
function extractJobContext(event: any): { jobId?: string; promptIndex?: number } {
  // Try canonical paths in order of likelihood
  const paths = [
    () => event?.data?.event?.data,
    () => event?.data,
    () => event?.data?.events?.[0]?.data,
  ];

  for (const getPath of paths) {
    const data = getPath();
    if (data?.jobId && data?.promptIndex !== undefined) {
      return {
        jobId: data.jobId,
        promptIndex: data.promptIndex,
      };
    }
  }

  // If no successful extraction, log warning with raw event for debugging
  console.warn(
    "[callUserApiForPrompt.onFailure] Failed to extract jobId/promptIndex from event. Raw event:",
    JSON.stringify(event, null, 2)
  );

  return {};
}

export const callUserApiForPrompt = inngest.createFunction(
  {
    id: "call-user-api-for-prompt",
    name: "Call User API For Prompt",
    onFailure: async ({ event, error }: { event: any; error: Error }) => {
      const { jobId, promptIndex } = extractJobContext(event);

      if (!jobId || promptIndex === undefined) {
        return;
      }

      await inngest.send({
        name: "user-api/call.completed",
        data: {
          jobId,
          promptIndex,
          success: false,
          error: error.message || "Unknown error",
        },
      });
    },
  },
  { event: "user-api/call.requested" },
  async ({ event, step }) => {
    const eventData = event.data || {};
    const {
      jobId: originalJobId,
      promptIndex: originalPromptIndex,
      category,
      prompt,
      config,
      includePromptConstraints,
      promptConstraints,
    } = eventData;

    if (!originalJobId) {
      throw new Error("Missing jobId in user-api/call.requested event");
    }

    if (originalPromptIndex === undefined || originalPromptIndex === null) {
      throw new Error("Missing promptIndex in user-api/call.requested event");
    }

    // Store jobId/promptIndex in database to preserve them through failures
    await step.run("store-context-in-db", async () => {
      await pool.query(
        `UPDATE evaluation_status
         SET payload = jsonb_set(
           COALESCE(payload, '{}'::jsonb),
           '{_currentApiCall}',
           jsonb_build_object('jobId', $1::text, 'promptIndex', $2::integer)
         )
         WHERE job_id = $1::text`,
        [originalJobId, originalPromptIndex]
      );
      return { jobId: originalJobId, promptIndex: originalPromptIndex };
    });

    const jobId = originalJobId;
    const promptIndex = originalPromptIndex;

    // Determine if and how to modify the prompt
    // Default behavior: includePromptConstraints is undefined/null -> use default constraint
    // If includePromptConstraints === false -> don't append anything
    // If promptConstraints is provided -> use that instead of default
    const shouldIncludeConstraints = includePromptConstraints !== false;
    const defaultConstraint = "Please provide a response that is 300-500 words in length. The response should be in simple paragraph format with no formatting, just plain text.";
    const constraintToUse = promptConstraints !== undefined && promptConstraints !== null 
      ? promptConstraints 
      : defaultConstraint;
    
    const modifiedPrompt = shouldIncludeConstraints 
      ? `${prompt}\n\n${constraintToUse}`
      : prompt;

    const response = await step.run("call-user-api", async () => {
      const normalizedConfig = normalizeFairnessApiJobConfig(config);
      return await callUserApi(normalizedConfig, modifiedPrompt);
    });

    await step.run("store-response", async () => {
      const jobResult = await pool.query(
        `SELECT id, payload FROM evaluation_status WHERE job_id = $1`,
        [jobId]
      );

      if (jobResult.rows.length === 0) {
        throw new Error(`Job ${jobId} not found`);
      }

      const job = jobResult.rows[0];
      const payload = (job.payload || {}) as FairnessApiJobPayloadExtended;
      const userApiResponses: UserApiResponse[] = payload.userApiResponses || [];

      const existingIndex = userApiResponses.findIndex(
        (r) => r.promptIndex === promptIndex
      );

      const userApiResponse: UserApiResponse = {
        promptIndex,
        category,
        prompt,
        success: true,
        response: response,
      };

      if (existingIndex >= 0) {
        userApiResponses[existingIndex] = userApiResponse;
      } else {
        userApiResponses.push(userApiResponse);
      }

      await pool.query(
        `UPDATE evaluation_status
         SET payload = jsonb_set(
           COALESCE(payload, '{}'::jsonb),
           '{userApiResponses}',
           $1::jsonb
         )
         WHERE job_id = $2`,
        [JSON.stringify(userApiResponses), jobId]
      );
    });

    await step.sendEvent("send-completion", {
      name: "user-api/call.completed",
      data: {
        jobId,
        promptIndex,
        success: true,
        response: response,
      },
    });

    return { success: true, response };
  }
);

export const userApiCallAggregator = inngest.createFunction(
  { id: "user-api-call-aggregator", name: "User API Call Aggregator" },
  { event: "user-api/call.completed" },
  async ({ event, step }) => {
    const { jobId, promptIndex, success, response, error } = event.data;

    if (!jobId) {
      throw new Error("Missing jobId in user-api/call.completed event");
    }

    if (promptIndex === undefined || promptIndex === null) {
      throw new Error("Missing promptIndex in user-api/call.completed event");
    }

    const allComplete = await step.run("process-completion", async () => {
      const jobResult = await pool.query(
        `SELECT id, payload, total_prompts FROM evaluation_status WHERE job_id = $1`,
        [jobId]
      );

      if (jobResult.rows.length === 0) {
        console.error(`userApiCallAggregator: Job not found: ${jobId}`);
        throw new Error(`Job ${jobId} not found`);
      }

      const job = jobResult.rows[0];
      const payload = (job.payload || {}) as FairnessApiJobPayloadExtended;
      const itemStatuses = payload.userApiCallStatuses || {};
      const totalPrompts = job.total_prompts || 0;

      if (totalPrompts === 0) {
        throw new Error(`Job ${jobId} has no total_prompts set`);
      }

      if (itemStatuses[promptIndex]) {
        const completed = Object.keys(itemStatuses).length;
        return { allComplete: completed >= totalPrompts, total: totalPrompts, completed };
      }

      itemStatuses[promptIndex] = success ? "success" : "failed";

      // Update payload first
      await pool.query(
        `UPDATE evaluation_status
         SET payload = jsonb_set(
           COALESCE(payload, '{}'::jsonb),
           '{userApiCallStatuses}',
           $1::jsonb
         )
         WHERE job_id = $2`,
        [JSON.stringify(itemStatuses), jobId]
      );

      await updateJobProgress(jobId);

      const completed = Object.keys(itemStatuses).length;
      return { allComplete: completed >= totalPrompts, total: totalPrompts, completed };
    });

    if (allComplete.allComplete) {
      await step.run("trigger-evaluation-phase", async () => {
        await inngest.send({
          name: "user-api/all-completed",
          data: {
            jobId,
          },
        });
      });
    }
  }
);

export const evaluationAggregator = inngest.createFunction(
  { id: "evaluation-aggregator", name: "Evaluation Aggregator" },
  { event: "evaluation/single.completed" },
  async ({ event, step }) => {
    const { jobId, responseIndex, result, error } = event.data;

    const allComplete = await step.run("process-completion", async () => {
      const jobResult = await pool.query(
        `SELECT id, payload, total_prompts, status FROM evaluation_status WHERE job_id = $1`,
        [jobId]
      );

      if (jobResult.rows.length === 0) {
        throw new Error(`Job ${jobId} not found`);
      }

      const job = jobResult.rows[0];
      const payload = (job.payload || {}) as EvaluationStatusPayload;
      const responses = ("responses" in payload ? payload.responses : undefined) || [];
      const total = job.total_prompts || responses.length;
      
      // Bounds check for responseIndex
      let response: any = null;
      if (responseIndex >= 0 && responseIndex < responses.length) {
        response = responses[responseIndex];
      } else {
        // Handle out-of-bounds case with safe defaults
        const outOfBoundsError = `Response index ${responseIndex} is out of bounds (valid range: 0-${responses.length - 1})`;
        response = {
          category: "unknown",
          prompt: "unknown",
          error: outOfBoundsError,
        };
        // Log the anomaly
        console.error(`[evaluationAggregator] ${outOfBoundsError} for jobId: ${jobId}`);
      }

      // Check if already processed (read-only check for early return)
      const itemStatuses = ("itemStatuses" in payload ? payload.itemStatuses : undefined) || {};
      if (itemStatuses[responseIndex]) {
        const completed = Object.keys(itemStatuses).length;
        return { allComplete: completed >= total, total, completed };
      }

      // Build delta fragments as JSON parameters
      const itemStatusValue = result ? "success" : "failed";
      const itemStatusEntry = JSON.stringify({ [responseIndex]: itemStatusValue });
      
      let resultEntry: string | null = null;
      let errorEntry: string | null = null;
      
      if (result) {
        resultEntry = JSON.stringify([{
          category: response?.category || "unknown",
          prompt: response?.prompt || "unknown",
          success: true,
          evaluation: result,
          message: `Overall score ${(result.overallScore * 100).toFixed(1)}%`,
        }]);
      } else {
        errorEntry = JSON.stringify([{
          category: response?.category || "unknown",
          prompt: response?.prompt || "unknown",
          success: false,
          error: response?.error || error || "Unknown error",
          message: response?.error || error || "Unknown error",
        }]);
      }

      const lastProcessedPrompt = response?.prompt || null;

      // Atomic UPDATE using jsonb_set and || operator to merge changes
      // Use CTE to build updated payload and calculate progress atomically
      const updateResult = await pool.query(
        `WITH updated_payload AS (
           SELECT 
             CASE 
               WHEN $2::jsonb IS NOT NULL THEN
                 jsonb_set(
                   jsonb_set(
                     COALESCE(payload, '{}'::jsonb),
                     '{itemStatuses}',
                     COALESCE(payload->'itemStatuses', '{}'::jsonb) || $1::jsonb
                   ),
                   '{results}',
                   COALESCE(payload->'results', '[]'::jsonb) || $2::jsonb
                 )
               ELSE
                 jsonb_set(
                   jsonb_set(
                     COALESCE(payload, '{}'::jsonb),
                     '{itemStatuses}',
                     COALESCE(payload->'itemStatuses', '{}'::jsonb) || $1::jsonb
                   ),
                   '{errors}',
                   COALESCE(payload->'errors', '[]'::jsonb) || $3::jsonb
                 )
             END AS new_payload
           FROM evaluation_status
           WHERE job_id = $6
             AND (payload->'itemStatuses'->>$7::text IS NULL)
         ),
         progress_calc AS (
           SELECT 
             new_payload,
             CASE 
               WHEN $5::integer = 0 THEN '0/0'
               ELSE (
                 SELECT COUNT(*)::text || '/' || $5::text
                 FROM jsonb_object_keys(COALESCE(new_payload->'itemStatuses', '{}'::jsonb))
               )
             END AS new_progress,
             CASE 
               WHEN $5::integer = 0 THEN 0
               ELSE LEAST(100, GREATEST(0, 
                 ROUND(
                   (SELECT COUNT(*)::numeric 
                    FROM jsonb_object_keys(COALESCE(new_payload->'itemStatuses', '{}'::jsonb))
                   ) / $5::numeric * 100
                 )
               ))
             END AS new_percent
           FROM updated_payload
         )
         UPDATE evaluation_status
         SET payload = progress_calc.new_payload,
             last_processed_prompt = $4,
             progress = progress_calc.new_progress,
             percent = progress_calc.new_percent
         FROM progress_calc
         WHERE job_id = $6
           AND (payload->'itemStatuses'->>$7::text IS NULL)
         RETURNING evaluation_status.payload, evaluation_status.progress, evaluation_status.percent`,
        [
          itemStatusEntry,
          resultEntry,
          errorEntry,
          lastProcessedPrompt,
          total,
          jobId,
          String(responseIndex),
        ]
      );

      if (updateResult.rows.length === 0) {
        // Another worker already processed this responseIndex, get current state
        const currentJob = await pool.query(
          `SELECT payload, total_prompts FROM evaluation_status WHERE job_id = $1`,
          [jobId]
        );
        if (currentJob.rows.length > 0) {
          const currentPayload = (currentJob.rows[0].payload || {}) as EvaluationStatusPayload;
          const currentItemStatuses = ("itemStatuses" in currentPayload ? currentPayload.itemStatuses : undefined) || {};
          const completed = Object.keys(currentItemStatuses).length;
          const currentTotal = currentJob.rows[0].total_prompts || responses.length;
          return { allComplete: completed >= currentTotal, total: currentTotal, completed };
        }
        throw new Error(`Job ${jobId} not found after update`);
      }

      const updatedPayload = updateResult.rows[0].payload || {};
      const updatedItemStatuses = updatedPayload.itemStatuses || {};
      const completed = Object.keys(updatedItemStatuses).length;
      
      return { allComplete: completed >= total, total, completed };
    });

    if (allComplete.allComplete) {
      await step.run("finalize-job", async () => {
        const jobResult = await pool.query(
          `SELECT id, payload FROM evaluation_status WHERE job_id = $1`,
          [jobId]
        );
        const job = jobResult.rows[0];
        const payload = (job.payload || {}) as EvaluationStatusPayload;
        const responses = ("responses" in payload ? payload.responses : undefined) || [];
        const results: JobResult[] = ("results" in payload ? payload.results : undefined) || [];
        const errors: JobError[] = ("errors" in payload ? payload.errors : undefined) || [];

        const summary = buildSummary(responses.length, results, errors);
        await markJobCompleted(job.id, payload, { summary, results, errors });
      });
    }
  }
);
