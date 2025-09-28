import { Request, Response } from "express";
import { AuthResponse } from "../types/auth";

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

    // MongoDB removed - return service unavailable
    const response: AuthResponse = {
      success: false,
      message: "Service Unavailable",
      error:
        "Database functionality has been removed. File counting is currently unavailable.",
    };
    res.status(503).json(response);
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

    // MongoDB removed - return service unavailable
    const response: AuthResponse = {
      success: false,
      message: "Service Unavailable",
      error:
        "Database functionality has been removed. Upload stats are currently unavailable.",
    };
    res.status(503).json(response);
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
