export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  company_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ResetPasswordRequest {
  email: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  // Refresh token comes from HttpOnly cookie
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface TokenResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    company_name: string;
    filesUploaded: number;
  };
}

export interface ProfileResponse {
  id: string;
  name: string;
  email: string;
  company_name: string;
  filesUploaded: number;
  createdAt: string;
}
