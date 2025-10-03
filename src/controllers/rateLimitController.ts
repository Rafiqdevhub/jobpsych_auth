import { Request, Response } from "express";
import { db } from "../db";
import { users } from "../models/users.model";
import { eq, sql } from "drizzle-orm";
import { config } from "../config/env";

// Constants
const UPLOAD_LIMIT = config.upload.limit;

/**
 * @route   GET /api/auth/user-uploads/:email
 * @desc    Get user's current file upload count
 * @access  Public (will be called by FastAPI service)
 */
export const getUserUploads = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.params;

    // Validate email parameter
    if (!email) {
      res.status(400).json({
        success: false,
        message: "Email is required",
        error: "VALIDATION_ERROR",
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: "Invalid email format",
        error: "VALIDATION_ERROR",
      });
      return;
    }

    // Query database for user
    const result = await db
      .select({
        email: users.email,
        filesUploaded: users.filesUploaded,
        name: users.name,
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    // User not found
    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
        error: "USER_NOT_FOUND",
        filesUploaded: 0, // Return 0 so FastAPI can handle new users
      });
      return;
    }

    const user = result[0];
    const filesUploaded = user.filesUploaded || 0;

    // Return upload statistics
    res.status(200).json({
      success: true,
      email: user.email,
      filesUploaded: filesUploaded,
      limit: UPLOAD_LIMIT,
      remaining: Math.max(0, UPLOAD_LIMIT - filesUploaded),
      message: "Upload statistics retrieved successfully",
    });
  } catch (error) {
    console.error("Get user uploads error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user upload count",
      error: "SERVER_ERROR",
      details:
        config.nodeEnv === "development" ? (error as Error).message : undefined,
    });
  }
};

/**
 * @route   POST /api/auth/increment-upload
 * @desc    Increment user's file upload count after successful upload
 * @access  Public (will be called by FastAPI service after successful upload)
 */
export const incrementUpload = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      res.status(400).json({
        success: false,
        message: "Email is required",
        error: "VALIDATION_ERROR",
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: "Invalid email format",
        error: "VALIDATION_ERROR",
      });
      return;
    }

    // Increment upload count atomically
    const result = await db
      .update(users)
      .set({
        filesUploaded: sql`${users.filesUploaded} + 1`,
        updated_at: new Date(),
      })
      .where(eq(users.email, email.toLowerCase()))
      .returning({
        email: users.email,
        filesUploaded: users.filesUploaded,
      });

    // User not found
    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
        error: "USER_NOT_FOUND",
      });
      return;
    }

    const updatedUser = result[0];

    // Return success response
    res.status(200).json({
      success: true,
      message: "Upload count incremented successfully",
      email: updatedUser.email,
      filesUploaded: updatedUser.filesUploaded,
      limit: UPLOAD_LIMIT,
      remaining: Math.max(0, UPLOAD_LIMIT - updatedUser.filesUploaded),
    });
  } catch (error) {
    console.error("Increment upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to increment upload count",
      error: "SERVER_ERROR",
      details:
        config.nodeEnv === "development" ? (error as Error).message : undefined,
    });
  }
};

/**
 * @route   GET /api/auth/upload-stats
 * @desc    Get detailed upload statistics for authenticated user
 * @access  Protected (requires JWT token)
 */
export const getUploadStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const email = req.user?.email;

    if (!email) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "UNAUTHORIZED",
      });
      return;
    }

    const result = await db
      .select({
        email: users.email,
        name: users.name,
        filesUploaded: users.filesUploaded,
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
        error: "USER_NOT_FOUND",
      });
      return;
    }

    const user = result[0];
    const filesUploaded = user.filesUploaded || 0;

    res.status(200).json({
      success: true,
      stats: {
        email: user.email,
        name: user.name,
        totalUploads: filesUploaded,
        limit: UPLOAD_LIMIT,
        remaining: Math.max(0, UPLOAD_LIMIT - filesUploaded),
        percentage: Math.min(100, (filesUploaded / UPLOAD_LIMIT) * 100),
        canUpload: filesUploaded < UPLOAD_LIMIT,
      },
    });
  } catch (error) {
    console.error("Get upload stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get upload statistics",
      error: "SERVER_ERROR",
    });
  }
};
