# JobPsych Payment & Subscription API Documentation

## Overview

JobPsych Payment & Subscription API is a modern RESTful service for managing subscription plans, payments, and Stripe integration. It supports Free, Pro, and Premium plans, with secure MongoDB storage for subscriptions and robust validation/error handling.

## Features

- 🆓 **Free Plan**: Up to 2 resume uploads
- 💼 **Pro Plan**: $50/month, unlimited resume uploads
- � **Premium Plan**: Contact for pricing and access
- 💳 **Stripe-powered payment processing**
- 📦 **MongoDB subscription storage**
- 🔒 **Input validation & error handling**
- 🌐 **CORS support for frontend integration**
- ⚡ **Streamlined endpoints for easy integration**

## API Endpoints

### Base URL

```
http://localhost:5000
```

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

Create a `.env` file:

```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
MONGODB_URI=mongodb://localhost:27017/jobpsych
PORT=5000
NODE_ENV=development
```

## Project Structure

```
src/
├── index.ts                    # Main server file
├── routes/
│   └── planRoutes.ts           # API routes
├── controllers/
│   ├── planPaymentController.ts # Payment logic
│   └── subscriptionStoreController.ts # MongoDB storage
├── models/
│   └── subscription.ts         # Subscription schema/model
├── middleware/
│   └── planValidation.ts       # Request validation
│   └── errorHandler.ts         # Async error handler
├── config/
│   ├── stripe.ts               # Stripe configuration
│   └── mongodb.ts              # MongoDB connection
└── types/
    └── payment.ts              # TypeScript types
```

## Quick Start

1. `npm install`
2. Add your `.env` file
3. `npm run dev`
4. Test endpoints with Postman, curl, or your frontend

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
