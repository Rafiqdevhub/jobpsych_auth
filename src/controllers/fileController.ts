import { Request, Response } from "express";
import User from "../models/user";
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

    // Check if file was uploaded
    if (!req.file) {
      const response: AuthResponse = {
        success: false,
        message: "No file provided",
        error: "Please provide a file to count",
      };
      res.status(400).json(response);
      return;
    }

    // Update user's file upload count
    const user = await User.findById(req.user.userId);
    if (!user) {
      const response: AuthResponse = {
        success: false,
        message: "User not found",
        error: "User does not exist",
      };
      res.status(404).json(response);
      return;
    }

    user.filesUploaded += 1;
    await user.save();

    const response: AuthResponse = {
      success: true,
      message: "File counted successfully",
      data: {
        originalName: req.file.originalname,
        size: req.file.size,
        totalFilesUploaded: user.filesUploaded,
      },
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("File counting error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Internal server error",
      error: "Failed to count file",
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

    const user = await User.findById(req.user.userId);
    if (!user) {
      const response: AuthResponse = {
        success: false,
        message: "User not found",
        error: "User does not exist",
      };
      res.status(404).json(response);
      return;
    }

    const response: AuthResponse = {
      success: true,
      message: "Upload stats retrieved successfully",
      data: {
        totalFilesUploaded: user.filesUploaded,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Get upload stats error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve upload stats",
    };
    res.status(500).json(response);
  }
};
