# JobPsych Payment API - Postman Testing Guide

## 🚀 Base URL

```txt
http://localhost:5000
```

## 📋 Prerequisites

1. Start your server: `npm run dev`
2. Ensure MongoDB is connected
3. Have valid Stripe keys in your `.env` file
4. Import this collection into Postman

---

## 🧪 API Endpoints Testing

### 1. **Health Check & Documentation**

#### GET /health

**Description**: Check server status

```http
GET http://localhost:5000/health
```

**Expected Response**:

```json
{
  "status": "OK",
  "service": "payment-service",
  "uptime": 123.456,
  "timestamp": "2025-08-05T10:30:00.000Z"
}
```

#### GET /

**Description**: API overview and endpoints

```http
GET http://localhost:5000/
```

#### GET /api

**Description**: API documentation

```http
GET http://localhost:5000/api
```

---

## 👥 User Management Endpoints

### 2. **Create User with Stripe Customer**

#### POST /api/users

**Description**: Creates a new user and corresponding Stripe customer

```http
POST http://localhost:5000/api/users
Content-Type: application/json
```

**Request Body**:

```json
{
  "email": "john.doe@example.com",
  "name": "John Doe"
}
```

**Expected Response**:

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user_id": "66b123456789abcdef123456",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "stripe_customer_id": "cus_P123456789",
    "plan_type": "free",
    "subscription_status": "inactive",
    "created_at": "2025-08-05T10:30:00.000Z"
  }
}
```

### 3. **Get User by ID**

#### GET /api/users/:id

**Description**: Retrieve user information by MongoDB ID

```http
GET http://localhost:5000/api/users/66b123456789abcdef123456
```

**Expected Response**:

```json
{
  "success": true,
  "data": {
    "user_id": "66b123456789abcdef123456",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "stripe_customer_id": "cus_P123456789",
    "plan_type": "free",
    "subscription_status": "inactive",
    "created_at": "2025-08-05T10:30:00.000Z",
    "updated_at": "2025-08-05T10:30:00.000Z"
  }
}
```

### 4. **Get User by Email**

#### GET /api/users/email/:email

**Description**: Retrieve user information by email

```http
GET http://localhost:5000/api/users/email/john.doe@example.com
```

### 5. **Update User**

#### PUT /api/users/:id

**Description**: Update user information

```http
PUT http://localhost:5000/api/users/66b123456789abcdef123456
Content-Type: application/json
```

**Request Body**:

```json
{
  "name": "John Smith",
  "plan_type": "pro",
  "subscription_status": "active"
}
```

---

## 💳 Subscription & Payment Endpoints

### 6. **Get Available Plans**

#### GET /api/

**Description**: Get all available subscription plans

```http
GET http://localhost:5000/api/
```

**Expected Response**:

```json
{
  "success": true,
  "data": {
    "plans": {
      "free": {
        "name": "JobPsych Free",
        "price": 0,
        "description": "Basic plan with limited features",
        "features": ["Upload up to 2 resumes", "Basic job matching"],
        "resumeLimit": 2
      },
      "pro": {
        "name": "JobPsych Pro",
        "price": 50,
        "description": "Professional plan with unlimited resume uploads",
        "features": ["Unlimited resume uploads", "Priority support"],
        "resumeLimit": -1
      }
    }
  }
}
```

### 7. **Subscribe to Free Plan**

#### POST /api/subscription (Free)

**Description**: Subscribe to free plan (no payment required)

```http
POST http://localhost:5000/api/subscription
Content-Type: application/json
```

**Request Body**:

```json
{
  "plan": "free",
  "customer_email": "jane.doe@example.com",
  "customer_name": "Jane Doe"
}
```

**Expected Response**:

```json
{
  "success": true,
  "data": {
    "plan": "free",
    "status": "active",
    "amount": 0,
    "currency": "usd",
    "created": 1722855000,
    "customer_email": "jane.doe@example.com",
    "description": "Basic plan with limited features",
    "resumeLimit": 2,
    "user_id": "66b123456789abcdef123457",
    "stripe_customer_id": "cus_P123456790"
  },
  "plan_details": {
    "name": "JobPsych Free",
    "price": 0,
    "description": "Basic plan with limited features",
    "features": ["Upload up to 2 resumes", "Basic job matching"]
  }
}
```

### 8. **Subscribe to Pro Plan**

#### POST /api/subscription (Pro)

**Description**: Create payment intent for Pro plan

```http
POST http://localhost:5000/api/subscription
Content-Type: application/json
```

**Request Body**:

```json
{
  "plan": "pro",
  "customer_email": "pro.user@example.com",
  "customer_name": "Pro User"
}
```

**Expected Response**:

```json
{
  "success": true,
  "data": {
    "id": "pi_3P123456789abcdef123456_secret_123",
    "client_secret": "pi_3P123456789abcdef123456_secret_123",
    "status": "requires_payment_method",
    "plan": "pro",
    "amount": 50,
    "currency": "usd",
    "created": 1722855000,
    "customer_email": "pro.user@example.com",
    "description": "JobPsych Pro - Professional plan with unlimited resume uploads",
    "user_id": "66b123456789abcdef123458",
    "stripe_customer_id": "cus_P123456791"
  },
  "plan_details": {
    "name": "JobPsych Pro",
    "price": 50,
    "description": "Professional plan with unlimited resume uploads",
    "features": ["Unlimited resume uploads", "Priority support"]
  }
}
```

### 9. **Get Payment Status**

#### GET /api/subscription/:id

**Description**: Check payment/subscription status by payment intent ID

```http
GET http://localhost:5000/api/subscription/pi_3P123456789abcdef123456
```

### 10. **Store Subscription Data**

#### POST /api/subscription/store

**Description**: Store complete subscription data in MongoDB

```http
POST http://localhost:5000/api/subscription/store
Content-Type: application/json
```

**Request Body**:

```json
{
  "user_id": "66b123456789abcdef123456",
  "user_email": "subscriber@example.com",
  "stripe_customer_id": "cus_P123456789",
  "stripe_subscription_id": "sub_1P123456789abcdef",
  "plan_type": "pro",
  "subscription_status": "active",
  "subscription_end": "2025-09-05T10:30:00.000Z",
  "amount": 50,
  "currency": "usd"
}
```

**Expected Response**:

```json
{
  "success": true,
  "message": "Subscription stored successfully",
  "data": {
    "subscription_id": "66b123456789abcdef123459",
    "user_id": "66b123456789abcdef123456",
    "user_email": "subscriber@example.com",
    "stripe_customer_id": "cus_P123456789",
    "stripe_subscription_id": "sub_1P123456789abcdef",
    "plan_type": "pro",
    "subscription_status": "active",
    "subscription_start": "2025-08-05T10:30:00.000Z",
    "subscription_end": "2025-09-05T10:30:00.000Z",
    "amount": 50,
    "currency": "usd",
    "created_at": "2025-08-05T10:30:00.000Z"
  }
}
```

---

## 🔗 Webhook Endpoint

### 11. **Stripe Webhook Handler**

#### POST /api/webhooks/stripe

**Description**: Handle Stripe webhook events (for Stripe to call)

```http
POST http://localhost:5000/api/webhooks/stripe
Content-Type: application/json
Stripe-Signature: t=1234567890,v1=signature_here
```

**Note**: This endpoint is called by Stripe automatically. For testing, use Stripe CLI:

```bash
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

