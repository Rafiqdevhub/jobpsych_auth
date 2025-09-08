# JobPsych Payment & Subscription API Documentation

## Overview

JobPsych Payment & Subscription API is a modern RESTful service for managing user authentication, subscription plans, payments, and Stripe integration. It supports direct user registration (candidates/recruiters), JWT-based authentication with refresh tokens, Free, Pro, and Premium plans, with secure MongoDB storage for users and subscriptions.

## Features

- 🔐 **Direct User Registration** - Register as candidate or recruiter with password complexity
- 🔑 **JWT Authentication** - Secure token-based authentication with refresh tokens
- 🆓 **Free Plan**: Up to 2 resume uploads
- 💼 **Pro Plan**: $50/month, unlimited resume uploads
- 💎 **Premium Plan**: Contact for pricing and access
- 💳 **Stripe-powered payment processing**
- 📦 **MongoDB subscription storage**
- 🔒 **Input validation & error handling**
- 🌐 **CORS support for frontend integration**
- ⚡ **Streamlined endpoints for easy integration**

## 🚀 Authentication System

### User Registration & Login

The API now includes a complete authentication system supporting:

- **Direct Registration**: Users can register with name, email, password, and user type (candidate/recruiter)
- **Password Complexity**: Minimum 8 characters with uppercase, lowercase, numbers, and special characters
- **JWT Tokens**: Access tokens (15min) and refresh tokens (7 days) for session management
- **User Types**: Support for candidates and recruiters with different feature access
- **Secure Storage**: Passwords hashed with bcrypt, tokens stored securely

### Authentication Endpoints

#### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "user_type": "candidate"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64f...",
      "name": "John Doe",
      "email": "john@example.com",
      "user_type": "candidate",
      "plan_type": "free",
      "subscription_status": "inactive"
    },
    "tokens": {
      "access_token": "eyJ...",
      "refresh_token": "eyJ..."
    }
  }
}
```

#### Login User

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJ..."
}
```

#### Verify Token

```http
GET /api/auth/verify
Authorization: Bearer <access_token>
```

### Password Requirements

Passwords must meet these complexity requirements:

- ✅ Minimum 8 characters
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)
- ✅ At least one special character (!@#$%^&\*()\_+-=[]{}|;:,.<>?)

### User Types

- **Candidate**: Access to job search, resume uploads (limited by plan)
- **Recruiter**: Access to candidate database, job posting, advanced features

## � Complete API Endpoints

### Base URL: `http://localhost:5000`

#### Authentication Endpoints

| Method | Endpoint             | Description           | Auth Required |
| ------ | -------------------- | --------------------- | ------------- |
| POST   | `/api/auth/register` | Register new user     | No            |
| POST   | `/api/auth/login`    | User login            | No            |
| POST   | `/api/auth/refresh`  | Refresh access token  | No            |
| GET    | `/api/auth/verify`   | Verify token validity | Yes           |

#### User Management Endpoints

| Method | Endpoint                  | Description       | Auth Required |
| ------ | ------------------------- | ----------------- | ------------- |
| GET    | `/api/users/:id`          | Get user by ID    | Yes           |
| GET    | `/api/users/email/:email` | Get user by email | Yes           |
| PUT    | `/api/users/:id`          | Update user       | Yes           |

#### Payment & Subscription Endpoints

| Method | Endpoint                  | Description              | Auth Required |
| ------ | ------------------------- | ------------------------ | ------------- |
| GET    | `/api/plans`              | Get available plans      | No            |
| POST   | `/api/subscription`       | Create subscription      | No            |
| GET    | `/api/subscription/:id`   | Get subscription status  | No            |
| POST   | `/api/subscription/store` | Store subscription in DB | No            |
| GET    | `/health`                 | Health check             | No            |
| GET    | `/api`                    | API documentation        | No            |

### Authentication Flow

1. **Registration**: User registers with name, email, password, user_type
2. **Login**: User receives access_token and refresh_token
3. **Access**: Use access_token in Authorization header for protected routes
4. **Refresh**: Use refresh_token to get new access_token when expired

### 1. Get Available Plans

```http
GET /api/plans
```

**Response:**

```json
{
  "success": true,
  "data": {
    "plans": {
      "pro": {
        "name": "JobPsych Pro",
        "price": 29.99,
        "description": "Professional plan with advanced features",
        "features": [
          "Advanced job matching",
          "Detailed personality insights",
          "Career recommendations",
          "Priority support"
        ]
      },
      "premium": {
        "name": "JobPsych Premium",
        "price": 49.99,
        "description": "Premium plan with all features",
        "features": [
          "All Pro features",
          "Expert career coaching",
          "Custom assessment reports",
          "1-on-1 consultation",
          "Premium support"
        ]
      }
    },
    "currency": "usd",
    "supported_payment_methods": ["card"],
    "publishable_key": "pk_test_..."
  }
}
```

### 1. API Documentation & Plans

```http
GET /api
```

Returns API documentation, available plans, and endpoint descriptions.

### 2. Get Available Plans

```http
GET /api/
```

Returns Free, Pro, and Premium plan details, pricing, and features.

### 3. Subscribe to Free or Pro Plan

```http
POST /api/subscription
Content-Type: application/json
```

**Request Body:**

```json
{
  "plan": "free" | "pro",
  "customer_email": "user@example.com",
  "customer_name": "John Doe"
}
```

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "plan": "pro",
    "status": "active",
    "amount": 50,
    "currency": "usd",
    "customer_email": "user@example.com",
    "description": "Professional plan with unlimited resume uploads",
    "resumeLimit": -1
  },
  "plan_details": {
    "name": "JobPsych Pro",
    "price": 50,
    "features": ["Unlimited resume uploads", "Priority support", ...]
  }
}
```

### 4. Get Subscription/Payment Status

```http
GET /api/subscription/:id
```

Returns payment/subscription status by Stripe payment intent ID.

### 5. Store Subscription Data in MongoDB

```http
POST /api/subscription/store
Content-Type: application/json
```

**Request Body:**

```json
{
  "user_email": "user@example.com",
  "user_id": "abc123",
  "stripe_customer_id": "cus_123",
  "stripe_subscription_id": "sub_456",
  "subscription_status": "active",
  "subscription_end": "2025-12-31T23:59:59.000Z"
}
```

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "user_email": "user@example.com",
    "user_id": "abc123",
    "stripe_customer_id": "cus_123",
    "stripe_subscription_id": "sub_456",
    "subscription_status": "active",
    "subscription_end": "2025-12-31T23:59:59.000Z"
  }
}
```

