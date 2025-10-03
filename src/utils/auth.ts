import bcrypt from "bcrypt";
import jwt, { Secret } from "jsonwebtoken";
import { TokenPayload } from "../types/auth";
import { config } from "../config/env";

// Use unified JWT secrets from config (ensures compatibility with FastAPI)
const JWT_ACCESS_SECRET: Secret = config.jwt.accessSecret;
const JWT_REFRESH_SECRET: Secret = config.jwt.refreshSecret;
const JWT_ACCESS_EXPIRES_IN: string = config.jwt.accessExpiresIn;
const JWT_REFRESH_EXPIRES_IN: string = config.jwt.refreshExpiresIn;

// Log JWT configuration on startup (for debugging cross-service communication)
console.log("=".repeat(60));
console.log("🔐 JWT CONFIGURATION LOADED");
console.log("JWT_ACCESS_SECRET length:", JWT_ACCESS_SECRET.toString().length);
console.log(
  "JWT_ACCESS_SECRET first 10 chars:",
  JWT_ACCESS_SECRET.toString().substring(0, 10)
);
console.log(
  "JWT_ACCESS_SECRET last 10 chars:",
  JWT_ACCESS_SECRET.toString().substring(
    JWT_ACCESS_SECRET.toString().length - 10
  )
);
console.log("Access Token Expiry:", JWT_ACCESS_EXPIRES_IN);
console.log("Refresh Token Expiry:", JWT_REFRESH_EXPIRES_IN);
console.log("Environment:", config.nodeEnv);
console.log("=".repeat(60));

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const hashRefreshToken = async (token: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(token, saltRounds);
};

export const verifyRefreshToken = async (
  token: string,
  hashedToken: string
): Promise<boolean> => {
  return await bcrypt.compare(token, hashedToken);
};

export const generateAccessToken = (payload: TokenPayload): string => {
  // @ts-ignore
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
  });
};

export const generateRefreshToken = (): string => {
  // @ts-ignore
  return jwt.sign({}, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  // @ts-ignore
  return jwt.verify(token, JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshTokenSignature = (token: string): any => {
  // @ts-ignore
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

export const extractTokenFromHeader = (
  authHeader: string | undefined
): string | null => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
};

export const extractRefreshTokenFromCookie = (cookies: any): string | null => {
  return cookies?.refreshToken || null;
};
