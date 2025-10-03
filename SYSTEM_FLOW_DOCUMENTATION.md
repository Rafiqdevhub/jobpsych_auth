# 🚀 JobPsych Auth API - Complete System Flow Documentation

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Authentication Flow](#authentication-flow)
6. [Rate Limiting Flow](#rate-limiting-flow)
7. [JWT Verification Flow](#jwt-verification-flow)
8. [API Endpoints](#api-endpoints)
9. [Middleware Flow](#middleware-flow)
10. [Cross-Service Communication](#cross-service-communication)
11. [Security Features](#security-features)
12. [Error Handling](#error-handling)

---

## 🎯 System Overview

**JobPsych Auth API** is a comprehensive authentication and authorization system built for the JobPsych platform. It provides:

- **User Authentication** with JWT access and refresh tokens
- **Rate Limiting** for file uploads (10 files per user)
- **Cross-Service Integration** with FastAPI backend
- **Secure Token Management** with HttpOnly cookies
- **Profile Management** and password reset functionality

**Version:** 2.0.0  
**Database:** NeonDB (PostgreSQL)  
**ORM:** Drizzle ORM  
**Language:** TypeScript  
**Framework:** Express.js

---

## 🏗️ Architecture & Tech Stack

### **Backend Stack**

```
┌─────────────────────────────────────────┐
│         Express.js Server               │
│  ┌────────────────────────────────┐    │
│  │   Authentication Layer         │    │
│  │   - JWT Access Tokens (15m)    │    │
│  │   - Refresh Tokens (7d)        │    │
│  │   - bcrypt Password Hashing    │    │
│  └────────────────────────────────┘    │
│  ┌────────────────────────────────┐    │
│  │   Rate Limiting Layer          │    │
│  │   - Upload Count Tracking      │    │
│  │   - 10 Files per User Limit    │    │
│  └────────────────────────────────┘    │
│  ┌────────────────────────────────┐    │
│  │   Database Layer (Drizzle)     │    │
│  │   - User Management            │    │
│  │   - Token Storage              │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
                  ↕️
        ┌──────────────────┐
        │  NeonDB (Postgres)│
        └──────────────────┘
```

### **Technology Stack**

| Component            | Technology          | Purpose                   |
| -------------------- | ------------------- | ------------------------- |
| **Runtime**          | Node.js             | JavaScript runtime        |
| **Framework**        | Express.js          | Web application framework |
| **Language**         | TypeScript          | Type-safe development     |
| **Database**         | NeonDB (PostgreSQL) | Data persistence          |
| **ORM**              | Drizzle ORM         | Database queries          |
| **Authentication**   | JWT (jsonwebtoken)  | Token-based auth          |
| **Password Hashing** | bcrypt              | Secure password storage   |
| **CORS**             | cors middleware     | Cross-origin requests     |
| **Logging**          | Morgan              | HTTP request logging      |
| **Validation**       | Custom middleware   | Input validation          |

---

## 📁 Project Structure

```
jobpsych_auth/
├── src/
│   ├── index.ts                    # Main application entry point
│   ├── config/
│   │   ├── env.ts                  # Environment configuration
│   │   ├── database.ts             # Database configuration
│   │   └── multer.ts               # File upload configuration
│   ├── controllers/
│   │   ├── authController.ts       # Authentication logic
│   │   ├── rateLimitController.ts  # Rate limiting logic
│   │   ├── jwtController.ts        # JWT verification logic
│   │   └── fileController.ts       # File upload logic
│   ├── middleware/
│   │   └── auth.ts                 # Authentication middleware
│   ├── models/
│   │   ├── users.model.ts          # User database schema
│   │   └── files.model.ts          # Files database schema
│   ├── routes/
│   │   ├── authRoutes.ts           # Authentication routes
│   │   ├── rateLimitRoutes.ts      # Rate limiting routes
│   │   └── fileRoutes.ts           # File upload routes
│   ├── types/
│   │   └── auth.ts                 # TypeScript type definitions
│   ├── utils/
│   │   └── auth.ts                 # Authentication utilities
│   └── db/
│       └── index.ts                # Database connection
├── tests/                          # Test files
├── drizzle/                        # Database migrations
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript configuration
└── vercel.json                     # Vercel deployment config
```

---

## 💾 Database Schema

### **Users Table**

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  company_name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,           -- bcrypt hashed
  refresh_token VARCHAR(255),               -- bcrypt hashed
  files_uploaded INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_files_uploaded ON users(files_uploaded);
```

### **User Model (Drizzle ORM)**

```typescript
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  company_name: varchar("company_name", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  refreshToken: varchar("refresh_token", { length: 255 }),
  filesUploaded: integer("files_uploaded").default(0).notNull(),
  created_at: timestamp().defaultNow().notNull(),
  updated_at: timestamp().defaultNow().notNull(),
});
```

---

## 🔐 Authentication Flow

### **1. User Registration Flow**

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB
    participant Utils

    Client->>API: POST /api/auth/register
    Note right of Client: { name, email, password, company_name }

    API->>API: Validate input fields
    API->>DB: Check if email exists

    alt Email exists
        DB-->>API: User found
        API-->>Client: 409 Conflict
    else Email not found
        API->>Utils: hashPassword(password)
        Utils-->>API: hashedPassword

        API->>Utils: generateRefreshToken()
        Utils-->>API: refreshToken

        API->>Utils: hashRefreshToken(refreshToken)
        Utils-->>API: hashedRefreshToken

        API->>DB: INSERT user
        DB-->>API: New user data

        API->>Utils: generateAccessToken({userId, email})
        Utils-->>API: accessToken

        API->>API: Set refresh token cookie (HttpOnly)
        API-->>Client: 201 Created + accessToken + user data
    end
```

**Request:**

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "company_name": "Acme Corp"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "name": "John Doe",
    "email": "john@example.com",
    "company_name": "Acme Corp",
    "filesUploaded": 0
  }
}
```

**Cookies Set:**

```
refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...;
HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/api/auth
```

---

### **2. User Login Flow**

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB
    participant Utils

    Client->>API: POST /api/auth/login
    Note right of Client: { email, password }

    API->>API: Validate input
    API->>DB: Find user by email

    alt User not found
        DB-->>API: No user
        API-->>Client: 401 Unauthorized
    else User found
        DB-->>API: User data
        API->>Utils: verifyPassword(password, hashedPassword)

        alt Password invalid
            Utils-->>API: false
            API-->>Client: 401 Unauthorized
        else Password valid
            Utils-->>API: true

            API->>Utils: generateAccessToken({userId, email})
            Utils-->>API: accessToken

            API->>Utils: generateRefreshToken()
            Utils-->>API: refreshToken

            API->>Utils: hashRefreshToken(refreshToken)
            Utils-->>API: hashedRefreshToken

            API->>DB: UPDATE user.refreshToken
            DB-->>API: Updated

            API->>API: Set refresh token cookie
            API-->>Client: 200 OK + accessToken + user data
        end
    end
```

**Request:**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "name": "John Doe",
    "email": "john@example.com",
    "company_name": "Acme Corp",
    "filesUploaded": 2
  }
}
```

---

### **3. Token Refresh Flow**

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB
    participant Utils

    Client->>API: POST /api/auth/refresh
    Note right of Client: Cookie: refreshToken

    API->>API: Extract refresh token from cookie

    alt No token
        API-->>Client: 401 Unauthorized
    else Token exists
        API->>Utils: verifyRefreshTokenSignature(token)

        alt Invalid signature
            Utils-->>API: Error
            API-->>Client: 401 Unauthorized
        else Valid signature
            Utils-->>API: Decoded
            API->>DB: Find user with refresh token

            alt User not found
                DB-->>API: No user
                API-->>Client: 401 Unauthorized
            else User found
                DB-->>API: User data
                API->>Utils: verifyRefreshToken(token, hashedToken)

                alt Token doesn't match
                    Utils-->>API: false
                    API-->>Client: 401 Unauthorized
                else Token matches
                    Utils-->>API: true

                    API->>Utils: generateAccessToken({userId, email})
                    Utils-->>API: New accessToken

                    API->>Utils: generateRefreshToken()
                    Utils-->>API: New refreshToken

                    API->>Utils: hashRefreshToken(newRefreshToken)
                    Utils-->>API: hashedRefreshToken

                    API->>DB: UPDATE user.refreshToken
                    DB-->>API: Updated

                    API->>API: Set new refresh token cookie
                    API-->>Client: 200 OK + new accessToken
                end
            end
        end
    end
```

**Token Rotation Strategy:**

- Every refresh generates **NEW** access and refresh tokens
- Old refresh token is invalidated
- Enhances security by limiting token lifetime

---

### **4. Logout Flow**

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB

    Client->>API: POST /api/auth/logout
    Note right of Client: Cookie: refreshToken (optional)

    API->>API: Extract refresh token from cookie

    alt Token exists
        API->>DB: Find user with refresh token
        DB-->>API: User data
        API->>DB: UPDATE user.refreshToken = NULL
        DB-->>API: Updated
    end

    API->>API: Clear refresh token cookie
    API-->>Client: 200 OK
    Note right of Client: Client should delete accessToken
```

---

### **5. Protected Route Access Flow**

```mermaid
sequenceDiagram
    participant Client
    participant Middleware
    participant Utils
    participant Controller
    participant DB

    Client->>Middleware: GET /api/auth/profile
    Note right of Client: Authorization: Bearer <accessToken>

    Middleware->>Middleware: Extract token from header

    alt No token
        Middleware-->>Client: 401 Unauthorized
    else Token exists
        Middleware->>Utils: verifyAccessToken(token)

        alt Invalid/Expired token
            Utils-->>Middleware: Error
            Middleware-->>Client: 401 Unauthorized
        else Valid token
            Utils-->>Middleware: Decoded payload {userId, email}
            Middleware->>Middleware: Attach user to req.user
            Middleware->>Controller: next()

            Controller->>DB: Find user by email
            DB-->>Controller: User data
            Controller-->>Client: 200 OK + user profile
        end
    end
```

---

## ⏱️ Rate Limiting Flow

### **1. Check Upload Count Flow (FastAPI Integration)**

```mermaid
sequenceDiagram
    participant FastAPI
    participant AuthAPI
    participant DB

    FastAPI->>AuthAPI: GET /api/auth/user-uploads/:email
    Note right of FastAPI: Check before processing file

    AuthAPI->>AuthAPI: Validate email format
    AuthAPI->>DB: SELECT filesUploaded FROM users WHERE email = ?

    alt User not found
        DB-->>AuthAPI: No user
        AuthAPI-->>FastAPI: 404 + filesUploaded: 0
    else User found
        DB-->>AuthAPI: User data
        AuthAPI->>AuthAPI: Calculate remaining = limit - filesUploaded
        AuthAPI-->>FastAPI: 200 OK
        Note left of AuthAPI: { filesUploaded: 3, limit: 10, remaining: 7 }

        alt remaining > 0
            FastAPI->>FastAPI: Process file upload
            FastAPI->>AuthAPI: POST /api/auth/increment-upload
        else remaining <= 0
            FastAPI-->>FastAPI: Return 429 Too Many Requests
        end
    end
```

**Request (from FastAPI):**

```http
GET /api/auth/user-uploads/john@example.com
```

**Response:**

```json
{
  "success": true,
  "email": "john@example.com",
  "filesUploaded": 3,
  "limit": 10,
  "remaining": 7,
  "message": "Upload statistics retrieved successfully"
}
```

---

### **2. Increment Upload Count Flow**

```mermaid
sequenceDiagram
    participant FastAPI
    participant AuthAPI
    participant DB

    FastAPI->>AuthAPI: POST /api/auth/increment-upload
    Note right of FastAPI: After successful file processing
    Note right of FastAPI: { email: "john@example.com" }

    AuthAPI->>AuthAPI: Validate email
    AuthAPI->>DB: UPDATE users SET filesUploaded = filesUploaded + 1
    Note right of DB: Atomic increment operation

    alt User not found
        DB-->>AuthAPI: No rows updated
        AuthAPI-->>FastAPI: 404 User Not Found
    else Success
        DB-->>AuthAPI: Updated user data
        AuthAPI->>AuthAPI: Calculate new remaining
        AuthAPI-->>FastAPI: 200 OK
        Note left of AuthAPI: { filesUploaded: 4, remaining: 6 }
    end
```

**Request (from FastAPI):**

```http
POST /api/auth/increment-upload
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Upload count incremented successfully",
  "email": "john@example.com",
  "filesUploaded": 4,
  "limit": 10,
  "remaining": 6
}
```

---

### **3. Get Upload Stats Flow (Authenticated)**

```mermaid
sequenceDiagram
    participant Client
    participant Middleware
    participant API
    participant DB

    Client->>Middleware: GET /api/auth/upload-stats
    Note right of Client: Authorization: Bearer <accessToken>

    Middleware->>Middleware: Verify JWT token
    Middleware->>API: next() with req.user

    API->>DB: SELECT * FROM users WHERE email = req.user.email
    DB-->>API: User data

    API->>API: Calculate statistics
    Note right of API: percentage, canUpload, etc.

    API-->>Client: 200 OK + detailed stats
```

**Response:**

```json
{
  "success": true,
  "stats": {
    "email": "john@example.com",
    "name": "John Doe",
    "totalUploads": 4,
    "limit": 10,
    "remaining": 6,
    "percentage": 40,
    "canUpload": true
  }
}
```

---

## 🔍 JWT Verification Flow

### **1. Verify Token Endpoint Flow**

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Utils

    Client->>API: POST /api/auth/verify-token
    Note right of Client: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }

    API->>API: Validate token presence
    API->>Utils: jwt.verify(token, JWT_ACCESS_SECRET)

    alt Invalid/Expired token
        Utils-->>API: Error
        API-->>Client: 401 Unauthorized
        Note left of API: { success: false, error: "TOKEN_VERIFICATION_FAILED" }
    else Valid token
        Utils-->>API: Decoded payload
        API-->>Client: 200 OK
        Note left of API: { success: true, decoded: { userId, email, iat, exp } }
    end
```

**Purpose:** Debug 403 Forbidden errors in cross-service communication

---

### **2. Get JWT Info Flow**

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Config

    Client->>API: GET /api/auth/jwt-info

    API->>Config: Get JWT configuration
    Config-->>API: JWT settings

    API->>API: Format response
    Note right of API: Include secret length, first/last chars

    API-->>Client: 200 OK + JWT info
```

**Response:**

```json
{
  "success": true,
  "message": "JWT configuration information",
  "jwtInfo": {
    "algorithm": "HS256",
    "accessTokenExpiry": "15m",
    "refreshTokenExpiry": "7d",
    "secretLength": 64,
    "secretFirstChars": "343164a0c3",
    "secretLastChars": "665cbe75a",
    "environment": "development",
    "timestamp": "2025-10-03T05:00:00.000Z"
  },
  "note": "Share this info with FastAPI team to ensure JWT secrets match"
}
```

**Purpose:** Compare JWT configurations between Express.js and FastAPI

---

## 🛣️ API Endpoints

### **Authentication Endpoints**

| Method | Endpoint                    | Auth Required | Description          |
| ------ | --------------------------- | ------------- | -------------------- |
| POST   | `/api/auth/register`        | ❌ No         | Register new user    |
| POST   | `/api/auth/login`           | ❌ No         | Login user           |
| POST   | `/api/auth/refresh`         | 🍪 Cookie     | Refresh access token |
| POST   | `/api/auth/logout`          | ❌ No         | Logout user          |
| POST   | `/api/auth/reset-password`  | ❌ No         | Reset password       |
| POST   | `/api/auth/change-password` | ✅ Yes        | Change password      |
| GET    | `/api/auth/profile`         | ✅ Yes        | Get user profile     |

### **Rate Limiting Endpoints**

| Method | Endpoint                        | Auth Required | Description                |
| ------ | ------------------------------- | ------------- | -------------------------- |
| GET    | `/api/auth/user-uploads/:email` | ❌ No         | Get upload count (FastAPI) |
| POST   | `/api/auth/increment-upload`    | ❌ No         | Increment count (FastAPI)  |
| GET    | `/api/auth/upload-stats`        | ✅ Yes        | Get detailed stats         |

### **JWT Verification Endpoints**

| Method | Endpoint                 | Auth Required | Description         |
| ------ | ------------------------ | ------------- | ------------------- |
| POST   | `/api/auth/verify-token` | ❌ No         | Verify JWT token    |
| GET    | `/api/auth/jwt-info`     | ❌ No         | Get JWT config info |

### **File Management Endpoints**

| Method | Endpoint            | Auth Required | Description    |
| ------ | ------------------- | ------------- | -------------- |
| POST   | `/api/files/upload` | ✅ Yes        | Upload file    |
| GET    | `/api/files/stats`  | ✅ Yes        | Get file stats |

### **System Endpoints**

| Method | Endpoint  | Auth Required | Description       |
| ------ | --------- | ------------- | ----------------- |
| GET    | `/`       | ❌ No         | API documentation |
| GET    | `/health` | ❌ No         | Health check      |

---

## 🔄 Middleware Flow

### **Authentication Middleware**

```typescript
// Flow: Request → Middleware → Controller

export const authenticate = (req, res, next) => {
  1. Extract token from Authorization header
     ↓
  2. Check if token exists
     ├─ No → Return 401 Unauthorized
     └─ Yes → Continue
     ↓
  3. Verify token with JWT_ACCESS_SECRET
     ├─ Invalid/Expired → Return 401 Unauthorized
     └─ Valid → Continue
     ↓
  4. Decode token payload {userId, email}
     ↓
  5. Attach to req.user
     ↓
  6. Call next() → Pass to controller
}
```

**Usage in Routes:**

```typescript
router.get("/profile", authenticate, getProfile);
router.post("/change-password", authenticate, changePassword);
router.get("/upload-stats", authenticate, getUploadStats);
```

---

## 🌐 Cross-Service Communication

### **Express.js ↔ FastAPI Integration**

```mermaid
graph TB
    A[Frontend] -->|1. Login| B[Express.js Auth API]
    B -->|2. JWT Token| A
    A -->|3. Upload File + JWT| C[FastAPI Backend]
    C -->|4. Verify JWT| C
    C -->|5. Check Upload Limit| B
    B -->|6. Upload Count| C
    C -->|7. Process File| C
    C -->|8. Increment Count| B
    B -->|9. Updated Count| C
    C -->|10. Success Response| A
```

### **Complete Integration Flow**

1. **User Authentication (Express.js)**

   - Frontend calls `POST /api/auth/login`
   - Express.js validates credentials
   - Returns JWT access token

2. **File Upload Request (Frontend → FastAPI)**

   - Frontend sends file + JWT to FastAPI
   - `Authorization: Bearer <accessToken>`

3. **JWT Verification (FastAPI)**

   - FastAPI verifies JWT signature
   - Uses same `JWT_SECRET` as Express.js
   - Extracts user email from token

4. **Rate Limit Check (FastAPI → Express.js)**

   - FastAPI calls `GET /api/auth/user-uploads/:email`
   - Express.js returns current upload count
   - FastAPI checks if limit reached

5. **File Processing (FastAPI)**

   - If under limit, process file
   - If over limit, return 429 Too Many Requests

6. **Update Upload Count (FastAPI → Express.js)**

   - After successful processing
   - FastAPI calls `POST /api/auth/increment-upload`
   - Express.js atomically increments counter

7. **Response to Frontend**
   - FastAPI returns success/error
   - Includes updated upload statistics

### **CORS Configuration**

```typescript
corsOrigins: [
  "https://hiredesk.vercel.app", // Frontend
  "http://localhost:3000", // Local Frontend
  "http://localhost:8000", // Local FastAPI
  "https://jobpsych-ai.vercel.app", // Production Frontend
  "https://hr-resume-analyzer-backend.vercel.app", // FastAPI Backend
];
```

### **JWT Secret Synchronization**

**Critical:** Both services MUST use the **EXACT same JWT_SECRET**

**Express.js (.env):**

```env
JWT_ACCESS_SECRET=343164a0c3169c9defa93088fddfc759dbda6f11cd0322c67a7c086665cbe75a
JWT_SECRET=343164a0c3169c9defa93088fddfc759dbda6f11cd0322c67a7c086665cbe75a
```

**FastAPI (.env):**

```env
JWT_SECRET=343164a0c3169c9defa93088fddfc759dbda6f11cd0322c67a7c086665cbe75a
```

**Verification:**

```bash
# Check Express.js JWT config
curl http://localhost:5000/api/auth/jwt-info

# Compare secretLength and first/last characters
# They MUST match FastAPI's configuration
```

---

## 🔒 Security Features

### **1. Password Security**

- **Hashing Algorithm:** bcrypt
- **Salt Rounds:** 12
- **Storage:** Never store plain text passwords

```typescript
// Registration/Password Change
password → bcrypt.hash(password, 12) → Store in DB

// Login
userInputPassword → bcrypt.compare(input, dbHash) → true/false
```

### **2. Token Security**

**Access Tokens:**

- **Algorithm:** HS256
- **Expiry:** 15 minutes
- **Storage:** Client-side (localStorage/memory)
- **Transmission:** Authorization header

**Refresh Tokens:**

- **Algorithm:** HS256
- **Expiry:** 7 days
- **Storage:** HttpOnly cookie (secure)
- **Transmission:** Automatic (cookie)
- **Hashing:** bcrypt before DB storage

**Token Rotation:**

- New tokens generated on each refresh
- Old tokens invalidated immediately

### **3. Cookie Security**

```typescript
{
  httpOnly: true,           // No JavaScript access
  secure: true,             // HTTPS only (production)
  sameSite: "strict",       // CSRF protection
  maxAge: 604800000,        // 7 days
  path: "/api/auth"         // Limited scope
}
```

### **4. CORS Protection**

- Whitelist-based origin control
- Credentials support enabled
- Pre-flight request handling

### **5. Rate Limiting**

- 10 file uploads per user
- Atomic counter operations
- FastAPI enforces limits

### **6. Input Validation**

- Email format validation
- Required field checks
- SQL injection prevention (ORM)

### **7. Error Handling**

- Production: Sanitized error messages
- Development: Detailed error info
- No sensitive data in responses

---

## ⚠️ Error Handling

### **Error Response Format**

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "ERROR_CODE",
  "details": "Additional info (development only)"
}
```

### **HTTP Status Codes**

| Code | Meaning               | Use Case                 |
| ---- | --------------------- | ------------------------ |
| 200  | OK                    | Successful request       |
| 201  | Created               | User registered          |
| 400  | Bad Request           | Invalid input            |
| 401  | Unauthorized          | Invalid/missing token    |
| 403  | Forbidden             | Insufficient permissions |
| 404  | Not Found             | Resource doesn't exist   |
| 409  | Conflict              | Email already exists     |
| 422  | Unprocessable Entity  | Validation error         |
| 429  | Too Many Requests     | Rate limit exceeded      |
| 500  | Internal Server Error | Server error             |

### **Error Codes**

- `VALIDATION_ERROR` - Input validation failed
- `USER_NOT_FOUND` - User doesn't exist
- `INVALID_CREDENTIALS` - Wrong email/password
- `TOKEN_VERIFICATION_FAILED` - Invalid JWT
- `UPLOAD_LIMIT_REACHED` - Rate limit exceeded
- `SERVER_ERROR` - Internal error

---

## 🚀 Deployment Flow

### **Environment Variables**

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# JWT Configuration (MUST MATCH FASTAPI)
JWT_ACCESS_SECRET=your_64_char_secret_here
JWT_SECRET=your_64_char_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGINS=https://hiredesk.vercel.app,https://jobpsych-ai.vercel.app

# Rate Limiting
UPLOAD_LIMIT=10
```

### **Vercel Deployment**

1. **Connect GitHub Repository**
2. **Configure Environment Variables**
   - Add all secrets in Vercel dashboard
   - Select: Production, Preview, Development
3. **Deploy**
   - Auto-deploys on git push
4. **Verify**
   - Check `GET /health` endpoint
   - Test `GET /api/auth/jwt-info`

---

## 📊 System Monitoring

### **Health Check**

```bash
curl https://your-api.vercel.app/health
```

**Response:**

```json
{
  "status": "OK",
  "service": "jobpsych-auth-api",
  "uptime": 12345.67,
  "timestamp": "2025-10-03T05:00:00.000Z",
  "version": "2.0.0",
  "environment": "production",
  "database": "connected",
  "features": {
    "authentication": "active",
    "rateLimiting": "active",
    "fileUploads": "active",
    "fastapiIntegration": "active"
  }
}
```

### **JWT Configuration Check**

```bash
curl https://your-api.vercel.app/api/auth/jwt-info
```

---

## 🎯 Best Practices

### **For Frontend Developers**

1. Store access token in memory or localStorage
2. Send token in `Authorization: Bearer <token>` header
3. Handle 401 errors → Refresh token
4. Clear tokens on logout

### **For FastAPI Developers**

1. Use same JWT_SECRET as Express.js
2. Check upload limit before processing
3. Increment count after successful upload
4. Handle rate limit errors gracefully

### **For DevOps**

1. Keep JWT secrets in sync across services
2. Use environment variables (never hardcode)
3. Monitor `/health` endpoint
4. Set up logging and error tracking

---

## 📚 Additional Resources

- **API Documentation:** `GET /` endpoint
- **Health Check:** `GET /health`
- **JWT Verification:** `POST /api/auth/verify-token`
- **JWT Config:** `GET /api/auth/jwt-info`

---

## 🎉 Summary

This JobPsych Auth API provides a complete authentication and authorization system with:

✅ **Secure JWT-based authentication**  
✅ **Rate limiting for file uploads**  
✅ **Cross-service integration with FastAPI**  
✅ **Automatic token rotation**  
✅ **HttpOnly secure cookies**  
✅ **Comprehensive error handling**  
✅ **Production-ready deployment**

**Version:** 2.0.0  
**Last Updated:** October 3, 2025

---

**For questions or issues, refer to:**

- `FIX_403_FORBIDDEN.md` - Troubleshooting guide
- `QUICK_START_FIX_403.md` - Quick reference
- API documentation at `/` endpoint
