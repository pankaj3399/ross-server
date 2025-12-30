# Backend Service

TypeScript + Express API that powers MATUR.ai. Handles auth, subscriptions, AIMA data, background evaluations, and transactional email.

## Quick Start

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Copy `backend/.env.example` to `backend/.env` and fill in the secrets.
3. Useful scripts:
   - `npm run dev` – start API with auto-reload
   - `npm run build && npm start` – compile and run compiled output
   - `npm run migrate` – run pending node-pg-migrate migrations
   - `npm run seed` – seed baseline AIMA data
   - `npm run db:init` – migrate + seed in one step

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
GEMINI_API_KEY=AIza...

# Inngest Configuration
# INNGEST_DEV=1  # For local development with Inngest Dev Server
# INNGEST_EVENT_KEY=evt_***  # Required for production (to send events)
# INNGEST_SIGNING_KEY=signkey-prod-***  # Required for production (to verify requests)

# Evaluation Job Configuration
EVALUATION_MIN_REQUEST_INTERVAL_MS=20000
```

## Inngest Dev Server Setup (Local Development)

To run Inngest functions locally, you need to start the Inngest dev server:

### Option 1: Using npx (Recommended)

1. **Set the environment variable** in your `backend/.env`:
   ```env
   INNGEST_DEV=1
   ```

2. **Start the Inngest dev server** in a separate terminal:
   ```bash
   npx inngest-cli@latest dev -u http://localhost:4000/api/inngest
   ```
   
   Or using the long form:
   ```bash
   npx inngest-cli@latest dev --sdk-url http://localhost:4000/api/inngest
   ```
   
   This will:
   - Start the Inngest dev server on `http://localhost:8288`
   - Connect to your backend at `http://localhost:4000/api/inngest`
   - Automatically discover your Inngest functions
   - Provide a UI at `http://localhost:8288` to view and test events
   
   **Important:** Make sure your backend server is running before starting the dev server, or the dev server won't be able to discover functions.

3. **Start your backend server** in another terminal:
   ```bash
   cd backend
   npm run dev
   ```

### Option 2: Install Inngest CLI globally

1. **Install the CLI globally**:
   ```bash
   npm install -g inngest-cli
   ```

2. **Set the environment variable** in your `backend/.env`:
   ```env
   INNGEST_DEV=1
   ```

3. **Start the dev server**:
   ```bash
   inngest dev -u http://localhost:4000/api/inngest
   ```
   
   Or using the long form:
   ```bash
   inngest dev --sdk-url http://localhost:4000/api/inngest
   ```

4. **Start your backend server** in another terminal:
   ```bash
   cd backend
   npm run dev
   ```

### Important Notes

- **Start your backend server FIRST**, then start the Inngest dev server
- The dev server listens on `http://localhost:8288` by default
- Your backend's Inngest endpoint should be accessible at `http://localhost:4000/api/inngest`
- The dev server needs the `-u` or `--sdk-url` flag to know where to find your backend functions
- If the dev server is not running, the backend will log a warning but continue to function (jobs will be created in the database but won't be processed until Inngest is available)

### Troubleshooting

- **Connection refused error**: Make sure the Inngest dev server is running before starting your backend
- **Functions not appearing**: Ensure your backend server is running and the `/api/inngest` endpoint is accessible
- **Port conflicts**: If port 8288 is in use, the Inngest CLI will automatically use the next available port

## Inngest Production Setup

### Prerequisites

1. **Create an Inngest account**: Sign up at [inngest.com](https://www.inngest.com)

2. **Create a new app** in the Inngest dashboard

### Required Environment Variables

Production requires **both** of the following environment variables:

1. **INNGEST_EVENT_KEY** (starts with `evt_`):
   - Location: Inngest Dashboard → Your App → Settings → **Keys**
   - Used for: Sending events to Inngest Cloud
   - Copy the **Event Key** value

2. **INNGEST_SIGNING_KEY** (starts with `signkey-prod-`):
   - Location: Inngest Dashboard → Your App → Settings → **Keys**
   - Used for: Verifying requests from Inngest Cloud
   - Copy the **Signing Key** value

3. **Set both variables** in your Vercel project:
   ```env
   INNGEST_EVENT_KEY=evt_***
   INNGEST_SIGNING_KEY=signkey-prod-***
   ```

**Critical**: Do NOT set `INNGEST_DEV=1` in production. This variable should be unset or removed entirely.

### Endpoint Configuration

1. **Production Endpoint URL**:
   - Format: `https://<your-vercel-app>.vercel.app/api/inngest`
   - Example: `https://ross-server-backend.vercel.app/api/inngest`

2. **Endpoint Requirements**:
   - The `/api/inngest` endpoint **must** be publicly accessible
   - The endpoint **must NOT** be behind authentication middleware
   - Ensure the endpoint is reachable from the internet (not behind a VPN or firewall)

### App Sync in Inngest Dashboard

1. **Configure App URL**:
   - Go to Inngest Dashboard → Your App → Settings → **Sync**
   - Set **App URL** to: `https://<your-vercel-app>.vercel.app/api/inngest`

2. **Manually Sync**:
   - Click **"Sync"** or **"Sync App"** button in the Inngest dashboard
   - Wait for the sync to complete (may take a few seconds)
   - Verify that your functions appear in the dashboard

3. **Verify Function Discovery**:
   - After syncing, check the **Functions** tab in the Inngest dashboard
   - You should see your `evaluationJobProcessor` function listed

### Deployment Steps

1. **Deploy to Vercel** with both environment variables set:
   - `INNGEST_EVENT_KEY`
   - `INNGEST_SIGNING_KEY`

2. **Verify deployment**:
   - Ensure your backend is deployed and accessible
   - Test the endpoint: `curl https://<your-vercel-app>.vercel.app/api/inngest`

3. **Sync in Inngest Dashboard** (as described above)

### Signing Key Warnings

- **Local/ngrok development**: Signing warnings are expected and can be ignored when using `INNGEST_DEV=1`
- **Production**: Signing warnings should **not** appear. If you see signing warnings in production:
  - Verify `INNGEST_SIGNING_KEY` is correctly set in Vercel
  - Ensure the signing key matches the one in your Inngest dashboard
  - Check that the key starts with `signkey-prod-`

## Stripe Webhook Configuration

### Setup

1. **Create webhook endpoint in Stripe Dashboard**: [Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
   - **Endpoint URL**: `https://your-domain.com/webhook` (or use ngrok for local: `https://your-ngrok-url.ngrok-free.dev/webhook`)

2. **Subscribe to these events**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

3. **Copy the webhook signing secret** (starts with `whsec_`) and add to `backend/.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_***
   ```

### Local Testing

Use ngrok to expose your local server:
```bash
ngrok http 4000
```
Then update the webhook URL in Stripe dashboard with the ngrok HTTPS URL.