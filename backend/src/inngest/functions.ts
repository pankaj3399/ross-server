import { inngest } from "./client";
import pool from "../config/database";
import { evaluateFairnessResponse } from "../services/evaluateFairness";
import { notificationService } from "../services/notificationService";
import { emailService } from "../services/emailService";
import {
  buildWeeklyDigestEmail,
  buildCriticalAlertEmail,
  buildVendorReassessmentEmail,
} from "../services/notificationTemplates";
import { computeCrcResults } from "../utils/crcScoring";
import {
  type EvaluationStatusRow,
  type FairnessApiJobPayload,
  type FairnessApiJobPayloadExtended,
  type FairnessPromptsJobPayload,
  type FairnessPromptsJobPayloadExtended,
  type SecurityScanJobPayloadExtended,
  type EvaluationStatusPayload,
  type JobResult,
  type JobError,
  type UserApiResponse,
  failJob,
  buildSummary,
  markJobCompleted,
  processAutomatedApiTest,
  processManualPromptTest,
  processSecurityScan,
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
      
      // Set initial status to 'collecting_responses' for automated API tests
      // (MANUAL_PROMPT_TEST will override this in processManualPromptTest)
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
        await processAutomatedApiTest(job, payload as FairnessApiJobPayloadExtended, step);
      } else if (jobType === "MANUAL_PROMPT_TEST") {
        await processManualPromptTest(job, payload as FairnessPromptsJobPayloadExtended, step);
      } else if (jobType === "SECURITY_SCAN") {
        await processSecurityScan(job, payload as SecurityScanJobPayloadExtended, step);
      } else {
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
      const apiResponse = await callUserApi(normalizedConfig, modifiedPrompt);
      // If the API call succeeded but returned no content (commonly a wrong
      // responseKey path or an endpoint that doesn't return JSON at the
      // expected location), treat it as a failure so the user sees a real
      // reason rather than every metric scoring 0.0 downstream (bug 16).
      if (typeof apiResponse !== "string" || !apiResponse.trim()) {
        throw new Error("API endpoint returned no content at the configured responseKey. Verify the endpoint URL, auth, and responseKey path.");
      }
      return apiResponse;
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

// Helper to extract error message safely
function extractErrorMessage(response: any, error: any): string {
  if (response?.error) {
    if (typeof response.error === 'string') return response.error;
    if (typeof response.error === 'object' && response.error.message) return response.error.message;
  }
  
  if (error) {
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
  }
  
  return "Unknown error";
}

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
      if (responseIndex < 0 || responseIndex >= responses.length) {
        const outOfBoundsError = responses.length === 0
          ? `Response index ${responseIndex} is out of bounds (no valid indices - responses array is empty)`
          : `Response index ${responseIndex} is out of bounds (valid range: 0-${responses.length - 1})`;
        console.error(`[evaluationAggregator] ${outOfBoundsError} for jobId: ${jobId}`);
        // If out of bounds, we should NOT process this result as it was likely a stray or manual error event
        // We still need to return a status but allComplete check should be based on real indices
        const itemStatuses = ("itemStatuses" in payload ? payload.itemStatuses : undefined) || {};
        const completed = Object.keys(itemStatuses).length;
        return { allComplete: completed >= total, total, completed };
      }

      const response = responses[responseIndex];

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
        const errMessage = extractErrorMessage(response, error);
        errorEntry = JSON.stringify([{
          category: response?.category || "unknown",
          prompt: response?.prompt || "unknown",
          success: false,
          error: errMessage,
          message: errMessage,
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
        if (payload.type !== "FAIRNESS_API" && payload.type !== "FAIRNESS_PROMPTS") {
          return;
        }
        const responses = ("responses" in payload ? payload.responses : undefined) || [];
        const results: JobResult[] = ("results" in payload ? payload.results : undefined) || [];
        const errors: JobError[] = ("errors" in payload ? payload.errors : undefined) || [];

        const summary = buildSummary(responses.length, results, errors);
        await markJobCompleted(job.id, payload as FairnessApiJobPayloadExtended | FairnessPromptsJobPayloadExtended, { summary, results, errors });
      });
    }
  }
);

export const hardDeleteStaleProjects = inngest.createFunction(
  { id: "hard-delete-stale-projects", name: "Hard Delete Stale Projects" },
  { cron: "0 0 * * *" }, // Run daily at midnight
  async ({ step }) => {
    await step.run("delete-projects", async () => {
      // Hard delete projects that have been soft-deleted for more than 30 days
      const result = await pool.query(`
        DELETE FROM projects 
        WHERE deleted_at IS NOT NULL 
        AND deleted_at < NOW() - INTERVAL '30 days'
        RETURNING id
      `);
      return { deletedCount: result.rowCount };
    });
  }
);

