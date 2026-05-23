import Anthropic from "@anthropic-ai/sdk";

// ─── Configuration ──────────────────────────────────────────────────────────
const DEFAULT_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";
const MODELS_TO_TRY = [DEFAULT_MODEL, "claude-3-5-sonnet-20241022", "claude-3-5-sonnet-latest"];
const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 2000;
const MAX_DELAY_MS = 30000;

// ─── Client Initialization ─────────────────────────────────────────────────
let anthropic: Anthropic | null = null;
if (process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
} else {
    console.warn("ANTHROPIC_API_KEY is not set; premium AI features (fairness evaluation, dataset analysis, security scan) will be disabled.");
}

export const isAnthropicConfigured = (): boolean => !!anthropic;

// ─── JSON Extraction Helper ────────────────────────────────────────────────
export function extractJsonFromResponse(text: string): string {
    let clean = text.trim();

    // 1. Try to find JSON inside markdown code blocks
    const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
        return match[1].trim();
    }

    // 2. If no code block, find the first '{' and last '}'
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return clean.substring(firstBrace, lastBrace + 1);
    }

    // 3. Try array format (for explanation responses)
    const firstBracket = clean.indexOf("[");
    const lastBracket = clean.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        return clean.substring(firstBracket, lastBracket + 1);
    }

    // 4. Fallback: return original
    return clean;
}

// ─── Core API Call ──────────────────────────────────────────────────────────

export interface ClaudeCallOptions {
    /** System prompt (Claude separates system from user messages) */
    systemPrompt?: string;
    /** User prompt content */
    userPrompt: string;
    /** Max tokens for response (default 1024) */
    maxTokens?: number;
    /** Optional label for logging */
    label?: string;
}

/**
 * Calls Claude with retry logic, model fallback, and rate limit handling.
 * Returns the raw text response from Claude.
 * Throws if all attempts fail.
 */
export async function callClaude(options: ClaudeCallOptions): Promise<string> {
    if (!anthropic) {
        throw new Error("Anthropic client is not configured (ANTHROPIC_API_KEY missing)");
    }

    const { systemPrompt, userPrompt, maxTokens = 1024, label = "Claude" } = options;
    let lastError: any = null;

    for (const modelName of MODELS_TO_TRY) {
        let attempt = 0;
        while (attempt <= MAX_RETRIES) {
            try {
                const message = await anthropic.messages.create({
                    model: modelName,
                    max_tokens: maxTokens,
                    ...(systemPrompt ? { system: systemPrompt } : {}),
                    messages: [
                        { role: "user", content: userPrompt },
                    ],
                });

                // Extract text from the response content blocks
                const textBlock = message.content.find((block) => block.type === "text");
                if (!textBlock || textBlock.type !== "text") {
                    throw new Error("No text content in Claude response");
                }

                return textBlock.text;
            } catch (error: any) {
                lastError = error;

                const errorMessage = error?.message || "";
                const statusCode = error?.status || error?.statusCode;

                console.error(`[${label}] Error with ${modelName} (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, {
                    message: errorMessage,
                    status: statusCode,
                    name: error?.name,
                });

                // Check for retryable errors
                const isRateLimit = statusCode === 429 || errorMessage.includes("429") || errorMessage.includes("rate_limit");
                const isOverloaded = statusCode === 529 || errorMessage.includes("overloaded");
                const isServerError = typeof statusCode === "number" && statusCode >= 500 && statusCode < 600;
                const isNetworkError = ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND"].includes(error?.code);
                const isRetryable = isRateLimit || isOverloaded || isServerError || isNetworkError;

                if (isRetryable) {
                    attempt++;
                    if (attempt <= MAX_RETRIES) {
                        const delayTime = Math.min(INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1), MAX_DELAY_MS);
                        console.warn(`[${label}] Retry ${attempt}/${MAX_RETRIES} for ${modelName} in ${delayTime}ms`);
                        await new Promise((resolve) => setTimeout(resolve, delayTime));
                        continue;
                    }
                }

                // Non-retryable error or max retries reached — try next model
                break;
            }
        }
    }

    throw lastError || new Error(`[${label}] All Claude models failed`);
}

/**
 * Calls Claude and parses the response as JSON.
 * Returns the parsed object.
 */
export async function callClaudeJSON<T = any>(options: ClaudeCallOptions): Promise<T> {
    const raw = await callClaude(options);
    const cleaned = extractJsonFromResponse(raw);
    return JSON.parse(cleaned) as T;
}
