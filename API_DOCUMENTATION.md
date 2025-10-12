# MATUR.ai API Documentation

## Overview

The MATUR.ai API provides endpoints for AI maturity assessment using the OWASP AIMA framework. All endpoints are RESTful and return JSON responses.

**Base URL**: `http://localhost:4000` (development)

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Endpoints

### Health Check

#### GET /health

Check if the API is running.

**Response:**

```json
{
  "ok": true,
  "service": "ross-ai-backend"
}
```

---

## Authentication Endpoints

### POST /auth/register

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "organization": "Acme Corp"
}
```

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "subscription_status": "free"
  },
  "token": "jwt_token_here"
}
```

### POST /auth/login

Authenticate user and get JWT token.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "subscription_status": "free"
  },
  "token": "jwt_token_here"
}
```

### GET /auth/me

Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "subscription_status": "free",
  "organization": "Acme Corp"
}
```

---

## AIMA Framework Endpoints

### GET /aima/domains

Get all AIMA domains (no authentication required).

**Response:**

```json
{
  "domains": [
    {
      "id": "governance",
      "title": "Governance",
      "description": "AI governance and organizational oversight",
      "practices": [
        "strategy_and_metrics",
        "policy_compliance",
        "education_awareness"
      ]
    }
  ]
}
```

### GET /aima/domains/:domainId

Get specific domain details.

**Response:**

```json
{
  "id": "governance",
  "title": "Governance",
  "description": "AI governance and organizational oversight",
  "practices": {
    "strategy_and_metrics": {
      "title": "Strategy & Metrics",
      "description": "Align AI initiatives with business strategy and measure effectiveness."
    }
  }
}
```

### GET /aima/domains/:domainId/practices/:practiceId

Get practice questions for assessment.

**Response:**

```json
{
  "domainId": "governance",
  "practiceId": "strategy_and_metrics",
  "title": "Strategy & Metrics",
  "description": "Align AI initiatives with business strategy and measure effectiveness.",
  "levels": {
    "1": {
      "A": ["Is there an initial AI strategy documented, even informally?"],
      "B": [
        "Are there any metrics informally tracked related to AI initiatives?"
      ]
    },
    "2": {
      "A": [
        "Has the AI strategy been formally defined and communicated to stakeholders?"
      ],
      "B": [
        "Are defined metrics regularly reviewed and communicated within the organization?"
      ]
    },
    "3": {
      "A": [
        "Is the AI strategy integrated into the organization's broader business strategy and iteratively refined?"
      ],
      "B": [
        "Are metrics systematically analyzed to drive improvements and decision-making processes?"
      ]
    }
  }
}
```

---

## Project Management Endpoints

### GET /projects

Get all projects for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
[
  {
    "id": "uuid",
    "name": "My AI Project",
    "description": "Project description",
    "ai_system_type": "Machine Learning",
    "status": "not_started",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

### POST /projects

Create a new project.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "name": "My AI Assessment",
  "description": "Comprehensive AI maturity assessment",
  "aiSystemType": "Machine Learning"
}
```

**Response:**

```json
{
  "project": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "My AI Assessment",
    "description": "Comprehensive AI maturity assessment",
    "ai_system_type": "Machine Learning",
    "status": "not_started",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### GET /projects/:id

Get specific project details.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "id": "uuid",
  "name": "My AI Assessment",
  "description": "Comprehensive AI maturity assessment",
  "ai_system_type": "Machine Learning",
  "status": "not_started",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### PUT /projects/:id

Update project details.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "aiSystemType": "Deep Learning"
}
```

**Response:**

```json
{
  "project": {
    "id": "uuid",
    "name": "Updated Project Name",
    "description": "Updated description",
    "ai_system_type": "Deep Learning",
    "status": "not_started",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### DELETE /projects/:id

Delete a project.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "message": "Project deleted successfully"
}
```

---

## Assessment Answers Endpoints

### POST /answers

Save assessment answers for a project.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "projectId": "uuid",
  "answers": [
    {
      "domainId": "governance",
      "practiceId": "strategy_and_metrics",
      "level": "1",
      "stream": "A",
      "questionIndex": 0,
      "value": 3.5
    }
  ]
}
```

**Response:**

```json
{
  "message": "Answers saved successfully",
  "savedCount": 1
}
```

### GET /answers/:projectId

Get all answers for a project.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
[
  {
    "domain_id": "governance",
    "practice_id": "strategy_and_metrics",
    "level": "1",
    "stream": "A",
    "question_index": 0,
    "value": 3.5,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

---

## Subscription Endpoints

### GET /subscriptions/status

Get current subscription status.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "subscription_status": "free",
  "hasStripeCustomer": false
}
```

### POST /subscriptions/create-checkout-session

Create Stripe checkout session for subscription upgrade.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "priceId": "price_1234567890"
}
```

**Response:**

```json
{
  "sessionId": "cs_test_1234567890",
  "url": "https://checkout.stripe.com/pay/cs_test_1234567890"
}
```

### POST /subscriptions/create-portal-session

Create Stripe billing portal session.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "url": "https://billing.stripe.com/session/1234567890"
}
```

### POST /subscriptions/webhook

Stripe webhook handler (for Stripe to call).

**Headers:** `Stripe-Signature: <signature>`

**Request Body:** Raw webhook payload from Stripe

**Response:**

```json
{
  "received": true
}
```

---

## Admin Endpoints

### POST /admin/reset-aima-data

Reset AIMA data (development only).

**Response:**

```json
{
  "message": "AIMA data cleared successfully"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "error": "Invalid request data"
}
```

### 401 Unauthorized

```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "error": "Access denied"
}
```

### 404 Not Found

```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented, but it's recommended for production use.

## CORS

The API supports CORS for frontend integration. All origins are currently allowed in development.

---

## Testing

Use the provided Postman collection to test all endpoints:

1. Import `ross-ai-api.postman_collection.json` into Postman
2. Set the `base_url` variable to your API URL
3. Run the "Login User" request to get an auth token
4. Use the token for authenticated requests

## Support

For API support, contact: support@matur.ai