/**
 * Build a safe frontend URL by normalizing the origin and percent-encoding path segments.
 */
function buildSafeFrontendUrl(pathTemplate: string, segments: Record<string, string>): string {
  const rawFrontend = process.env.FRONTEND_URL || "http://localhost:3000";
  let origin = "http://localhost:3000";
  try {
    const parsed = new URL(rawFrontend);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      origin = parsed.origin;
    }
  } catch (e) {
    // Ignore and use default origin
  }
  
  let path = pathTemplate;
  for (const [key, value] of Object.entries(segments)) {
    path = path.replace(`:${key}`, encodeURIComponent(value));
  }
  
  return `${origin}${path}`;
}

export const weeklyDigestCron = inngest.createFunction(
  { id: "weekly-digest-cron", name: "Weekly Digest Cron" },
  { cron: "0 * * * *" }, // Run hourly to scan all user timezones
  async ({ step }) => {
    const users = await step.run("fetch-eligible-users", async () => {
      const res = await pool.query(`
        SELECT u.id, u.email, u.timezone, np.weekly_digest
        FROM users u
        LEFT JOIN notification_preferences np ON np.user_id = u.id
        WHERE np.weekly_digest IS NULL OR np.weekly_digest = true
      `);
      return res.rows;
    });

    const now = new Date();
    const eligibleUsers = users.filter((u) => {
      try {
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: u.timezone || "UTC",
          weekday: "long",
          hour: "numeric",
          hour12: false,
        });
        const parts = formatter.formatToParts(now);
        const weekday = parts.find((p) => p.type === "weekday")?.value;
        const hour = parts.find((p) => p.type === "hour")?.value;
        return weekday === "Monday" && parseInt(hour || "", 10) === 9;
      } catch (err) {
        console.warn(`Timezone formatting error for user ${u.id}:`, err);
        // Fallback to UTC
        return now.getUTCDay() === 1 && now.getUTCHours() === 9;
      }
    });

    for (const user of eligibleUsers) {
      const projects = await step.run(`fetch-projects-${user.id}`, async () => {
        const res = await pool.query(
          "SELECT id, name FROM projects WHERE user_id = $1 AND deleted_at IS NULL",
          [user.id]
        );
        return res.rows;
      });

      for (const project of projects) {
        const hasChanges = await step.run(`check-changes-${project.id}`, async () => {
          const auditLogsRes = await pool.query(
            "SELECT COUNT(*)::int as count FROM audit_logs WHERE project_id = $1 AND created_at > NOW() - INTERVAL '7 days'",
            [project.id]
          );
          const crcRes = await pool.query(
            "SELECT COUNT(*)::int as count FROM crc_assessment_responses WHERE project_id = $1 AND updated_at > NOW() - INTERVAL '7 days'",
            [project.id]
          );
          return (auditLogsRes.rows[0].count + crcRes.rows[0].count) > 0;
        });

        if (!hasChanges) continue;

        const digestData = await step.run(`prepare-digest-${project.id}`, async () => {
          const results = await computeCrcResults(project.id);
          
          const quickWinsRes = await pool.query(
            `SELECT c.control_id AS "controlCode", c.control_title AS title
             FROM crc_controls c
             LEFT JOIN crc_assessment_responses r ON r.control_id = c.id AND r.project_id = $1
             WHERE c.status = 'Published' AND (r.value IS NULL OR r.value IN (0, 3))
             LIMIT 3`,
            [project.id]
          );

          const changesCountRes = await pool.query(
            "SELECT COUNT(*)::int as count FROM crc_assessment_responses WHERE project_id = $1 AND updated_at > NOW() - INTERVAL '7 days'",
            [project.id]
          );

          return {
            projectName: project.name,
            readinessPercentage: results.overall.percentage || 0,
            changesCount: changesCountRes.rows[0].count,
            quickWins: quickWinsRes.rows,
            riskSummary: {
              Critical: results.riskSummary.critical,
              High: results.riskSummary.high,
              Medium: results.riskSummary.medium,
              Low: results.riskSummary.low,
            },
            dashboardUrl: buildSafeFrontendUrl("/assess/:projectId/crc/dashboard", { projectId: project.id }),
          };
        });

        await step.run(`send-digest-${user.id}-${project.id}`, async () => {
          const shouldSend = await notificationService.shouldSendNotification(user.id, project.id, "weekly_digest");
          if (!shouldSend) return;

          const { html, text } = buildWeeklyDigestEmail(user.id, digestData);

          const success = await emailService.sendEmail({
            to: user.email,
            subject: `Weekly Compliance Digest for ${project.name} - MATUR.ai`,
            html,
            text,
          });

          if (success) {
            await notificationService.logNotification(
              user.id,
              project.id,
              "weekly_digest",
              `Weekly Compliance Digest for ${project.name} - MATUR.ai`,
              "sent",
              digestData
            );
          } else {
            await notificationService.queueNotification(user.id, project.id, "weekly_digest", {
              to: user.email,
              subject: `Weekly Compliance Digest for ${project.name} - MATUR.ai`,
              html,
              text,
            });
          }
        });
      }
    }
  }
);

