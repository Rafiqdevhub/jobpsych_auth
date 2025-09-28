import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../models/users.model";
import {
  hashPassword,
  verifyPassword,
  hashRefreshToken,
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshTokenSignature,
  extractRefreshTokenFromCookie,
} from "../utils/auth";
import {
  RegisterRequest,
  LoginRequest,
  ResetPasswordRequest,
  AuthResponse,
  TokenResponse,
  ProfileResponse,
  ChangePasswordRequest,
} from "../types/auth";

const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/api/auth",
  });
};

const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, company_name }: RegisterRequest = req.body;

    if (!name || !email || !password || !company_name) {
      const response: AuthResponse = {
        success: false,
        message: "Validation Error",
        error: "Name, email, password, and company_name are required",
      };
      res.status(400).json(response);
      return;
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      const response: AuthResponse = {
        success: false,
        message: "User already exists",
        error: "A user with this email already exists",
      };
      res.status(409).json(response);
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate refresh token
    const refreshToken = generateRefreshToken();
    const hashedRefreshToken = await hashRefreshToken(refreshToken);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        name,
        email,
        company_name,
        password: hashedPassword,
        refreshToken: hashedRefreshToken,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        company_name: users.company_name,
      });

    if (newUser.length === 0) {
      const response: AuthResponse = {
        success: false,
        message: "Registration failed",
        error: "Failed to create user account",
      };
      res.status(500).json(response);
      return;
    }

    // Generate access token
    const accessToken = generateAccessToken({
      userId: newUser[0].id.toString(),
      email: newUser[0].email,
    });

    // Set refresh token cookie
    setRefreshTokenCookie(res, refreshToken);

    const response: AuthResponse = {
      success: true,
      message: "User registered successfully",
      data: {
        accessToken,
        user: {
          id: newUser[0].id.toString(),
          name: newUser[0].name,
          email: newUser[0].email,
          company_name: newUser[0].company_name,
          filesUploaded: 0, // Will be implemented with file upload feature
        },
      },
    };
    res.status(201).json(response);
  } catch (error) {
    console.error("Registration error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Internal Server Error",
      error: "An unexpected error occurred during registration",
    };
    res.status(500).json(response);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      const response: AuthResponse = {
        success: false,
        message: "Validation Error",
        error: "Email and password are required",
      };
      res.status(400).json(response);
      return;
    }

    // Find user by email
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (userResult.length === 0) {
      const response: AuthResponse = {
        success: false,
        message: "Invalid credentials",
        error: "Invalid email or password",
      };
      res.status(401).json(response);
      return;
    }

    const user = userResult[0];

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      const response: AuthResponse = {
        success: false,
        message: "Invalid credentials",
        error: "Invalid email or password",
      };
      res.status(401).json(response);
      return;
    }

    // Generate new tokens
    const accessToken = generateAccessToken({
      userId: user.id.toString(),
      email: user.email,
    });
    const refreshToken = generateRefreshToken();
    const hashedRefreshToken = await hashRefreshToken(refreshToken);

    // Update refresh token in database
    await db
      .update(users)
      .set({ refreshToken: hashedRefreshToken })
      .where(eq(users.id, user.id));

    // Set refresh token cookie
    setRefreshTokenCookie(res, refreshToken);

    const response: AuthResponse = {
      success: true,
      message: "Login successful",
      data: {
        accessToken,
        user: {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          company_name: user.company_name,
          filesUploaded: 0, // Will be implemented with file upload feature
        },
      },
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Login error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Internal Server Error",
      error: "An unexpected error occurred during login",
    };
    res.status(500).json(response);
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = extractRefreshTokenFromCookie(req.cookies);

    if (!refreshToken) {
      const response: AuthResponse = {
        success: false,
        message: "Refresh token required",
        error: "No refresh token provided",
      };
      res.status(401).json(response);
      return;
    }

    // Verify refresh token signature
    let decoded;
    try {
      decoded = verifyRefreshTokenSignature(refreshToken);
    } catch (error) {
      const response: AuthResponse = {
        success: false,
        message: "Invalid refresh token",
        error: "Refresh token is invalid or expired",
      };
      res.status(401).json(response);
      return;
    }

    // Find user with matching refresh token
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, decoded.email))
      .limit(1);

    if (userResult.length === 0) {
      const response: AuthResponse = {
        success: false,
        message: "Invalid refresh token",
        error: "User not found",
      };
      res.status(401).json(response);
      return;
    }

    const user = userResult[0];

    // Verify refresh token hash
    if (!user.refreshToken) {
      const response: AuthResponse = {
        success: false,
        message: "Invalid refresh token",
        error: "No stored refresh token",
      };
      res.status(401).json(response);
      return;
    }

    const isRefreshTokenValid = await verifyRefreshToken(
      refreshToken,
      user.refreshToken
    );
    if (!isRefreshTokenValid) {
      const response: AuthResponse = {
        success: false,
        message: "Invalid refresh token",
        error: "Refresh token does not match stored token",
      };
      res.status(401).json(response);
      return;
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: user.id.toString(),
      email: user.email,
    });
    const newRefreshToken = generateRefreshToken();
    const hashedNewRefreshToken = await hashRefreshToken(newRefreshToken);

    // Update refresh token in database
    await db
      .update(users)
      .set({ refreshToken: hashedNewRefreshToken })
      .where(eq(users.id, user.id));

    // Set new refresh token cookie
    setRefreshTokenCookie(res, newRefreshToken);

    const response: AuthResponse = {
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken,
      },
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Refresh token error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Internal Server Error",
      error: "An unexpected error occurred during token refresh",
    };
    res.status(500).json(response);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = extractRefreshTokenFromCookie(req.cookies);

    // Clear refresh token from database if it exists
    if (refreshToken) {
      try {
        // Find user by refresh token and clear it
        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.refreshToken, await hashRefreshToken(refreshToken)))
          .limit(1);

        if (userResult.length > 0) {
          await db
            .update(users)
            .set({ refreshToken: null })
            .where(eq(users.id, userResult[0].id));
        }
      } catch (error) {
        // Log error but don't fail logout
        console.error("Error clearing refresh token from database:", error);
      }
    }

    // Clear refresh token cookie
    clearRefreshTokenCookie(res);

    const response: AuthResponse = {
      success: true,
      message: "Logged out successfully",
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Logout error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Internal Server Error",
      error: "An unexpected error occurred during logout",
    };
    res.status(500).json(response);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, newPassword }: ResetPasswordRequest = req.body;

    if (!email || !newPassword) {
      const response: AuthResponse = {
        success: false,
        message: "Validation Error",
        error: "Email and new password are required",
      };
      res.status(400).json(response);
      return;
    }

    if (newPassword.length < 8) {
      const response: AuthResponse = {
        success: false,
        message: "Validation error",
        error: "New password must be at least 8 characters long",
      };
      res.status(400).json(response);
      return;
    }

    // Find user by email
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (userResult.length === 0) {
      const response: AuthResponse = {
        success: false,
        message: "User not found",
        error: "No user found with this email address",
      };
      res.status(404).json(response);
      return;
    }

    const user = userResult[0];

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear refresh token (force re-login)
    await db
      .update(users)
      .set({
        password: hashedPassword,
        refreshToken: null,
      })
      .where(eq(users.id, user.id));

    const response: AuthResponse = {
      success: true,
      message: "Password reset successfully",
      data: {
        message:
          "Password has been reset. Please login with your new password.",
      },
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Reset password error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Internal Server Error",
      error: "An unexpected error occurred during password reset",
    };
    res.status(500).json(response);
  }
};

