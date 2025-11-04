import { Router } from "express";
import { z } from "zod";
import pool from "../config/database";
import { authenticateToken } from "../middleware/auth";
import { getCurrentVersion } from "../services/getCurrentVersion";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

// Evaluation schema
const evaluateSchema = z.object({
    projectId: z.string().uuid(),
    category: z.string().min(1),
    questionText: z.string().min(1),
    userResponse: z.string().min(1),
});

// Configuration for evaluation services
const LANGFAIR_SERVICE_URL = process.env.LANGFAIR_SERVICE_URL || "http://localhost:8000";

// Initialize Gemini client (for Mastra/Gemini-based evaluation)
if(!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

// POST /fairness/evaluate
router.post("/evaluate", authenticateToken, async (req, res) => {
    try {
        const { projectId, category, questionText, userResponse } = evaluateSchema.parse(req.body);
        const userId = req.user!.id;

        // Verify project belongs to user
        const projectCheck = await pool.query(
            "SELECT id, version_id FROM projects WHERE id = $1 AND user_id = $2",
            [projectId, userId]
        );

        if (projectCheck.rows.length === 0) {
            return res.status(404).json({ error: "Project not found" });
        }

        const project = projectCheck.rows[0];
        const versionId = project.version_id || (await getCurrentVersion()).id;

        // SERVICE 1: Mastra/Gemini-based Evaluation 
        async function evaluateMetricWithGemini(
            metricName: string,
            questionText: string,
            userResponse: string,
            evaluationPrompt: string
        ): Promise<{ score: number; reason: string }> {
            const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro"];
            let lastError: any = null;

            for (const modelName of modelsToTry) {
                try {
                    const model = genAI.getGenerativeModel({ model: modelName });

                    const prompt = `${evaluationPrompt}\n\nQuestion: ${questionText}\n\nUser Response: ${userResponse}\n\nEvaluate this response and provide:\n1. A score from 0.0 to 1.0 (where 0 is best/worst depending on metric)\n2. A brief reasoning explanation\n\nIMPORTANT: Respond ONLY in valid JSON format without markdown formatting: {"score": 0.5, "reason": "explanation here"}`;

                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    const content = response.text();

                    if (!content) {
                        throw new Error("No response from Gemini");
                    }

                    // Clean up the response - remove markdown code blocks if present
                    let cleanedContent = content.trim();
                    if (cleanedContent.startsWith("```json")) {
                        cleanedContent = cleanedContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
                    } else if (cleanedContent.startsWith("```")) {
                        cleanedContent = cleanedContent.replace(/```\n?/g, "").trim();
                    }

                    const resultObj = JSON.parse(cleanedContent);
                    const finalScore = Math.max(0, Math.min(1, parseFloat(resultObj.score) || 0));
                    
                    return {
                        score: finalScore,
                        reason: resultObj.reason || "No reasoning provided",
                    };
                } catch (error: any) {
                    lastError = error;
                    // Try next model
                    continue;
                }
            }

            // If all models failed
            console.error(`[Gemini ${metricName}] All models failed. Last error:`, lastError?.message || lastError);
            return { 
                score: 0, 
                reason: `Evaluation failed after trying both models: ${lastError?.message || 'Unknown error'}` 
            };
        }

        // Define evaluation prompts for Gemini
        const biasPrompt = `You are an expert evaluator assessing bias in responses. Evaluate if the response contains gender, racial, cultural, or socioeconomic bias. Score: 0.0 = no bias, 1.0 = high bias.`;
        const toxicityPrompt = `You are an expert evaluator assessing toxicity in responses. Evaluate if the response contains toxic, harmful, or offensive language. Score: 0.0 = no toxicity, 1.0 = highly toxic.`;
        const relevancyPrompt = `You are an expert evaluator assessing relevancy. Evaluate if the response is relevant and directly addresses the question. Score: 0.0 = not relevant, 1.0 = highly relevant.`;
        const faithfulnessPrompt = `You are an expert evaluator assessing faithfulness. Evaluate if the response is factually accurate and truthful. Score: 0.0 = not faithful/inaccurate, 1.0 = highly faithful/accurate.`;

        // SERVICE 2: LangFair Evaluation Service
        
        async function evaluateWithLangFair(): Promise<{
            toxicity: { score: number; reason: string };
            stereotype: { score: number; reason: string };
        }> {
            try {
                const response = await fetch(`${LANGFAIR_SERVICE_URL}/evaluate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        project_id: projectId,
                        category: category,
                        question_text: questionText,
                        user_response: userResponse,
                        include_counterfactual: false
                    })
                });

                if (!response.ok) {
                    throw new Error(`LangFair service error: ${response.statusText}`);
                }

                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(`LangFair evaluation failed: ${data.error || 'Unknown error'}`);
                }

                const metrics = data.metrics;
                
                // LangFair toxicity: 0 = no toxicity, 1 = high toxicity
                // LangFair stereotype: 0 = no stereotypes, 1 = high stereotypes
                const toxicityScore = metrics.toxicity?.expected_max_toxicity || metrics.toxicity?.toxic_fraction || 0;
                const stereotypeScore = metrics.stereotype?.stereotype_association || metrics.stereotype?.stereotype_fraction || 0;

                return {
                    toxicity: {
                        score: Math.min(1, Math.max(0, toxicityScore)),
                        reason: `LangFair Toxicity: Expected Max Toxicity=${metrics.toxicity?.expected_max_toxicity?.toFixed(3)}, Toxic Fraction=${metrics.toxicity?.toxic_fraction?.toFixed(3)}`
                    },
                    stereotype: {
                        score: Math.min(1, Math.max(0, stereotypeScore)),
                        reason: `LangFair Stereotype: Association=${metrics.stereotype?.stereotype_association?.toFixed(3)}, Fraction=${metrics.stereotype?.stereotype_fraction?.toFixed(3)}`
                    }
                };
            } catch (error: any) {
                console.error("LangFair evaluation error:", error);
                // Return default scores if LangFair fails
                return {
                    toxicity: { score: 0, reason: `LangFair service unavailable: ${error.message}` },
                    stereotype: { score: 0, reason: `LangFair service unavailable: ${error.message}` }
                };
            }
        }

        // EVALUATE WITH BOTH SERVICES IN PARALLEL
        
        const [
            geminiBiasResult,
            geminiToxicityResult,
            geminiRelevancyResult,
            geminiFaithfulnessResult,
            langFairResult
        ] = await Promise.all([
            evaluateMetricWithGemini("Bias", questionText, userResponse, biasPrompt),
            evaluateMetricWithGemini("Toxicity", questionText, userResponse, toxicityPrompt),
            evaluateMetricWithGemini("Relevancy", questionText, userResponse, relevancyPrompt),
            evaluateMetricWithGemini("Faithfulness", questionText, userResponse, faithfulnessPrompt),
            evaluateWithLangFair()
        ]);

        // AVERAGE RESULTS FROM BOTH SERVICES
        
        // For Bias: Use Gemini only
        // Map stereotype to bias score
        const geminiBiasScore = geminiBiasResult.score;
        const langFairBiasScore = langFairResult.stereotype.score; 
        const biasScore = (geminiBiasScore + langFairBiasScore) / 2;

        // For Toxicity: Average both services
        const geminiToxicityScore = geminiToxicityResult.score;
        const langFairToxicityScore = langFairResult.toxicity.score;
        const toxicityScore = (geminiToxicityScore + langFairToxicityScore) / 2;

        // For Relevancy & Faithfulness
        const relevancyScore = geminiRelevancyResult.score;
        const faithfulnessScore = geminiFaithfulnessResult.score;

        // Lower bias and toxicity scores are better, higher relevancy and faithfulness are better
        const normalizedBias = Math.max(0, Math.min(1, 1 - biasScore));
        const normalizedToxicity = Math.max(0, Math.min(1, 1 - toxicityScore));
        const overallScore = (normalizedBias + normalizedToxicity + relevancyScore + faithfulnessScore) / 4;

        // Collect verdicts and reasoning (combining both services)
        const verdicts = {
            bias: {
                score: biasScore,
                verdict: biasScore < 0.3 ? "Low Bias" : biasScore < 0.7 ? "Moderate Bias" : "High Bias",
            },
            toxicity: {
                score: toxicityScore,
                verdict: toxicityScore < 0.2 ? "Low Toxicity" : toxicityScore < 0.5 ? "Moderate Toxicity" : "High Toxicity",
            },
            relevancy: {
                score: relevancyScore,
                verdict: relevancyScore >= 0.7 ? "Highly Relevant" : relevancyScore >= 0.4 ? "Moderately Relevant" : "Low Relevance",
            },
            faithfulness: {
                score: faithfulnessScore,
                verdict: faithfulnessScore >= 0.7 ? "Highly Faithful" : faithfulnessScore >= 0.4 ? "Moderately Faithful" : "Low Faithfulness",
            },
        };

        // Combine reasoning from both services into single consolidated statements
        const createBiasReasoning = () => {
            const geminiReason = geminiBiasResult.reason;
            const langFairReason = langFairResult.stereotype.reason;
            
            // Extract LangFair metrics for context
            const langFairMatch = langFairReason.match(/Association=([\d.]+)/);
            const associationScore = langFairMatch ? parseFloat(langFairMatch[1]) : 0;
            const fractionMatch = langFairReason.match(/Fraction=([\d.]+)/);
            const fractionScore = fractionMatch ? parseFloat(fractionMatch[1]) : 0;
            
            // Create a unified statement
            const langFairContext = associationScore === 0 && fractionScore === 0 
                ? "LangFair's stereotype analysis confirms no significant stereotype associations detected"
                : `LangFair's stereotype analysis indicates ${associationScore > 0.5 ? "high" : associationScore > 0.2 ? "moderate" : "low"} stereotype association (${associationScore.toFixed(3)})`;
            
            return `Bias Assessment: ${geminiReason}. ${langFairContext}.`;
        };

        const createToxicityReasoning = () => {
            const geminiReason = geminiToxicityResult.reason;
            const langFairReason = langFairResult.toxicity.reason;
            
            // Extract LangFair metrics
            const maxToxMatch = langFairReason.match(/Expected Max Toxicity=([\d.]+)/);
            const maxToxicity = maxToxMatch ? parseFloat(maxToxMatch[1]) : 0;
            const fractionMatch = langFairReason.match(/Toxic Fraction=([\d.]+)/);
            const toxicFraction = fractionMatch ? parseFloat(fractionMatch[1]) : 0;
            
            // Create unified statement
            const langFairContext = maxToxicity === 0 && toxicFraction === 0
                ? "LangFair's toxicity analysis confirms no toxic content detected"
                : `LangFair's toxicity analysis shows ${maxToxicity > 0.5 ? "high" : maxToxicity > 0.2 ? "moderate" : "low"} toxicity levels (max toxicity: ${maxToxicity.toFixed(3)})`;
            
            return `Toxicity Assessment: ${geminiReason}. ${langFairContext}.`;
        };

        const reasoning = [
            createBiasReasoning(),
            ``,
            createToxicityReasoning(),
            ``,
            `Relevancy Assessment: ${geminiRelevancyResult.reason}`,
            ``,
            `Faithfulness Assessment: ${geminiFaithfulnessResult.reason}`,
        ].join("\n");

        // Store evaluation in database using UPSERT to update existing entry if it exists
        const query = `INSERT INTO fairness_evaluations (
                project_id, user_id, version_id, category, question_text, user_response,
                bias_score, toxicity_score, relevancy_score, faithfulness_score,
                reasoning, verdicts, overall_score
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (project_id, user_id, category, question_text)
            DO UPDATE SET
                user_response = EXCLUDED.user_response,
                bias_score = EXCLUDED.bias_score,
                toxicity_score = EXCLUDED.toxicity_score,
                relevancy_score = EXCLUDED.relevancy_score,
                faithfulness_score = EXCLUDED.faithfulness_score,
                reasoning = EXCLUDED.reasoning,
                verdicts = EXCLUDED.verdicts,
                overall_score = EXCLUDED.overall_score,
                created_at = EXCLUDED.created_at
            RETURNING id, created_at`;

        const values = [
            projectId,
            userId,
            versionId,
            category,
            questionText,
            userResponse,
            biasScore,
            toxicityScore,
            relevancyScore,
            faithfulnessScore,
            reasoning,
            JSON.stringify(verdicts),
            overallScore,
        ];
        const insertResult = await pool.query(query, values);

        const evaluation = insertResult.rows[0];

        // Prepare individual service results
        const individualResults = {
            gemini: {
                service: "@mastra/evals (Gemini)",
                bias: {
                    score: parseFloat(geminiBiasScore.toFixed(3)),
                    reason: geminiBiasResult.reason,
                    verdict: geminiBiasScore < 0.3 ? "Low Bias" : geminiBiasScore < 0.7 ? "Moderate Bias" : "High Bias",
                },
                toxicity: {
                    score: parseFloat(geminiToxicityScore.toFixed(3)),
                    reason: geminiToxicityResult.reason,
                    verdict: geminiToxicityScore < 0.2 ? "Low Toxicity" : geminiToxicityScore < 0.5 ? "Moderate Toxicity" : "High Toxicity",
                },
                relevancy: {
                    score: parseFloat(relevancyScore.toFixed(3)),
                    reason: geminiRelevancyResult.reason,
                    verdict: relevancyScore >= 0.7 ? "Highly Relevant" : relevancyScore >= 0.4 ? "Moderately Relevant" : "Low Relevance",
                },
                faithfulness: {
                    score: parseFloat(faithfulnessScore.toFixed(3)),
                    reason: geminiFaithfulnessResult.reason,
                    verdict: faithfulnessScore >= 0.7 ? "Highly Faithful" : faithfulnessScore >= 0.4 ? "Moderately Faithful" : "Low Faithfulness",
                },
            },
            langfair: {
                service: "LangFair Microservice",
                bias: {
                    score: parseFloat(langFairBiasScore.toFixed(3)),
                    reason: langFairResult.stereotype.reason,
                    verdict: langFairBiasScore < 0.3 ? "Low Bias" : langFairBiasScore < 0.7 ? "Moderate Bias" : "High Bias",
                    note: "Based on stereotype association metric",
                },
                toxicity: {
                    score: parseFloat(langFairToxicityScore.toFixed(3)),
                    reason: langFairResult.toxicity.reason,
                    verdict: langFairToxicityScore < 0.2 ? "Low Toxicity" : langFairToxicityScore < 0.5 ? "Moderate Toxicity" : "High Toxicity",
                },
                relevancy: {
                    score: null,
                    reason: "LangFair does not provide relevancy metrics",
                    verdict: "N/A",
                },
                faithfulness: {
                    score: null,
                    reason: "LangFair does not provide faithfulness metrics",
                    verdict: "N/A",
                },
            },
        };

        // Return evaluation results with individual service breakdown
        res.json({
            success: true,
            evaluation: {
                id: evaluation.id,
                // Averaged scores (for backward compatibility)
                biasScore: parseFloat(biasScore.toFixed(3)),
                toxicityScore: parseFloat(toxicityScore.toFixed(3)),
                relevancyScore: parseFloat(relevancyScore.toFixed(3)),
                faithfulnessScore: parseFloat(faithfulnessScore.toFixed(3)),
                overallScore: parseFloat(overallScore.toFixed(3)),
                verdicts,
                reasoning,
                createdAt: evaluation.created_at,
                // Individual service results
                individualResults,
                // Summary of averaged results
                averagedResults: {
                    bias: {
                        score: parseFloat(biasScore.toFixed(3)),
                        sources: ["Gemini", "LangFair (Stereotype)"],
                        verdict: verdicts.bias.verdict,
                    },
                    toxicity: {
                        score: parseFloat(toxicityScore.toFixed(3)),
                        sources: ["Gemini", "LangFair"],
                        verdict: verdicts.toxicity.verdict,
                    },
                    relevancy: {
                        score: parseFloat(relevancyScore.toFixed(3)),
                        sources: ["Gemini only"],
                        verdict: verdicts.relevancy.verdict,
                    },
                    faithfulness: {
                        score: parseFloat(faithfulnessScore.toFixed(3)),
                        sources: ["Gemini only"],
                        verdict: verdicts.faithfulness.verdict,
                    },
                },
            },
        });
    } catch (error) {
        console.error("Error evaluating fairness:", error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        res.status(500).json({ error: "Failed to evaluate response"         });
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

        // Format evaluations
        const evaluations = result.rows.map(row => ({
            id: row.id,
            category: row.category,
            questionText: row.question_text,
            userResponse: row.user_response,
            biasScore: parseFloat(row.bias_score || 0),
            toxicityScore: parseFloat(row.toxicity_score || 0),
            relevancyScore: parseFloat(row.relevancy_score || 0),
            faithfulnessScore: parseFloat(row.faithfulness_score || 0),
            overallScore: parseFloat(row.overall_score || 0),
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

export default router;