export const criticalRiskAlertHandler = inngest.createFunction(
  { id: "critical-risk-alert-handler", name: "Critical Risk Alert Handler" },
  { event: "notification/critical-risk.triggered" },
  async ({ event, step }) => {
    const { projectId, riskId } = event.data;

    const details = await step.run("fetch-details", async () => {
      const projectRes = await pool.query(
        `SELECT p.user_id, p.name AS project_name, u.email
         FROM projects p
         JOIN users u ON p.user_id = u.id
         WHERE p.id = $1 AND p.deleted_at IS NULL`,
        [projectId]
      );
      if (projectRes.rows.length === 0) return null;

      const riskRes = await pool.query(
        `SELECT id, risk_code, title, rating, description, mitigation_plan
         FROM crc_risks
         WHERE id = $1 AND project_id = $2 AND status = 'Open' AND rating = 'Critical'`,
        [riskId, projectId]
      );
      if (riskRes.rows.length === 0) return null;

      return {
        owner: projectRes.rows[0],
        risk: riskRes.rows[0]
      };
    });

    if (!details) return;

    const { owner, risk } = details;

    const shouldSend = await step.run("check-preferences", async () => {
      return await notificationService.shouldSendNotification(owner.user_id, projectId, "critical_alerts");
    });

    if (!shouldSend) return;

    await step.run("send-alert", async () => {
      const projectUrl = buildSafeFrontendUrl("/assess/:projectId/crc/risks", { projectId });
      const { html, text } = buildCriticalAlertEmail(owner.user_id, {
        projectName: owner.project_name,
        riskCode: risk.risk_code,
        riskTitle: risk.title,
        rating: risk.rating,
        description: risk.description,
        mitigationPlan: risk.mitigation_plan,
        projectUrl,
      });

      const success = await emailService.sendEmail({
        to: owner.email,
        subject: `[CRITICAL RISK ALERT] ${risk.risk_code}: ${risk.title} - ${owner.project_name}`,
        html,
        text,
      });

      if (success) {
        await notificationService.logNotification(
          owner.user_id,
          projectId,
          "critical_alerts",
          `[CRITICAL RISK ALERT] ${risk.risk_code}: ${risk.title} - ${owner.project_name}`,
          "sent",
          { riskId, rating: risk.rating }
        );
      } else {
        await notificationService.queueNotification(owner.user_id, projectId, "critical_alerts", {
          to: owner.email,
          subject: `[CRITICAL RISK ALERT] ${risk.risk_code}: ${risk.title} - ${owner.project_name}`,
          html,
          text,
        });
      }
    });
  }
);

