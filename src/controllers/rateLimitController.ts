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

    const normalizedEmail = email.toLowerCase();

    const result = await db
      .select({
        email: users.email,
        filesUploaded: users.filesUploaded,
        batch_analysis: users.batch_analysis,
        compare_resumes: users.compare_resumes,
        name: users.name,
      })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
        error: "USER_NOT_FOUND",
        filesUploaded: 0,
      });
      return;
    }

    const user = result[0];
    const filesUploaded = user.filesUploaded || 0;

    res.status(200).json({
      success: true,
      email: user.email,
      filesUploaded: filesUploaded,
      batch_analysis: user.batch_analysis || 0,
      compare_resumes: user.compare_resumes || 0,
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
 * @route   POST /api/auth/increment-counter
 * @desc    Increment specific user counter (filesUploaded, batch_analysis, or compare_resumes)
 * @access  Public (will be called by FastAPI service)
 * @param   fieldType: "filesUploaded" | "batch_analysis" | "compare_resumes"
 */
export const incrementCounter = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, fieldType = "filesUploaded" } = req.body;

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

    // Validate fieldType
    const validFields = ["filesUploaded", "batch_analysis", "compare_resumes"];
    if (!validFields.includes(fieldType)) {
      res.status(400).json({
        success: false,
        message: `Invalid field type. Must be one of: ${validFields.join(
          ", "
        )}`,
        error: "VALIDATION_ERROR",
      });
      return;
    }

    const normalizedEmail = email.toLowerCase();

    // Prepare update object based on fieldType
    let updateData: any = {
      updated_at: new Date(),
    };

    let returnFields: any = {
      email: users.email,
      filesUploaded: users.filesUploaded,
      batch_analysis: users.batch_analysis,
      compare_resumes: users.compare_resumes,
    };

    if (fieldType === "filesUploaded") {
      updateData.filesUploaded = sql`${users.filesUploaded} + 1`;
    } else if (fieldType === "batch_analysis") {
      updateData.batch_analysis = sql`${users.batch_analysis} + 1`;
    } else if (fieldType === "compare_resumes") {
      updateData.compare_resumes = sql`${users.compare_resumes} + 1`;
    }

    // Increment the specified counter atomically
    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.email, normalizedEmail))
      .returning(returnFields);

    // User not found
    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not found - must register first",
        error: "USER_NOT_FOUND",
      });
      return;
    }

    const updatedUser = result[0];

    // Return success response with all counters
    res.status(200).json({
      success: true,
      message: `${fieldType} incremented successfully`,
      email: updatedUser.email,
      filesUploaded: updatedUser.filesUploaded,
      batch_analysis: updatedUser.batch_analysis,
      compare_resumes: updatedUser.compare_resumes,
      incrementedField: fieldType,
    });
  } catch (error) {
    console.error("Increment counter error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to increment counter",
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

    const normalizedEmail = email.toLowerCase();

    const result = await db
      .update(users)
      .set({
        filesUploaded: sql`${users.filesUploaded} + 1`,
        updated_at: new Date(),
      })
      .where(eq(users.email, normalizedEmail))
      .returning({
        email: users.email,
        filesUploaded: users.filesUploaded,
      });

    if (!result || result.length === 0) {
      res.status(500).json({
        success: false,
        message: "Failed to increment upload count",
        error: "INCREMENT_FAILED",
      });
      return;
    }

    const updatedUser = result[0];

    res.status(200).json({
      success: true,
      message: "Upload count incremented successfully",
      email: updatedUser.email,
      filesUploaded: updatedUser.filesUploaded,
      batch_analysis: 0,
      compare_resumes: 0,
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
        batch_analysis: users.batch_analysis,
        compare_resumes: users.compare_resumes,
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
        batchAnalysisCount: user.batch_analysis || 0,
        compareResumesCount: user.compare_resumes || 0,
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

/**
 * @route   POST /api/auth/increment-batch-analysis
 * @desc    Increment user's batch analysis count
 * @access  Public (will be called by FastAPI service)
 */
export const incrementBatchAnalysis = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, count = 1 } = req.body;

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

    // Validate count
    if (typeof count !== "number" || count < 1) {
      res.status(400).json({
        success: false,
        message: "Count must be a positive number",
        error: "VALIDATION_ERROR",
      });
      return;
    }

    const normalizedEmail = email.toLowerCase();

    // ✅ Increment batch analysis count by 'count' parameter (not just 1)
    const result = await db
      .update(users)
      .set({
        batch_analysis: sql`${users.batch_analysis} + ${count}`,
        updated_at: new Date(),
      })
      .where(eq(users.email, normalizedEmail))
      .returning({
        email: users.email,
        batch_analysis: users.batch_analysis,
      });

    // Verify increment worked
    if (!result || result.length === 0) {
      res.status(500).json({
        success: false,
        message: "Failed to increment batch analysis counter",
        error: "INCREMENT_FAILED",
      });
      return;
    }

    const updatedUser = result[0];

    // ✅ Return success response with count confirmation
    res.status(200).json({
      success: true,
      message: "Batch analysis count incremented successfully",
      email: updatedUser.email,
      batch_analysis: updatedUser.batch_analysis,
      incrementedBy: count, // ✅ Confirm how much was added
    });
  } catch (error) {
    console.error("Increment batch analysis error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to increment batch analysis count",
      error: "SERVER_ERROR",
      details:
        config.nodeEnv === "development" ? (error as Error).message : undefined,
    });
  }
};