---

## 🧪 Testing Workflow

### **Complete User Journey Testing**

#### Step 1: Create a User

```http
POST /api/users
{
  "email": "testuser@example.com",
  "name": "Test User"
}
```

**Save the `user_id` and `stripe_customer_id` from response**

#### Step 2: Subscribe to Free Plan

```http
POST /api/subscription
{
  "plan": "free",
  "customer_email": "testuser@example.com",
  "customer_name": "Test User"
}
```

#### Step 3: Upgrade to Pro Plan

```http
POST /api/subscription
{
  "plan": "pro",
  "customer_email": "testuser@example.com",
  "customer_name": "Test User"
}
```

**Save the `payment_intent_id` from response**

#### Step 4: Check Payment Status

```http
GET /api/subscription/{payment_intent_id}
```

#### Step 5: Store Subscription (after payment success)

```http
POST /api/subscription/store
{
  "user_id": "{user_id_from_step_1}",
  "user_email": "testuser@example.com",
  "stripe_customer_id": "{stripe_customer_id_from_step_1}",
  "stripe_subscription_id": "sub_test123",
  "plan_type": "pro",
  "subscription_status": "active",
  "subscription_end": "2025-09-05T10:30:00.000Z",
  "amount": 50,
  "currency": "usd"
}
```

#### Step 6: Verify User Update

```http
GET /api/users/{user_id_from_step_1}
```

---

## 📊 Mock Data Sets

### **User Test Data**

```json
{
  "email": "alice@example.com",
  "name": "Alice Johnson"
}
```

### **Subscription Test Data**

```json
{
  "user_id": "66b123456789abcdef123456",
  "user_email": "alice@example.com",
  "stripe_customer_id": "cus_P123456789",
  "stripe_subscription_id": "sub_1P123ABC456DEF789",
  "plan_type": "pro",
  "subscription_status": "active",
  "subscription_end": "2025-09-05T23:59:59.000Z",
  "amount": 50,
  "currency": "usd"
}
```