export const getProfile = async (
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

    // Get user from database
    const userResult = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        company_name: users.company_name,
        created_at: users.created_at,
      })
      .from(users)
      .where(eq(users.id, parseInt(req.user.userId)))
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

    const user = userResult[0];

    const response: AuthResponse = {
      success: true,
      message: "Profile retrieved successfully",
      data: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        company_name: user.company_name,
        filesUploaded: 0, // Will be implemented with file upload feature
        createdAt: user.created_at?.toISOString() || new Date().toISOString(),
      },
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Get profile error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Internal Server Error",
      error: "An unexpected error occurred during profile retrieval",
    };
    res.status(500).json(response);
  }
};

export const changePassword = async (
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

    const { currentPassword, newPassword, confirmPassword } =
      req.body as ChangePasswordRequest;

    if (!currentPassword || !newPassword || !confirmPassword) {
      const response: AuthResponse = {
        success: false,
        message: "Validation error",
        error: "All password fields are required",
      };
      res.status(400).json(response);
      return;
    }

    if (newPassword !== confirmPassword) {
      const response: AuthResponse = {
        success: false,
        message: "Validation error",
        error: "New password and confirm password do not match",
      };
      res.status(400).json(response);
      return;
    }

    if (newPassword.length < 8) {
      const response: AuthResponse = {
        success: false,
        message: "Validation error",
        error: "New password must be at least 8 characters long",
      };
      res.status(400).json(response);
      return;
    }

    // Get user from database
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(req.user.userId)))
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

    const user = userResult[0];

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      const response: AuthResponse = {
        success: false,
        message: "Invalid current password",
        error: "Current password is incorrect",
      };
      res.status(400).json(response);
      return;
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password and clear refresh token (force re-login from other devices)
    await db
      .update(users)
      .set({
        password: hashedNewPassword,
        refreshToken: null,
      })
      .where(eq(users.id, user.id));

    const response: AuthResponse = {
      success: true,
      message: "Password changed successfully",
      data: {
        message:
          "Password has been changed. You have been logged out from other devices.",
      },
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Change password error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Internal Server Error",
      error: "An unexpected error occurred during password change",
    };
    res.status(500).json(response);
  }
};
