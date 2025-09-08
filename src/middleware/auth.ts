import { Request, Response, NextFunction } from "express";
import { extractTokenFromHeader, verifyAccessToken } from "../utils/auth";
import { TokenPayload } from "../types/auth";
import User from "../models/user";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        user_type: string;
      };
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Authentication Required",
        error: "Access token is required",
      });
      return;
    }

    const decoded: TokenPayload = verifyAccessToken(token);

    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication Failed",
        error: "User not found",
      });
      return;
    }

    req.user = {
      id: (user._id as any).toString(),
      email: user.email,
      user_type: user.user_type,
    };

    next();
  } catch (error: any) {
    console.error("Authentication middleware error:", error);
    res.status(401).json({
      success: false,
      message: "Authentication Failed",
      error: error.message || "Invalid token",
    });
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      try {
        const decoded: TokenPayload = verifyAccessToken(token);
        const user = await User.findById(decoded.userId);

        if (user) {
          req.user = {
            id: (user._id as any).toString(),
            email: user.email,
            user_type: user.user_type,
          };
        }
      } catch (error) {
        console.log("Optional auth token invalid:", (error as Error).message);
      }
    }

    next();
  } catch (error: any) {
    console.error("Optional auth middleware error:", error);
    next();
  }
};
