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
# INNGEST_EVENT_KEY=your_event_key_here  # Required for production (to send events)

# Evaluation Job Configuration
EVALUATION_MIN_REQUEST_INTERVAL_MS=20000
EVALUATION_USER_API_MAX_ATTEMPTS=3
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