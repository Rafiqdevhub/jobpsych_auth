import express from "express";
import { config } from "../config/env";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    api: "JobPsych Auth API",
    version: "3.0.0",
    description:
      "Complete authentication and rate limiting system for JobPsych platform with user management, JWT authentication and FastAPI integration.",
    status: "Server is running",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    uptime: process.uptime(),

    architecture: {
      database: "NeonDB (PostgreSQL)",
      orm: "Drizzle ORM",
      authentication: "JWT with refresh tokens",
      security: "bcrypt password hashing",
      cors: "Configured for multiple origins",
      validation: "Express validation middleware",
      logging: "Morgan HTTP request logger",
    },

    features: [
      "User registration with name, email, password, company_name",
      "Secure login with JWT access tokens (15 minutes)",
      "HttpOnly refresh tokens (7 days) stored as secure cookies",
      "Automatic token refresh without user intervention",
      "Secure logout that clears both client and server tokens",
      "Password reset functionality with secure validation",
      "Protected profile endpoint with user data",
      "Rate limiting for file uploads (10 files per user)",
      "FastAPI integration endpoints for upload count management",
      "NeonDB (PostgreSQL) user storage with bcrypt password hashing",
      "JWT authentication with automatic token rotation",
      "CORS protection for multiple domains",
      "Comprehensive error handling and logging",
    ],

    rateLimiting: {
      uploadLimit: config.upload.limit,
      description: "Users can upload maximum 10 files",
      endpoints: {
        check: "GET /api/auth/user-uploads/:email",
        increment: "POST /api/auth/increment-upload",
        stats: "GET /api/auth/upload-stats",
      },
      integration: "Designed for FastAPI backend integration",
    },

    security: {
      passwordHashing: "bcrypt with salt rounds",
      jwtTokens: "Access tokens (15min) + Refresh tokens (7 days)",
      cookieSecurity: "HttpOnly, Secure, SameSite cookies",
      corsProtection: "Multiple domain whitelist",
      headerSecurity: "X-Powered-By removed",
      errorHandling: "Production-safe error messages",
    },

    endpoints: [
      {
        category: "Authentication",
        method: "POST",
        path: "/api/auth/register",
        description: "Register a new user account",
        authentication: "None",
        requestBody: {
          name: "string (required)",
          email: "string (required, unique)",
          password: "string (required, min 6 chars)",
          company_name: "string (required)",
        },
        response: "User data + access token + refresh token cookie",
        notes: "Creates user account and logs them in immediately",
      },
      {
        category: "Authentication",
        method: "POST",
        path: "/api/auth/login",
        description: "Login with email and password",
        authentication: "None",
        requestBody: {
          email: "string (required)",
          password: "string (required)",
        },
        response: "User data + access token + refresh token cookie",
        notes: "Sets HttpOnly refresh token cookie for 7 days",
      },
      {
        category: "Authentication",
        method: "POST",
        path: "/api/auth/refresh",
        description: "Refresh access token using refresh token",
        authentication: "Refresh token (cookie)",
        requestBody: "None",
        response: "New access token + rotated refresh token cookie",
        notes: "Automatically rotates refresh token for security",
      },
      {
        category: "Authentication",
        method: "POST",
        path: "/api/auth/logout",
        description: "Logout and clear all tokens",
        authentication: "Access token (optional)",
        requestBody: "None",
        response: "Success message",
        notes: "Clears refresh token cookie and invalidates tokens",
      },
      {
        category: "Authentication",
        method: "POST",
        path: "/api/auth/reset-password",
        description: "Reset user password",
        authentication: "None",
        requestBody: {
          email: "string (required)",
          newPassword: "string (required, min 6 chars)",
        },
        response: "Success message",
        notes: "Updates password in database with bcrypt hashing",
      },
      {
        category: "Authentication",
        method: "PUT",
        path: "/api/auth/update-profile",
        description:
          "Update authenticated user's profile (name and/or password)",
        authentication: "Access token (required)",
        requestBody: {
          name: "string (optional) - Update user's name",
          currentPassword: "string (required if updating password)",
          newPassword: "string (optional) - New password (min 8 chars)",
          confirmPassword:
            "string (required if updating password, must match newPassword)",
        },
        response: {
          success: "boolean",
          message: "string",
          data: {
            id: "string",
            name: "string",
            email: "string",
            company_name: "string",
            filesUploaded: "number",
            updatedAt: "string (ISO)",
            securityNote: "string (only if password changed)",
          },
        },
        notes:
          "Update name, password, or both. Password changes require current password verification and log out other devices.",
      },
      {
        category: "Authentication",
        method: "GET",
        path: "/api/auth/profile",
        description: "Get authenticated user's profile data",
        authentication: "Access token (required)",
        requestBody: "None",
        response:
          "User profile data (id, name, email, company_name, filesUploaded, createdAt)",
        notes: "Returns complete user profile information",
      },
      {
        category: "Rate Limiting",
        method: "GET",
        path: "/api/auth/user-uploads/:email",
        description: "Get user's current upload count by email",
        authentication: "None (Public - for FastAPI service)",
        requestBody: "None",
        response: {
          success: "boolean",
          email: "string",
          filesUploaded: "number",
          limit: "number (10)",
          remaining: "number",
          message: "string",
        },
        notes:
          "Used by FastAPI backend to check upload limits before processing",
      },
      {
        category: "Rate Limiting",
        method: "POST",
        path: "/api/auth/increment-upload",
        description: "Increment user's upload count after successful upload",
        authentication: "None (Public - for FastAPI service)",
        requestBody: {
          email: "string (required)",
        },
        response: {
          success: "boolean",
          message: "string",
          email: "string",
          filesUploaded: "number",
          limit: "number (10)",
          remaining: "number",
        },
        notes:
          "Called by FastAPI after successful file processing to increment count",
      },
      {
        category: "Rate Limiting",
        method: "GET",
        path: "/api/auth/upload-stats",
        description: "Get detailed upload statistics for authenticated user",
        authentication: "Access token (required)",
        requestBody: "None",
        response: {
          success: "boolean",
          stats: {
            email: "string",
            name: "string",
            totalUploads: "number",
            limit: "number (10)",
            remaining: "number",
            percentage: "number (0-100)",
            canUpload: "boolean",
          },
        },
        notes:
          "Provides comprehensive upload statistics for frontend dashboards",
      },

      // JWT Verification Endpoints (Cross-Service Communication)
      {
        category: "JWT Verification",
        method: "POST",
        path: "/api/auth/verify-token",
        description: "Verify JWT token validity and decode payload",
        authentication: "None (Public - for debugging and FastAPI integration)",
        requestBody: {
          token: "string (required) - JWT token to verify",
        },
        response: {
          success: "boolean",
          message: "string",
          decoded: "object (token payload)",
          tokenInfo: {
            algorithm: "string",
            expiresIn: "string",
            secretLength: "number",
          },
        },
        notes:
          "Use this endpoint to verify if JWT tokens are valid and properly signed. Useful for debugging 403 Forbidden errors.",
      },
      {
        category: "JWT Verification",
        method: "GET",
        path: "/api/auth/jwt-info",
        description: "Get JWT configuration information for debugging",
        authentication: "None (Public - for cross-service setup)",
        requestBody: "None",
        response: {
          success: "boolean",
          jwtInfo: {
            algorithm: "string (HS256)",
            accessTokenExpiry: "string",
            refreshTokenExpiry: "string",
            secretLength: "number",
            secretFirstChars: "string",
            secretLastChars: "string",
            environment: "string",
          },
        },
        notes:
          "Share this information with FastAPI team to ensure JWT secrets match. Helps resolve authentication issues.",
      },

      {
        category: "System",
        method: "GET",
        path: "/health",
        description: "Health check endpoint for monitoring",
        authentication: "None",
        requestBody: "None",
        response: {
          status: "string (OK)",
          service: "string",
          uptime: "number (seconds)",
          timestamp: "string (ISO)",
        },
        notes: "Used for health monitoring and load balancer checks",
      },
      {
        category: "System",
        method: "GET",
        path: "/",
        description: "API documentation and system information",
        authentication: "None",
        requestBody: "None",
        response: "Complete API documentation (this response)",
        notes: "Comprehensive system documentation and endpoint reference",
      },
    ],

    integration: {
      fastapi: {
        description:
          "Seamless integration with FastAPI backend for file processing",
        workflow: [
          "1. Frontend authenticates user with this service",
          "2. Frontend receives JWT access token",
          "3. Frontend sends file + JWT to FastAPI backend",
          "4. FastAPI validates JWT and checks upload limit via GET /user-uploads/:email",
          "5. FastAPI processes file if under limit",
          "6. FastAPI increments count via POST /increment-upload",
          "7. User's upload count is updated in real-time",
        ],
        endpoints: {
          checkLimit: "GET /api/auth/user-uploads/:email",
          incrementCount: "POST /api/auth/increment-upload",
        },
      },
      cors: {
        allowedOrigins: config.corsOrigins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        headers: ["Content-Type", "Authorization"],
      },
    },

    errorHandling: {
      development: "Detailed error messages with stack traces",
      production: "Sanitized error messages for security",
      statusCodes: {
        200: "Success",
        400: "Bad Request - Invalid input data",
        401: "Unauthorized - Invalid or missing token",
        403: "Forbidden - Insufficient permissions",
        404: "Not Found - Resource doesn't exist",
        500: "Internal Server Error - Server-side error",
      },
      errorFormat: {
        success: "boolean (false)",
        message: "string (error description)",
        error: "string (error code)",
        details: "string (development only)",
      },
    },

    database: {
      tables: {
        users: {
          id: "serial (primary key)",
          name: "varchar(255) not null",
          email: "varchar(255) not null unique",
          company_name: "varchar(255) not null",
          password: "varchar(255) not null (bcrypt hashed)",
          refreshToken: "varchar(255) nullable",
          filesUploaded: "integer default 0 not null",
          created_at: "timestamp default now()",
          updated_at: "timestamp default now()",
        },
        files: {
          description: "File upload tracking (if implemented)",
          note: "Additional table for detailed file metadata",
        },
      },
    },

    performance: {
      uptime: `${Math.floor(process.uptime())} seconds`,
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      environment: config.nodeEnv,
    },

    documentation:
      "Complete authentication and rate limiting system for JobPsych platform. Features JWT authentication, file upload tracking, FastAPI integration, and comprehensive security measures. Built with TypeScript, Express.js, Drizzle ORM, and PostgreSQL.",
  });
});

export default router;
