import { Request, Response } from "express";
import User from "../models/user";
import RefreshToken from "../models/refreshToken";
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

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const response: AuthResponse = {
        success: false,
        message: "User already exists",
        error: "A user with this email already exists",
      };
      res.status(409).json(response);
      return;
    }

    const hashedPassword = await hashPassword(password);

    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      company_name,
    });

    await user.save();

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });
    const refreshToken = generateRefreshToken();
    const hashedRefreshToken = await hashRefreshToken(refreshToken);

    const refreshTokenDoc = new RefreshToken({
      userId: user._id,
      token: hashedRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await refreshTokenDoc.save();

    // Set refresh token as HttpOnly cookie
    setRefreshTokenCookie(res, refreshToken);

    const tokenResponse: TokenResponse = {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company_name: user.company_name,
        filesUploaded: user.filesUploaded,
      },
    };

    const response: AuthResponse = {
      success: true,
      message: "User registered successfully",
      data: tokenResponse,
    };
    res.status(201).json(response);
  } catch (error) {
    console.error("Registration error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Internal server error",
      error: "Failed to register user",
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

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const response: AuthResponse = {
        success: false,
        message: "Invalid credentials",
        error: "User not found",
      };
      res.status(401).json(response);
      return;
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      const response: AuthResponse = {
        success: false,
        message: "Invalid credentials",
        error: "Incorrect password",
      };
      res.status(401).json(response);
      return;
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });
    const refreshToken = generateRefreshToken();
    const hashedRefreshToken = await hashRefreshToken(refreshToken);

    await RefreshToken.deleteMany({ userId: user._id });

    const refreshTokenDoc = new RefreshToken({
      userId: user._id,
      token: hashedRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await refreshTokenDoc.save();

    setRefreshTokenCookie(res, refreshToken);

    const tokenResponse: TokenResponse = {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company_name: user.company_name,
        filesUploaded: user.filesUploaded,
      },
    };

    const response: AuthResponse = {
      success: true,
      message: "Login successful",
      data: tokenResponse,
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Login error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Internal server error",
      error: "Failed to login",
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
        message: "Refresh token is required",
        error: "No refresh token provided",
      };
      res.status(401).json(response);
      return;
    }

    try {
      verifyRefreshTokenSignature(refreshToken);
    } catch (error) {
      const response: AuthResponse = {
        success: false,
        message: "Invalid refresh token",
        error: "Refresh token signature verification failed",
      };
      res.status(401).json(response);
      return;
    }

    const storedRefreshToken = await RefreshToken.findOne({
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!storedRefreshToken) {
      const response: AuthResponse = {
        success: false,
        message: "Refresh token expired or not found",
        error: "Token not found in database",
      };
      res.status(401).json(response);
      return;
    }

    const isValidToken = await verifyRefreshToken(
      refreshToken,
      storedRefreshToken.token
    );
    if (!isValidToken) {
      const response: AuthResponse = {
        success: false,
        message: "Invalid refresh token",
        error: "Token verification failed",
      };
      res.status(401).json(response);
      return;
    }

    const user = await User.findById(storedRefreshToken.userId);
    if (!user) {
      const response: AuthResponse = {
        success: false,
        message: "User not found",
        error: "Associated user not found",
      };
      res.status(401).json(response);
      return;
    }

    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });
    const newRefreshToken = generateRefreshToken();
    const hashedNewRefreshToken = await hashRefreshToken(newRefreshToken);

    await RefreshToken.deleteOne({ _id: storedRefreshToken._id });

    const newRefreshTokenDoc = new RefreshToken({
      userId: user._id,
      token: hashedNewRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await newRefreshTokenDoc.save();

    // Set new refresh token cookie
    setRefreshTokenCookie(res, newRefreshToken);

    const tokenResponse: TokenResponse = {
      accessToken: newAccessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company_name: user.company_name,
        filesUploaded: user.filesUploaded,
      },
    };

    const response: AuthResponse = {
      success: true,
      message: "Token refreshed successfully",
      data: tokenResponse,
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Refresh token error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Internal server error",
      error: "Failed to refresh token",
    };
    res.status(500).json(response);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = extractRefreshTokenFromCookie(req.cookies);

    if (refreshToken) {
      const storedRefreshToken = await RefreshToken.findOne({
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      if (storedRefreshToken) {
        const isValidToken = await verifyRefreshToken(
          refreshToken,
          storedRefreshToken.token
        );
        if (isValidToken) {
          await RefreshToken.deleteOne({ _id: storedRefreshToken._id });
        }
      }
    }

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
      message: "Internal server error",
      error: "Failed to logout",
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

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const response: AuthResponse = {
        success: false,
        message: "User not found",
        error: "No user with this email exists",
      };
      res.status(404).json(response);
      return;
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    const response: AuthResponse = {
      success: true,
      message: "Password reset successfully",
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Reset password error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Internal server error",
      error: "Failed to reset password",
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

    const profile: ProfileResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      company_name: user.company_name,
      filesUploaded: user.filesUploaded,
      createdAt: user.createdAt.toISOString(),
    };

    const response: AuthResponse = {
      success: true,
      message: "Profile retrieved successfully",
      data: profile,
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Get profile error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Internal server error",
      error: "Failed to retrieve profile",
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

    const hashedNewPassword = await hashPassword(newPassword);

    user.password = hashedNewPassword;
    await user.save();

    const response: AuthResponse = {
      success: true,
      message: "Password changed successfully",
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Change password error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Internal server error",
      error: "Failed to change password",
    };
    res.status(500).json(response);
  }
};
