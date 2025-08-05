import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import planRoutes from "./routes/planRoutes";
import userRoutes from "./routes/userRoutes";
import morgan from "morgan";
import { connectMongoDB } from "./config/mongodb";
import { handleStripeWebhook } from "./controllers/webhookController";
import { asyncHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(morgan("dev"));

// Stripe webhook endpoint (before express.json())
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  asyncHandler(handleStripeWebhook)
);

app.use(
  cors({
    origin: "https://jobpsych.vercel.app",
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    api: "JobPsych Payment & Subscription API",
    description:
      "A modern RESTful API for managing JobPsych subscription plans, payments, and Stripe integration. Supports Free, Pro, and Premium plans with secure MongoDB storage for subscriptions.",
    status: "Server is running",
    timestamp: new Date().toISOString(),
    features: [
      "🆓 Free plan: Up to 2 resume uploads",
      "💼 Pro plan: $50/month, unlimited resume uploads",
      "🌟 Premium plan: Contact for pricing and access",
      "💳 Stripe-powered payment processing",
      "📦 MongoDB subscription storage",
      "� User management with Stripe customers",
      "🔗 Webhook integration for real-time updates",
      "�🔒 Input validation & error handling",
      "🌐 CORS support for frontend integration",
      "⚡ Streamlined endpoints for easy integration",
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
        path: "/api/users",
        description: "Create user with Stripe customer",
      },
      {
        method: "GET",
        path: "/api/users/:id",
        description: "Get user by ID",
      },
      {
        method: "GET",
        path: "/api/users/email/:email",
        description: "Get user by email",
      },
      {
        method: "PUT",
        path: "/api/users/:id",
        description: "Update user information",
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
    message: "JobPsych Payment API - Simplified for Free & Pro Plans",
    version: "3.0.0",
    endpoints: [
      "GET /api/ - Home route with available plans and pricing",
      "POST /api/subscription - Subscribe to free or pro plan",
      "GET /api/subscription/:id - Get subscription payment status by ID (for pro plan)",
      "POST /api/contact - Contact us for Premium plan",
    ],
    supported_plans: ["free", "pro", "premium"],
    plan_features: {
      free: "Up to 2 resume uploads",
      pro: "Unlimited resume uploads ($50/month)",
      premium: "Contact us for pricing and access",
    },
    documentation:
      "Simplified payment processing for JobPsych subscription plans. Pro is $50/month. Premium requires contacting support.",
  });
});

app.use("/api", planRoutes);
app.use("/api/users", userRoutes);

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
      console.log(
        `🚀 JobPsych Payment Service running on http://localhost:${PORT}`
      );
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 API docs: http://localhost:${PORT}/api`);
      console.log(
        `🎯 Simplified API - Free, Pro ($50/month), and Premium (contact us) plans!`
      );
      console.log(`💳 Available endpoints:`);
      console.log(`   GET  /api/plans - View available plans`);
      console.log(`   POST /api/pay - Create payment for pro`);
      console.log(`   GET  /api/status/:id - Check payment status`);
      console.log(`   POST /api/contact - Contact for Premium plan`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

export default app;
