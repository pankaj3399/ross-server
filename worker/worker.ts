import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { fetchNextJob, processJob } from "./services/evaluationJobQueue";
import { initializeDatabase } from "./utils/database";

dotenv.config();

const MIN_POLL_MS = Number(process.env.EVALUATION_JOB_MIN_POLL_INTERVAL_MS || 5000);
const MAX_POLL_MS = Number(process.env.EVALUATION_JOB_MAX_POLL_INTERVAL_MS || 600000);
const CONCURRENCY = Number(process.env.EVALUATION_WORKER_CONCURRENCY || 5);
const HEALTH_PORT = Number(process.env.HEALTH_PORT || 4001);
const STALE_JOB_CHECK_INTERVAL_MS = Number(process.env.STALE_JOB_CHECK_INTERVAL_MS || 3600000);

let isShuttingDown = false;
let activeJobs = 0;
let workerStartTime = Date.now();
let totalJobsProcessed = 0;
let currentPollInterval = MIN_POLL_MS;
let loopTimeoutId: NodeJS.Timeout | null = null;

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
    app.use(express.json());
    
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

    // POST /wake - Wake up the worker to check for jobs immediately
    app.post("/wake", (req: Request, res: Response) => {
        
        console.log("Waking up worker...");
        currentPollInterval = MIN_POLL_MS;
        
        if (loopTimeoutId) {
            clearTimeout(loopTimeoutId);
            loopTimeoutId = null;
        }
        
        if (!isShuttingDown) {
            setImmediate(loop);
        }
        
        res.json({ 
            status: "ok", 
            message: "Worker woken up",
            currentPollInterval: currentPollInterval,
            activeJobs 
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
        loopTimeoutId = setTimeout(loop, 1000);
        return;
    }

    try {
        const job = await fetchNextJob();
        if (job) {
            currentPollInterval = MIN_POLL_MS;
            activeJobs++;
            processJob(job)
                .catch((err) => console.error(`Job ${job.id} failed unhandled:`, err))
                .finally(() => {
                    activeJobs--;
                    totalJobsProcessed++;
                });

            setImmediate(loop);
        } else {
            loopTimeoutId = setTimeout(loop, currentPollInterval);
            currentPollInterval = Math.min(currentPollInterval * 2, MAX_POLL_MS);
        }
    } catch (error) {
        console.error("Error fetching job:", error);
        loopTimeoutId = setTimeout(loop, currentPollInterval);
        currentPollInterval = Math.min(currentPollInterval * 2, MAX_POLL_MS);
    }
}

const shutdown = () => {
    console.log("Received shutdown signal, waiting for active jobs to complete...");
    isShuttingDown = true;
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

startWorker();
