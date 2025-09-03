# JobPsych Payment API - Frontend Integration Guide

## 🎯 Overview

This guide provides comprehensive instructions for frontend developers to integrate with the JobPsych Payment & Subscription API. The integration covers Clerk authentication, Stripe payment processing, and subscription management.

## 📋 Prerequisites

### Required Dependencies

```bash
npm install @clerk/clerk-react @stripe/stripe-js @stripe/react-stripe-js axios
# or
yarn add @clerk/clerk-react @stripe/stripe-js @stripe/react-stripe-js axios
```

### Environment Variables

```env
# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# API Configuration
VITE_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 🏗️ Project Setup

### 1. Clerk Provider Setup

#### React Setup

```jsx
// src/main.jsx or src/App.jsx
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);
```

#### Next.js Setup

```jsx
// pages/_app.jsx
import { ClerkProvider } from "@clerk/nextjs";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}

export default MyApp;
```

### 2. Stripe Provider Setup

```jsx
// src/components/StripeProvider.jsx
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export function StripeProvider({ children }) {
  return <Elements stripe={stripePromise}>{children}</Elements>;
}
```

### 3. API Client Setup

```javascript
// src/services/api.js
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "API request failed");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // User Management
  async getUserByClerkId(clerkId) {
    return this.request(`/api/users/clerk/${clerkId}`);
  }

  async getUserByEmail(email) {
    return this.request(`/api/users/email/${email}`);
  }

  // Subscription Management
  async getAvailablePlans() {
    return this.request("/api/");
  }

  async createSubscription(planData) {
    return this.request("/api/subscription", {
      method: "POST",
      body: JSON.stringify(planData),
    });
  }

  async getPaymentStatus(paymentId) {
    return this.request(`/api/subscription/${paymentId}`);
  }

  // Health Check
  async healthCheck() {
    return this.request("/health");
  }
}

export const apiClient = new ApiClient();
```

## 🔐 Authentication Integration

### 1. Protected Route Component

```jsx
// src/components/ProtectedRoute.jsx
import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
}
```

### 2. User Context Provider

```jsx
// src/contexts/UserContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiClient } from "../services/api";

const UserContext = createContext();

