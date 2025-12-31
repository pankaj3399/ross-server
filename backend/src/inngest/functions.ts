import { inngest } from "./client";
import pool from "../config/database";
import { evaluateFairnessResponse } from "../services/evaluateFairness";
import {
  type EvaluationStatusRow,
  type FairnessApiJobPayload,
  type FairnessPromptsJobPayload,
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
      // (MANUAL_PROMPT_TEST will override this to EVALUATING in processManualPromptTest)
      await pool.query(
        `UPDATE evaluation_status SET status = 'COLLECTING_RESPONSES' WHERE id = $1`,
        [jobRow.id]
      );

      return jobRow;
    });

    const payload: any =
      job.payload && typeof job.payload === "object"
        ? job.payload
        : job.payload
          ? JSON.parse(job.payload)
          : null;

    if (!payload) {
      await step.run("fail-job", async () => {
        await failJob(job.id, "Missing job payload");
      });
      return;
    }

    try {
      if (job.job_type === "AUTOMATED_API_TEST") {
        await processAutomatedApiTest(job, payload as FairnessApiJobPayload, step);
      } else if (job.job_type === "MANUAL_PROMPT_TEST") {
        await processManualPromptTest(job, payload as FairnessPromptsJobPayload, step);
      } else {
        throw new Error(`Unknown job type: ${job.job_type}`);
      }
    } catch (error: any) {
      await step.run("fail-job-on-error", async () => {
        console.error(`Fairness job ${job.job_id} failed:`, error);
        await failJob(job.id, error?.message || "Unknown worker failure");
      });
    }
  }
);

export const callUserApiForPrompt = inngest.createFunction(
  {
    id: "call-user-api-for-prompt",
    name: "Call User API For Prompt",
    onFailure: async ({ event, error }: { event: any; error: Error }) => {
      // In Inngest's onFailure, the event structure is: event.data.event.data contains the original event
      let jobId: string | undefined;
      let promptIndex: number | undefined;
      
      if (event?.data?.event?.data) {
        jobId = event.data.event.data.jobId;
        promptIndex = event.data.event.data.promptIndex;
      }
      
      if (!jobId && event?.data) {
        jobId = event.data.jobId;
        promptIndex = event.data.promptIndex;
      }
      
      if (!jobId && event?.data?.events && Array.isArray(event.data.events) && event.data.events.length > 0) {
        const originalEvent = event.data.events[0];
        if (originalEvent?.data) {
          jobId = originalEvent.data.jobId;
          promptIndex = originalEvent.data.promptIndex;
        }
      }
      
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

    const modifiedPrompt = `${prompt}\n\nPlease provide a response that is 300-500 words in length. The response should be in simple paragraph format with no formatting, just plain text.`;

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
      const payload = job.payload || {};
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
      const payload = job.payload || {};
      const itemStatuses = payload.userApiCallStatuses || {};
      const totalPrompts = job.total_prompts || 0;

      if (totalPrompts === 0) {
        throw new Error(`Job ${jobId} has no total_prompts set`);
      }

      if (itemStatuses[promptIndex]) {
        const completed = Object.keys(itemStatuses).length;
        return { allComplete: completed >= totalPrompts, total: totalPrompts, completed };
      }

      itemStatuses[promptIndex] = success ? "SUCCESS" : "FAILED";

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
        `SELECT id, payload, total_prompts FROM evaluation_status WHERE job_id = $1`,
        [jobId]
      );

      if (jobResult.rows.length === 0) {
        throw new Error(`Job ${jobId} not found`);
      }

      const job = jobResult.rows[0];
      const payload = job.payload || {};
      const responses = payload.responses || [];
      const itemStatuses = payload.itemStatuses || {};
      const results: JobResult[] = payload.results || [];
      const errors: JobError[] = payload.errors || [];

      if (itemStatuses[responseIndex]) {
        const completed = Object.keys(itemStatuses).length;
        const total = job.total_prompts || responses.length;
        return { allComplete: completed >= total, total, completed };
      }

      itemStatuses[responseIndex] = result ? "SUCCESS" : "FAILED";

      const response = responses[responseIndex];
      if (result) {
        results.push({
          category: response.category,
          prompt: response.prompt,
          success: true,
          evaluation: result,
          message: `Overall score ${(result.overallScore * 100).toFixed(1)}%`,
        });
      } else {
        errors.push({
          category: response.category,
          prompt: response.prompt,
          success: false,
          error: error || "Unknown error",
          message: error || "Unknown error",
        });
      }

      const updatedPayload = {
        ...payload,
        itemStatuses,
        results,
        errors,
      };

      // Update payload first
      await pool.query(
        `UPDATE evaluation_status
         SET payload = $1,
             last_processed_prompt = $2
         WHERE job_id = $3`,
        [
          JSON.stringify(updatedPayload),
          response?.prompt || null,
          jobId,
        ]
      );

      await updateJobProgress(jobId);

      const completed = Object.keys(itemStatuses).length;
      const total = job.total_prompts || responses.length;
      return { allComplete: completed >= total, total, completed };
    });

    if (allComplete.allComplete) {
      await step.run("finalize-job", async () => {
        const jobResult = await pool.query(
          `SELECT id, payload FROM evaluation_status WHERE job_id = $1`,
          [jobId]
        );
        const job = jobResult.rows[0];
        const payload = job.payload || {};
        const responses = payload.responses || [];
        const results: JobResult[] = payload.results || [];
        const errors: JobError[] = payload.errors || [];

        const summary = buildSummary(responses.length, results, errors);
        await markJobCompleted(job.id, payload, { summary, results, errors });
      });
    }
  }
);
