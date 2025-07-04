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
    message: "Welcome to JobPsych Payment Service",
    status: "Server is running",
    timestamp: new Date().toISOString(),
    features: [
      "💳 Simple payment processing for Pro and Premium plans",
      "🎯 Focused on two plan types only",
      "� Secure Stripe integration",
      "⚡ Streamlined API",
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
    message: "JobPsych Payment API - Simplified for Pro & Premium Plans",
    version: "2.0.0",
    endpoints: [
      "GET /api/plans - Get available plans and pricing",
      "POST /api/pay - Create payment for pro or premium plan",
      "GET /api/status/:id - Get payment status by payment ID",
    ],
    supported_plans: ["pro", "premium"],
    documentation:
      "Simplified Stripe-powered payment processing for JobPsych Pro and Premium plans only",
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