### 6. Health Check

```http
GET /health
```

Returns service status and uptime.

## Error Handling

All errors return structured JSON responses with clear messages and details.

**Validation Error Example:**

```json
{
  "error": "Validation Error",
  "message": "Plan must be either 'free' or 'pro'",
  "valid_plans": ["free", "pro"]
}
```

**Not Found Example:**

```json
{
  "error": "Not Found",
  "message": "Route /api/invalid not found",
  "available_routes": [
    "GET /api - API documentation",
    "GET /api/ - Available plans",
    "POST /api/subscription - Subscribe to plan",
    "GET /api/subscription/:id - Payment status",
    "POST /api/subscription/store - Store subscription",
    "GET /health - Health check"
  ]
}
```

## Frontend Integration Example

```javascript
// Subscribe to a plan
const response = await fetch("http://localhost:5000/api/subscription", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    plan: "pro",
    customer_email: "user@example.com",
    customer_name: "John Doe",
  }),
});
const data = await response.json();
if (data.success) {
  // Use Stripe client_secret for payment
}
```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/jobpsych

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Production Environment Variables

For production deployment, use strong, unique secrets:

```env
JWT_SECRET=your-production-jwt-secret-key-minimum-32-characters
JWT_REFRESH_SECRET=your-production-refresh-secret-key-minimum-32-characters
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
MONGODB_URI=mongodb+srv://...
NODE_ENV=production
```

## Project Structure

```
src/
├── controllers/
│   ├── authController.ts       # Authentication logic (register, login, tokens)
│   ├── userController.ts       # User management operations
│   ├── planPaymentController.ts # Payment logic for subscription plans
│   └── subscriptionStoreController.ts # MongoDB subscription storage
├── middleware/
│   ├── auth.ts                 # JWT authentication middleware
│   ├── planValidation.ts       # Request validation for payments
│   └── errorHandler.ts         # Async error handler
├── models/
│   ├── user.ts                 # User schema with auth fields
│   └── subscription.ts         # Subscription schema/model
├── routes/
│   ├── authRoutes.ts           # Authentication endpoints
│   ├── userRoutes.ts           # User management routes
│   └── planRoutes.ts           # Subscription/payment routes
├── types/
│   ├── auth.ts                 # Authentication TypeScript types
│   └── payment.ts              # Payment TypeScript types
├── utils/
│   └── auth.ts                 # Authentication utilities (hashing, JWT)
├── config/
│   ├── stripe.ts               # Stripe configuration
│   └── mongodb.ts              # MongoDB connection
└── index.ts                    # Main Express server file
```

### Key Authentication Files

