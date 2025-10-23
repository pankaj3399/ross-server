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

### Backend 

# Stripe Secret Key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Price IDs for server-side operations
PRICE_ID_BASIC=price_XXXXXXXXXXXXXXXXXXXXXX
PRICE_ID_PRO=price_XXXXXXXXXXXXXXXXXXXXXXXX

### Frontend

# Stripe Publishable Key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Price IDs (safe to expose)
NEXT_PUBLIC_PRICE_ID_BASIC=price_XXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_PRICE_ID_PRO=price_XXXXXXXXXXXXXXXXXXXXXXXX

# Frontend URL (for Stripe redirects)
FRONTEND_URL=http://localhost:3000

# Server Configuration
PORT=4000
NODE_ENV=development
```

### 4. Frontend Setup

```bash
cd frontend
npm install
```

### 5. Start Development Servers

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
- `POST /subscriptions/webhook` - Stripe webhook handler

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

## 💳 Stripe Integration

### Setup Stripe

1. Create a Stripe account
2. Get your API keys from the Stripe dashboard
3. Set up webhook endpoints:
   - Endpoint URL: `https://yourdomain.com/subscriptions/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`

### Subscription Tiers

- **Free**: Basic assessment features
- **Premium**: Advanced features, multiple projects, detailed analytics

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
