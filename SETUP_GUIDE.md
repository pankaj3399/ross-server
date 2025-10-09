# Ross AI Setup Guide

## Quick Start

### 1. Environment Setup

```bash
# Backend
cd backend
cp env.example .env
# Edit .env with your credentials

# Frontend
cd frontend
# No additional setup required
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 3. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. Test API

```bash
# Health check
curl http://localhost:4000/health

# Register user
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User","organization":"Test Org"}'

# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Required Environment Variables

### Database

- `DATABASE_URL`: PostgreSQL connection string (Neon recommended)

### Authentication

- `JWT_SECRET`: Long, random string for JWT signing

### Stripe (Optional for testing)

- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Webhook endpoint secret
- `FRONTEND_URL`: Frontend URL for redirects

## API Testing

### Using Postman

1. Import `ross-ai-api.postman_collection.json`
2. Set `base_url` variable to `http://localhost:4000`
3. Run "Login User" to get auth token
4. Test all endpoints

### Using curl

```bash
# Get auth token first
TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | \
  jq -r '.token')

# Use token for protected endpoints
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/projects
```

## Database Setup

The database schema is automatically created on first run. No manual setup required.

## Stripe Setup (Optional)

1. Create Stripe account
2. Get API keys from dashboard
3. Set up webhook endpoint: `https://yourdomain.com/subscriptions/webhook`
4. Configure events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check database server is running
- Ensure network connectivity

### Authentication Issues

- Verify `JWT_SECRET` is set
- Check token format: `Bearer <token>`
- Ensure token hasn't expired

### CORS Issues

- Backend CORS is configured for `http://localhost:3000`
- Update CORS settings for production

## Production Deployment

### Backend

1. Set up PostgreSQL database (Neon recommended)
2. Configure all environment variables
3. Deploy to your platform (Vercel, Railway, etc.)

### Frontend

1. Build: `npm run build`
2. Deploy to Vercel, Netlify, etc.
3. Update `FRONTEND_URL` in backend

## Support

- Documentation: See `API_DOCUMENTATION.md`
- Postman Collection: `ross-ai-api.postman_collection.json`
- Issues: Create GitHub issue
- Email: support@ross-ai.com
