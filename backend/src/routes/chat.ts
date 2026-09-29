import { Router, Request, Response } from "express";
import { z } from "zod";
import { handleChatMessage, ChatMessage } from "../services/chatService";
import { isAnthropicConfigured } from "../services/anthropicClient";
import { getMembership } from "../services/projectMembershipService";

const router = Router();

// ─── Validation ─────────────────────────────────────────────────────────────

const USER_MESSAGE_MAX_CHARS = 20000;
const ASSISTANT_MESSAGE_MAX_CHARS = 40000;
const MAX_TOTAL_CHAT_CHARS = 100000;

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1, "Message content cannot be empty"),
}).superRefine((msg, ctx) => {
  if (msg.role === "user" && msg.content.length > USER_MESSAGE_MAX_CHARS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `User message content must be at most ${USER_MESSAGE_MAX_CHARS} characters`,
    });
  } else if (msg.role === "assistant" && msg.content.length > ASSISTANT_MESSAGE_MAX_CHARS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Assistant message content must be at most ${ASSISTANT_MESSAGE_MAX_CHARS} characters`,
    });
  }
});

const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(100),
  controlId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
}).superRefine((req, ctx) => {
  const totalLength = req.messages.reduce((sum, m) => sum + m.content.length, 0);
  if (totalLength > MAX_TOTAL_CHAT_CHARS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Total chat history exceeds character budget of ${MAX_TOTAL_CHAT_CHARS} characters`,
    });
  }
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
const rateLimitCleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60_000);
if (rateLimitCleanupInterval.unref) rateLimitCleanupInterval.unref();

// Daily limit for free tier users (10 messages per day)
const freeTierDailyLimitMap = new Map<string, number>();
const FREE_TIER_DAILY_LIMIT = 10;

function getFreeTierRemaining(userId: string): number {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const key = `${userId}:${today}`;
  const currentCount = freeTierDailyLimitMap.get(key) || 0;
  return Math.max(0, FREE_TIER_DAILY_LIMIT - currentCount);
}

function incrementFreeTierDailyLimit(userId: string): number {
  const today = new Date().toISOString().slice(0, 10);
  const key = `${userId}:${today}`;
  const currentCount = freeTierDailyLimitMap.get(key) || 0;
  freeTierDailyLimitMap.set(key, currentCount + 1);
  return Math.max(0, FREE_TIER_DAILY_LIMIT - (currentCount + 1));
}

// Periodically clean up entries from previous days (every hour)
const dailyLimitCleanupInterval = setInterval(() => {
  const today = new Date().toISOString().slice(0, 10);
  for (const key of freeTierDailyLimitMap.keys()) {
    if (!key.endsWith(today)) {
      freeTierDailyLimitMap.delete(key);
    }
  }
}, 60 * 60_000);
if (dailyLimitCleanupInterval.unref) dailyLimitCleanupInterval.unref();

// ─── Routes ─────────────────────────────────────────────────────────────────

// GET /chat/usage - Get remaining free messages
router.get("/usage", (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const isPaid = user.role === "ADMIN" || ["basic_premium", "pro_premium", "trial"].includes(user.subscription_status);
  if (isPaid) {
    return res.json({ unlimited: true, remaining: null, dailyLimit: null });
  }
  const today = new Date().toISOString().slice(0, 10);
  const key = `${user.id}:${today}`;
  const currentCount = freeTierDailyLimitMap.get(key) || 0;
  return res.json({
    unlimited: false,
    dailyLimit: FREE_TIER_DAILY_LIMIT,
    used: currentCount,
    remaining: Math.max(0, FREE_TIER_DAILY_LIMIT - currentCount),
  });
});

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

    // Rate limiting (per-minute spike prevention)
    if (isRateLimited(user.id)) {
      return res.status(429).json({
        error: "You're sending messages too quickly. Please wait a moment before trying again.",
      });
    }

    // Check free tier daily message limit before expensive work
    const isPaid = user.role === "ADMIN" || ["basic_premium", "pro_premium", "trial"].includes(user.subscription_status);
    if (!isPaid) {
      const remaining = getFreeTierRemaining(user.id);
      if (remaining <= 0) {
        return res.status(429).json({
          error: "You have reached your daily limit of 10 free messages with Mira. Upgrade your plan for unlimited messages.",
          limitReached: true,
          dailyLimit: FREE_TIER_DAILY_LIMIT,
          remaining: 0,
        });
      }
    }

    // Validate request body
    const parsed = chatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return res.status(400).json({
        error: firstError?.message || "Invalid request",
      });
    }

    const { messages, controlId, projectId } = parsed.data;

    // Ensure the last message is from the user
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "user") {
      return res.status(400).json({
        error: "The last message must be from the user",
      });
    }

    // Validate user message length (assistant responses can be long)
    if (lastMessage.content.length > 4000) {
      return res.status(400).json({
        error: "Message must be at most 4000 characters",
      });
    }

    // Verify project access if projectId is provided
    let verifiedProjectId: string | undefined = undefined;
    if (projectId) {
      const membership = await getMembership(projectId, user.id);
      if (membership) {
        verifiedProjectId = projectId;
      } else {
        console.warn(`[Chat] User ${user.id} requested chat with projectId ${projectId} but is not a member.`);
      }
    }

    // Call the chat service
    const reply = await handleChatMessage(
      messages as ChatMessage[],
      controlId,
      verifiedProjectId
    );

    // Charge free tier allowance only upon successful generation
    if (!isPaid) {
      const remainingAfterCharge = incrementFreeTierDailyLimit(user.id);
      res.setHeader("X-RateLimit-Remaining-Daily", remainingAfterCharge.toString());
    }

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
