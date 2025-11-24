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
import fairnessRouter from "./routes/fairness";
import publicRouter from "./routes/public";
import { seedAIMAData } from "./scripts/seeds/seedAIMA"
import subscriptionsWebhookRouter from "./routes/subscriptionsWebhook";
import { initializeDatabase } from "./utils/database";
import { authenticateToken, checkRouteAccess } from "./middleware/auth";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

app.use("/webhook", subscriptionsWebhookRouter);

app.use(express.json());
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

const initialize = async () => {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error("Failed to start server:", error);
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
