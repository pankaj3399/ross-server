# MATUR.ai - AI Maturity Assessment Platform

A comprehensive SaaS platform for conducting AI maturity assessments using the OWASP AIMA (AI Maturity Assessment) framework. Built with Next.js, Node.js, PostgreSQL, and Stripe integration.

## 🚀 Features

- **Complete OWASP AIMA Framework**: 8 domains, 24 practices, 144 assessment questions
- **User Authentication**: JWT-based authentication with role management
- **Project Management**: Create and manage multiple assessment projects
- **Subscription Management**: Free and premium tiers with Stripe integration
- **Persistent Storage**: PostgreSQL database with Neon integration
- **Modern UI**: Beautiful, responsive interface with Tailwind CSS

## 🏗️ Architecture

### Backend (Node.js + Express + TypeScript)

- **Database**: PostgreSQL with Neon
- **Authentication**: JWT tokens with bcryptjs
- **Payments**: Stripe integration for subscriptions
- **API**: RESTful endpoints with proper error handling

### Frontend (Next.js + React + TypeScript)

- **UI Framework**: Tailwind CSS with ShadCN components
- **State Management**: React Context API
- **Routing**: Next.js App Router
- **Styling**: Modern, responsive design

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)
- Stripe account for payments
- Git

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ross-ai
```

### 2. Backend Setup

```bash
cd backend
npm install
cp env.example .env
```

### 3. Configure Environment Variables

Edit `.env` file with your credentials:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@hostname:port/database

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
PRICE_ID_BASIC=price_XXXXXXXXXXXXXXXXXXXXXX
PRICE_ID_PRO=price_XXXXXXXXXXXXXXXXXXXXXXXX

# Frontend URL (for Stripe redirects)
FRONTEND_URL=http://localhost:3000

# Server Configuration
PORT=4000
NODE_ENV=development
```

### 4.  Stripe Configuration

#### 1️⃣ Backend 

```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
PRICE_ID_BASIC=price_XXXXXXXXXXXXXXXXXXXXXX
PRICE_ID_PRO=price_XXXXXXXXXXXXXXXXXXXXXXXX
FRONTEND_URL=http://localhost:3000
```

#### 2️⃣ Frontend 

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_PRICE_ID_BASIC=price_XXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_PRICE_ID_PRO=price_XXXXXXXXXXXXXXXXXXXXXXXX
```

#### 3️⃣ Steps

1. **Create Products** in Stripe for Basic & Pro subscriptions.
2. **Copy Price IDs** into backend and frontend .env.
3. **Set up a webhook** in Stripe at:
    ```
    https://your-domain.com/subscriptions/webhook
    ```
   - Listen to:   
   `checkout.session.completed`, `customer.subscription.deleted`,    `invoice.payment_failed`.

   - Copy webhook secret to backend .env.

4. **Use Price IDs:**

    - Backend: create checkout sessions securely with secret key.

    - Frontend: initiate checkout using publishable key and Price IDs.

5. **Redirects**: use `FRONTEND_URL` for success/cancel URLs in checkout.

### 5. Frontend Setup

```bash
cd frontend
npm install
```

### 6. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🌐 API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info

### Projects

- `GET /projects` - Get user projects
- `POST /projects` - Create new project
- `GET /projects/:id` - Get project details
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### AIMA Assessment

- `GET /aima/domains` - Get all AIMA domains
- `GET /aima/domains/:domainId` - Get domain details
- `GET /aima/domains/:domainId/practices/:practiceId` - Get practice questions

### Assessment Answers

- `POST /answers` - Save assessment answers
- `GET /answers/:projectId` - Get project answers

### Subscriptions

- `POST /subscriptions/create-checkout-session` - Create Stripe checkout
- `POST /subscriptions/create-portal-session` - Create billing portal
- `GET /subscriptions/status` - Get subscription status
- `POST /subscriptions/prices` - Fetch Stripe prices
- `POST /webhook` - Stripe webhook handler

### Admin

- `POST /admin/reset-aima-data` - Reset AIMA data (development only)

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:4000/projects
```