- **`src/models/user.ts`** - User schema with password, user_type, refresh_token
- **`src/controllers/authController.ts`** - Registration, login, token management
- **`src/middleware/auth.ts`** - JWT verification middleware for protected routes
- **`src/utils/auth.ts`** - Password hashing, JWT generation/verification
- **`src/routes/authRoutes.ts`** - Authentication API endpoints

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI, JWT secrets, and Stripe keys
   ```

3. **Start development server:**

   ```bash
   npm run dev
   ```

4. **Test authentication endpoints:**

   ```bash
   # Register a new user
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "John Doe",
       "email": "john@example.com",
       "password": "SecurePass123!",
       "user_type": "candidate"
     }'

   # Login
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "john@example.com",
       "password": "SecurePass123!"
     }'
   ```

5. **Test payment endpoints:**
   ```bash
   node test-payment.js
   ```

---

**JobPsych Payment & Subscription API is production-ready for Free, Pro, and Premium plans with Stripe and MongoDB integration!**

### 3. Get Payment Status

```http
GET /api/status/:payment_id
```

**Example:**

```http
GET /api/status/pi_3RgjWOBD8fyBOgMZ1TrI3hjG
```

## Error Handling

### Validation Errors (400)

```json
{
  "error": "Validation Error",
  "message": "Plan must be either 'pro' or 'premium'",
  "valid_plans": ["pro", "premium"]
}
```

### Missing JSON Body (400)

```json
{
  "error": "Validation Error",
  "message": "Request body is missing or invalid. Make sure to send JSON data with Content-Type: application/json",
  "received_body": null,
  "content_type": null
}
```

### Not Found (404)

```json
{
  "error": "Not Found",
  "message": "Route /api/invalid not found",
  "available_routes": [
    "GET /api - API documentation",
    "GET /api/plans - Available plans",
    "POST /api/pay - Create payment",
    "GET /api/status/:id - Payment status"
  ]
}
```

## Frontend Integration

### JavaScript/TypeScript Example

```javascript
// Get available plans
const plansResponse = await fetch("http://localhost:5000/api/plans");
const plansData = await plansResponse.json();

// Create payment
const paymentResponse = await fetch("http://localhost:5000/api/pay", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    plan: "pro",
    customer_email: "user@example.com",
    customer_name: "John Doe",
  }),
});

const paymentData = await paymentResponse.json();

if (paymentData.success) {
  // Use the client_secret with Stripe.js to complete payment
  const { client_secret } = paymentData.data;
  // ... Stripe frontend integration
}
```

### React Example

```jsx
const handlePayment = async (plan) => {
  try {
    const response = await fetch("/api/pay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan,
        customer_email: userEmail,
        customer_name: userName,
      }),
    });

    const data = await response.json();

    if (data.success) {
      // Redirect to Stripe Checkout or use Elements
      const { client_secret } = data.data;
      // ... handle payment completion
    }
  } catch (error) {
    console.error("Payment failed:", error);
  }
};
```

## Testing

### Using curl

```bash
# Get plans
curl http://localhost:5000/api/plans

# Create Pro payment
curl -X POST http://localhost:5000/api/pay \
  -H "Content-Type: application/json" \
  -d '{"plan":"pro","customer_email":"test@example.com","customer_name":"Test User"}'

# Create Premium payment
curl -X POST http://localhost:5000/api/pay \
  -H "Content-Type: application/json" \
  -d '{"plan":"premium","customer_email":"premium@example.com"}'
```

### Test Script

Run the included test script:

```bash
node test-payment.js
```

## Environment Variables

Create a `.env` file with:

```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
FRONTEND_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
```

## Installation & Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your Stripe keys
   ```

3. **Start development server:**

   ```bash
   npm run dev
   ```

4. **Test the API:**
   ```bash
   node test-payment.js
   ```

## Project Structure

```
src/
├── index.ts                    # Main server file
├── routes/
│   └── planRoutes.ts          # API routes
├── controllers/
│   └── planPaymentController.ts # Payment logic
├── middleware/
│   └── planValidation.ts      # Request validation
├── config/
│   └── stripe.ts              # Stripe configuration
└── types/
    └── payment.ts             # TypeScript types
```

## Key Features

### ✅ Completed

- [x] Simplified API with only Pro and Premium plans
- [x] Stripe payment integration
- [x] Input validation middleware
- [x] Error handling
- [x] CORS support
- [x] TypeScript support
- [x] Development hot-reload
- [x] Environment variable configuration
- [x] Test scripts

### 🎯 Focused Design

- Only 3 endpoints (plans, pay, status)
- Only 2 plan types (pro, premium)
- Streamlined payment flow
- Clear error messages
- Ready for frontend integration

## Support

For questions or issues, please check:

1. Environment variables are correctly set
2. Stripe keys are valid and without quotes
3. Content-Type header is set to application/json
4. Request body contains valid JSON

---

**🚀 Your JobPsych Payment API is ready to use!**

```bash
cp .env.example .env
# Add your Stripe keys to .env
```

3. **Run the service:**

   ```bash
   npm run dev
   ```

