import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import planRoutes from "./routes/planRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to JobPsych Subscription Service",
    status: "Server is running",
    timestamp: new Date().toISOString(),
    features: [
      "🆓 Free plan with up to 2 resume uploads",
      "💼 Pro plan with unlimited resume uploads ($50/user)",
      "🎯 Focused on two plan types only",
      "💳 Secure Stripe integration for Pro plan",
      "⚡ Streamlined API with just two main routes",
    ],
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
    ],
    supported_plans: ["free", "pro"],
    plan_features: {
      free: "Up to 2 resume uploads",
      pro: "Unlimited resume uploads ($50/user)",
    },
    documentation:
      "Simplified payment processing for JobPsych subscription plans",
  });
});

app.use("/api", planRoutes);

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
    ],
  });
});

app.listen(PORT, () => {
  console.log(
    `🚀 JobPsych Payment Service running on http://localhost:${PORT}`
  );
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 API docs: http://localhost:${PORT}/api`);
  console.log(`🎯 Simplified API - Pro & Premium plans only!`);
  console.log(`💳 Available endpoints:`);
  console.log(`   GET  /api/plans - View available plans`);
  console.log(`   POST /api/pay - Create payment for pro/premium`);
  console.log(`   GET  /api/status/:id - Check payment status`);
});

export default app;
