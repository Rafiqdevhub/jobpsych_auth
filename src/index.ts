import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes";
import fileRoutes from "./routes/fileRoutes";
import { connectMongoDB } from "./config/mongodb";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(morgan("dev"));

app.use(
  cors({
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(",")
      : ["https://hiredesk.vercel.app", "http://localhost:3000"],
    credentials: true,
  })
);

app.use(cookieParser());

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    api: "JobPsych Auth API",
    description:
      "Authentication system for JobPsych with user registration, login, change password, password reset, and profile management.",
    status: "Server is running",
    timestamp: new Date().toISOString(),
    features: [
      "User registration with name, email, password, company_name",
      "Secure login with JWT access tokens (15 minutes)",
      "HttpOnly refresh tokens (7 days) stored as secure cookies",
      "Automatic token refresh without user intervention",
      "Secure logout that clears both client and server tokens",
      "Password reset functionality",
      "Protected profile endpoint",
      "File upload with upload count tracking",
      "MongoDB user storage with bcrypt password hashing",
      "JWT authentication with token rotation",
    ],
    endpoints: [
      {
        method: "POST",
        path: "/api/auth/register",
        description: "Register a new user (sets refresh token cookie)",
      },
      {
        method: "POST",
        path: "/api/auth/login",
        description:
          "Login with email and password (sets refresh token cookie)",
      },
      {
        method: "POST",
        path: "/api/auth/refresh",
        description: "Refresh access token using refresh token cookie",
      },
      {
        method: "POST",
        path: "/api/auth/logout",
        description: "Logout and clear refresh token cookie",
      },
      {
        method: "POST",
        path: "/api/auth/reset-password",
        description: "Reset user password",
      },
      {
        method: "POST",
        path: "/api/auth/change-password",
        description: "Change user password",
      },
      {
        method: "GET",
        path: "/api/auth/profile",
        description: "Get user profile (requires access token)",
      },
      {
        method: "POST",
        path: "/api/files/upload",
        description: "Upload a file (requires authentication)",
      },
      {
        method: "GET",
        path: "/api/files/stats",
        description:
          "Get user's file upload statistics (requires authentication)",
      },
      { method: "GET", path: "/health", description: "Health check endpoint" },
    ],
    documentation:
      "Secure authentication system with JWT access tokens (15min) and HttpOnly refresh tokens (7 days). Refresh tokens are hashed in database and automatically rotated. Implements industry best practices for token security.",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "jobpsych-api",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);

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
  });
});

connectMongoDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`JobPsych Auth API running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

export default app;