4. **Test the API:**
   ```bash
   node test-api.js
   ```

## 📡 API Endpoints

### Base URL: `http://localhost:5000`

| Method | Endpoint          | Description                            |
| ------ | ----------------- | -------------------------------------- |
| GET    | `/api/plans`      | Get available plans and pricing        |
| POST   | `/api/pay`        | Create payment for pro or premium plan |
| GET    | `/api/status/:id` | Get payment status by payment ID       |
| GET    | `/health`         | Health check                           |
| GET    | `/api`            | API documentation                      |

## 📝 API Usage

### 1. Get Available Plans

```bash
GET /api/plans
```

**Response:**

```json
{
  "success": true,
  "data": {
    "plans": {
      "pro": {
        "name": "JobPsych Pro",
        "price": 29.99,
        "description": "Professional plan with advanced features",
        "features": ["Advanced job matching", "Priority support", ...]
      },
      "premium": {
        "name": "JobPsych Premium",
        "price": 49.99,
        "description": "Premium plan with all features",
        "features": ["All Pro features", "Expert coaching", ...]
      }
    },
    "currency": "usd",
    "supported_payment_methods": ["card"],
    "publishable_key": "pk_test_..."
  }
}
```

### 2. Create Payment

```bash
POST /api/pay
```

**Request Body:**

```json
{
  "plan": "pro", // Required: "pro" or "premium"
  "customer_email": "user@example.com", // Required: Valid email
  "customer_name": "John Doe", // Optional: Customer name
  "metadata": {
    // Optional: Additional data
    "source": "website",
    "promotion": "first_time_user"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "pi_...",
    "client_secret": "pi_..._secret_...",
    "status": "requires_payment_method",
    "plan": "pro",
    "amount": 29.99,
    "currency": "usd",
    "customer_email": "user@example.com",
    "description": "JobPsych Pro - Professional plan..."
  },
  "plan_details": {
    "name": "JobPsych Pro",
    "price": 29.99,
    "features": [...]
  }
}
```

### 3. Check Payment Status

```bash
GET /api/status/{payment_id}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "pi_...",
    "status": "requires_payment_method",
    "plan": "pro",
    "amount": 29.99,
    "customer_email": "user@example.com"
  },
  "plan_details": {
    "name": "JobPsych Pro",
    "price": 29.99,
    "features": [...]
  }
}
```

## ✅ Validation Rules

### Plan Validation

- Only `"pro"` and `"premium"` plans are accepted
- Any other plan value will return a 400 error

### Email Validation

- `customer_email` is required
- Must be a valid email format

### Name Validation

- `customer_name` is optional
- If provided, must be a non-empty string

## 🔧 Error Handling

The API returns consistent error responses:

```json
{
  "error": "Validation Error",
  "message": "Plan must be either 'pro' or 'premium'",
  "valid_plans": ["pro", "premium"]
}
```

Common errors:

- Invalid plan type (400)
- Missing or invalid email (400)
- Invalid payment ID format (400)
- Payment not found (404)
- Stripe API errors (400)

## 🏗️ Project Structure

```
src/
├── config/
│   └── stripe.ts              # Stripe configuration
├── controllers/
│   └── planPaymentController.ts  # Payment logic for plans
├── middleware/
│   └── planValidation.ts      # Validation for plan payments
├── routes/
│   └── planRoutes.ts          # API routes
├── types/
│   └── payment.ts             # TypeScript types
└── index.ts                   # Express server setup
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
node test-api.js
```

Tests include:

- ✅ Health check
- ✅ API documentation
- ✅ Plan listing
- ✅ Pro plan payment creation
- ✅ Premium plan payment creation
- ✅ Payment status retrieval
- ✅ Invalid plan validation
- ✅ Missing email validation

## 💳 Payment Flow

1. **Get Plans**: Client fetches available plans and pricing
2. **Create Payment**: Client submits plan choice and customer details
3. **Process Payment**: Frontend uses client_secret with Stripe Elements
4. **Check Status**: Client can query payment status using payment ID

## 🔒 Security Features

- ✅ Input validation for all requests
- ✅ Email format validation
- ✅ Plan type restriction (only pro/premium)
- ✅ Secure Stripe integration
- ✅ Environment-based configuration
- ✅ Error message standardization

## 📦 Dependencies

- **Express**: Web framework
- **Stripe**: Payment processing
- **TypeScript**: Type safety
- **dotenv**: Environment configuration
- **cors**: Cross-origin requests

#

## 📞 Support

For issues or questions about the payment service, check:

- Server logs for detailed error information
- Stripe Dashboard for payment status
- Test script output for API validation

---

**Version**: 2.0.0 - Simplified for Pro & Premium Plans Only  
**Status**: ✅ Production Ready
