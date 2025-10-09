import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aimaRouter from "./routes/aima";
import answersRouter from "./routes/answers";
import authRouter from "./routes/auth";
import projectsRouter from "./routes/projects";
import subscriptionsRouter from "./routes/subscriptions";
import adminRouter from "./routes/admin";
import { initializeDatabase, seedAIMAData } from "./utils/database";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "ross-ai-backend" });
});

// Routes
app.use("/auth", authRouter);
app.use("/projects", projectsRouter);
app.use("/subscriptions", subscriptionsRouter);
app.use("/admin", adminRouter);
app.use("/aima", aimaRouter);
app.use("/answers", answersRouter);

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    await seedAIMAData();

    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`🚀 Backend listening on http://localhost:${PORT}`);
      console.log(`📊 Database connected and initialized`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
