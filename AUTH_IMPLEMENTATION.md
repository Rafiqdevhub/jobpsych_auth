# JobPsych Authentication Implementation

This implementation provides a secure authentication system with the following features:

## Security Strategy

### Token Management

- **Access Tokens**: Short-lived (15 minutes), stored in localStorage on frontend
- **Refresh Tokens**: Long-lived (7 days), stored as HttpOnly cookies and hashed in database
- **Automatic Token Rotation**: New refresh token generated on each refresh

### Security Features

- ✅ HttpOnly cookies prevent XSS attacks on refresh tokens
- ✅ SameSite=Strict prevents CSRF attacks
- ✅ Refresh tokens are hashed in database (like passwords)
- ✅ Access tokens have short expiration (15 minutes)
- ✅ Automatic token refresh without user intervention
- ✅ Secure logout that clears both client and server tokens

## Backend Implementation

### Dependencies Installed

```bash
npm install cookie-parser
npm install @types/cookie-parser
```

### Key Changes Made

1. **Updated `src/controllers/authController.ts`**:

   - Added bcrypt hashing for refresh tokens
   - Implemented HttpOnly cookie storage
   - Added automatic token refresh logic
   - Added secure logout functionality

2. **Updated `src/index.ts`**:

   - Added cookie-parser middleware
   - Updated CORS to include credentials

3. **Updated `src/routes/authRoutes.ts`**:

   - Added logout endpoint

4. **Updated `src/types/auth.ts`**:
   - Modified AuthResponse to support new token structure

### API Endpoints

#### POST `/api/auth/register`

- Registers new user
- Returns access token in response body
- Sets refresh token as HttpOnly cookie

#### POST `/api/auth/login`

- Authenticates user
- Returns access token in response body
- Sets refresh token as HttpOnly cookie

#### POST `/api/auth/refresh`

- Refreshes access token using cookie-stored refresh token
- Returns new access token
- Sets new refresh token as HttpOnly cookie

#### POST `/api/auth/logout`

- Clears refresh token cookie
- Removes refresh token from database

#### GET `/api/auth/verify`

- Verifies access token validity
- Returns user information

## Frontend Implementation

### Authentication Service (`frontend/src/services/authService.js`)

Key functions:

- `login(credentials)` - Handles user login
- `register(userData)` - Handles user registration
- `logout()` - Secure logout
- `makeAuthenticatedRequest(url, options)` - Auto-refresh API calls
- `isAuthenticated()` - Check auth status
- `getCurrentUser()` - Get user data

### Usage Examples

#### Login

```javascript
import { login } from "./services/authService";

const handleLogin = async (email, password) => {
  try {
    const result = await login({ email, password });
    console.log("Login successful:", result);
    // Redirect to dashboard
    window.location.href = "/dashboard";
  } catch (error) {
    console.error("Login failed:", error.message);
  }
};
```

#### Making Authenticated Requests

```javascript
import { makeAuthenticatedRequest } from "./services/authService";

const fetchUserData = async () => {
  try {
    const response = await makeAuthenticatedRequest("/api/user/profile");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Request failed:", error);
  }
};
```

#### Logout

```javascript
import { logout } from "./services/authService";

const handleLogout = async () => {
  await logout();
  // User will be redirected to login automatically
};
```

## Frontend Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create `.env` file:

```
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Use the Login Component

```jsx
import LoginForm from "./components/LoginForm";

function App() {
  return (
    <div>
      <LoginForm />
    </div>
  );
}
```

## Security Best Practices Implemented

1. **Refresh Token Security**:

   - Stored as HttpOnly cookies (not accessible via JavaScript)
   - Hashed in database using bcrypt
   - Automatically rotated on refresh

2. **Access Token Management**:

   - Short-lived (15 minutes)
   - Stored in localStorage for easy access
   - Automatically refreshed when expired

3. **CORS Configuration**:

   - Credentials enabled for cookie support
   - Origin restrictions in place

4. **Cookie Configuration**:
   - HttpOnly: Prevents XSS attacks
   - Secure: HTTPS only in production
   - SameSite=Strict: Prevents CSRF attacks
   - Path=/api/auth: Limited scope

## Testing the Implementation

1. Start the backend server:

```bash
npm run dev
```

2. Test registration:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!@#",
    "user_type": "candidate"
  }' \
  -c cookies.txt
```

3. Test login:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }' \
  -c cookies.txt
```

4. Test token refresh:

```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -b cookies.txt
```

5. Test logout:

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -b cookies.txt
```

## Production Considerations

1. **Environment Variables**:

   - Set `NODE_ENV=production`
   - Use strong JWT secrets
   - Configure proper CORS origins

2. **HTTPS**:

   - Enable SSL/TLS in production
   - Ensure `secure: true` for cookies

3. **Database Security**:

   - Use MongoDB connection with authentication
   - Implement proper indexing

4. **Rate Limiting**:
   - Add rate limiting to auth endpoints
   - Implement account lockout mechanisms

This implementation provides a robust, secure authentication system that follows industry best practices while maintaining a smooth user experience.