export const vendorReassessmentCron = inngest.createFunction(
  { id: "vendor-reassessment-cron", name: "Vendor Reassessment Cron" },
  { cron: "0 6 * * *" }, // Daily at 6 AM UTC
  async ({ step }) => {
    const eligibleAssessments = await step.run("fetch-eligible-vendors", async () => {
      try {
        const res = await pool.query(`
          SELECT va.id, va.vendor_name, va.project_id, p.user_id, p.name AS project_name, u.email
          FROM vendor_assessments va
          JOIN projects p ON va.project_id = p.id
          JOIN users u ON p.user_id = u.id
          WHERE va.status = 'Completed'
          AND va.completed_at <= NOW() - INTERVAL '12 months'
          AND p.deleted_at IS NULL
        `);
        return res.rows;
      } catch (err: any) {
        if (err && err.code === "42P01") {
          return [];
        }
        throw err;
      }
    });

    for (const item of eligibleAssessments) {
      const isSnoozed = await step.run(`check-snooze-${item.id}`, async () => {
        const res = await pool.query(
          `SELECT COUNT(*)::int as count FROM notification_log
           WHERE user_id = $1 AND project_id = $2 AND notification_type = 'vendor_reassessment'
           AND metadata->>'vendorId' = $3
           AND created_at > NOW() - INTERVAL '14 days'`,
          [item.user_id, item.project_id, item.id]
        );
        return res.rows[0].count > 0;
      });

      if (isSnoozed) continue;

      const shouldSend = await step.run(`check-preference-${item.user_id}-${item.id}`, async () => {
        return await notificationService.shouldSendNotification(item.user_id, item.project_id, "vendor_reassessment");
      });

      if (!shouldSend) continue;

      await step.run(`send-reminder-${item.id}`, async () => {
        const assessmentUrl = buildSafeFrontendUrl("/assess/:projectId/vendors", { projectId: item.project_id });
        const { html, text } = buildVendorReassessmentEmail(item.user_id, {
          projectName: item.project_name,
          vendorName: item.vendor_name,
          assessmentUrl,
        });

        const success = await emailService.sendEmail({
          to: item.email,
          subject: `Vendor Reassessment Reminder: ${item.vendor_name} - ${item.project_name}`,
          html,
          text,
        });

        if (success) {
          await notificationService.logNotification(
            item.user_id,
            item.project_id,
            "vendor_reassessment",
            `Vendor Reassessment Reminder: ${item.vendor_name} - ${item.project_name}`,
            "sent",
            { vendorId: item.id }
          );
        } else {
          await notificationService.queueNotification(item.user_id, item.project_id, "vendor_reassessment", {
            to: item.email,
            subject: `Vendor Reassessment Reminder: ${item.vendor_name} - ${item.project_name}`,
            html,
            text,
          });
        }
      });
    }

    return { processedCount: eligibleAssessments.length };
  }
);

export const notificationQueueProcessor = inngest.createFunction(
  { id: "notification-queue-processor", name: "Notification Queue Processor" },
  { cron: "*/15 * * * *" }, // Run every 15 minutes
  async ({ step }) => {
    await step.run("process-queue", async () => {
      await notificationService.processQueue();
    });
  }
);

export const riskTargetDateChecker = inngest.createFunction(
  { id: "risk-target-date-checker", name: "Risk Target Date Checker" },
  { cron: "0 7 * * *" }, // Run daily at 7 AM UTC
  async ({ step }) => {
    const overdueRisks = await step.run("fetch-overdue-risks", async () => {
      const res = await pool.query(`
        SELECT id, project_id FROM crc_risks
        WHERE target_date < CURRENT_DATE AND status = 'Open' AND rating = 'Critical'
      `);
      return res.rows;
    });

    const events = overdueRisks.map((risk) => ({
      name: "notification/critical-risk.triggered",
      data: {
        projectId: risk.project_id,
        riskId: risk.id,
        reason: "overdue",
      },
    }));

    if (events.length > 0) {
      await step.sendEvent("trigger-overdue-alerts", events);
    }

    return { triggeredCount: events.length };
  }
);

export const premiumFollowUpEmail = inngest.createFunction(
  { id: "premium-follow-up-email", name: "Premium Follow-Up Email" },
  { event: "app/user.chose-free-path" },
  async ({ event, step }) => {
    const { userId } = event.data;

    // Wait 2 days before sending follow-up
    await step.sleep("wait-2-days", "2d");

    // Check if user is still eligible and fetch fresh data
    const eligibility = await step.run("check-eligibility", async () => {
      const result = await pool.query(
        `SELECT u.subscription_status, u.trial_used, u.premium_followup_email_sent, u.email, u.name,
                COALESCE(np.marketing_emails, true) AS marketing_emails
         FROM users u
         LEFT JOIN notification_preferences np ON np.user_id = u.id
         WHERE u.id = $1`,
        [userId]
      );

      if (result.rows.length === 0) return null;

      const user = result.rows[0];
      const isEligible = (
        user.subscription_status === "free" &&
        !user.trial_used &&
        !user.premium_followup_email_sent
      );

      return {
        isEligible,
        email: user.email,
        name: user.name,
        marketingEmails: user.marketing_emails,
      };
    });

    if (!eligibility || !eligibility.isEligible) {
      return { skipped: true, reason: !eligibility ? "User not found" : "User no longer eligible" };
    }

    // Send the follow-up email
    const emailSent = await step.run("send-follow-up-email", async () => {
      // Check for marketing email consent
      if (eligibility.marketingEmails !== true) {
        return { skipped: true, reason: "Marketing email consent disabled" };
      }

      const success = await emailService.sendPremiumFollowUpEmail(eligibility.email, eligibility.name);

      if (success) {
        // Mark email as sent to avoid duplicates
        await pool.query(
          `UPDATE users SET premium_followup_email_sent = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [userId]
        );
      }

      return { success };
    });

    return { emailSent };
  }
);
