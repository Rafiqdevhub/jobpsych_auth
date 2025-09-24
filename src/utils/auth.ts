import bcrypt from "bcrypt";
import jwt, { Secret } from "jsonwebtoken";
import { TokenPayload } from "../types/auth";

const JWT_ACCESS_SECRET: Secret =
  process.env.JWT_ACCESS_SECRET || "access-secret-key";
const JWT_REFRESH_SECRET: Secret =
  process.env.JWT_REFRESH_SECRET || "refresh-secret-key";
const JWT_ACCESS_EXPIRES_IN: string =
  process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN: string =
  process.env.JWT_REFRESH_EXPIRES_IN || "7d";

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
