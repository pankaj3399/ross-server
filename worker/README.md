# Evaluation Worker

Standalone runner that polls the evaluation job queue defined in `backend/` and executes jobs with configurable concurrency.

## Quick Start

1. `cd worker`
2. `npm install`
3. Copy `.env.example` to `.env` and fill in the worker-specific variables.
4. Start it:
   - `npm run dev` – hot-reloading via `ts-node-dev`
   - `npm start` – run once with `ts-node`

## Scripts

- `npm run dev`: respawns on code changes, ideal for local debugging.
- `npm start`: lighter wrapper around `ts-node` for production or long-running jobs. Wrap with a process manager (PM2, systemd, Docker, etc.) in real deployments.

## Env Example

```env
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@host:5432/matur_ai
JWT_SECRET=replace_with_secure_random_string_should_be_same_in_worker_and_backend_service
API_URL=http://localhost:4000
EVALUATION_JOB_POLL_INTERVAL_MS=20000
EVALUATION_WORKER_CONCURRENCY=5
EVALUATION_MIN_REQUEST_INTERVAL_MS=20000
EVALUATION_USER_API_MAX_ATTEMPTS=3
EVALUATION_USER_API_BACKOFF_BASE_MS=1000
EVALUATION_USER_API_BACKOFF_MAX_MS=30000
HEALTH_PORT=4001
```

## Operations

- Keep `backend/src` and migrations in sync with this worker—run `npm run db:init` in `backend/` before launching jobs.
- Runtime flow: `worker.ts` initializes the DB, exposes `/health`, then repeatedly runs `fetchNextJob()` / `processJob()` from the backend queue helpers.
- Run the API and worker as separate processes (or containers). The API handles auth & webhooks; the worker focuses on long-running evaluation jobs.
- For graceful shutdowns, send `SIGTERM`/`SIGINT`. The worker stops pulling new jobs, waits for active jobs to finish, then exits.
- Monitor `http://localhost:HEALTH_PORT/health` for `activeJobs`, `totalJobsProcessed`, uptime, and configured concurrency. Wire this into probes/alerts.
- Tune throughput by adjusting the poll interval, concurrency, and retry/backoff env vars. Increase load only if downstream evaluation endpoints can sustain it.
- For debugging, enable verbose logs via `DEBUG=1` (or `NODE_ENV=development`), enqueue jobs through the API, and watch the worker console for lifecycle events.

