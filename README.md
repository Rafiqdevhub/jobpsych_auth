# JobPsych Backend API - Implementation Guide

## 📋 Overview

JobPsych is a secure backend API built with Node.js, Express, TypeScript, and MongoDB that provides authentication and file upload services. The system implements industry-standard security practices with JWT access tokens and HttpOnly refresh tokens.

## 🏗 Architecture

### Core Technologies

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (Access + Refresh Tokens)
- **Security**: bcrypt password hashing, HttpOnly cookies
- **File Handling**: Multer for multipart uploads

### Security Features

- **Access Tokens**: Short-lived (15 minutes) JWT tokens
- **Refresh Tokens**: Long-lived (7 days) HttpOnly cookies
- **Token Rotation**: Automatic refresh token renewal
- **Password Security**: bcrypt hashing with 12 salt rounds
- **Cookie Security**: HttpOnly, SameSite=Strict, Secure flags

## 📁 Project Structure

```
jobpsych_backend/
├── src/
│   ├── config/
│   │   ├── mongodb.ts          # Database connection
│   │   └── multer.ts           # File upload configuration
│   ├── controllers/
│   │   ├── authController.ts   # Authentication logic
│   │   └── fileController.ts   # File upload logic
│   ├── middleware/
│   │   └── auth.ts             # JWT authentication middleware
│   ├── models/
│   │   ├── user.ts             # User schema
│   │   └── refreshToken.ts     # Refresh token schema
│   ├── routes/
│   │   ├── authRoutes.ts       # Auth endpoints
│   │   └── fileRoutes.ts       # File upload endpoints
│   ├── types/
│   │   └── auth.ts             # TypeScript interfaces
│   ├── utils/
│   │   └── auth.ts             # JWT utilities
│   └── index.ts                # Main server file
├── uploads/                    # File storage directory
├── package.json
├── tsconfig.json
└── .env.example
```

## 🔧 Environment Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd jobpsych_backend
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/jobpsych

# JWT Secrets (generate strong random strings)
JWT_ACCESS_SECRET=your-super-secret-access-key-minimum-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-chars

# JWT Expiration (optional - defaults provided)
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000
```

### 3. MongoDB Setup

```bash
# Install MongoDB locally or use MongoDB Atlas
# For local MongoDB:
brew install mongodb-community  # macOS
# or follow installation guide for your OS

# Start MongoDB service
mongod

# Or use Docker:
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Generate JWT Secrets

```bash
# Generate secure random strings for JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Start Development Server

```bash
npm run dev
```

## 🔐 Authentication System

### Token Flow

1. **Registration/Login**: Returns access token + sets HttpOnly refresh cookie
2. **API Requests**: Include access token in Authorization header
3. **Token Refresh**: Automatic refresh using refresh cookie
4. **Logout**: Clears cookie and removes server token

### API Endpoints

#### Authentication Endpoints

##### POST /api/auth/register

Register a new user account.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "company_name": "ABC Corporation"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "name": "John Doe",
      "email": "john@example.com",
      "company_name": "ABC Corporation",
      "filesUploaded": 0
    }
  }
}
```

**Cookies Set:**

- `refreshToken`: HttpOnly cookie containing refresh token

##### POST /api/auth/login

Authenticate user credentials.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:** Same as registration (access token + user data)

##### POST /api/auth/refresh

Refresh access token using refresh cookie.

**Request:** No body required (uses refresh cookie)

**Response:**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_access_token_here",
    "user": {
      /* user data */
    }
  }
}
```

##### POST /api/auth/logout

Secure logout - clears refresh token.

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

##### POST /api/auth/reset-password

Reset user password.

**Request Body:**

```json
{
  "email": "john@example.com",
  "newPassword": "NewSecurePass123!"
}
```

##### GET /api/auth/profile

Get authenticated user profile.

**Headers:**

```http
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "name": "John Doe",
    "email": "john@example.com",
    "company_name": "ABC Corporation",
    "filesUploaded": 5,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### File Upload Endpoints

##### POST /api/files/upload

Upload a file (authenticated users only).

**Headers:**

```http
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**

```text
file: <uploaded_file>
```

**Supported File Types:**

- PDF (.pdf)
- Word documents (.doc, .docx)
- Text files (.txt)
- Images (.jpg, .png, .gif)

**Response:**

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "filename": "file-1695123456789-123456789.pdf",
    "originalName": "resume.pdf",
    "size": 1024000,
    "totalFilesUploaded": 6
  }
}
```

##### GET /api/files/stats

Get user's file upload statistics.

**Headers:**

```http
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Upload stats retrieved successfully",
  "data": {
    "totalFilesUploaded": 6,
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

## 🎨 Frontend Implementation

### 1. Project Setup

```bash
# Create React app
npx create-react-app jobpsych-frontend
cd jobpsych-frontend
npm install axios
```

### 2. Authentication Service

Create `src/services/authService.js`:

```javascript
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookies
});

// Request interceptor to add access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = refreshResponse.data.data;
        localStorage.setItem("accessToken", accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  // Register new user
  async register(userData) {
    const response = await api.post("/auth/register", userData);
    const { accessToken, user } = response.data.data;

    localStorage.setItem("accessToken", accessToken);
    return { accessToken, user };
  },

  // Login user
  async login(credentials) {
    const response = await api.post("/auth/login", credentials);
    const { accessToken, user } = response.data.data;

    localStorage.setItem("accessToken", accessToken);
    return { accessToken, user };
  },

  // Logout user
  async logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("accessToken");
      // Redirect will happen automatically due to cookie clearing
    }
  },

  // Get current user profile
  async getProfile() {
    const response = await api.get("/auth/profile");
    return response.data.data;
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem("accessToken");
  },

  // Get stored access token
  getAccessToken() {
    return localStorage.getItem("accessToken");
  },
};

