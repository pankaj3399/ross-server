import express, { Router } from "express";
import { z } from "zod";
import pool from "../config/database";
import { authenticateToken } from "../middleware/auth";
import { evaluateDatasetFairness, parseCSV, FairnessAssessment } from "../utils/datasetFairness";
import { inngest } from "../inngest/client";
import { 
    isGeminiConfigured, 
    generateExplanationWithGemini, 
    evaluateToxicity, 
    evaluateRelevancyWithAI, 
    evaluateFaithfulnessWithAI,
    calculateRelevancyHeuristics,
    calculateFaithfulnessHeuristics
} from "../services/fairnessAI";
import { 
    getScoreFromVerdict, 
    getFairnessLabel, 
    getBiasLabel, 
    getPositiveMetricLabel,
    THRESHOLDS
} from "../utils/fairnessThresholds";

const router = Router();

// Batch API evaluation schema
const evaluateApiSchema = z.object({
    projectId: z.string().uuid(),
    apiUrl: z.string().url("Invalid API URL"),
    responseKey: z.string().min(1, "Response key is required"),
    requestTemplate: z.string().min(1, "Request template is required"),
    apiKey: z.string().nullable().optional(),
    apiKeyPlacement: z.enum(["none", "auth_header", "x_api_key", "query_param", "body_field"]).optional().default("none"),
    apiKeyFieldName: z.string().nullable().optional(),
});

// Dataset evaluation schema
const evaluateDatasetSchema = z.object({
    projectId: z.string().uuid(),
    fileName: z.string().min(1, "File name is required"),
    csvText: z.string().min(1, "CSV text is required"),
});

// Manual prompt test schema
const evaluatePromptsSchema = z.object({
    projectId: z.string().uuid(),
    responses: z.array(z.object({
        category: z.string().min(1),
        prompt: z.string().min(1),
        response: z.string().min(1),
    })).min(1, "At least one response is required"),
});

const LANGFAIR_SERVICE_URL = process.env.LANGFAIR_SERVICE_URL;

// GET /fairness/thresholds - Get shared threshold constants
router.get("/thresholds", authenticateToken, (req, res) => {
    // Return statically imported thresholds
    res.json(THRESHOLDS);
});

// GET /fairness-prompts
router.get("/prompts", authenticateToken, async (req, res) => {
    try {
        // Fetch all fairness questions grouped by label
        const result = await pool.query(
            `SELECT label, prompt, id 
         FROM fairness_questions 
         ORDER BY label, created_at`
        );

        // Group questions by label
        const groupedQuestions: Record<string, { label: string; prompts: string[] }> = {};

        result.rows.forEach((row) => {
            if (!groupedQuestions[row.label]) {
                groupedQuestions[row.label] = {
                    label: row.label,
                    prompts: [],
                };
            }
            groupedQuestions[row.label].prompts.push(row.prompt);
        });

        // Convert to array format
        const questions = Object.values(groupedQuestions);

        res.json({ questions });
    } catch (error) {
        console.error("Error fetching fairness questions:", error);
        res.status(500).json({ error: "Failed to fetch fairness questions" });
    }
});

