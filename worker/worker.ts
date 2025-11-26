import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { fetchNextJob, processJob } from "../backend/src/services/evaluationJobQueue";
import { initializeDatabase } from "../backend/src/utils/database";

const workerEnvPath = path.resolve(__dirname, ".env");
const backendEnvPath = path.resolve(__dirname, "../backend/.env");

if (fs.existsSync(workerEnvPath)) {
    dotenv.config({ path: workerEnvPath });
} else if (fs.existsSync(backendEnvPath)) {
    dotenv.config({ path: backendEnvPath });
} else {
    dotenv.config();
}

const POLL_INTERVAL_MS = Number(process.env.EVALUATION_JOB_POLL_INTERVAL_MS || 20000);
const CONCURRENCY = Number(process.env.EVALUATION_WORKER_CONCURRENCY || 5);
const HEALTH_PORT = Number(process.env.HEALTH_PORT || 4001);

let isShuttingDown = false;
let activeJobs = 0;
let workerStartTime = Date.now();
let totalJobsProcessed = 0;

async function startWorker() {
    console.log("Starting evaluation worker...");

    try {
        await initializeDatabase();
        console.log("Database initialized for worker");
    } catch (error) {
        console.error("Failed to initialize database:", error);
        process.exit(1);
    }

    const app = express();
    app.get("/health", (req: Request, res: Response) => {
        const uptime = Math.floor((Date.now() - workerStartTime) / 1000);
        res.json({
            status: "ok",
            worker: "running",
            activeJobs,
            totalJobsProcessed,
            uptime: `${uptime}s`,
            concurrency: CONCURRENCY,
        });
    });

    app.listen(HEALTH_PORT, () => {
        console.log(`Health check server listening on port ${HEALTH_PORT}`);
    });

    loop();
}

async function loop() {
    if (isShuttingDown) {
        if (activeJobs === 0) {
            console.log("Worker shut down gracefully");
            process.exit(0);
        }
        return;
    }

    if (activeJobs >= CONCURRENCY) {
        setTimeout(loop, 1000);
        return;
    }

    try {
        const job = await fetchNextJob();
        if (job) {
            activeJobs++;
            processJob(job)
                .catch((err) => console.error(`Job ${job.id} failed unhandled:`, err))
                .finally(() => {
                    activeJobs--;
                    totalJobsProcessed++;
                });

            setImmediate(loop);
        } else {
            setTimeout(loop, POLL_INTERVAL_MS);
        }
    } catch (error) {
        console.error("Error fetching job:", error);
        setTimeout(loop, POLL_INTERVAL_MS);
    }
}

const shutdown = () => {
    console.log("Received shutdown signal, waiting for active jobs to complete...");
    isShuttingDown = true;
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

startWorker();
