import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";

/**
 * @route   POST /api/auth/verify-token
 * @desc    Verify JWT token validity (for debugging and FastAPI integration)
 * @access  Public
 */
export const verifyToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        message: "Token is required",
        error: "VALIDATION_ERROR",
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.accessSecret);

    res.status(200).json({
      success: true,
      message: "Token is valid",
      decoded: decoded,
      tokenInfo: {
        algorithm: "HS256",
        expiresIn: config.jwt.accessExpiresIn,
        secretLength: config.jwt.accessSecret.toString().length,
      },
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      error: "TOKEN_VERIFICATION_FAILED",
      details: config.nodeEnv === "development" ? error.message : undefined,
    });
  }
};

/**
 * @route   GET /api/auth/jwt-info
 * @desc    Get JWT configuration information (for debugging)
 * @access  Public
 */
export const getJWTInfo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: "JWT configuration information",
      jwtInfo: {
        algorithm: "HS256",
        accessTokenExpiry: config.jwt.accessExpiresIn,
        refreshTokenExpiry: config.jwt.refreshExpiresIn,
        secretLength: config.jwt.accessSecret.toString().length,
        secretFirstChars: config.jwt.accessSecret.toString().substring(0, 10),
        secretLastChars: config.jwt.accessSecret
          .toString()
          .substring(config.jwt.accessSecret.toString().length - 10),
        environment: config.nodeEnv,
        timestamp: new Date().toISOString(),
      },
      note: "Share this info with FastAPI team to ensure JWT secrets match",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to get JWT info",
      error: "SERVER_ERROR",
    });
  }
};
