# JobPsych Payment API Documentation

## Overview

A simplified payment API for JobPsych supporting only **Pro** and **Premium** plans. Built with Express.js, TypeScript, and Stripe integration.

## Features

- 🎯 **Simplified Design**: Only supports Pro ($29.99) and Premium ($49.99) plans
- 💳 **Secure Payments**: Stripe-powered payment processing
- ⚡ **Streamlined API**: Minimal endpoints focused on essential functionality
- 🔒 **Input Validation**: Comprehensive request validation middleware
- 🌐 **CORS Support**: Ready for frontend integration

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

### 2. Create Payment

```http
POST /api/pay
Content-Type: application/json
```

**Request Body:**

```json
{
  "plan": "pro", // Required: "pro" or "premium"
  "customer_email": "user@example.com", // Required: valid email
  "customer_name": "John Doe" // Optional: customer name
}
```

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "id": "pi_3RgjWOBD8fyBOgMZ1TrI3hjG",
    "client_secret": "pi_3RgjWOBD8fyBOgMZ1TrI3hjG_secret_...",
    "status": "requires_payment_method",
    "plan": "pro",
    "amount": 29.99,
    "currency": "usd",
    "created": 1751535216,
    "customer_email": "user@example.com",
    "description": "JobPsych Pro - Professional plan with advanced features",
    "metadata": {
      "created_at": "2025-07-03T09:33:35.680Z",
      "customer_email": "user@example.com",
      "customer_name": "John Doe",
      "plan": "pro",
      "plan_name": "JobPsych Pro",
      "plan_price": "29.99",
      "service": "JobPsych Payment Service"
    }
  },
  "plan_details": {
    "name": "JobPsych Pro",
    "price": 29.99,
    "description": "Professional plan with advanced features",
    "features": [...]
  }
}
```

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

## 🚀 Deployment

1. Build the project:

   ```bash
   npm run build
   ```

2. Start production server:

   ```bash
   npm start
   ```

3. Set production environment variables:
   ```bash
   NODE_ENV=production
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

## 📞 Support

For issues or questions about the payment service, check:

- Server logs for detailed error information
- Stripe Dashboard for payment status
- Test script output for API validation

---

**Version**: 2.0.0 - Simplified for Pro & Premium Plans Only  
**Status**: ✅ Production Ready
# jobpsych_payment