/**
 * @route   POST /api/auth/increment-compare-resumes
 * @desc    Increment user's compare resumes count
 * @access  Public (will be called by FastAPI service)
 */
export const incrementCompareResumes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, count = 1 } = req.body;

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

    // Validate count
    if (typeof count !== "number" || count < 1) {
      res.status(400).json({
        success: false,
        message: "Count must be a positive number",
        error: "VALIDATION_ERROR",
      });
      return;
    }

    const normalizedEmail = email.toLowerCase();

    // ✅ Increment compare resumes count by 'count' parameter (not just 1)
    const result = await db
      .update(users)
      .set({
        compare_resumes: sql`${users.compare_resumes} + ${count}`,
        updated_at: new Date(),
      })
      .where(eq(users.email, normalizedEmail))
      .returning({
        email: users.email,
        compare_resumes: users.compare_resumes,
      });

    // Verify increment worked
    if (!result || result.length === 0) {
      res.status(500).json({
        success: false,
        message: "Failed to increment compare resumes counter",
        error: "INCREMENT_FAILED",
      });
      return;
    }

    const updatedUser = result[0];

    // ✅ Return success response with count confirmation
    res.status(200).json({
      success: true,
      message: "Compare resumes count incremented successfully",
      email: updatedUser.email,
      compare_resumes: updatedUser.compare_resumes,
      incrementedBy: count, // ✅ Confirm how much was added
    });
  } catch (error) {
    console.error("Increment compare resumes error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to increment compare resumes count",
      error: "SERVER_ERROR",
      details:
        config.nodeEnv === "development" ? (error as Error).message : undefined,
    });
  }
};

/**
 * @route   GET /api/auth/feature-usage/:email
 * @desc    Get feature usage statistics for a user
 * @access  Public (will be called by FastAPI service)
 */
export const getFeatureUsage = async (
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

    const normalizedEmail = email.toLowerCase();

    // Query database for user
    const result = await db
      .select({
        email: users.email,
        filesUploaded: users.filesUploaded,
        batch_analysis: users.batch_analysis,
        compare_resumes: users.compare_resumes,
        name: users.name,
      })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    // User not found
    if (!result || result.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
        error: "USER_NOT_FOUND",
      });
      return;
    }

    const user = result[0];

    // Return feature usage statistics
    res.status(200).json({
      success: true,
      email: user.email,
      name: user.name,
      features: {
        filesUploaded: user.filesUploaded || 0,
        batch_analysis: user.batch_analysis || 0,
        compare_resumes: user.compare_resumes || 0,
      },
      message: "Feature usage statistics retrieved successfully",
    });
  } catch (error) {
    console.error("Get feature usage error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get feature usage statistics",
      error: "SERVER_ERROR",
      details:
        config.nodeEnv === "development" ? (error as Error).message : undefined,
    });
  }
};
