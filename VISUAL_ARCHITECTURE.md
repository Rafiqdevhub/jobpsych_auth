# 🎨 JobPsych Auth API - Visual Architecture Guide

This document provides visual representations of the system architecture, flows, and interactions.

---

## 📐 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        JOBPSYCH AUTH API                             │
│                         (Express.js)                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                    ENTRY POINT                              │    │
│  │                    src/index.ts                             │    │
│  │  • CORS Configuration                                       │    │
│  │  • Cookie Parser                                            │    │
│  │  • Morgan Logger                                            │    │
│  │  • JSON Parser                                              │    │
│  └─────────────────────┬──────────────────────────────────────┘    │
│                        │                                             │
│  ┌─────────────────────┴──────────────────────────────────────┐    │
│  │                    ROUTING LAYER                            │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │  • /api/auth/*     → authRoutes.ts                         │    │
│  │  • /api/auth/*     → rateLimitRoutes.ts                    │    │
│  │  • /api/files/*    → fileRoutes.ts                         │    │
│  │  • /              → API Documentation                       │    │
│  │  • /health        → Health Check                           │    │
│  └─────────────────────┬──────────────────────────────────────┘    │
│                        │                                             │
│  ┌─────────────────────┴──────────────────────────────────────┐    │
│  │                 MIDDLEWARE LAYER                            │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │  authenticate()                                             │    │
│  │  ├─ Extract JWT from Authorization header                  │    │
│  │  ├─ Verify token signature                                 │    │
│  │  ├─ Decode payload {userId, email}                         │    │
│  │  └─ Attach to req.user → pass to controller               │    │
│  └─────────────────────┬──────────────────────────────────────┘    │
│                        │                                             │
│  ┌─────────────────────┴──────────────────────────────────────┐    │
│  │              CONTROLLER LAYER                               │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │                                                             │    │
│  │  ┌──────────────────┐  ┌──────────────────┐               │    │
│  │  │ authController   │  │ rateLimitCtrl    │               │    │
│  │  ├──────────────────┤  ├──────────────────┤               │    │
│  │  │ • register()     │  │ • getUserUploads │               │    │
│  │  │ • login()        │  │ • incrementUpload│               │    │
│  │  │ • refresh()      │  │ • getUploadStats │               │    │
│  │  │ • logout()       │  └──────────────────┘               │    │
│  │  │ • resetPassword()│                                       │    │
│  │  │ • changePassword │  ┌──────────────────┐               │    │
│  │  │ • getProfile()   │  │  jwtController   │               │    │
│  │  └──────────────────┘  ├──────────────────┤               │    │
│  │                         │ • verifyToken()  │               │    │
│  │                         │ • getJWTInfo()   │               │    │
│  │                         └──────────────────┘               │    │
│  │                                                             │    │
│  └─────────────────────┬──────────────────────────────────────┘    │
│                        │                                             │
│  ┌─────────────────────┴──────────────────────────────────────┐    │
│  │                 UTILITY LAYER                               │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │  utils/auth.ts                                              │    │
│  │  ├─ hashPassword()                                          │    │
│  │  ├─ verifyPassword()                                        │    │
│  │  ├─ generateAccessToken()     (HS256, 15m)                 │    │
│  │  ├─ generateRefreshToken()    (HS256, 7d)                  │    │
│  │  ├─ verifyAccessToken()                                     │    │
│  │  ├─ verifyRefreshToken()                                    │    │
│  │  └─ extractTokenFromHeader()                               │    │
│  └─────────────────────┬──────────────────────────────────────┘    │
│                        │                                             │
│  ┌─────────────────────┴──────────────────────────────────────┐    │
│  │              DATABASE LAYER (Drizzle ORM)                   │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │  db/index.ts → NeonDB Connection                           │    │
│  │  models/users.model.ts → User Schema                       │    │
│  │  models/files.model.ts → Files Schema                      │    │
│  └─────────────────────┬──────────────────────────────────────┘    │
│                        │                                             │
└────────────────────────┼─────────────────────────────────────────────┘
                         │
                         ↓
              ┌──────────────────────┐
              │   NeonDB (PostgreSQL) │
              │  ┌─────────────────┐  │
              │  │  users table    │  │
              │  │  • id           │  │
              │  │  • email        │  │
              │  │  • password     │  │
              │  │  • refreshToken │  │
              │  │  • filesUploaded│  │
              │  └─────────────────┘  │
              └──────────────────────┘
```

---

## 🔄 Complete Request Flow

```
┌─────────────┐
│   CLIENT    │
│  (Frontend) │
└──────┬──────┘
       │
       │ 1. HTTP Request
       │    POST /api/auth/login
       ↓
┌──────────────────────────────────────┐
│         EXPRESS.js SERVER            │
│                                      │
│  ┌─────────────────────────────┐   │
│  │    CORS Middleware          │   │
│  │    ✓ Check origin           │   │
│  │    ✓ Allow credentials      │   │
│  └──────────┬──────────────────┘   │
│             │                        │
│  ┌──────────┴──────────────────┐   │
│  │    Body Parser              │   │
│  │    ✓ Parse JSON             │   │
│  └──────────┬──────────────────┘   │
│             │                        │
│  ┌──────────┴──────────────────┐   │
│  │    Router                   │   │
│  │    ✓ Match route            │   │
│  │    ✓ /api/auth/login        │   │
│  └──────────┬──────────────────┘   │
│             │                        │
│  ┌──────────┴──────────────────┐   │
│  │  Middleware (if protected)  │   │
│  │  ✓ Extract JWT token        │   │
│  │  ✓ Verify signature         │   │
│  │  ✓ Attach req.user          │   │
│  └──────────┬──────────────────┘   │
│             │                        │
│  ┌──────────┴──────────────────┐   │
│  │    Controller               │   │
│  │    • Process business logic │   │
│  │    • Validate input         │   │
│  │    • Call database          │   │
│  │    • Generate response      │   │
│  └──────────┬──────────────────┘   │
│             │                        │
│  ┌──────────┴──────────────────┐   │
│  │    Database (Drizzle ORM)   │   │
│  │    • Execute query          │   │
│  │    • Return data            │   │
│  └──────────┬──────────────────┘   │
│             │                        │
└─────────────┼────────────────────────┘
              │
              │ 2. HTTP Response
              │    200 OK + JSON
              ↓
       ┌──────────────┐
       │   CLIENT     │
       └──────────────┘
```

---

## 🔐 Authentication Flow Diagram

```
REGISTRATION FLOW
─────────────────

Client                  API                     Database              Utils
  │                      │                          │                  │
  ├─ POST /register ────>│                          │                  │
  │  {email, password}   │                          │                  │
  │                      ├─ Check email exists ────>│                  │
  │                      │<── User exists? ─────────┤                  │
  │                      │                          │                  │
  │                      │  IF NOT EXISTS:          │                  │
  │                      ├─ hashPassword() ────────────────────────────>│
  │                      │<── hashedPassword ───────────────────────────┤
  │                      │                          │                  │
  │                      ├─ generateRefreshToken()─────────────────────>│
  │                      │<── refreshToken ─────────────────────────────┤
  │                      │                          │                  │
  │                      ├─ INSERT user ───────────>│                  │
  │                      │<── New user data ────────┤                  │
  │                      │                          │                  │
  │                      ├─ generateAccessToken()──────────────────────>│
  │                      │<── accessToken ──────────────────────────────┤
  │                      │                          │                  │
  │<── 201 Created ──────┤                          │                  │
  │    + accessToken     │                          │                  │
  │    + Set-Cookie      │                          │                  │
  │    + user data       │                          │                  │
  │                      │                          │                  │


LOGIN FLOW
──────────

Client                  API                     Database              Utils
  │                      │                          │                  │
  ├─ POST /login ───────>│                          │                  │
  │  {email, password}   │                          │                  │
  │                      ├─ Find user ─────────────>│                  │
  │                      │<── User data ────────────┤                  │
  │                      │                          │                  │
  │                      ├─ verifyPassword() ──────────────────────────>│
  │                      │<── true/false ───────────────────────────────┤
  │                      │                          │                  │
  │                      │  IF VALID:               │                  │
  │                      ├─ generateAccessToken()──────────────────────>│
  │                      │<── accessToken ──────────────────────────────┤
  │                      │                          │                  │
  │                      ├─ generateRefreshToken()─────────────────────>│
  │                      │<── refreshToken ─────────────────────────────┤
  │                      │                          │                  │
  │                      ├─ UPDATE refresh token ──>│                  │
  │                      │<── Updated ──────────────┤                  │
  │                      │                          │                  │
  │<── 200 OK ───────────┤                          │                  │
  │    + accessToken     │                          │                  │
  │    + Set-Cookie      │                          │                  │
  │    + user data       │                          │                  │
  │                      │                          │                  │


TOKEN REFRESH FLOW
──────────────────

Client                  API                     Database              Utils
  │                      │                          │                  │
  ├─ POST /refresh ─────>│                          │                  │
  │  Cookie: refreshToken│                          │                  │
  │                      │                          │                  │
  │                      ├─ Extract from cookie     │                  │
  │                      ├─ verifyRefreshToken() ──────────────────────>│
  │                      │<── decoded/error ────────────────────────────┤
  │                      │                          │                  │
  │                      ├─ Find user with token ──>│                  │
  │                      │<── User data ────────────┤                  │
  │                      │                          │                  │
  │                      ├─ Compare hashed tokens ─────────────────────>│
  │                      │<── true/false ───────────────────────────────┤
  │                      │                          │                  │
  │                      │  IF VALID:               │                  │
  │                      ├─ generateAccessToken()──────────────────────>│
  │                      │<── NEW accessToken ──────────────────────────┤
  │                      │                          │                  │
  │                      ├─ generateRefreshToken()─────────────────────>│
  │                      │<── NEW refreshToken ─────────────────────────┤
  │                      │                          │                  │
  │                      ├─ UPDATE refresh token ──>│                  │
  │                      │<── Updated ──────────────┤                  │
  │                      │                          │                  │
  │<── 200 OK ───────────┤                          │                  │
  │    + NEW accessToken │                          │                  │
  │    + NEW Set-Cookie  │  (Token Rotation!)       │                  │
  │                      │                          │                  │
```

---

## 📊 Rate Limiting Flow

```
FASTAPI INTEGRATION FLOW
─────────────────────────

Frontend            FastAPI Backend         Express Auth API         Database
   │                      │                        │                      │
   │                      │                        │                      │
   ├─ 1. Login ──────────────────────────────────>│                      │
   │                      │                        ├─ Authenticate ──────>│
   │                      │                        │<── User data ────────┤
   │<─ JWT Token ─────────────────────────────────┤                      │
   │                      │                        │                      │
   │                      │                        │                      │
   ├─ 2. Upload File + JWT ─────────────────────>│                      │
   │    with Resume       │                        │                      │
   │                      │                        │                      │
   │                      ├─ 3. Verify JWT ────────>│                    │
   │                      │    (Check signature)    │                    │
   │                      │<── Valid ───────────────┤                    │
   │                      │                         │                    │
   │                      ├─ 4. Check Limit ────────>│                   │
   │                      │    GET /user-uploads/   │                    │
   │                      │                         ├─ Query count ─────>│
   │                      │                         │<── filesUploaded ──┤
   │                      │<── Count: 3/10 ─────────┤                    │
   │                      │                         │                    │
   │                      │  IF count < 10:         │                    │
   │                      ├─ 5. Process File        │                    │
   │                      │    (AI Analysis)        │                    │
   │                      │                         │                    │
   │                      ├─ 6. Increment Count ───>│                    │
   │                      │    POST /increment      │                    │
   │                      │                         ├─ UPDATE + 1 ──────>│
   │                      │                         │<── New count: 4 ───┤
   │                      │<── Updated: 4/10 ───────┤                    │
   │                      │                         │                    │
   │<─ 7. Success + Results ──────────────────────┤                    │
   │    (Analysis data)   │                         │                    │
   │                      │                         │                    │
   │                      │  IF count >= 10:        │                    │
   │                      ├─ X. Return 429          │                    │
   │<─ 8. Rate Limited ───┤    Too Many Requests    │                    │
   │                      │                         │                    │
```

---

## 🔍 Middleware Authentication Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    PROTECTED ENDPOINT REQUEST                     │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ↓
                    ┌─────────────────┐
                    │ Client Request  │
                    │ GET /profile    │
                    │ Authorization:  │
                    │ Bearer <token>  │
                    └────────┬────────┘
                             │
                             ↓
        ┌────────────────────────────────────────────┐
        │      AUTHENTICATE MIDDLEWARE               │
        ├────────────────────────────────────────────┤
        │                                            │
        │  1. Extract Authorization Header           │
        │     ↓                                       │
        │  2. Parse "Bearer <token>"                 │
        │     ↓                                       │
        │  3. Token exists?                          │
        │     ├─ NO ──→ Return 401 Unauthorized     │
        │     └─ YES                                  │
        │        ↓                                    │
        │  4. jwt.verify(token, JWT_ACCESS_SECRET)   │
        │     ├─ Invalid ──→ Return 401              │
        │     └─ Valid                                │
        │        ↓                                    │
        │  5. Decode payload                         │
        │     { userId: "123", email: "user@ex.com" }│
        │        ↓                                    │
        │  6. Attach to request                      │
        │     req.user = decoded                     │
        │        ↓                                    │
        │  7. Call next() ──→ Pass to Controller    │
        │                                            │
        └────────────────────────────────────────────┘
                             │
                             ↓
                    ┌─────────────────┐
                    │   Controller    │
                    │  Can access:    │
                    │  req.user.email │
                    │  req.user.userId│
                    └─────────────────┘
```

---

## 🌐 Cross-Service JWT Verification

```
EXPRESS.js JWT CONFIGURATION
────────────────────────────
┌─────────────────────────────────────────┐
│  JWT_ACCESS_SECRET = "343164a0c3..."    │  ← MUST MATCH
│  Algorithm: HS256                        │
│  Expiry: 15 minutes                      │
└─────────────────────────────────────────┘
                │
                │ Generates JWT
                ↓
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ────────────────────────────────────────
   Header      Payload           Signature
   (HS256)     (userId, email)   (HMAC SHA256)
                │
                │
                ↓
┌─────────────────────────────────────────┐
│  FastAPI JWT Verification                │
├─────────────────────────────────────────┤
│  JWT_SECRET = "343164a0c3..."           │  ← MUST MATCH
│  Algorithm: HS256                        │
│                                          │
│  jwt.decode(token, JWT_SECRET, HS256)   │
│     ↓                                    │
│  ✅ Valid → Process request             │
│  ❌ Invalid → 403 Forbidden             │
└─────────────────────────────────────────┘


TROUBLESHOOTING FLOW
────────────────────

        403 Forbidden Error?
              │
              ↓
    ┌─────────────────────┐
    │ GET /jwt-info       │ ← Check Express.js config
    └──────────┬──────────┘
               │
               ↓
    Compare:
    • secretLength (should be 64)
    • secretFirstChars
    • secretLastChars
               │
               ↓
    ┌─────────────────────┐
    │ Do they match       │
    │ FastAPI's secret?   │
    └──────────┬──────────┘
               │
     ┌─────────┴─────────┐
     │                   │
    YES                 NO
     │                   │
     ↓                   ↓
  ✅ Good!          ❌ FIX SECRETS
  Test with         Update .env
  /verify-token     Restart servers
```

---

## 📦 Data Flow Through System

```
USER REGISTRATION DATA FLOW
───────────────────────────

Input (Client)                    Processing                    Storage (DB)
──────────────                    ──────────                    ────────────

{                                 ┌──────────────┐
  name: "John"      ────────────>│   Validate   │
  email: "john@ex"  ────────────>│   Required   │
  password: "pass"  ────────────>│   Fields     │
  company: "Acme"   ────────────>│              │
}                                 └──────┬───────┘
                                         │
                                         ↓
                                  ┌──────────────┐
                                  │ Check Exists │
                                  └──────┬───────┘
                                         │
                                         ↓
Password: "pass"                  ┌──────────────┐
    ────────────────────────────>│ bcrypt.hash  │
                                  │ (12 rounds)  │
                                  └──────┬───────┘              users table
                                         │                      ───────────
                                         ↓                      id: 1
                            Hashed: "$2b$12$..."                name: "John"
                                         │                      email: "john@ex"
                                         ├──────────────────> password: "$2b$12$..."
                                         │                      company: "Acme"
Generate Tokens              ┌──────────┴─────────┐           files_uploaded: 0
    ────────────────────────>│ generateRefreshToken│           refresh_token: "$2b$12$..."
                             │ generateAccessToken │           created_at: NOW()
                             └──────────┬──────────┘
                                        │
                                        ↓
Response (Client)            ┌──────────────────┐
                             │  Hash Refresh    │
{                            │  Store in DB     │
  accessToken: "eyJ..."  <───┤  Return Access   │
  user: {                    │  Set Cookie      │
    id: "1"                  └──────────────────┘
    name: "John"
    email: "john@ex"
    filesUploaded: 0
  }
}
Cookie: refreshToken=...
```

---

## 🔄 Token Lifecycle

```
TOKEN LIFECYCLE TIMELINE
────────────────────────

t=0min                t=15min              t=7days
  │                      │                    │
  ├─ Access Token ───────┤                    │
  │  (expires)           X (Invalid)          │
  │                      │                    │
  │                      │                    │
  ├─ Refresh Token ──────────────────────────┤
  │  (expires)                                X (Invalid)
  │                                           │
  │                                           │
  └─ User Activity ──────────────────────────>│
        │              │                      │
        │              │                      │
     Login         Token Refresh          Logout or
                   (get new tokens)       Token Expiry


TOKEN ROTATION ON REFRESH
─────────────────────────

Before Refresh:
┌──────────────────────────────────────┐
│ Client has:                          │
│ • Access Token A1 (expired)          │
│ • Refresh Token R1 (valid)           │
└──────────────────────────────────────┘
               │
               ↓ POST /refresh (Cookie: R1)
               │
┌──────────────────────────────────────┐
│ Server validates R1                  │
│ • Verify signature                   │
│ • Check database                     │
│ • Confirm not revoked                │
└──────────────┬───────────────────────┘
               │
               ↓ Generates NEW tokens
               │
┌──────────────────────────────────────┐
│ Server creates:                      │
│ • NEW Access Token A2                │
│ • NEW Refresh Token R2               │
│ • Invalidates R1 in database        │
└──────────────┬───────────────────────┘
               │
               ↓
After Refresh:
┌──────────────────────────────────────┐
│ Client has:                          │
│ • Access Token A2 (fresh, 15m)       │
│ • Refresh Token R2 (fresh, 7d)       │
│ • R1 is now INVALID                  │
└──────────────────────────────────────┘
```

---

## 🎯 Summary

This visual guide provides:

✅ **Complete system architecture**
✅ **Request/response flows**
✅ **Authentication sequences**
✅ **Rate limiting integration**
✅ **Token lifecycle management**
✅ **Cross-service communication**
✅ **Troubleshooting diagrams**

For detailed code-level documentation, see:

- `SYSTEM_FLOW_DOCUMENTATION.md` - Complete flow documentation
- `FIX_403_FORBIDDEN.md` - JWT troubleshooting guide
- `API_DOCUMENTATION.md` - API endpoint reference

---

**Last Updated:** October 3, 2025  
**Version:** 2.0.0
