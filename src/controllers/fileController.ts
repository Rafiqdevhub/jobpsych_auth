import { Request, Response } from "express";
import { db } from "../db";
import { users } from "../models/users.model";
import { files } from "../models/files.model";
import { eq, sql } from "drizzle-orm";
import { AuthResponse } from "../types/auth";
import fs from "fs";
import path from "path";

export const countFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      const response: AuthResponse = {
        success: false,
        message: "Unauthorized",
        error: "User not authenticated",
      };
      res.status(401).json(response);
      return;
    }

    if (!req.file) {
      const response: AuthResponse = {
        success: false,
        message: "No file provided",
        error: "Please provide a file to count",
      };
      res.status(400).json(response);
      return;
    }

    const userId = parseInt(req.user.userId);
    const file = req.file;

    // Read file content to count words, lines, and characters
    let content = "";
    try {
      content = fs.readFileSync(file.path, "utf-8");
    } catch (error) {
      console.error("Error reading file:", error);
      const response: AuthResponse = {
        success: false,
        message: "File processing error",
        error: "Unable to read file content",
      };
      res.status(500).json(response);
      return;
    }

    // Count statistics
    const lines = content.split("\n").length;
    const words =
      content.trim() === "" ? 0 : content.trim().split(/\s+/).length;
    const chars = content.length;

    // Save file record to database
    const fileRecord = await db
      .insert(files)
      .values({
        user_id: userId,
        filename: file.filename,
        original_name: file.originalname,
        mime_type: file.mimetype,
        size: file.size,
        word_count: words,
        line_count: lines,
        char_count: chars,
      })
      .returning();

    // Update user's files uploaded count
    await db
      .update(users)
      .set({
        filesUploaded: sql`${users.filesUploaded} + 1`,
      })
      .where(eq(users.id, userId));

    // Clean up uploaded file from temp storage
    try {
      fs.unlinkSync(file.path);
    } catch (error) {
      console.error("Error cleaning up temp file:", error);
      // Don't fail the request for cleanup errors
    }

    const response: AuthResponse = {
      success: true,
      message: "File processed successfully",
      data: {
        fileId: fileRecord[0].id,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        statistics: {
          words,
          lines,
          characters: chars,
        },
      },
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("File counting error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Internal Server Error",
      error: "An unexpected error occurred during file counting",
    };
    res.status(500).json(response);
  }
};

export const getUploadStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      const response: AuthResponse = {
        success: false,
        message: "Unauthorized",
        error: "User not authenticated",
      };
      res.status(401).json(response);
      return;
    }

    const userId = parseInt(req.user.userId);

    // Get user's file count
    const userResult = await db
      .select({ filesUploaded: users.filesUploaded })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      const response: AuthResponse = {
        success: false,
        message: "User not found",
        error: "User account not found",
      };
      res.status(404).json(response);
      return;
    }

    // Get recent files (last 10)
    const recentFiles = await db
      .select({
        id: files.id,
        filename: files.original_name,
        uploadedAt: files.uploaded_at,
        wordCount: files.word_count,
        lineCount: files.line_count,
        charCount: files.char_count,
        size: files.size,
      })
      .from(files)
      .where(eq(files.user_id, userId))
      .orderBy(sql`${files.uploaded_at} desc`)
      .limit(10);

    // Get total statistics
    const totalStats = await db
      .select({
        totalWords: sql<number>`sum(${files.word_count})`,
        totalLines: sql<number>`sum(${files.line_count})`,
        totalChars: sql<number>`sum(${files.char_count})`,
        totalSize: sql<number>`sum(${files.size})`,
      })
      .from(files)
      .where(eq(files.user_id, userId));

    const stats = totalStats[0];

    const response: AuthResponse = {
      success: true,
      message: "Upload statistics retrieved successfully",
      data: {
        totalFiles: userResult[0].filesUploaded,
        totalWords: stats.totalWords || 0,
        totalLines: stats.totalLines || 0,
        totalCharacters: stats.totalChars || 0,
        totalSize: stats.totalSize || 0,
        recentFiles: recentFiles.map((file) => ({
          id: file.id,
          filename: file.filename,
          uploadedAt: file.uploadedAt,
          statistics: {
            words: file.wordCount || 0,
            lines: file.lineCount || 0,
            characters: file.charCount || 0,
            size: file.size,
          },
        })),
      },
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Get upload stats error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Internal Server Error",
      error: "An unexpected error occurred during stats retrieval",
    };
    res.status(500).json(response);
  }
};
