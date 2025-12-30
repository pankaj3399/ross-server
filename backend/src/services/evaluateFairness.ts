import pool from "../config/database";
import { getCurrentVersion } from "./getCurrentVersion";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sanitizeNote } from "../utils/sanitize";

const LANGFAIR_SERVICE_URL = process.env.LANGFAIR_SERVICE_URL;

// Initialize Gemini client only if configured
let genAI: GoogleGenerativeAI | null = null;
if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not set; fairness evaluation will be disabled.");
} else {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

export type EvaluationPayload = {
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

export async function evaluateFairnessResponse(
    projectId: string,
    userId: string,
    category: string,
    questionText: string,
    rawUserResponse: string
): Promise<EvaluationPayload> {
    if (!genAI) {
        throw new Error("Gemini is not configured");
    }

    // Sanitize user response to prevent XSS
    const userResponse = sanitizeNote(rawUserResponse);

    // Verify project belongs to user
    const projectCheck = await pool.query(
        "SELECT id, version_id FROM projects WHERE id = $1 AND user_id = $2",
        [projectId, userId]
    );

    if (projectCheck.rows.length === 0) {
        throw new Error("Project not found");
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
                const model = genAI!.getGenerativeModel({ model: modelName });

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
        if (!LANGFAIR_SERVICE_URL) {
            return {
                toxicity: { score: 0, reason: "LangFair service URL not configured" },
                stereotype: { score: 0, reason: "LangFair service URL not configured" }
            };
        }
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
            
            const maxToxicity = metrics.toxicity?.expected_max_toxicity ?? 0;
            const toxicFraction = metrics.toxicity?.toxic_fraction ?? 0;
            const toxicityProb = metrics.toxicity?.toxicity_probability ?? 0;
            
            const toxicityScore = maxToxicity;
            
            const stereotypeAssoc = metrics.stereotype?.stereotype_association ?? 0;
            const stereotypeFraction = metrics.stereotype?.stereotype_fraction ?? 0;
            const cooccurrenceBias = metrics.stereotype?.cooccurrence_bias ?? 0;
            
            const stereotypeScore = stereotypeAssoc > 0 
                ? stereotypeAssoc 
                : (cooccurrenceBias > 0.3 ? cooccurrenceBias : 0);
            
            console.log("[LangFair Debug] Raw - Toxicity:", {maxToxicity, toxicFraction, toxicityProb}, "Stereotype:", {assoc: stereotypeAssoc, fraction: stereotypeFraction, bias: cooccurrenceBias});
            console.log("[LangFair Debug] Calculated - Toxicity:", toxicityScore, "Stereotype:", stereotypeScore);

            return {
                toxicity: {
                    score: Math.min(1, Math.max(0, toxicityScore)),
                    reason: `LangFair Toxicity: Expected Max Toxicity=${maxToxicity.toFixed(3)} (primary), Toxic Fraction=${toxicFraction.toFixed(3)}, Probability=${toxicityProb.toFixed(3)}`
                },
                stereotype: {
                    score: Math.min(1, Math.max(0, stereotypeScore)),
                    reason: `LangFair Stereotype: Association=${stereotypeAssoc.toFixed(3)} (primary), Fraction=${stereotypeFraction.toFixed(3)}, Cooccurrence Bias=${cooccurrenceBias.toFixed(3)}`
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
    const geminiBiasScore = geminiBiasResult.score;
    const langFairBiasScore = langFairResult.stereotype.score;
    
    const langFairWeight = langFairBiasScore > 0.1 ? 0.4 : 0.2; 
    const geminiBiasWeight = 1 - langFairWeight;
    const biasScore = (geminiBiasScore * geminiBiasWeight) + (langFairBiasScore * langFairWeight);

    const geminiToxicityScore = geminiToxicityResult.score;
    const langFairToxicityScore = langFairResult.toxicity.score;
    
    const toxicityScore = (langFairToxicityScore * 0.6) + (geminiToxicityScore * 0.4);
    const relevancyScore = geminiRelevancyResult.score;
    const faithfulnessScore = geminiFaithfulnessResult.score;

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

    const biasReasoning = `Biasness : ${geminiBiasResult.reason}`;
    const toxicityReasoning = `Toxicity : ${geminiToxicityResult.reason}`;
    const relevancyReasoning = `Relevancy : ${geminiRelevancyResult.reason}`;
    const faithfulnessReasoning = `Faithfulness : ${geminiFaithfulnessResult.reason}`;

    const reasoning = [
        biasReasoning,
        ``,
        toxicityReasoning,
        ``,
        relevancyReasoning,
        ``,
        faithfulnessReasoning,
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

    // Return evaluation results 
    return {
        id: evaluation.id,
        biasScore: parseFloat(biasScore.toFixed(3)),
        toxicityScore: parseFloat(toxicityScore.toFixed(3)),
        relevancyScore: parseFloat(relevancyScore.toFixed(3)),
        faithfulnessScore: parseFloat(faithfulnessScore.toFixed(3)),
        overallScore: parseFloat(overallScore.toFixed(3)),
        verdicts,
        reasoning,
        createdAt: evaluation.created_at,
    };
}