export function UserProvider({ children }) {
  const { user: clerkUser, isSignedIn } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isSignedIn && clerkUser) {
      fetchUserData();
    } else {
      setUserData(null);
      setLoading(false);
    }
  }, [isSignedIn, clerkUser]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUserByClerkId(clerkUser.id);
      setUserData(response.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      setError(err.message);
      // If user doesn't exist in our system, they might need to complete setup
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = () => {
    if (isSignedIn && clerkUser) {
      fetchUserData();
    }
  };

  return (
    <UserContext.Provider
      value={{
        userData,
        loading,
        error,
        refreshUserData,
        isAuthenticated: isSignedIn,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
```

### 3. App Structure with Providers

```jsx
// src/App.jsx
import { Routes, Route } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import { StripeProvider } from "./components/StripeProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import Payment from "./pages/Payment";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";

function App() {
  return (
    <UserProvider>
      <StripeProvider>
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pricing"
            element={
              <ProtectedRoute>
                <Pricing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            }
          />
        </Routes>
      </StripeProvider>
    </UserProvider>
  );
}

export default App;
```

## 💳 Payment Integration

### 1. Pricing Page Component

```jsx
// src/pages/Pricing.jsx
import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useUser } from "../contexts/UserContext";
import { apiClient } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Pricing() {
  const { user: clerkUser } = useAuth();
  const { userData, refreshUserData } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const plans = [
    {
      id: "free",
      name: "Free",
      price: 0,
      features: [
        "Up to 2 resume uploads",
        "Basic job matching",
        "Basic career insights",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: 50,
      features: [
        "Unlimited resume uploads",
        "Advanced job matching",
        "Detailed personality insights",
        "Career recommendations",
        "Priority support",
      ],
    },
  ];

  const handlePlanSelect = async (planId) => {
    if (planId === userData?.plan_type) {
      return; // Already on this plan
    }

    setLoading(true);
    setError(null);

    try {
      if (planId === "free") {
        // Handle free plan
        const response = await apiClient.createSubscription({
          plan: "free",
          customer_email: clerkUser.primaryEmailAddress.emailAddress,
          customer_name: `${clerkUser.firstName} ${clerkUser.lastName}`,
        });

        if (response.success) {
          await refreshUserData();
          navigate("/dashboard");
        }
      } else if (planId === "pro") {
        // Navigate to payment page for pro plan
        navigate("/payment", {
          state: {
            plan: "pro",
            price: 50,
            customer_email: clerkUser.primaryEmailAddress.emailAddress,
            customer_name: `${clerkUser.firstName} ${clerkUser.lastName}`,
          },
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pricing-container">
      <h1>Choose Your Plan</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="plans-grid">
        {plans.map((plan) => (
          <div key={plan.id} className="plan-card">
            <h2>{plan.name}</h2>
            <div className="price">
              ${plan.price}
              <span>/month</span>
            </div>
            <ul className="features">
              {plan.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
            <button
              onClick={() => handlePlanSelect(plan.id)}
              disabled={loading || userData?.plan_type === plan.id}
              className="plan-button"
            >
              {userData?.plan_type === plan.id
                ? "Current Plan"
                : loading
                ? "Processing..."
                : `Choose ${plan.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. Payment Page Component

```jsx
// src/pages/Payment.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { useAuth } from "@clerk/clerk-react";
import { useUser } from "../contexts/UserContext";
import { apiClient } from "../services/api";

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#32325d",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a",
    },
  },
};

export default function Payment() {
  const stripe = useStripe();
  const elements = useElements();
  const location = useLocation();
  const navigate = useNavigate();
  const { user: clerkUser } = useAuth();
  const { refreshUserData } = useUser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

  const { plan, price, customer_email, customer_name } = location.state || {};

  useEffect(() => {
    if (!plan || !price) {
      navigate("/pricing");
      return;
    }

    createPaymentIntent();
  }, [plan, price]);

  const createPaymentIntent = async () => {
    try {
      const response = await apiClient.createSubscription({
        plan,
        customer_email,
        customer_name,
      });

      if (response.client_secret) {
        setClientSecret(response.client_secret);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    try {
      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: customer_name,
              email: customer_email,
            },
          },
        });

      if (stripeError) {
        setError(stripeError.message);
      } else if (paymentIntent.status === "succeeded") {
        // Payment successful
        await refreshUserData();
        navigate("/dashboard", {
          state: {
            message: "Payment successful! Welcome to Pro plan.",
            type: "success",
          },
        });
      }
    } catch (err) {
      setError("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!plan || !price) {
    return <div>Invalid payment request. Redirecting...</div>;
  }

  return (
    <div className="payment-container">
      <h1>Complete Your Payment</h1>

      <div className="payment-summary">
        <h2>Plan: {plan.charAt(0).toUpperCase() + plan.slice(1)}</h2>
        <p className="price">${price}/month</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="payment-form">
        <div className="form-group">
          <label htmlFor="card-element">Credit or Debit Card</label>
          <div className="card-element-container">
            <CardElement id="card-element" options={CARD_ELEMENT_OPTIONS} />
          </div>
        </div>

        <button
          type="submit"
          disabled={!stripe || loading}
          className="payment-button"
        >
          {loading ? "Processing..." : `Pay $${price}`}
        </button>
      </form>
    </div>
  );
}
```

### 3. Dashboard Component

```jsx
// src/pages/Dashboard.jsx
import { useAuth } from "@clerk/clerk-react";
import { useUser } from "../contexts/UserContext";
import { UserButton } from "@clerk/clerk-react";

export default function Dashboard() {
  const { user: clerkUser } = useAuth();
  const { userData, loading, error, refreshUserData } = useUser();

  if (loading) {
    return <div className="loading">Loading your dashboard...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Unable to load your data</h2>
        <p>{error}</p>
        <button onClick={refreshUserData}>Try Again</button>
      </div>
    );
  }

  const getPlanDisplay = (planType) => {
    switch (planType) {
      case "free":
        return { name: "Free Plan", color: "gray" };
      case "pro":
        return { name: "Pro Plan", color: "blue" };
      case "premium":
        return { name: "Premium Plan", color: "gold" };
      default:
        return { name: "Unknown Plan", color: "gray" };
    }
  };

  const planInfo = getPlanDisplay(userData?.plan_type);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Welcome to JobPsych</h1>
        <UserButton />
      </header>

      <div className="dashboard-content">
        <div className="user-info-card">
          <h2>Your Account</h2>
          <div className="user-details">
            <p>
              <strong>Name:</strong> {clerkUser.firstName} {clerkUser.lastName}
            </p>
            <p>
              <strong>Email:</strong>{" "}
              {clerkUser.primaryEmailAddress.emailAddress}
            </p>
            <p>
              <strong>Current Plan:</strong>
              <span className={`plan-badge ${planInfo.color}`}>
                {planInfo.name}
              </span>
            </p>
            <p>
              <strong>Status:</strong>
              <span
                className={`status-badge ${
                  userData?.subscription_status === "active"
                    ? "active"
                    : "inactive"
                }`}
              >
                {userData?.subscription_status || "Unknown"}
              </span>
            </p>
          </div>
        </div>

        <div className="plan-features-card">
          <h2>Your Plan Features</h2>
          {userData?.plan_type === "free" && (
            <ul>
              <li>✅ Up to 2 resume uploads</li>
              <li>✅ Basic job matching</li>
              <li>✅ Basic career insights</li>
              <li>🔒 Upgrade to Pro for unlimited uploads</li>
            </ul>
          )}

          {userData?.plan_type === "pro" && (
            <ul>
              <li>✅ Unlimited resume uploads</li>
              <li>✅ Advanced job matching</li>
              <li>✅ Detailed personality insights</li>
              <li>✅ Career recommendations</li>
              <li>✅ Priority support</li>
            </ul>
          )}
        </div>

        <div className="actions-card">
          <h2>Actions</h2>
          <button
            onClick={() => (window.location.href = "/pricing")}
            className="upgrade-button"
          >
            {userData?.plan_type === "free" ? "Upgrade to Pro" : "Manage Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

## 🔄 Complete Integration Flow

### 1. User Authentication Flow

```javascript
// 1. User signs up via Clerk
// 2. Clerk sends webhook to JobPsych API
// 3. API creates user in MongoDB with Stripe customer
// 4. Frontend fetches user data using Clerk ID
// 5. User can now access dashboard and select plans
```

### 2. Subscription Flow

```javascript
// Free Plan Flow:
User clicks "Choose Free" → API call → Update user plan → Success

// Pro Plan Flow:
User clicks "Choose Pro" → Navigate to payment → Create PaymentIntent →
Stripe payment → Webhook confirmation → Update user plan → Success
```

### 3. Error Handling

```jsx
// src/hooks/useApi.js
import { useState, useCallback } from "react";

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiCall) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading, error };
}
```

## 🎨 CSS Styling Example

```css
/* src/styles/payment.css */
.pricing-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.plan-card {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  transition: box-shadow 0.3s ease;
}

.plan-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.plan-button {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;
  width: 100%;
}

.plan-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.payment-form {
  max-width: 400px;
  margin: 2rem auto;
}

.card-element-container {
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 0.75rem;
  margin-bottom: 1rem;
}
```

## 🧪 Testing the Integration

### 1. Test Authentication

```javascript
// Test Clerk authentication
const { user } = useAuth();
console.log("Clerk User:", user);

// Test API integration
const userData = await apiClient.getUserByClerkId(user.id);
console.log("JobPsych User Data:", userData);
```

### 2. Test Payment Flow

```javascript
// Test free plan
await apiClient.createSubscription({
  plan: "free",
  customer_email: "test@example.com",
  customer_name: "Test User",
});

// Test pro plan (requires Stripe setup)
await apiClient.createSubscription({
  plan: "pro",
  customer_email: "test@example.com",
  customer_name: "Test User",
});
```

### 3. Test Error Scenarios

```javascript
// Test invalid plan
try {
  await apiClient.createSubscription({
    plan: "invalid",
    customer_email: "test@example.com",
    customer_name: "Test User",
  });
} catch (error) {
  console.log("Expected error:", error.message);
}
```

## 🚀 Deployment Checklist

### Frontend Deployment

- [ ] Set up environment variables
- [ ] Configure Clerk dashboard with your domain
- [ ] Set up Stripe webhook endpoints
- [ ] Test payment flow with test cards
- [ ] Configure CORS for production API
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure CI/CD pipeline

### Production Environment Variables

```env
# Production URLs
VITE_API_BASE_URL=https://your-api-domain.com
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Webhook endpoints in Clerk/Stripe dashboards
CLERK_WEBHOOK_URL=https://your-api-domain.com/api/webhooks/clerk
STRIPE_WEBHOOK_URL=https://your-api-domain.com/api/webhooks/stripe
```

## 📞 Support & Troubleshooting

### Common Issues

1. **Clerk User Not Found**

   - Check if webhooks are properly configured
   - Verify Clerk ID is being passed correctly
   - Check API logs for webhook processing

2. **Payment Fails**

   - Verify Stripe publishable key
   - Check card element is properly mounted
   - Ensure client_secret is valid

3. **CORS Errors**
   - Add frontend domain to API CORS configuration
   - Check if API is running and accessible

### Debug Tools

```javascript
// Debug user data
console.log("Clerk User:", clerkUser);
console.log("JobPsych User:", userData);

// Debug API calls
const response = await apiClient.healthCheck();
console.log("API Health:", response);

// Debug Stripe
console.log("Stripe loaded:", !!stripe);
console.log("Elements loaded:", !!elements);
```

## 📋 API Reference Summary

| Endpoint                | Method | Description                 |
| ----------------------- | ------ | --------------------------- |
| `/api/users/clerk/:id`  | GET    | Get user by Clerk ID        |
| `/api/`                 | GET    | Get available plans         |
| `/api/subscription`     | POST   | Create subscription/payment |
| `/api/subscription/:id` | GET    | Get payment status          |
| `/health`               | GET    | Health check                |

## 🎯 Next Steps

1. **Set up your Clerk application** and configure webhooks
2. **Configure Stripe** with your webhook endpoints
3. **Deploy the API** to your production environment
4. **Test the complete flow** with real payments
5. **Set up monitoring** and error tracking
6. **Configure CI/CD** for automated deployments

This integration guide provides everything needed to connect your frontend with the JobPsych Payment API. The implementation includes authentication, payment processing, subscription management, and error handling for a complete user experience.
