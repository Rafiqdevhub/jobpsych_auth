import { Request, Response } from "express";
import User from "../models/user";
import bcrypt from "bcrypt";
import {
  validatePassword,
  hashPassword,
  generateTokens,
  verifyPassword,
  verifyRefreshToken,
  extractTokenFromHeader,
  verifyAccessToken,
} from "../utils/auth";
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  RefreshTokenRequest,
  TokenPayload,
} from "../types/auth";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, user_type }: RegisterRequest = req.body;

    if (!name || !email || !password || !user_type) {
      const response: AuthResponse = {
        success: false,
        message: "Validation Error",
        error: "Name, email, password, and user_type are required",
      };
      res.status(400).json(response);
      return;
    }

    if (!["candidate", "recruiter"].includes(user_type)) {
      const response: AuthResponse = {
        success: false,
        message: "Validation Error",
        error: "User type must be either 'candidate' or 'recruiter'",
      };
      res.status(400).json(response);
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      const response: AuthResponse = {
        success: false,
        message: "Password Validation Failed",
        error: passwordValidation.errors.join(", "),
      };
      res.status(400).json(response);
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const response: AuthResponse = {
        success: false,
        message: "User Already Exists",
        error: "A user with this email already exists",
      };
      res.status(409).json(response);
      return;
    }

    const hashedPassword = await hashPassword(password);

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      user_type,
      plan_type: "free",
      subscription_status: "inactive",
    });

    await user.save();

    const tokenPayload: TokenPayload = {
      userId: (user._id as any).toString(),
      email: user.email,
      user_type: user.user_type,
    };

    const tokens = generateTokens(tokenPayload);

    // Hash and store refresh token in database
    const hashedRefreshToken = await bcrypt.hash(tokens.refresh_token, 10);
    user.refresh_token = hashedRefreshToken;
    await user.save();

    // Set refresh token as HttpOnly cookie
    res.cookie("refresh_token", tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/api/auth",
    });

    const response: AuthResponse = {
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: (user._id as any).toString(),
          name: user.name,
          email: user.email,
          user_type: user.user_type,
          plan_type: user.plan_type,
          subscription_status: user.subscription_status,
        },
        access_token: tokens.access_token,
      },
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error("Registration error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Registration Failed",
      error: error.message || "An error occurred during registration",
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
        message: "Authentication Failed",
        error: "Invalid email or password",
      };
      res.status(401).json(response);
      return;
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      const response: AuthResponse = {
        success: false,
        message: "Authentication Failed",
        error: "Invalid email or password",
      };
      res.status(401).json(response);
      return;
    }

    const tokenPayload: TokenPayload = {
      userId: (user._id as any).toString(),
      email: user.email,
      user_type: user.user_type,
    };

    const tokens = generateTokens(tokenPayload);

    // Hash and store refresh token in database
    const hashedRefreshToken = await bcrypt.hash(tokens.refresh_token, 10);
    user.refresh_token = hashedRefreshToken;
    await user.save();

    // Set refresh token as HttpOnly cookie
    res.cookie("refresh_token", tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/api/auth",
    });

    const response: AuthResponse = {
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: (user._id as any).toString(),
          name: user.name,
          email: user.email,
          user_type: user.user_type,
          plan_type: user.plan_type,
          subscription_status: user.subscription_status,
        },
        access_token: tokens.access_token,
      },
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error("Login error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Login Failed",
      error: error.message || "An error occurred during login",
    };
    res.status(500).json(response);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const refreshTokenFromCookie = req.cookies.refresh_token;

    if (!refreshTokenFromCookie) {
      const response: AuthResponse = {
        success: false,
        message: "Authentication Required",
        error: "Refresh token not found",
      };
      res.status(401).json(response);
      return;
    }

    const decoded = verifyRefreshToken(refreshTokenFromCookie);

    const user = await User.findById(decoded.userId);
    if (!user || !user.refresh_token) {
      const response: AuthResponse = {
        success: false,
        message: "Authentication Failed",
        error: "Invalid refresh token",
      };
      res.status(401).json(response);
      return;
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshTokenFromCookie,
      user.refresh_token
    );
    if (!isRefreshTokenValid) {
      const response: AuthResponse = {
        success: false,
        message: "Authentication Failed",
        error: "Invalid refresh token",
      };
      res.status(401).json(response);
      return;
    }

    const tokenPayload: TokenPayload = {
      userId: (user._id as any).toString(),
      email: user.email,
      user_type: user.user_type,
    };

    const tokens = generateTokens(tokenPayload);

    const hashedRefreshToken = await bcrypt.hash(tokens.refresh_token, 10);
    user.refresh_token = hashedRefreshToken;
    await user.save();

    res.cookie("refresh_token", tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth",
    });

    const response: AuthResponse = {
      success: true,
      message: "Token refreshed successfully",
      data: {
        access_token: tokens.access_token,
      },
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error("Token refresh error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Token Refresh Failed",
      error: error.message || "An error occurred during token refresh",
    };
    res.status(401).json(response);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshTokenFromCookie = req.cookies.refresh_token;

    if (refreshTokenFromCookie) {
      try {
        const decoded = verifyRefreshToken(refreshTokenFromCookie);
        await User.findByIdAndUpdate(decoded.userId, {
          $unset: { refresh_token: 1 },
        });
      } catch (error) {
        console.log("Invalid refresh token during logout");
      }
    }

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth",
    });

    const response: AuthResponse = {
      success: true,
      message: "Logged out successfully",
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error("Logout error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Logout Failed",
      error: error.message || "An error occurred during logout",
    };
    res.status(500).json(response);
  }
};

export const verifyToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      const response: AuthResponse = {
        success: false,
        message: "Authentication Required",
        error: "Access token is required",
      };
      res.status(401).json(response);
      return;
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId);
    if (!user) {
      const response: AuthResponse = {
        success: false,
        message: "Authentication Failed",
        error: "User not found",
      };
      res.status(401).json(response);
      return;
    }

    const response: AuthResponse = {
      success: true,
      message: "Token is valid",
      data: {
        user: {
          id: (user._id as any).toString(),
          name: user.name,
          email: user.email,
          user_type: user.user_type,
          plan_type: user.plan_type,
          subscription_status: user.subscription_status,
        },
      },
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error("Token verification error:", error);
    const response: AuthResponse = {
      success: false,
      message: "Token Verification Failed",
      error: error.message || "Invalid or expired token",
    };
    res.status(401).json(response);
  }
};
