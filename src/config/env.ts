import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL || "",
  corsOrigin: process.env.CORS_ORIGIN || "",
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
    : [
        "https://hiredesk.vercel.app",
        "http://localhost:3000",
        "http://localhost:8000",
        "https://jobpsych-ai.vercel.app",
        "https://hr-resume-analyzer-backend.vercel.app",
      ],
  nodeEnv: process.env.NODE_ENV || "development",
  // Upload Configuration
  upload: {
    limit: parseInt(process.env.UPLOAD_LIMIT || "10"),
  },
  // JWT Configuration
  jwt: {
    // Primary secret used for access tokens (must match FastAPI's JWT_SECRET)
    accessSecret:
      process.env.JWT_ACCESS_SECRET ||
      process.env.JWT_SECRET ||
      "access-secret-key",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "refresh-secret-key",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    // Legacy support
    secret: process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
} as const;