export default api;
```

### 3. File Upload Service

Create `src/services/fileService.js`:

```javascript
import api from "./authService";

export const fileService = {
  // Upload a file
  async uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.data;
  },

  // Get upload statistics
  async getUploadStats() {
    const response = await api.get("/files/stats");
    return response.data.data;
  },
};

export default fileService;
```

### 4. React Components

#### Login Component

```jsx
import React, { useState } from "react";
import { authService } from "../services/authService";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await authService.login(formData);
      console.log("Login successful:", result);
      // Redirect to dashboard or home page
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="login-container">
      <h2>Login to JobPsych</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;
```

#### File Upload Component

```jsx
import React, { useState, useEffect } from "react";
import { fileService } from "../services/fileService";

const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUploadStats();
  }, []);

  const loadUploadStats = async () => {
    try {
      const stats = await fileService.getUploadStats();
      setUploadStats(stats);
    } catch (err) {
      console.error("Failed to load upload stats:", err);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "image/jpeg",
        "image/png",
        "image/gif",
      ];

      if (!allowedTypes.includes(file.type)) {
        setError(
          "Invalid file type. Please select a PDF, DOC, DOCX, TXT, or image file."
        );
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size too large. Maximum size is 10MB.");
        return;
      }

      setSelectedFile(file);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError("");

    try {
      const result = await fileService.uploadFile(selectedFile);
      console.log("Upload successful:", result);
      setSelectedFile(null);
      // Reset file input
      document.getElementById("file-input").value = "";
      // Reload stats
      await loadUploadStats();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload-container">
      <h3>File Upload</h3>

      {uploadStats && (
        <div className="upload-stats">
          <p>Total files uploaded: {uploadStats.totalFilesUploaded}</p>
        </div>
      )}

      <div className="upload-form">
        <input
          id="file-input"
          type="file"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
        />

        {selectedFile && (
          <div className="file-info">
            <p>Selected: {selectedFile.name}</p>
            <p>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        <button onClick={handleUpload} disabled={!selectedFile || uploading}>
          {uploading ? "Uploading..." : "Upload File"}
        </button>
      </div>
    </div>
  );
};

export default FileUpload;
```

#### App Component with Authentication

```jsx
import React, { useState, useEffect } from "react";
import { authService } from "./services/authService";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    if (authService.isAuthenticated()) {
      try {
        const userProfile = await authService.getProfile();
        setUser(userProfile);
      } catch (error) {
        // Token might be expired, try refresh
        try {
          // The interceptor will handle refresh automatically
          const userProfile = await authService.getProfile();
          setUser(userProfile);
        } catch (refreshError) {
          // Both token and refresh failed
          localStorage.removeItem("accessToken");
        }
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout on frontend anyway
      localStorage.removeItem("accessToken");
      setUser(null);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={setUser} />
      )}
    </div>
  );
};

export default App;
```

## 🧪 Testing

### Backend Testing

#### Test Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123!",
    "company_name": "Test Company"
  }' \
  -c cookies.txt
```

#### Test Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }' \
  -c cookies.txt
```

#### Test Protected Endpoint

```bash
# Extract access token from previous response
ACCESS_TOKEN="your_access_token_here"

curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### Test Token Refresh

```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -b cookies.txt
```

### Frontend Testing

1. Start the backend server: `npm run dev`
2. Start the frontend: `npm start`
3. Test registration, login, file upload, and logout flows
4. Verify automatic token refresh works
5. Test with expired tokens

## 🔒 Security Considerations

### Production Deployment

1. **HTTPS Only**: Set `NODE_ENV=production` and use HTTPS
2. **Strong Secrets**: Use cryptographically secure random strings (minimum 32 characters)
3. **Environment Variables**: Never commit `.env` file to version control
4. **Rate Limiting**: Implement rate limiting for auth endpoints
5. **Input Validation**: Validate all user inputs on both frontend and backend
6. **File Upload Security**: Scan uploaded files for malware in production

### Cookie Security

- HttpOnly: Prevents XSS access to refresh tokens
- SameSite=Strict: Prevents CSRF attacks
- Secure: HTTPS only in production
- Path restricted: `/api/auth` only

### Token Security

- Access tokens: Short-lived (15 minutes)
- Refresh tokens: Hashed in database, auto-expiring
- Token rotation: New refresh token on each use
- Secure logout: Server-side token invalidation

## 🚀 Production Deployment

### Environment Setup

```bash
NODE_ENV=production
JWT_ACCESS_SECRET=<strong-random-string>
JWT_REFRESH_SECRET=<different-strong-random-string>
MONGODB_URI=<production-mongodb-uri>
```

### Process Management

```bash
# Using PM2
npm install -g pm2
pm2 start dist/index.js --name jobpsych-api
pm2 startup
pm2 save
```

### Nginx Configuration (example)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📞 Support

For issues or questions:

1. Check the API documentation at `GET /`
2. Review server logs for error details
3. Ensure environment variables are properly set
4. Verify MongoDB connection is working

## 📝 API Response Format

All API responses follow this structure:

```json
{
  "success": boolean,
  "message": string,
  "data": object | null,
  "error": string | null
}
```

- `success`: `true` for successful operations, `false` for errors
- `message`: Human-readable message
- `data`: Response payload (null for errors)
- `error`: Error details (null for success)

This implementation provides a production-ready, secure authentication and file upload system following industry best practices.
