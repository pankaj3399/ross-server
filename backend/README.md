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
JWT_SECRET=replace_with_secure_random_string_should_be_same_in_worker_and_backend_service
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:4000
STRIPE_SECRET_KEY=sk_test_***
STRIPE_WEBHOOK_SECRET=whsec_***
STRIPE_PRICE_ID_BASIC=price_basic_***
STRIPE_PRICE_ID_PRO=price_pro_***
GMAIL_USER=alerts@example.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
LANGFAIR_SERVICE_URL=https://eval-service.example.com
GEMINI_API_KEY=AIza...
```