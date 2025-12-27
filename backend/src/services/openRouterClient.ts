/**
 * OpenRouter API Client
 * Handles communication with OpenRouter API
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export interface OpenRouterMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface OpenRouterRequest {
    model: string;
    messages: OpenRouterMessage[];
    temperature?: number;
}

export interface OpenRouterResponse {
    id: string;
    model: string;
    choices: Array<{
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export interface OpenRouterError {
    error: {
        message: string;
        type?: string;
        code?: string;
    };
}

/**
 * Call OpenRouter API with the specified model and messages
 */
export async function callOpenRouter(
    model: string,
    messages: OpenRouterMessage[],
    temperature: number = 0.3
): Promise<string> {
    if (!OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": process.env.OPENROUTER_REFERER || "https://matur.ai",
            "X-Title": process.env.OPENROUTER_TITLE || "MATUR.ai",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model,
            messages,
            temperature,
        }),
    });

    if (!response.ok) {
        const errorData: OpenRouterError = await response.json().catch(() => ({
            error: { message: `HTTP ${response.status}: ${response.statusText}` },
        }));

        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
        const statusCode = response.status;

        // Create error with status code for fallback logic
        const error: any = new Error(errorMessage);
        error.statusCode = statusCode;
        error.isRateLimit = statusCode === 429;
        error.isServerError = statusCode >= 500;
        throw error;
    }

    const data: OpenRouterResponse = await response.json();

    if (!data.choices || data.choices.length === 0 || !data.choices[0].message?.content) {
        throw new Error("No content in OpenRouter response");
    }

    return data.choices[0].message.content.trim();
}

