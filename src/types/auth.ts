import { UserType } from "../models/user";

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  user_type: UserType;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user?: {
      id: string;
      name: string;
      email: string;
      user_type: UserType;
      plan_type: string;
      subscription_status: string;
    };
    tokens?: {
      access_token: string;
      refresh_token: string;
    };
    access_token?: string; // For new structure where only access token is sent
  };
  error?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  user_type: UserType;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}