---

## ⚠️ Error Testing

### **Test Invalid Data**

#### Invalid Plan Type

```json
{
  "plan": "enterprise",
  "customer_email": "test@example.com",
  "customer_name": "Test User"
}
```

**Expected**: 400 Error

#### Missing Required Fields

```json
{
  "plan": "pro"
}
```

**Expected**: 400 Error

#### Invalid Email Format

```json
{
  "plan": "free",
  "customer_email": "invalid-email",
  "customer_name": "Test User"
}
```

**Expected**: 400 Error

#### Non-existent User ID

```http
GET /api/users/66b000000000000000000000
```

**Expected**: 404 Error

---

## 🔧 Environment Setup

### **Required .env Variables**

```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
MONGODB_URI=mongodb://localhost:27017/jobpsych
PORT=5000
NODE_ENV=development
```

### **Postman Environment Variables**

Create a Postman environment with:

- `base_url`: `http://localhost:5000`
- `user_id`: (set dynamically from responses)
- `stripe_customer_id`: (set dynamically from responses)
- `payment_intent_id`: (set dynamically from responses)

---

## 📈 Success Criteria

### **All Tests Should Pass When:**

1. ✅ Server starts without errors
2. ✅ MongoDB connection is established
3. ✅ All endpoints return expected status codes
4. ✅ User creation includes Stripe customer
5. ✅ Subscription data is stored correctly
6. ✅ Payment intents are created for paid plans
7. ✅ Free plans activate immediately
8. ✅ Error handling works for invalid data

---

## 🎯 Quick Test Collection for Postman

Import this JSON into Postman for quick testing:

```json
{
  "info": {
    "name": "JobPsych Payment API",
    "description": "Complete API testing collection"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/health"
      }
    },
    {
      "name": "Create User",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/users",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "raw": "{\"email\":\"test@example.com\",\"name\":\"Test User\"}"
        }
      }
    },
    {
      "name": "Subscribe to Pro",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/subscription",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "raw": "{\"plan\":\"pro\",\"customer_email\":\"test@example.com\",\"customer_name\":\"Test User\"}"
        }
      }
    }
  ]
}
```

## Happy Testing! 🚀

---

## 🐳 Run with Docker (Build & Run the Image)

This project includes a production-ready multi-stage Dockerfile and a docker-compose.yml to run the API and MongoDB together.

### Prerequisites

- Docker Desktop installed and running
- A valid `.env` file at the project root (contains Stripe keys, etc.)

### Option A — Build and run with Docker (single container)

1. Build the image

```powershell
docker build -t jobpsych-payment:latest -f dockerfile .
```

1. Run the container (connect to MongoDB on your host)

```powershell
docker run --name jobpsych-payment `
  --env-file .env `
  -e NODE_ENV=production `
  -e PORT=5000 `
  -e MONGODB_URI=mongodb://host.docker.internal:27017/jobpsych `
  -p 5000:5000 `
  jobpsych-payment:latest
```

Notes:

- `host.docker.internal` lets the container reach services on your Windows host.
- Change `MONGODB_URI` if your DB is elsewhere.

1. Verify it’s running

```powershell
curl http://localhost:5000/health
curl http://localhost:5000/api
```

1. Stop and clean up

```powershell
docker stop jobpsych-payment
docker rm jobpsych-payment
```

### Option B — Run API + MongoDB with Docker Compose

This repo contains `docker-compose.yml` that starts MongoDB and the API together.

1. Up (build + start)

```powershell
docker compose up --build
```

1. Verify

```powershell
curl http://localhost:5000/health
curl http://localhost:5000/api
```

1. Down (stop and remove)

```powershell
docker compose down
```

1. Clean volumes (remove Mongo data)

```powershell
docker compose down -v
```

1. Rebuild without cache (if deps changed)

```powershell
docker compose build --no-cache
```

Compose details:

- The API service reads `.env` automatically (via `env_file`).
- `MONGODB_URI` is set to `mongodb://mongo:27017/jobpsych` to talk to the `mongo` service.
- The API listens on `localhost:5000`.

### Logs & troubleshooting

- Tail logs (single container):

```powershell
docker logs -f jobpsych-payment
```

- Tail logs (compose):

```powershell
docker compose logs -f
```

- Common issues:
  - Mongo connection failure: ensure Mongo is reachable; adjust `MONGODB_URI` accordingly.
  - Missing env vars: confirm `.env` contains `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, (and `STRIPE_WEBHOOK_SECRET` if using webhooks).
  - Port conflicts: change host port mapping (e.g., `-p 5001:5000`).

### Webhooks (optional)

If you test Stripe webhooks locally, forward events to the container:

```powershell
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

Your API should log webhook handling output when events arrive.
