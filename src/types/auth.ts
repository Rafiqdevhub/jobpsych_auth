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

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Rate Limiting Types
export interface RateLimitResponse {
  success: boolean;
  email: string;
  filesUploaded: number;
  limit: number;
  remaining: number;
  message: string;
  error?: string;
}

export interface UploadStatsResponse {
  success: boolean;
  stats: {
    email: string;
    name: string;
    totalUploads: number;
    limit: number;
    remaining: number;
    percentage: number;
    canUpload: boolean;
  };
}

export interface IncrementUploadRequest {
  email: string;
}
