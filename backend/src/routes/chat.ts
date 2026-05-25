import { Router, Request, Response } from "express";
import { z } from "zod";
import { handleChatMessage, ChatMessage } from "../services/chatService";
import { isAnthropicConfigured } from "../services/anthropicClient";

const router = Router();

// ─── Validation ─────────────────────────────────────────────────────────────

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(40),
  controlId: z.string().uuid().optional(),
});

// ─── Rate Limiting ──────────────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per window

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return true;
  }

  return false;
}

// Periodically clean up stale rate limit entries (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60_000);

// ─── Routes ─────────────────────────────────────────────────────────────────

// POST /chat - Send a chat message
router.post("/", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if Anthropic is configured
    if (!isAnthropicConfigured()) {
      return res.status(503).json({
        error: "AI Copilot is temporarily unavailable. Please try again later.",
      });
    }

    // Rate limiting
    if (isRateLimited(user.id)) {
      return res.status(429).json({
        error: "You're sending messages too quickly. Please wait a moment before trying again.",
      });
    }

    // Validate request body
    const parsed = chatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return res.status(400).json({
        error: firstError?.message || "Invalid request",
      });
    }

    const { messages, controlId } = parsed.data;

    // Ensure the last message is from the user
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "user") {
      return res.status(400).json({
        error: "The last message must be from the user",
      });
    }

    // Call the chat service
    const reply = await handleChatMessage(
      messages as ChatMessage[],
      controlId
    );

    res.json({ reply });
  } catch (error: any) {
    console.error("[Chat] Error processing chat message:", error);

    // Handle specific Anthropic errors
    const statusCode = error?.status || error?.statusCode;
    if (statusCode === 429) {
      return res.status(429).json({
        error: "The AI service is currently busy. Please try again in a few seconds.",
      });
    }

    res.status(500).json({
      error: "Failed to process your message. Please try again.",
    });
  }
});

export default router;
