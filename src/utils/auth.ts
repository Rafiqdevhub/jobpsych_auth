import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { TokenPayload, PasswordValidationResult } from "../types/auth";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

/**
 * Hash a password using bcrypt
 * @param password - The plain text password to hash
 * @returns Promise<string> - The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against its hash
 * @param password - The plain text password
 * @param hash - The hashed password to compare against
 * @returns Promise<boolean> - True if password matches hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Validate password strength requirements
 * @param password - The password to validate
 * @returns PasswordValidationResult - Validation result with errors if any
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate an access token
 * @param payload - The token payload containing user information
 * @returns string - The JWT access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * Generate a refresh token
 * @param payload - The token payload containing user information
 * @returns string - The JWT refresh token
 */
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * Verify an access token
 * @param token - The JWT access token to verify
 * @returns TokenPayload - The decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error("Invalid or expired access token");
  }
}

/**
 * Verify a refresh token
 * @param token - The JWT refresh token to verify
 * @returns TokenPayload - The decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyRefreshToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
}

/**
 * Generate both access and refresh tokens
 * @param payload - The token payload containing user information
 * @returns Object containing access_token and refresh_token
 */
export function generateTokens(payload: TokenPayload) {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}

/**
 * Extract token from Authorization header
 * @param authHeader - The Authorization header value
 * @returns string | null - The extracted token or null if invalid
 */
export function extractTokenFromHeader(
  authHeader: string | undefined
): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