// POST /fairness/dataset-evaluate - Evaluate dataset fairness from CSV
// Apply larger body size limit (25MB) specifically for CSV evaluation
router.post("/dataset-evaluate", authenticateToken, express.json({ limit: "25mb" }), async (req, res) => {
    try {
        // Check if Gemini is configured - required for explanations
        if (!isGeminiConfigured()) {
            console.error("[Fairness API] GEMINI_API_KEY is not configured. Dataset evaluation cannot proceed.");
            return res.status(503).json({ 
                error: "AI service is not configured. Please contact support."
            });
        }

        const { projectId, fileName, csvText } = evaluateDatasetSchema.parse(req.body);
        const userId = req.user!.id;

        // Verify project belongs to user
        const projectCheck = await pool.query(
            "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
            [projectId, userId]
        );

        if (projectCheck.rows.length === 0) {
            return res.status(404).json({ error: "Project not found" });
        }

        // Parse CSV to analyze data
        const parsed = parseCSV(csvText);
        const { headers, rows } = parsed;

        // Evaluate dataset fairness
        const fairnessAssessment = evaluateDatasetFairness(csvText);

        // Prepare dataset summary for Gemini explanations
        const datasetSummary = `Dataset contains ${rows.length} rows and ${headers.length} columns. ` +
            `Sensitive columns detected: ${fairnessAssessment.sensitiveColumns.length}. ` +
            `Overall verdict: ${fairnessAssessment.overallVerdict}. ` +
            `Columns: ${headers.slice(0, 5).join(", ")}${headers.length > 5 ? "..." : ""}`;

        // Calculate scores based on fairness assessment
        const overallScore = getScoreFromVerdict(fairnessAssessment.overallVerdict);
        const fairnessLabel = getFairnessLabel(overallScore);
        const fairnessContext = `The dataset fairness assessment resulted in a "${fairnessAssessment.overallVerdict}" verdict with a score of ${overallScore.toFixed(3)}. ` +
            `This indicates ${fairnessAssessment.overallVerdict === "pass" ? "low bias" : fairnessAssessment.overallVerdict === "caution" ? "moderate bias requiring attention" : "significant bias requiring immediate correction"} across sensitive groups.`;
        
        // Calculate biasness score from sensitive columns
        const maxDisparity = fairnessAssessment.sensitiveColumns.length > 0
            ? Math.max(0, ...fairnessAssessment.sensitiveColumns.map(col => col.disparity)) // Ensure non-negative and handle empty case implicitly via length check
            : 0;
        const biasnessScore = Math.min(1, maxDisparity * 2); // Scale disparity to 0-1
        const biasnessLabel = getBiasLabel(biasnessScore);
        const biasnessContext = maxDisparity > 0
            ? `Maximum disparity of ${(maxDisparity * 100).toFixed(1)}% detected across sensitive groups. ` +
              `Sensitive columns analyzed: ${fairnessAssessment.sensitiveColumns.map(col => col.column).join(", ")}.`
            : "No significant bias detected in sensitive columns. The dataset shows relatively balanced representation across demographic groups.";
        
        // Prepare toxicity sample
        // Extract text content from CSV for evaluation
        // Sample 50 rows for better coverage (increased from 10)
        const sampleRows = rows.slice(0, Math.min(50, rows.length));
        let textContent = sampleRows
            .map(row => 
                Object.values(row)
                    .filter(val => val && val.trim().length > 0)
                    .join(" ")
            )
            .filter(text => text.length > 0)
            .join("\n");
        
        // Limit text content to 5000 characters (increased from 2000)
        if (textContent.length > 5000) {
            textContent = textContent.substring(0, 5000) + "...";
        }

        // Prepare Relevancy data
        const { score: relevancyScore, factors } = calculateRelevancyHeuristics(rows, headers, fairnessAssessment);
        
        let relevancyContext = "";
        let relevancyLabel: "low" | "moderate" | "high" = "moderate";
        
        if (rows.length > 0 && headers.length > 0) {
            relevancyLabel = getPositiveMetricLabel(relevancyScore);
            relevancyContext = `Relevancy assessment for fairness evaluation. ` +
                `Score: ${relevancyScore.toFixed(3)}. ` +
                (factors.length > 0
                    ? `Dataset is relevant for fairness evaluation: ${factors.join(", ")}.`
                    : "Dataset structure may not be optimal for fairness evaluation.");
        } else {
             relevancyContext = "Insufficient data to assess relevancy";
        }

        // Prepare Faithfulness data
        const { score: faithfulnessScore, issues, metrics } = calculateFaithfulnessHeuristics(rows, headers);
        
        let faithfulnessContext = "";
        let faithfulnessLabel: "low" | "moderate" | "high" = "moderate";

        if (rows.length > 0 && headers.length > 0) {
            faithfulnessLabel = getPositiveMetricLabel(faithfulnessScore);
            faithfulnessContext = `Faithfulness assessment based on data quality metrics. ` +
                `Score: ${faithfulnessScore.toFixed(3)}. ` +
                (issues.length > 0
                    ? `Data quality concerns: ${issues.join(", ")}.`
                    : `Data appears consistent: ${(metrics.completeness * 100).toFixed(1)}% complete, ${(metrics.typeConsistency * 100).toFixed(1)}% type consistency, ${(metrics.uniqueness * 100).toFixed(1)}% unique rows.`);
        } else {
            faithfulnessContext = "Insufficient data to assess faithfulness";
        }

        // Execute all AI calls in parallel
        // Define promises for each explanation/evaluation
        const fairnessPromise = generateExplanationWithGemini("Fairness", overallScore, fairnessLabel, fairnessContext, datasetSummary);
        const biasnessPromise = generateExplanationWithGemini("Biasness", biasnessScore, biasnessLabel, biasnessContext, datasetSummary);
        const toxicityPromise = evaluateToxicity(textContent, sampleRows.length, datasetSummary);
        // Use AI-based Relevancy evaluation (combines structural score with AI content analysis)
        const relevancyPromise = evaluateRelevancyWithAI(textContent, relevancyScore, headers, datasetSummary);
        // Use AI-based Faithfulness evaluation (combines data quality metrics with AI analysis)
        const faithfulnessPromise = evaluateFaithfulnessWithAI(
            textContent, 
            faithfulnessScore, 
            metrics.completeness,
            metrics.typeConsistency,
            metrics.uniqueness,
            datasetSummary
        );

        // Await all promises
        const [
            fairnessExplanation,
            biasnessExplanation,
            toxicityResult,
            relevancyResult,
            faithfulnessResult
        ] = await Promise.all([
            fairnessPromise,
            biasnessPromise,
            toxicityPromise,
            relevancyPromise,
            faithfulnessPromise
        ]);

        const fairnessResult = {
            score: overallScore,
            label: fairnessLabel,
            explanation: fairnessExplanation,
        };

        const biasness = {
            score: biasnessScore,
            label: biasnessLabel,
            explanation: biasnessExplanation,
        };

        const toxicity = toxicityResult;

        // relevancyResult and faithfulnessResult are now full objects from AI evaluation
        const relevance = relevancyResult;
        const faithfulness = faithfulnessResult;

        // Limit CSV preview to first 100 rows to avoid DB bloat
        // Type of parsed is { headers: string[], rows: (string[] | Record<string, string>)[] }
        // We'll trust parseCSV returns a valid structure, usually rows is array of objects or arrays
        const PREVIEW_ROW_LIMIT = 100;
        const parsedSlice = {
            ...parsed,
            rows: parsed.rows.slice(0, PREVIEW_ROW_LIMIT)
        };

        // Save evaluation results to database
        try {
            await pool.query(
                `INSERT INTO dataset_fairness_reports 
                 (user_id, project_id, file_name, file_size, uploaded_at, 
                  fairness_data, fairness_result, biasness_result, toxicity_result, 
                  relevance_result, faithfulness_result, csv_preview, selections)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [
                    userId,
                    projectId,
                    fileName,
                    Buffer.byteLength(csvText, 'utf8'), // Accurate byte size
                    new Date(),
                    JSON.stringify({
                        overallVerdict: fairnessAssessment.overallVerdict,
                        sensitiveColumns: fairnessAssessment.sensitiveColumns,
                        outcomeColumn: fairnessAssessment.outcomeColumn,
                        positiveOutcome: fairnessAssessment.positiveOutcome,
                        datasetStats: fairnessAssessment.datasetStats,
                        metricDefinitions: fairnessAssessment.metricDefinitions,
                    }),
                    JSON.stringify(fairnessResult),
                    JSON.stringify(biasness),
                    JSON.stringify(toxicity),
                    JSON.stringify(relevance),
                    JSON.stringify(faithfulness),
                    JSON.stringify(parsedSlice), // Limited CSV preview
                    null, // selections (not available in this endpoint)
                ]
            );
        } catch (dbError) {
            console.error("Failed to save fairness report to database:", dbError);
            // Don't fail the request if saving fails, just log it
        }

        res.json({
            fairness: {
                overallVerdict: fairnessAssessment.overallVerdict,
                sensitiveColumns: fairnessAssessment.sensitiveColumns,
                outcomeColumn: fairnessAssessment.outcomeColumn,
                positiveOutcome: fairnessAssessment.positiveOutcome,
                datasetStats: fairnessAssessment.datasetStats,
                metricDefinitions: fairnessAssessment.metricDefinitions,
            },
            fairnessResult,
            biasness,
            toxicity,
            relevance,
            faithfulness,
        });
    } catch (error: any) {
        console.error("Error evaluating dataset fairness:", error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        // Provide more helpful error messages
        const errorMessage = error?.message || "Failed to evaluate dataset fairness";
        // Validating status code to be a valid HTTP error code (100-599)
        let statusCode = 500;
        const rawStatus = error?.status;
        if (rawStatus !== undefined && rawStatus !== null) {
            const parsedStatus = typeof rawStatus === 'number' ? rawStatus : parseInt(String(rawStatus), 10);
            if (Number.isInteger(parsedStatus) && parsedStatus >= 100 && parsedStatus < 600) {
                statusCode = parsedStatus;
            }
        }
        
        // Check for specific error types
        if (errorMessage.includes("CSV") || errorMessage.includes("parse")) {
            return res.status(400).json({ error: "Invalid CSV format. Please check your file and try again." });
        }
        if (errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT")) {
            return res.status(504).json({ error: "Request timed out. Please try with a smaller file." });
        }
        
        res.status(statusCode).json({ error: errorMessage });
    }
});

// POST /fairness/evaluate-prompts - Create a job for manual prompt testing
router.post("/evaluate-prompts", authenticateToken, async (req, res) => {
    try {
        const { projectId, responses } = evaluatePromptsSchema.parse(req.body);
        const userId = req.user!.id;

        // Verify project belongs to user
        const projectCheck = await pool.query(
            "SELECT id, version_id FROM projects WHERE id = $1 AND user_id = $2",
            [projectId, userId]
        );

        if (projectCheck.rows.length === 0) {
            return res.status(404).json({ error: "Project not found" });
        }

        const totalPrompts = responses.length;

        // Generate a unique job ID
        const jobId = `fairness-prompts-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Create job payload with responses
        const jobPayload = {
            type: "FAIRNESS_PROMPTS",
            responses: responses.map(r => ({
                category: r.category,
                prompt: r.prompt,
                response: r.response,
            })),
        };

        // Insert job into evaluation_status table with job_type = MANUAL_PROMPT_TEST
        // Use status='processing' instead of 'queued' since Inngest will handle it
        const insertResult = await pool.query(
            `INSERT INTO evaluation_status (user_id, project_id, job_id, payload, status, total_prompts, progress, percent, job_type)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id, job_id, total_prompts`,
            [
                userId,
                projectId,
                jobId,
                JSON.stringify(jobPayload),
                "processing",
                totalPrompts,
                `0/${totalPrompts}`,
                0,
                "MANUAL_PROMPT_TEST",
            ]
        );

        const job = insertResult.rows[0];

        // Send Inngest event to process the job
        try {
            await inngest.send({
                name: "evaluation/job.created",
                data: {
                    jobId: job.job_id,
                },
            });
        } catch (inngestError) {
            // Log error but don't fail the request - job is already created in DB
            console.warn("Failed to send Inngest event (job will be processed manually or retried):", inngestError);
        }

        res.json({
            jobId: job.job_id,
            totalPrompts: job.total_prompts,
            message: `Evaluation job created successfully. Processing ${totalPrompts} prompts.`,
        });
    } catch (error) {
        console.error("Error creating manual prompt evaluation job:", error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        res.status(500).json({ error: "Failed to create evaluation job" });
    }
});

// POST /fairness/evaluate-api - Create a job for batch API evaluation
router.post("/evaluate-api", authenticateToken, async (req, res) => {
    try {
        const { projectId, apiUrl, responseKey, requestTemplate, apiKey, apiKeyPlacement, apiKeyFieldName } = evaluateApiSchema.parse(req.body);
        const userId = req.user!.id;

        // Verify project belongs to user
        const projectCheck = await pool.query(
            "SELECT id, version_id FROM projects WHERE id = $1 AND user_id = $2",
            [projectId, userId]
        );

        if (projectCheck.rows.length === 0) {
            return res.status(404).json({ error: "Project not found" });
        }

        // Fetch all fairness questions to get total count
        const questionsResult = await pool.query(
            `SELECT label, prompt, id 
             FROM fairness_questions 
             ORDER BY label, created_at`
        );

        const totalPrompts = questionsResult.rows.length;

        // Generate a unique job ID
        const jobId = `fairness-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Create job payload
        const jobPayload = {
            type: "FAIRNESS_API",
            config: {
                projectId,
                apiUrl,
                requestTemplate,
                responseKey,
                apiKey: apiKey || null,
                apiKeyPlacement: apiKeyPlacement || "none",
                apiKeyFieldName: apiKeyFieldName || null,
            },
        };

        // Insert job into evaluation_status table with job_type = AUTOMATED_API_TEST
        // Use status='processing' instead of 'queued' since Inngest will handle it
        const insertResult = await pool.query(
            `INSERT INTO evaluation_status (user_id, project_id, job_id, payload, status, total_prompts, progress, percent, job_type)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id, job_id, total_prompts`,
            [
                userId,
                projectId,
                jobId,
                JSON.stringify(jobPayload),
                "processing",
                totalPrompts,
                `0/${totalPrompts}`,
                0,
                "AUTOMATED_API_TEST",
            ]
        );

        const job = insertResult.rows[0];

        // Send Inngest event to process the job
        try {
            await inngest.send({
                name: "evaluation/job.created",
                data: {
                    jobId: job.job_id,
                },
            });
        } catch (inngestError) {
            // Log error but don't fail the request - job is already created in DB
            console.warn("Failed to send Inngest event (job will be processed manually or retried):", inngestError);
        }

        res.json({
            jobId: job.job_id,
            totalPrompts: job.total_prompts,
            message: `Evaluation job created successfully. Processing ${totalPrompts} prompts.`,
        });
    } catch (error) {
        console.error("Error creating evaluation job:", error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        res.status(500).json({ error: "Failed to create evaluation job" });
    }
});

// GET /fairness/jobs/:jobId - Get job status
router.get("/jobs/:jobId", authenticateToken, async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.user!.id;

        // Fetch job from evaluation_status table
        const result = await pool.query(
            `SELECT 
                id,
                job_id,
                user_id,
                project_id,
                payload,
                status,
                total_prompts,
                progress,
                last_processed_prompt,
                percent,
                created_at,
                updated_at
            FROM evaluation_status
            WHERE job_id = $1 AND user_id = $2`,
            [jobId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Job not found" });
        }

        const job = result.rows[0];
        const payload = typeof job.payload === 'string' ? JSON.parse(job.payload) : job.payload;

        // Extract summary, results, and errors from payload
        const summary = payload.summary || null;
        const results = payload.results || [];
        const errors = payload.errors || [];
        const errorMessage = payload.error || null;

        // Normalize status for consistent API responses
        // statuses: queued | running | processing | collecting_responses | evaluating | completed | success | partial_success | failed
        const rawStatus = String(job.status).toLowerCase();
        let normalizedStatus: string = rawStatus;
        
        // Map backend internal statuses to standard frontend ones if needed
        if (rawStatus === 'success' || rawStatus === 'partial_success' || rawStatus === 'completed') {
            normalizedStatus = 'completed';
        }

        res.json({
            jobId: job.job_id,
            status: normalizedStatus,
            progress: job.progress || "0/0",
            percent: job.percent || 0,
            lastProcessedPrompt: job.last_processed_prompt || null,
            totalPrompts: job.total_prompts || 0,
            summary,
            results,
            errors,
            errorMessage,
        });
    } catch (error: any) {
        console.error("Error fetching job status:", error);
        res.status(500).json({ error: "Failed to fetch job status" });
    }
});

// GET /fairness/jobs/project/:projectId - Get all jobs for a user and project
router.get("/jobs/project/:projectId", authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user!.id;

        // Verify project belongs to user
        const projectCheck = await pool.query(
            "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
            [projectId, userId]
        );

        if (projectCheck.rows.length === 0) {
            return res.status(403).json({ error: "Project not found or access denied" });
        }

        // Fetch all jobs (queued, processing, running, completed) for this project and user
        const result = await pool.query(
            `SELECT 
                id,
                job_id,
                user_id,
                project_id,
                status,
                total_prompts,
                progress,
                last_processed_prompt,
                percent,
                created_at,
                updated_at
            FROM evaluation_status
            WHERE project_id = $1 AND user_id = $2 AND status IN ('queued', 'processing', 'running', 'completed')
            ORDER BY created_at DESC`,
            [projectId, userId]
        );

        const jobs = result.rows.map(row => {
            // Normalize status to lowercase for consistent API responses
            const normalizedStatus = String(row.status).toLowerCase() as "queued" | "processing" | "running" | "completed";
            return {
                jobId: row.job_id,
                status: normalizedStatus,
                progress: row.progress || "0/0",
                percent: row.percent || 0,
                lastProcessedPrompt: row.last_processed_prompt || null,
                totalPrompts: row.total_prompts || 0,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            };
        });

        res.json({
            success: true,
            jobs,
            count: jobs.length,
        });
    } catch (error: any) {
        console.error("Error fetching pending jobs:", error);
        res.status(500).json({ error: "Failed to fetch pending jobs" });
    }
});

// GET /fairness/evaluations/:projectId - Get all evaluations for a project
router.get("/evaluations/:projectId", authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user!.id;

        // Verify project belongs to user
        const projectCheck = await pool.query(
            "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
            [projectId, userId]
        );

        if (projectCheck.rows.length === 0) {
            return res.status(403).json({ error: "Project not found or access denied" });
        }

        // Get all evaluations for this project and user
        // Filter by both project_id and user_id to ensure users only see their own evaluations
        const result = await pool.query(
            `SELECT 
                id,
                category,
                question_text,
                user_response,
                bias_score,
                toxicity_score,
                relevancy_score,
                faithfulness_score,
                overall_score,
                verdicts,
                reasoning,
                created_at
            FROM fairness_evaluations
            WHERE project_id = $1 AND user_id = $2
            ORDER BY created_at DESC`,
            [projectId, userId]
        );

        // Format evaluations - preserve null scores to distinguish failed evaluations from 0 scores
        const evaluations = result.rows.map(row => ({
            id: row.id,
            category: row.category,
            questionText: row.question_text,
            userResponse: row.user_response,
            biasScore: row.bias_score !== null ? parseFloat(row.bias_score) : null,
            toxicityScore: row.toxicity_score !== null ? parseFloat(row.toxicity_score) : null,
            relevancyScore: row.relevancy_score !== null ? parseFloat(row.relevancy_score) : null,
            faithfulnessScore: row.faithfulness_score !== null ? parseFloat(row.faithfulness_score) : null,
            overallScore: row.overall_score !== null ? parseFloat(row.overall_score) : null,
            verdicts: typeof row.verdicts === 'string' ? JSON.parse(row.verdicts) : row.verdicts,
            reasoning: row.reasoning,
            createdAt: row.created_at,
        }));

        res.json({ success: true, evaluations });
    } catch (error: any) {
        console.error("Error fetching evaluations:", error);
        res.status(500).json({ error: "Failed to fetch evaluations" });
    }
});

// GET /fairness/dataset-reports/:projectId - Get all dataset reports for a project
router.get("/dataset-reports/:projectId", authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user!.id;
        
        // Verify project belongs to user
        const projectCheck = await pool.query(
            "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
            [projectId, userId]
        );
        
        if (projectCheck.rows.length === 0) {
            return res.status(403).json({ error: "Project not found or access denied" });
        }
        
        // Parse pagination params
        const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 50); // Default 20, max 50
        const offset = Math.max(parseInt(req.query.offset as string) || 0, 0); // Default 0

        // Fetch reports for this project with pagination
        const countResult = await pool.query(
             `SELECT COUNT(*) as total
              FROM dataset_fairness_reports
              WHERE project_id = $1 AND user_id = $2`,
             [projectId, userId]
        );
        const total = parseInt(countResult.rows[0].total || '0');

        const result = await pool.query(
            `SELECT 
                id, file_name, file_size, uploaded_at,
                fairness_data, fairness_result, biasness_result,
                toxicity_result, relevance_result, faithfulness_result,
                csv_preview, selections, created_at
             FROM dataset_fairness_reports
             WHERE project_id = $1 AND user_id = $2
             ORDER BY created_at DESC
             LIMIT $3 OFFSET $4`,
            [projectId, userId, limit, offset]
        );
        
        res.json({ 
            success: true, 
            reports: result.rows,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + result.rows.length < total
            }
        });
    } catch (error: any) {
        console.error("Error fetching dataset reports:", error);
        res.status(500).json({ error: "Failed to fetch dataset reports" });
    }
});

function sanitizeConfigResponse(config: any): any {
    if (!config) return config;
    try {
        const parsed = typeof config === 'string' ? JSON.parse(config) : config;
        const sensitivePattern = /api[-_]?key|token|secret|password|access[-_]?token/i;
        const sanitized = { ...parsed };
        for (const key of Object.keys(sanitized)) {
            if (sensitivePattern.test(key)) {
                sanitized[key] = "[REDACTED]";
            }
        }
        return sanitized;
    } catch (e) {
        return config; // Fallback for non-JSON or other issues
    }
}

// GET /fairness/api-reports/:projectId - Get all API test reports for a project
router.get("/api-reports/:projectId", authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user!.id;
        
        // Verify project belongs to user
        const projectCheck = await pool.query(
            "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
            [projectId, userId]
        );
        
        if (projectCheck.rows.length === 0) {
            return res.status(403).json({ error: "Project not found or access denied" });
        }
        
        // Parse pagination params
        const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 50); 
        const offset = Math.max(parseInt(req.query.offset as string) || 0, 0); 

        // Fetch reports for this project with pagination
        const countResult = await pool.query(
             `SELECT COUNT(*) as total
              FROM api_test_reports
              WHERE project_id = $1 AND user_id = $2 AND (config->>'testType' IS NULL OR config->>'testType' != 'MANUAL_PROMPT_TEST')`,
             [projectId, userId]
        );
        const total = parseInt(countResult.rows[0].total || '0');

        const result = await pool.query(
            `SELECT 
                id, job_id, total_prompts, success_count, failure_count,
                average_scores, config, created_at
             FROM api_test_reports
             WHERE project_id = $1 AND user_id = $2 AND (config->>'testType' IS NULL OR config->>'testType' != 'MANUAL_PROMPT_TEST')
             ORDER BY created_at DESC
             LIMIT $3 OFFSET $4`,
            [projectId, userId, limit, offset]
        );
        
        res.json({ 
            success: true, 
            reports: result.rows.map(row => ({
                ...row,
                config: sanitizeConfigResponse(row.config)
            })),
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + result.rows.length < total
            }
        });
    } catch (error: any) {
        console.error("Error fetching API test reports:", error);
        res.status(500).json({ error: "Failed to fetch API test reports" });
    }
});

// GET /fairness/api-reports/detail/:reportId - Get full detail of a specific API report
router.get("/api-reports/detail/:reportId", authenticateToken, async (req, res) => {
    try {
        const { reportId } = req.params;
        const userId = req.user!.id; // Use non-null assertion as authenticateToken ensures user exists
        
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(reportId)) {
            return res.status(400).json({ error: "Invalid reportId" });
        }

        const result = await pool.query(
            `SELECT * FROM api_test_reports
             WHERE id = $1 AND user_id = $2`,
            [reportId, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Report not found or access denied" });
        }
        
        res.json({ 
            success: true, 
            report: {
                ...result.rows[0],
                config: sanitizeConfigResponse(result.rows[0].config)
            },
        });
    } catch (error: any) {
        console.error("Error fetching API test report details:", error);
        res.status(500).json({ error: "Failed to fetch API test report details" });
    }
});

// DELETE /fairness/api-reports/:reportId - Delete an API test report
router.delete("/api-reports/:reportId", authenticateToken, async (req, res) => {
    try {
        const { reportId } = req.params;
        const userId = req.user!.id;
        
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(reportId)) {
            return res.status(400).json({ error: "Invalid reportId" });
        }

        const result = await pool.query(
            "DELETE FROM api_test_reports WHERE id = $1 AND user_id = $2 RETURNING id",
            [reportId, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Report not found or access denied" });
        }
        
        res.json({ success: true, message: "Report deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting API test report:", error);
        res.status(500).json({ error: "Failed to delete API test report" });
    }
});

// GET /fairness/manual-reports/:projectId - Get all Manual test reports for a project
router.get("/manual-reports/:projectId", authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user!.id;
        
        // Verify project belongs to user
        const projectCheck = await pool.query(
            "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
            [projectId, userId]
        );
        
        if (projectCheck.rows.length === 0) {
            return res.status(403).json({ error: "Project not found or access denied" });
        }
        
        // Parse pagination params
        const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 50); 
        const offset = Math.max(parseInt(req.query.offset as string) || 0, 0); 

        // Fetch reports for this project with pagination
        // Filter by config having testType = MANUAL_PROMPT_TEST
        const countResult = await pool.query(
             `SELECT COUNT(*) as total
              FROM api_test_reports
              WHERE project_id = $1 AND user_id = $2 AND (config->>'testType' = 'MANUAL_PROMPT_TEST')`,
             [projectId, userId]
        );
        const total = parseInt(countResult.rows[0].total || '0');

        const result = await pool.query(
            `SELECT 
                id, job_id, total_prompts, success_count, failure_count,
                average_scores, config, created_at
             FROM api_test_reports
             WHERE project_id = $1 AND user_id = $2 AND (config->>'testType' = 'MANUAL_PROMPT_TEST')
             ORDER BY created_at DESC
             LIMIT $3 OFFSET $4`,
            [projectId, userId, limit, offset]
        );
        
        res.json({ 
            success: true, 
            reports: result.rows,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + result.rows.length < total
            }
        });
    } catch (error: any) {
        console.error("Error fetching manual test reports:", error);
        res.status(500).json({ error: "Failed to fetch manual test reports" });
    }
});

// GET /fairness/manual-reports/detail/:reportId - Get full detail of a specific Manual report
router.get("/manual-reports/detail/:reportId", authenticateToken, async (req, res) => {
    try {
        const { reportId } = req.params;
        const userId = req.user!.id;
        
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(reportId)) {
            return res.status(400).json({ error: "Invalid reportId" });
        }

        const result = await pool.query(
            `SELECT * FROM api_test_reports
             WHERE id = $1 AND user_id = $2 AND (config->>'testType' = 'MANUAL_PROMPT_TEST')`,
            [reportId, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Report not found or access denied" });
        }
        
        res.json({ 
            success: true, 
            report: result.rows[0],
        });
    } catch (error: any) {
        console.error("Error fetching manual test report details:", error);
        res.status(500).json({ error: "Failed to fetch manual test report details" });
    }
});

// DELETE /fairness/manual-reports/:reportId - Delete a Manual test report
router.delete("/manual-reports/:reportId", authenticateToken, async (req, res) => {
    try {
        const { reportId } = req.params;
        const userId = req.user!.id;
        
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(reportId)) {
            return res.status(400).json({ error: "Invalid reportId" });
        }

        const result = await pool.query(
            "DELETE FROM api_test_reports WHERE id = $1 AND user_id = $2 AND (config->>'testType' = 'MANUAL_PROMPT_TEST') RETURNING id",
            [reportId, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Report not found or access denied" });
        }
        
        res.json({ success: true, message: "Report deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting manual test report:", error);
        res.status(500).json({ error: "Failed to delete manual test report" });
    }
});

// Update standard API reports endpoint to filter OUT manual tests
// We want to update the existing route handler for /api-reports/:projectId logic
// But since we can't easily replace just logic inside a function without replacing the whole function block and it's large,
// I'll leave the existing one alone as it will just show manual tests mixed in if we don't filter.
// However, the existing route is GET /api-reports/:projectId
// We should probably update it to filter out manual tests to keep them separate.
// But given tool limitations on replacing blocks, and that mixing them might be okay or I can filter in frontend,
// wait, the prompt asks to "show it in frontend", likely in a separate section or tab.
// It's safer if I update the existing route too, but I'll do it as a separate replacement if needed.
// For now let's just add the manual routes.
// Wait, I should also update the API reports route to NOT include manual tests.

export default router;