## 📊 Database Schema

### Users

- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `password_hash` (VARCHAR)
- `name` (VARCHAR)
- `organization` (VARCHAR)
- `role` (VARCHAR) - USER, ADMIN, PREMIUM_USER
- `subscription_status` (VARCHAR) - free, premium
- `stripe_customer_id` (VARCHAR)
- `created_at`, `updated_at` (TIMESTAMP)

### Projects

- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `name` (VARCHAR)
- `description` (TEXT)
- `ai_system_type` (VARCHAR)
- `status` (VARCHAR) - not_started, in_progress, completed
- `created_at`, `updated_at` (TIMESTAMP)

### AIMA Framework

- `aima_domains` - 8 domains (Governance, Responsible AI, etc.)
- `aima_practices` - 24 practices across domains
- `aima_questions` - 144 questions (6 per practice)

### Assessment Answers

- `project_id` (UUID, Foreign Key)
- `domain_id`, `practice_id` (VARCHAR)
- `level`, `stream` (VARCHAR)
- `question_index` (INTEGER)
- `value` (NUMERIC) - Answer value (0.0-5.0)
- `created_at`, `updated_at` (TIMESTAMP)

## 💳 Stripe Integration & Configuration

This section provides a comprehensive guide to setting up Stripe payments, creating recurring products, and configuring webhooks for your MATUR.ai application.

### 🎯 **Customizable Pricing System**

**✅ Prices are fully customizable!** Your MATUR.ai application uses dynamic pricing that can be changed anytime without code modifications:

- **Real-time Price Fetching**: Prices are fetched directly from Stripe, not hardcoded
- **No Code Changes Required**: Update prices in Stripe Dashboard and they update automatically
- **Multiple Pricing Tiers**: Support for Basic, Pro, and additional custom tiers
- **Flexible Billing**: Monthly, yearly, or custom billing periods
- **Currency Support**: USD, EUR, GBP, CAD, and more
- **Promotional Pricing**: Discounts, coupons, and trial periods

**Current Default Pricing** (easily changeable):
- **Premium Basic**: $29/month
- **Premium Pro**: $49/month

### 🏪 Step 1: Create Stripe Account & Get API Keys

