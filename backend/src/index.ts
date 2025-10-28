import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aimaRouter from "./routes/aima";
import answersRouter from "./routes/answers";
import authRouter from "./routes/auth";
import projectsRouter from "./routes/projects";
import subscriptionsRouter from "./routes/subscriptions";
import adminRouter from "./routes/admin";
import notesRouter from "./routes/notes";
import { initializeDatabase } from "./utils/database";
import subscriptionsWebhookRouter from "./routes/subscriptionsWebhook";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

app.use("/webhook", subscriptionsWebhookRouter);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "matur-ai-backend" });
});

// Routes
app.use("/auth", authRouter);
app.use("/projects", projectsRouter);
app.use("/subscriptions", subscriptionsRouter);
app.use("/admin", adminRouter);
app.use("/aima", aimaRouter);
app.use("/answers", answersRouter);
app.use("/notes", notesRouter);

// Initialize database
const initialize = async () => {
  try {
    // Skip database initialization since migration was already run
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// If running as a standalone server, start listening. In serverless, export app.
if (process.env.VERCEL || process.env.SERVERLESS) {
  // For serverless platforms, export the app without starting a listener
  // The platform will handle the request lifecycle
  initialize().catch((err) => {
    console.error("Initialization failed:", err);
  });
} else {
  // Local/standalone run
  initialize()
    .then(() => {
      app.listen(PORT, () => {
        // eslint-disable-next-line no-console
        console.log(`🚀 Backend listening on http://localhost:${PORT}`);
        console.log(`📊 Database connected and initialized`);
      });
    })
    .catch((err) => {
      console.error("Initialization failed:", err);
      process.exit(1);
    });
}

export default app;
