import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aimaRouter from "./routes/aima";
import answersRouter from "./routes/answers";
import authRouter from "./routes/auth";
import projectsRouter from "./routes/projects";
import subscriptionsRouter from "./routes/subscriptions";
import adminRouter from "./routes/admin";
import crcRouter from "./routes/crc";
import notesRouter from "./routes/notes";
import fairnessRouter from "./routes/fairness";
import publicRouter from "./routes/public";
import subscriptionsWebhookHandler from "./routes/subscriptionsWebhook";
import commentsRouter from "./routes/comments";
import auditLogsRouter from "./routes/auditLogs";
import chatRouter from "./routes/chat";
import notificationsRouter from "./routes/notifications";
import inventoryRouter from "./routes/inventory";
import wizardRouter from "./routes/wizard";
import vendorAssessmentRouter from "./routes/vendorAssessment";
import pool from "./config/database";
import { authenticateToken, checkRouteAccess } from "./middleware/auth";
import { serve } from "inngest/express";
import { inngest } from "./inngest/client";
import {
  evaluationJobProcessor,
  evaluateSingleResponse,
  evaluationAggregator,
  callUserApiForPrompt,
  userApiCallAggregator,
  hardDeleteStaleProjects,
  weeklyDigestCron,
  criticalRiskAlertHandler,
  vendorReassessmentCron,
  notificationQueueProcessor,
  riskTargetDateChecker,
  premiumFollowUpEmail,
} from "./inngest/functions";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  subscriptionsWebhookHandler
);

// Validate CORS configuration in production
const FRONTEND_URL = process.env.FRONTEND_URL;
if (process.env.NODE_ENV === 'production' && !FRONTEND_URL) {
  console.warn('FRONTEND_URL environment variable is recommended in production for explicit CORS configuration');
}

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;

  const configuredFrontends = (FRONTEND_URL || "")
    .split(",")
    .map((u) => u.trim().replace(/\/$/, ""))
    .filter(Boolean);

  const allowed = [
    ...configuredFrontends,
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "https://matur.ai",
    "https://www.matur.ai"
  ];

  const normalizedOrigin = origin.replace(/\/$/, "");
  if (allowed.some((url) => normalizedOrigin === url)) return true;

  // Strict match for verified team Vercel production and preview deployment hostnames
  return /^https:\/\/(?:matur-ai\.vercel\.app|ross-server\.vercel\.app|(?:ross-server|matur-ai)(?:-[a-z0-9]+)?-pankajs-projects-[a-z0-9]+\.vercel\.app)$/i.test(normalizedOrigin);
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Configure CORS with proper options for production
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));


// Specific route requiring larger payload - defined BEFORE global body parser
// This ensures that for this specific path, the 50mb limit applies and consumes the stream
app.use("/fairness/dataset-evaluate", authenticateToken, express.json({ limit: '50mb' }));

// Set a global body size limit for JSON (25MB)
app.use(express.json({ limit: '25mb' }));
app.use("/", publicRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "matur-ai-backend" });
}); 




app.use("/auth", authRouter);
app.use("/aima", authenticateToken, checkRouteAccess('/aima'), aimaRouter);
app.use("/projects", authenticateToken, checkRouteAccess('/projects'), projectsRouter);
app.use("/answers", authenticateToken, checkRouteAccess('/answers'), answersRouter);
app.use("/notes", authenticateToken, checkRouteAccess('/notes'), notesRouter);
app.use("/subscriptions", authenticateToken, checkRouteAccess('/subscriptions'), subscriptionsRouter);
app.use("/fairness", authenticateToken, checkRouteAccess('/fairness'), fairnessRouter);
app.use("/admin", adminRouter);
app.use("/crc", authenticateToken, checkRouteAccess('/crc'), crcRouter);
app.use("/projects", authenticateToken, checkRouteAccess('/projects'), commentsRouter);
app.use("/projects", authenticateToken, checkRouteAccess('/projects'), auditLogsRouter);
app.use("/chat", authenticateToken, checkRouteAccess('/chat'), chatRouter);
app.use("/notifications", notificationsRouter);
app.use("/inventory", authenticateToken, checkRouteAccess('/inventory'), inventoryRouter);
app.use("/wizard", authenticateToken, checkRouteAccess('/wizard'), wizardRouter);
app.use("/vendor-assessments", authenticateToken, checkRouteAccess('/inventory'), vendorAssessmentRouter);

// Inngest endpoint
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: [
      evaluationJobProcessor,
      evaluateSingleResponse,
      evaluationAggregator,
      callUserApiForPrompt,
      userApiCallAggregator,
      hardDeleteStaleProjects,
      weeklyDigestCron,
      criticalRiskAlertHandler,
      vendorReassessmentCron,
      notificationQueueProcessor,
      riskTargetDateChecker,
      premiumFollowUpEmail,
    ],
    signingKey: process.env.INNGEST_SIGNING_KEY,
  })
);

// Global Express error handler to guarantee CORS headers on all error responses (500, cold-start, unhandled errors)
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Express Error Handler]", err);
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  const status = typeof err.status === "number" && err.status >= 400 && err.status < 600 ? err.status : 500;
  const message = status >= 500 ? "Internal server error" : (err.message || "An error occurred");
  res.status(status).json({ error: message });
});

const initialize = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Database connection verified");
  } catch (error) {
    console.error("Database connection failed");
    console.error(error);
    process.exit(1);
  }
};


if (process.env.VERCEL || process.env.SERVERLESS) {
  initialize().catch((err) => {
    console.error("Initialization failed:", err);
  });
} else {
  initialize()
    .then(() => {
 
      app.listen(PORT, () => {
        console.log(`Backend listening on http://localhost:${PORT}`);
        console.log(`Database connected and initialized`);
      });
    })
    .catch((err) => {
      console.error("Initialization failed:", err);
      process.exit(1);
    });
}

export default app;