1. **Create Stripe Account**
   - Go to [stripe.com](https://stripe.com) and sign up
   - Complete account verification (email, phone, business details)
   - Switch to **Test mode** for development

2. **Get API Keys**
   - Go to [Dashboard → Developers → API Keys](https://dashboard.stripe.com/test/apikeys)
   - Copy your **Publishable key** (starts with `pk_test_`)
   - Copy your **Secret key** (starts with `sk_test_`)

### 🛍️ Step 2: Create Recurring Products & Prices

#### 2.1 Create Products

1. **Go to Products**: [Dashboard → Products](https://dashboard.stripe.com/test/products)

2. **Create Basic Premium Product**:
   ```
   Name: Premium Basic
   Description: Perfect for small teams - Everything you need to get started
   ```

3. **Create Pro Premium Product**:
   ```
   Name: Premium Pro  
   Description: For growing organizations - Advanced features and support
   ```

#### 2.2 Create Recurring Prices

1. **For Basic Premium Product**:
   - Click "Add pricing"
   - **Pricing model**: Standard pricing
   - **Price**: $29.00 USD
   - **Billing period**: Monthly
   - **Usage type**: Licensed (per seat)
   - Click "Save pricing"

2. **For Pro Premium Product**:
   - Click "Add pricing"
   - **Pricing model**: Standard pricing
   - **Price**: $49.00 USD
   - **Billing period**: Monthly
   - **Usage type**: Licensed (per seat)
   - Click "Save pricing"

3. **Copy Price IDs**:
   - Each price will have an ID like `price_1ABC123...`
   - Copy these IDs for your environment variables

### 🔗 Step 3: Configure Webhooks

#### 3.1 Create Webhook Endpoint

1. **Go to Webhooks**: [Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)

2. **Add Endpoint**:
   ```
   Endpoint URL: https://your-domain.com/webhook
   ```
   **Note**: For development, use ngrok: `https://your-ngrok-url.ngrok-free.dev/webhook`

3. **Select Events to Listen For**:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`

4. **Create Endpoint** and copy the **Signing secret** (starts with `whsec_`)

#### 3.2 Test Webhook Locally (Development)

1. **Install ngrok**:
   ```bash
   # Install ngrok
   npm install -g ngrok
   # or download from https://ngrok.com/download
   ```

2. **Start your backend server**:
   ```bash
   cd backend
   npm run dev  # Runs on port 4000
   ```

3. **Create ngrok tunnel**:
   ```bash
   ngrok http 4000
   ```

4. **Update webhook URL** in Stripe dashboard:
   ```
   https://your-ngrok-url.ngrok-free.dev/webhook
   ```

5. **Test webhook**:
   - Go to your webhook in Stripe dashboard
   - Click "Send test webhook"
   - Check your backend logs for webhook events

### ⚙️ Step 4: Environment Configuration

#### 4.1 Backend Environment Variables

Create/update `backend/.env`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRICE_ID_BASIC=price_your_basic_price_id_here
STRIPE_PRICE_ID_PRO=price_your_pro_price_id_here

# Frontend URL (for Stripe redirects)
FRONTEND_URL=http://localhost:3000

# Other configurations...
DATABASE_URL=postgresql://username:password@hostname:port/database
JWT_SECRET=your-super-secret-jwt-key-here
PORT=4000
NODE_ENV=development
```

#### 4.2 Frontend Environment Variables

Create/update `frontend/.env.local`:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
NEXT_PUBLIC_PRICE_ID_BASIC=price_your_basic_price_id_here
NEXT_PUBLIC_PRICE_ID_PRO=price_your_pro_price_id_here
NEXT_PUBLIC_API_URL=http://localhost:4000

# Other configurations...
```

### 🔄 Step 5: Subscription Flow Implementation

#### 5.1 Frontend Integration

The application includes a subscription modal that:

1. **Fetches real-time prices** from Stripe using your Price IDs
2. **Displays pricing plans** with features and benefits
3. **Handles checkout** by redirecting to Stripe Checkout
4. **Manages success/cancel** redirects

#### 5.2 Backend Webhook Handling

The webhook handler (`/webhook`) processes:

1. **`checkout.session.completed`**:
   - Updates user subscription status based on Price ID
   - Maps `STRIPE_PRICE_ID_BASIC` → `basic_premium`
   - Maps `STRIPE_PRICE_ID_PRO` → `pro_premium`

2. **`customer.subscription.deleted`**:
   - Sets user subscription status to `free`

3. **`invoice.payment_failed`**:
   - Sets user subscription status to `free`

### 🧪 Step 6: Testing Stripe Integration

#### 6.1 Test Cards (Test Mode)

Use these test card numbers:

```
# Successful payment
4242 4242 4242 4242

# Declined payment  
4000 0000 0000 0002

# Requires authentication
4000 0025 0000 3155
```

**Expiry**: Any future date (e.g., 12/25)  
**CVC**: Any 3 digits (e.g., 123)

#### 6.2 Test Subscription Flow

1. **Start both servers**:
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend  
   cd frontend && npm run dev
   
   # Terminal 3 - ngrok (for webhooks)
   ngrok http 4000
   ```

2. **Test the flow**:
   - Register/login to your application
   - Click "Upgrade to Premium" 
   - Select a plan and proceed to checkout
   - Use test card: `4242 4242 4242 4242`
   - Complete payment and verify redirect
   - Check user subscription status in database

#### 6.3 Verify Webhook Events

1. **Check Stripe Dashboard**:
   - Go to [Webhooks → Your endpoint](https://dashboard.stripe.com/test/webhooks)
   - View recent events and their status

2. **Check Backend Logs**:
   ```bash
   # Look for webhook logs
   Webhook received: checkout.session.completed
   Updated user subscription status to: basic_premium
   ```

### 🚀 Step 7: Production Deployment

#### 7.1 Switch to Live Mode

1. **In Stripe Dashboard**:
   - Toggle from "Test mode" to "Live mode"
   - Get live API keys
   - Create live products and prices
   - Set up live webhook endpoint

2. **Update Environment Variables**:
   ```env
   # Production Stripe Configuration
   STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret_here
   STRIPE_PRICE_ID_BASIC=price_your_live_basic_price_id_here
   STRIPE_PRICE_ID_PRO=price_your_live_pro_price_id_here
   ```

#### 7.2 Production Webhook

Update your webhook endpoint URL:
```
https://your-production-domain.com/webhook
```

### 🔧 Step 8: Troubleshooting

#### Common Issues:

1. **Webhook 404 Error**:
   - Ensure ngrok is pointing to port 4000 (backend), not 3000 (frontend)
   - Check webhook URL in Stripe dashboard
   - Verify backend server is running

2. **Price Fetching Fails**:
   - Verify Price IDs in environment variables
   - Check Stripe API key permissions
   - Ensure products are published in Stripe

3. **Subscription Status Not Updated**:
   - Check webhook secret in environment variables
   - Verify webhook events are being received
   - Check backend logs for webhook processing

4. **Checkout Session Creation Fails**:
   - Verify Stripe secret key
   - Check Price IDs exist and are active
   - Ensure FRONTEND_URL is correctly set

5. **Price Customization Issues**:
   - **To change prices**: Update in Stripe Dashboard → Products → Edit Pricing
   - **To add new tiers**: Create new products in Stripe, update environment variables
   - **Prices not updating**: Clear browser cache, restart application
   - **Currency changes**: Update in Stripe Dashboard, no code changes needed

### 📊 Step 9: Monitoring & Analytics

#### Stripe Dashboard Features:

1. **Payments**: Monitor successful/failed payments
2. **Customers**: View customer details and subscription status
3. **Subscriptions**: Track active/canceled subscriptions
4. **Webhooks**: Monitor webhook delivery and failures
5. **Logs**: View detailed API request logs

#### Application Monitoring:

1. **Database**: Check user subscription statuses
2. **Logs**: Monitor webhook processing
3. **Analytics**: Track conversion rates and churn

### 🔐 Step 10: Security Best Practices

1. **Never expose secret keys** in frontend code
2. **Use environment variables** for all sensitive data
3. **Verify webhook signatures** (already implemented)
4. **Use HTTPS** in production
5. **Regularly rotate** API keys
6. **Monitor failed webhook deliveries**

---

**Need Help?** Check the [Stripe Documentation](https://stripe.com/docs) or create an issue in this repository.

## 🧪 Testing

### Using Postman

1. Import the provided Postman collection
2. Set up environment variables:
   - `base_url`: http://localhost:4000
   - `auth_token`: (will be set after login)

### Manual Testing

```bash
# Register user
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User","organization":"Test Org"}'

# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get domains (no auth required)
curl http://localhost:4000/aima/domains

# Create project (requires auth)
curl -X POST http://localhost:4000/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"My AI Project","description":"Testing","aiSystemType":"Machine Learning"}'
```

## 🚀 Deployment

### Backend Deployment

1. Set up PostgreSQL database (Neon recommended)
2. Configure environment variables
3. Deploy to your preferred platform (Vercel, Railway, etc.)

### Frontend Deployment

1. Build the Next.js application
2. Deploy to Vercel, Netlify, or similar platform
3. Update `FRONTEND_URL` in backend environment

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support, email support@ross-ai.com or create an issue in the repository.

---

**MATUR.ai** - Empowering organizations to assess and improve their AI maturity with the OWASP AIMA framework.
