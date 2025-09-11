import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import planRoutes from "./routes/planRoutes";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import morgan from "morgan";
import { connectMongoDB } from "./config/mongodb";
import { handleStripeWebhook } from "./controllers/webhookController";
import { asyncHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(morgan("dev"));

app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  asyncHandler(handleStripeWebhook)
);

app.use(
  cors({
    origin: ["http://localhost:3000", "https://jobpsych.vercel.app"],
    credentials: true,
  })
);

// Add cookie parser middleware
app.use(cookieParser());

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    api: "JobPsych Payment & Subscription API",
    description:
      "A modern RESTful API for managing JobPsych users, subscription plans, payments, and authentication. Supports direct user registration for candidates and recruiters, JWT-based authentication, Stripe payment processing, and MongoDB storage.",
    status: "Server is running",
    timestamp: new Date().toISOString(),
    features: [
      "Direct user registration (candidates & recruiters)",
      "JWT-based authentication with refresh tokens",
      "Password complexity validation",
      "Free plan: Up to 2 resume uploads",
      "Pro plan: $50/month, unlimited resume uploads",
      "Premium plan: Contact for pricing and access",
      "Stripe-powered payment processing",
      "MongoDB user and subscription storage",
      "Webhook integration for real-time updates",
      "Input validation & error handling",
      "CORS support for frontend integration",
      "Streamlined endpoints for easy integration",
    ],
    endpoints: [
      {
        method: "GET",
        path: "/api",
        description: "API documentation and available plans",
      },
      {
        method: "GET",
        path: "/api/",
        description: "Get available plans and pricing",
      },
      {
        method: "POST",
        path: "/api/subscription",
        description: "Subscribe to Free or Pro plan",
      },
      {
        method: "GET",
        path: "/api/subscription/:id",
        description: "Get subscription/payment status by ID",
      },
      {
        method: "POST",
        path: "/api/subscription/store",
        description: "Store subscription data in MongoDB",
      },
      {
        method: "POST",
        path: "/api/auth/register",
        description: "Register new user (candidate or recruiter)",
      },
      {
        method: "POST",
        path: "/api/auth/login",
        description: "User login with email and password",
      },
      {
        method: "POST",
        path: "/api/auth/refresh",
        description: "Refresh access token using refresh token",
      },
      {
        method: "GET",
        path: "/api/auth/verify",
        description: "Verify access token validity",
      },
      {
        method: "POST",
        path: "/api/users",
        description: "Create user (alternative registration method)",
      },
      {
        method: "GET",
        path: "/api/users/:id",
        description: "Get user by ID (requires authentication)",
      },
      {
        method: "GET",
        path: "/api/users/email/:email",
        description: "Get user by email (requires authentication)",
      },
      {
        method: "PUT",
        path: "/api/users/:id",
        description: "Update user information (requires authentication)",
      },
      {
        method: "POST",
        path: "/api/webhooks/stripe",
        description: "Stripe webhook handler",
      },
      { method: "GET", path: "/health", description: "Health check endpoint" },
    ],
    documentation:
      "This API allows you to view plans, create payments, check payment status, and store subscription data securely. Integrate with Stripe for payments and MongoDB for persistent subscription management.",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "payment-service",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api", (req, res) => {
  res.json({
    message: "JobPsych Payment API - Direct Registration & Authentication",
    version: "4.0.0",
    endpoints: [
      "POST /api/auth/register - Register as candidate or recruiter",
      "POST /api/auth/login - Login with email and password",
      "POST /api/auth/refresh - Refresh access token",
      "GET /api/auth/verify - Verify token validity",
      "GET /api/ - Home route with available plans and pricing",
      "POST /api/subscription - Subscribe to free or pro plan",
      "GET /api/subscription/:id - Get subscription payment status by ID (for pro plan)",
      "POST /api/contact - Contact us for Premium plan",
    ],
    supported_plans: ["free", "pro", "premium"],
    user_types: ["candidate", "recruiter"],
    plan_features: {
      free: "Up to 2 resume uploads",
      pro: "Unlimited resume uploads ($50/month)",
      premium: "Contact us for pricing and access",
    },
    password_requirements: {
      min_length: 8,
      uppercase: true,
      lowercase: true,
      number: true,
      special_character: true,
    },
    documentation:
      "Direct user registration and authentication for JobPsych. Supports JWT tokens with refresh capability. Pro plan is $50/month. Premium requires contacting support.",
  });
});

app.use("/api", planRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err.message);
    res.status(500).json({
      error: "Internal Server Error",
      message: err.message,
    });
  }
);

app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
    available_routes: [
      "GET /api - API documentation",
      "GET /api/plans - Available plans",
      "POST /api/pay - Create payment",
      "GET /api/status/:id - Payment status",
      "POST /api/contact - Contact for Premium plan",
    ],
  });
});

connectMongoDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`JobPsych running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

export default app;
