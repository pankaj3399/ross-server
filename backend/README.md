# Backend Service

TypeScript + Express API that powers MATUR.ai. Handles auth, subscriptions, AIMA data, background evaluations, and transactional email.

## Quick Start

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Copy your environment template (see **Env Example** below) into `backend/.env`.
3. Useful scripts:
   - `npm run dev` – start API with auto-reload
   - `npm run build && npm start` – compile and run compiled output
   - `npm run migrate` – run pending node-pg-migrate migrations
   - `npm run seed` – seed baseline AIMA data
   - `npm run db:init` – migrate + seed in one step
   - `npm run worker` – start the evaluation job worker

## Environment Variables

| Name | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PORT` | No | `4000` | HTTP port for the API server |
| `NODE_ENV` | No | `development` | Runtime mode toggles logging/config |
| `DATABASE_URL` | Yes | – | PostgreSQL connection string |
| `DATABASE_POOL_MAX` | No | `20` | Max connections in pg pool |
| `JWT_SECRET` | Yes | – | Signing key for auth tokens & worker service calls |
| `FRONTEND_URL` | Yes | – | Used for auth emails, Stripe redirects, portals |
| `STRIPE_SECRET_KEY` | Yes | – | Server-side Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Yes (if webhooks enabled) | – | Validates `/subscriptions/webhook` events |
| `STRIPE_PRICE_ID_BASIC` | Yes (if Basic plan sold) | – | Price ID mapped to `basic_premium` |
| `STRIPE_PRICE_ID_PRO` | Yes (if Pro plan sold) | – | Price ID mapped to `pro_premium` |
| `GMAIL_USER` | Yes (if email enabled) | – | Gmail address for Nodemailer transport |
| `GMAIL_APP_PASSWORD` | Yes (if email enabled) | – | App password paired with `GMAIL_USER` |
| `LANGFAIR_SERVICE_URL` | No | – | Explicit fairness eval endpoint override |
| `AI_EVAL_SERVICE_URL` | No | – | Fallback fairness evaluation service URL |
| `GEMINI_API_KEY` | No | – | Required to run Gemini-powered fairness evals |
| `API_URL` | No | `http://localhost:4000` | Base URL the worker uses to call back into the API |
| `VERCEL` / `SERVERLESS` | No | – | Auto-set by hosting providers for specific boot logic |
| `EVALUATION_JOB_POLL_INTERVAL_MS` | No | `20000` | Worker poll cadence for new jobs |
| `EVALUATION_WORKER_CONCURRENCY` | No | `5` | Number of concurrent evaluation jobs |
| `EVALUATION_MIN_REQUEST_INTERVAL_MS` | No | `20000` | Throttle between API evaluation requests |
| `EVALUATION_USER_API_MAX_ATTEMPTS` | No | `3` | Retry count for user-provided evaluation endpoints |
| `EVALUATION_USER_API_BACKOFF_BASE_MS` | No | `1000` | Initial exponential backoff delay |
| `EVALUATION_USER_API_BACKOFF_MAX_MS` | No | `30000` | Backoff ceiling between retries |
| `HEALTH_PORT` | No | `4001` | Port for worker health probe server |

## Env Example

```env
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@host:5432/matur_ai
DATABASE_POOL_MAX=20
JWT_SECRET=replace_with_secure_random_string
FRONTEND_URL=http://localhost:3000

STRIPE_SECRET_KEY=sk_test_***
STRIPE_WEBHOOK_SECRET=whsec_***
STRIPE_PRICE_ID_BASIC=price_basic_***
STRIPE_PRICE_ID_PRO=price_pro_***

GMAIL_USER=alerts@example.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

LANGFAIR_SERVICE_URL=https://eval-service.example.com
AI_EVAL_SERVICE_URL=
GEMINI_API_KEY=AIza...

API_URL=http://localhost:4000
EVALUATION_JOB_POLL_INTERVAL_MS=20000
EVALUATION_WORKER_CONCURRENCY=5
EVALUATION_MIN_REQUEST_INTERVAL_MS=20000
EVALUATION_USER_API_MAX_ATTEMPTS=3
EVALUATION_USER_API_BACKOFF_BASE_MS=1000
EVALUATION_USER_API_BACKOFF_MAX_MS=30000
HEALTH_PORT=4001
```

> Tip: keep `.env` out of source control. Use `dotenv` or your host's secret manager to inject these at runtime.

## Worker Guidance

- **Bootstrapping**: run `npm run worker` from `backend/`. The worker loads `.env` on startup, so make sure the API credentials, DB URL, and `API_URL` (public base of the API) are present before launching.
- **Runtime flow**: `src/worker.ts` initializes the DB connection, spins up a `/health` endpoint on `HEALTH_PORT`, then repeatedly calls `fetchNextJob()` / `processJob()` from `src/services/evaluationJobQueue.ts`. Concurrency and poll cadence are controlled via `EVALUATION_WORKER_CONCURRENCY` and `EVALUATION_JOB_POLL_INTERVAL_MS`.
- **Operating alongside the API**: keep one API instance running (for auth + webhooks) and one worker instance (for long-running evaluations). They can share the same code bundle but should be separate processes or containers.
- **Graceful shutdown**: send `SIGTERM`/`SIGINT`. The worker stops pulling new jobs, waits for `activeJobs` to drain, then exits. Orchestrators like Docker/Kubernetes should wire their stop signals accordingly.
- **Monitoring**: hit `http://<host>:HEALTH_PORT/health` to check `activeJobs`, `totalJobsProcessed`, uptime, and configured concurrency. Use this for probes/alerts.
- **Throughput tuning**: adjust the throttling env vars (`EVALUATION_MIN_REQUEST_INTERVAL_MS`, `EVALUATION_USER_API_*`, etc.) to respect upstream rate limits. Increase concurrency only if the downstream evaluation endpoints can handle the load.
- **Common pitfalls**:
  - Missing `JWT_SECRET`/`API_URL` → worker fails to post results back.
  - Incorrect DB URL → worker exits during `initializeDatabase()`.
  - Running worker without migrations → evaluation jobs can fail because required tables/seeds are absent. Always run `npm run db:init` first.
- **Local debugging**: set `DEBUG=1` (or `NODE_ENV=development`) to get verbose logs, then enqueue jobs via the API and watch `activeJobs`/console output to verify processing.


