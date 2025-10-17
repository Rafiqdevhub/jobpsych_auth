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
      "Batch analysis tracking - counts batch resume analysis operations",
      "Resume comparison tracking - counts resume comparison operations",
      "FastAPI integration endpoints for all feature tracking",
      "Feature usage endpoints for analytics and dashboard display",
      "NeonDB (PostgreSQL) user storage with bcrypt password hashing",
      "JWT authentication with automatic token rotation",
      "CORS protection for multiple domains",
      "Comprehensive error handling and logging",
      "Atomic database operations to prevent race conditions",
    ],

    rateLimiting: {
      uploadLimit: config.upload.limit,
      description: "Users can upload maximum 10 files",
      batchAnalysisLimit: "Unlimited batch analysis operations per user",
      compareResumesLimit: "Unlimited resume comparison operations per user",
      endpoints: {
        checkUploads: "GET /api/auth/user-uploads/:email",
        incrementUploads: "POST /api/auth/increment-upload",
        uploadStats: "GET /api/auth/upload-stats",
        incrementBatchAnalysis: "POST /api/auth/increment-batch-analysis",
        incrementCompareResumes: "POST /api/auth/increment-compare-resumes",
        featureUsage: "GET /api/auth/feature-usage/:email",
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
        method: "POST",
        path: "/api/auth/increment-batch-analysis",
        description:
          "Increment user's batch analysis count after successful batch processing",
        authentication: "None (Public - for FastAPI service)",
        requestBody: {
          email: "string (required)",
        },
        response: {
          success: "boolean",
          message: "string",
          email: "string",
          batch_analysis: "number",
          filesUploaded: "number",
          compare_resumes: "number",
        },
        notes:
          "Called by FastAPI after successful batch analysis to track feature usage",
      },
      {
        category: "Rate Limiting",
        method: "POST",
        path: "/api/auth/increment-compare-resumes",
        description:
          "Increment user's resume comparison count after successful comparison",
        authentication: "None (Public - for FastAPI service)",
        requestBody: {
          email: "string (required)",
        },
        response: {
          success: "boolean",
          message: "string",
          email: "string",
          compare_resumes: "number",
          filesUploaded: "number",
          batch_analysis: "number",
        },
        notes:
          "Called by FastAPI after successful resume comparison to track feature usage",
      },
      {
        category: "Rate Limiting",
        method: "GET",
        path: "/api/auth/feature-usage/:email",
        description: "Get comprehensive feature usage statistics for a user",
        authentication: "None (Public - for FastAPI service and dashboard)",
        requestBody: "None",
        response: {
          success: "boolean",
          message: "string",
          email: "string",
          stats: {
            filesUploaded: "number (count of files uploaded)",
            batch_analysis: "number (count of batch analysis operations)",
            compare_resumes: "number (count of resume comparisons)",
            totalFeatureUsage: "number (sum of all feature counters)",
          },
        },
        notes:
          "Consolidated endpoint for retrieving all feature usage statistics. Used for analytics, dashboards, and rate limit checks.",
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
          "Seamless integration with FastAPI backend for file processing and feature tracking",
        workflow: [
          "1. Frontend authenticates user with this service",
          "2. Frontend receives JWT access token",
          "3. Frontend sends file + JWT to FastAPI backend",
          "4. FastAPI validates JWT and checks upload limit via GET /user-uploads/:email",
          "5. FastAPI processes file if under limit",
          "6. FastAPI increments count via POST /increment-upload",
          "7. For batch analysis: FastAPI calls POST /increment-batch-analysis after processing",
          "8. For resume comparison: FastAPI calls POST /increment-compare-resumes after processing",
          "9. User feature usage tracked in real-time via GET /feature-usage/:email",
          "10. Dashboard displays all feature counters for user analytics",
        ],
        endpoints: {
          checkLimit: "GET /api/auth/user-uploads/:email",
          incrementCount: "POST /api/auth/increment-upload",
          incrementBatchAnalysis: "POST /api/auth/increment-batch-analysis",
          incrementCompareResumes: "POST /api/auth/increment-compare-resumes",
          featureUsage: "GET /api/auth/feature-usage/:email",
        },
      },
      cors: {
        allowedOrigins: config.corsOrigins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        headers: ["Content-Type", "Authorization"],
      },
    },

    operationDetails: {
      emailValidation: {
        pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
        requirement: "Valid email format required",
        normalization: "All emails converted to lowercase for consistency",
        appliedTo: [
          "POST /increment-upload",
          "POST /increment-batch-analysis",
          "POST /increment-compare-resumes",
          "GET /user-uploads/:email",
          "GET /feature-usage/:email",
        ],
      },
      atomicIncrement: {
        description: "Database-level atomic increment prevents race conditions",
        implementation: "sql`${column} + 1` executed at database level",
        benefit: "Ensures accurate counting even with concurrent requests",
        appliedTo: ["filesUploaded", "batch_analysis", "compare_resumes"],
        concurrencyGuarantee:
          "100% accuracy with unlimited concurrent requests",
      },
      errorResponses: {
        format: {
          success: "boolean",
          message: "string",
          error: "string (error code)",
          data: "optional (varies by endpoint)",
        },
        commonErrors: {
          invalidEmail: {
            code: "INVALID_EMAIL",
            status: 400,
            message: "Email format validation failed",
          },
          userNotFound: {
            code: "USER_NOT_FOUND",
            status: 404,
            message: "User with specified email does not exist",
          },
          internalError: {
            code: "INTERNAL_ERROR",
            status: 500,
            message: "Database operation or server error",
          },
          unauthorized: {
            code: "UNAUTHORIZED",
            status: 401,
            message: "Authentication required or token invalid",
          },
        },
      },
      responsePatterns: {
        incrementOperations: {
          description: "All POST endpoints return updated counters",
          returns: [
            "success",
            "message",
            "email",
            "filesUploaded",
            "batch_analysis",
            "compare_resumes",
          ],
        },
        getOperations: {
          description: "All GET endpoints return current counter values",
          returns: ["success", "message", "stats (with all counters)"],
        },
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
          filesUploaded: "integer default 0 not null (count of uploaded files)",
          batch_analysis:
            "integer default 0 not null (count of batch analysis operations)",
          compare_resumes:
            "integer default 0 not null (count of resume comparisons)",
          created_at: "timestamp default now()",
          updated_at: "timestamp default now()",
        },
        fieldDescriptions: {
          filesUploaded:
            "Tracks number of resume files uploaded by user (max 10)",
          batch_analysis:
            "Counts how many batch analysis operations user has performed",
          compare_resumes:
            "Counts how many resume comparison operations user has performed",
        },
      },
    },

    performance: {
      uptime: `${Math.floor(process.uptime())} seconds`,
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      environment: config.nodeEnv,
    },

    featureTracking: {
      overview:
        "Complete analytics system for tracking user activities across the JobPsych platform",
      counters: {
        filesUploaded: {
          description: "Resume files uploaded by user",
          limit: "10 files maximum",
          incremented: "When FastAPI successfully processes a file upload",
          tracked: "Yes - for rate limiting and quota management",
          resetCycle: "Never - accumulates indefinitely",
          useCase: "Prevent users from uploading more than 10 resumes",
        },
        batch_analysis: {
          description: "Batch analysis operations performed",
          limit: "Unlimited",
          incremented:
            "When FastAPI completes a batch analysis of multiple resumes",
          tracked: "Yes - for analytics and usage statistics",
          resetCycle: "Never - accumulates indefinitely",
          useCase: "Track feature usage for premium analytics and dashboards",
        },
        compare_resumes: {
          description: "Resume comparison operations performed",
          limit: "Unlimited",
          incremented: "When FastAPI completes a resume comparison operation",
          tracked: "Yes - for analytics and usage statistics",
          resetCycle: "Never - accumulates indefinitely",
          useCase: "Track feature usage for premium analytics and dashboards",
        },
      },
      endpoints: {
        trackUpload: {
          method: "POST",
          path: "/api/auth/increment-upload",
          usedBy: "FastAPI after file upload processing",
          atomic: true,
          description:
            "Increments filesUploaded counter atomically to prevent race conditions",
        },
        trackBatchAnalysis: {
          method: "POST",
          path: "/api/auth/increment-batch-analysis",
          usedBy: "FastAPI after batch analysis completes",
          atomic: true,
          description:
            "Increments batch_analysis counter atomically for analytics",
        },
        trackCompareResumes: {
          method: "POST",
          path: "/api/auth/increment-compare-resumes",
          usedBy: "FastAPI after resume comparison completes",
          atomic: true,
          description:
            "Increments compare_resumes counter atomically for analytics",
        },
        retrieveStats: {
          method: "GET",
          path: "/api/auth/feature-usage/:email",
          usedBy: "Frontend dashboard, analytics, and FastAPI quota checks",
          atomic: false,
          description: "Retrieves consolidated feature usage statistics",
        },
      },
      atomicOperations: {
        description:
          "All increment operations use database-level atomic increments",
        benefit:
          "Prevents race conditions when multiple requests happen simultaneously",
        sqlPattern: "sql`${column} + 1` ensures database handles the increment",
        concurrencySafe: true,
      },
    },

    documentation:
      "Complete authentication and rate limiting system for JobPsych platform. Features JWT authentication, file upload tracking, FastAPI integration, and comprehensive security measures. Built with TypeScript, Express.js, Drizzle ORM, and PostgreSQL.",
  });
});

export default router;
