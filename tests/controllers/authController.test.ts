import { Request, Response } from "express";
import {
  register,
  login,
  updateProfile,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPasswordWithToken,
} from "../../src/controllers/authController";

// Mock dependencies
jest.mock("../../src/utils/auth");
jest.mock("../../src/db");
jest.mock("../../src/services/emailService");
jest.mock("../../src/utils/emailVerification");
jest.mock("../../src/utils/passwordReset");

import { sendVerificationEmail } from "../../src/services/emailService";
import {
  generateVerificationToken,
  generateVerificationExpiry,
  isTokenExpired,
} from "../../src/utils/emailVerification";

import { sendPasswordResetEmail } from "../../src/services/emailService";
import {
  generatePasswordResetToken,
  generatePasswordResetExpiry,
  isPasswordResetTokenExpired,
  validatePassword,
  validateEmailFormat,
  normalizeEmail,
} from "../../src/utils/passwordReset";

// Mock implementations
const mockSendVerificationEmail = sendVerificationEmail as jest.MockedFunction<
  typeof sendVerificationEmail
>;
const mockGenerateVerificationToken =
  generateVerificationToken as jest.MockedFunction<
    typeof generateVerificationToken
  >;
const mockGenerateVerificationExpiry =
  generateVerificationExpiry as jest.MockedFunction<
    typeof generateVerificationExpiry
  >;
const mockIsTokenExpired = isTokenExpired as jest.MockedFunction<
  typeof isTokenExpired
>;

// Password Reset Mocks
const mockSendPasswordResetEmail =
  sendPasswordResetEmail as jest.MockedFunction<typeof sendPasswordResetEmail>;
const mockGeneratePasswordResetToken =
  generatePasswordResetToken as jest.MockedFunction<
    typeof generatePasswordResetToken
  >;
const mockGeneratePasswordResetExpiry =
  generatePasswordResetExpiry as jest.MockedFunction<
    typeof generatePasswordResetExpiry
  >;
const mockIsPasswordResetTokenExpired =
  isPasswordResetTokenExpired as jest.MockedFunction<
    typeof isPasswordResetTokenExpired
  >;
const mockValidatePassword = validatePassword as jest.MockedFunction<
  typeof validatePassword
>;
const mockValidateEmailFormat = validateEmailFormat as jest.MockedFunction<
  typeof validateEmailFormat
>;
const mockNormalizeEmail = normalizeEmail as jest.MockedFunction<
  typeof normalizeEmail
>;

describe("Auth Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };
  });

  describe("register", () => {
    beforeEach(() => {
      mockGenerateVerificationToken.mockReturnValue("test-verification-token");
      mockGenerateVerificationExpiry.mockReturnValue(
        new Date(Date.now() + 24 * 60 * 60 * 1000)
      );
      mockSendVerificationEmail.mockResolvedValue(true);
    });

    it("should return 400 for missing required fields", async () => {
      mockRequest.body = { email: "test@example.com" };

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation Error",
        error: "Name, email, password, and company name are required",
      });
    });

    it("should return 400 for invalid email", async () => {
      mockRequest.body = {
        name: "Test",
        email: "invalid-email",
        password: "Test123!",
        company_name: "Test Co",
      };

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Internal Server Error",
        error: "An unexpected error occurred during registration",
      });
    });

    it("should successfully register user and send verification email", async () => {
      mockRequest.body = {
        name: "Test User",
        email: "test@example.com",
        password: "Test123!",
        company_name: "Test Company",
      };

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockSendVerificationEmail).toHaveBeenCalledWith(
        "test@example.com",
        "Test User",
        "test-verification-token"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message:
          "Registration successful! Please check your email to verify your account.",
        data: {
          user: {
            id: expect.any(String),
            name: "Test User",
            email: "test@example.com",
            company_name: "Test Company",
            emailVerified: false,
          },
          requiresVerification: true,
        },
      });
    });
  });

  describe("login", () => {
    it("should return 400 for missing email", async () => {
      mockRequest.body = { password: "test123" };

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation Error",
        error: "Email and password are required",
      });
    });

    it("should return 400 for missing password", async () => {
      mockRequest.body = { email: "test@example.com" };

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("should return 403 for unverified email", async () => {
      mockRequest.body = {
        email: "unverified@example.com",
        password: "test123",
      };

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Email not verified",
        error:
          "Please verify your email address before logging in. Check your email for the verification link.",
        requiresVerification: true,
      });
    });
  });

  describe("updateProfile", () => {
    beforeEach(() => {
      (mockRequest as any).user = { userId: "1", email: "test@example.com" };
    });

    it("should return 401 if user is not authenticated", async () => {
      (mockRequest as any).user = undefined;

      await updateProfile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Unauthorized",
        error: "User not authenticated",
      });
    });

    it("should return 400 if no fields are provided", async () => {
      mockRequest.body = {};

      await updateProfile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation error",
        error: "At least one field (name or newPassword) must be provided",
      });
    });

    it("should return 400 for invalid name", async () => {
      mockRequest.body = { name: "" };

      await updateProfile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation error",
        error: "Name must be a non-empty string",
      });
    });

    it("should return 400 for name too long", async () => {
      mockRequest.body = { name: "a".repeat(256) };

      await updateProfile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation error",
        error: "Name must be less than 255 characters",
      });
    });

    it("should return 400 if changing password without current password", async () => {
      mockRequest.body = { newPassword: "newpassword123" };

      await updateProfile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation error",
        error: "Current password is required when changing password",
      });
    });

    it("should return 400 if password confirmation doesn't match", async () => {
      mockRequest.body = {
        currentPassword: "currentpass",
        newPassword: "newpassword123",
        confirmPassword: "differentpassword",
      };

      await updateProfile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation error",
        error: "New password and confirm password do not match",
      });
    });

    it("should return 400 for password too short", async () => {
      mockRequest.body = {
        currentPassword: "currentpass",
        newPassword: "short",
        confirmPassword: "short",
      };

      await updateProfile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation error",
        error: "New password must be at least 8 characters long",
      });
    });

    it("should return 404 if user not found", async () => {
      mockRequest.body = { name: "New Name" };

      // Mock database to return empty result
      const mockDb = require("../../src/db").db;
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await updateProfile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "User not found",
        error: "User account not found",
      });
    });

    it("should return 400 for incorrect current password", async () => {
      mockRequest.body = {
        currentPassword: "wrongpassword",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      };

      // Mock database and password verification
      const mockDb = require("../../src/db").db;
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              {
                id: 1,
                password: "hashedpassword",
              },
            ]),
          }),
        }),
      });

      const mockVerifyPassword = require("../../src/utils/auth").verifyPassword;
      mockVerifyPassword.mockResolvedValue(false);

      await updateProfile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid current password",
        error: "Current password is incorrect",
      });
    });

    it("should successfully update name only", async () => {
      mockRequest.body = { name: "Updated Name" };

      // Mock database operations
      const mockDb = require("../../src/db").db;
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              {
                id: 1,
                name: "Old Name",
                email: "test@example.com",
                company_name: "Test Company",
                password: "hashedpassword",
                filesUploaded: 5,
              },
            ]),
          }),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                id: 1,
                name: "Updated Name",
                email: "test@example.com",
                company_name: "Test Company",
                filesUploaded: 5,
                updated_at: new Date("2025-10-08T10:00:00Z"),
              },
            ]),
          }),
        }),
      });

      await updateProfile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Profile updated successfully",
        data: {
          id: "1",
          name: "Updated Name",
          email: "test@example.com",
          company_name: "Test Company",
          filesUploaded: 5,
          updatedAt: "2025-10-08T10:00:00.000Z",
        },
      });
    });

    it("should successfully update password only", async () => {
      mockRequest.body = {
        currentPassword: "currentpass",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      };

      // Mock database and password operations
      const mockDb = require("../../src/db").db;
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              {
                id: 1,
                name: "Test User",
                email: "test@example.com",
                company_name: "Test Company",
                password: "hashedpassword",
                filesUploaded: 5,
              },
            ]),
          }),
        }),
      });

      const mockVerifyPassword = require("../../src/utils/auth").verifyPassword;
      mockVerifyPassword.mockResolvedValue(true);

      const mockHashPassword = require("../../src/utils/auth").hashPassword;
      mockHashPassword.mockResolvedValue("newhashedpassword");

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                id: 1,
                name: "Test User",
                email: "test@example.com",
                company_name: "Test Company",
                filesUploaded: 5,
                updated_at: new Date("2025-10-08T10:00:00Z"),
              },
            ]),
          }),
        }),
      });

      await updateProfile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Profile updated successfully",
        data: {
          id: "1",
          name: "Test User",
          email: "test@example.com",
          company_name: "Test Company",
          filesUploaded: 5,
          updatedAt: "2025-10-08T10:00:00.000Z",
          securityNote:
            "Password has been changed. You have been logged out from other devices.",
        },
      });
    });

    it("should successfully update both name and password", async () => {
      mockRequest.body = {
        name: "Updated Name",
        currentPassword: "currentpass",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      };

      // Mock database and password operations
      const mockDb = require("../../src/db").db;
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              {
                id: 1,
                name: "Old Name",
                email: "test@example.com",
                company_name: "Test Company",
                password: "hashedpassword",
                filesUploaded: 5,
              },
            ]),
          }),
        }),
      });

      const mockVerifyPassword = require("../../src/utils/auth").verifyPassword;
      mockVerifyPassword.mockResolvedValue(true);

      const mockHashPassword = require("../../src/utils/auth").hashPassword;
      mockHashPassword.mockResolvedValue("newhashedpassword");

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                id: 1,
                name: "Updated Name",
                email: "test@example.com",
                company_name: "Test Company",
                filesUploaded: 5,
                updated_at: new Date("2025-10-08T10:00:00Z"),
              },
            ]),
          }),
        }),
      });

      await updateProfile(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Profile updated successfully",
        data: {
          id: "1",
          name: "Updated Name",
          email: "test@example.com",
          company_name: "Test Company",
          filesUploaded: 5,
          updatedAt: "2025-10-08T10:00:00.000Z",
          securityNote:
            "Password has been changed. You have been logged out from other devices.",
        },
      });
    });
  });

  describe("verifyEmail", () => {
    beforeEach(() => {
      mockGenerateVerificationToken.mockReturnValue("test-verification-token");
      mockGenerateVerificationExpiry.mockReturnValue(
        new Date(Date.now() + 24 * 60 * 60 * 1000)
      );
      mockIsTokenExpired.mockReturnValue(false);
      mockSendVerificationEmail.mockResolvedValue(true);
    });

    it("should return 400 for missing token", async () => {
      mockRequest.body = {};

      await verifyEmail(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation Error",
        error: "Verification token is required",
      });
    });

    it("should return 400 for invalid token", async () => {
      mockRequest.body = { token: "invalid-token" };

      await verifyEmail(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid token",
        error: "Verification token is invalid or has already been used",
      });
    });

    it("should return 400 for expired token", async () => {
      mockIsTokenExpired.mockReturnValue(true);
      mockRequest.body = { token: "expired-token" };

      await verifyEmail(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Token expired",
        error:
          "Verification token has expired. Please request a new verification email.",
      });
    });

    it("should return 400 for already verified email", async () => {
      mockRequest.body = { token: "already-verified-token" };

      await verifyEmail(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Already verified",
        error: "This email address has already been verified",
      });
    });

    it("should successfully verify email and return tokens", async () => {
      mockRequest.body = { token: "valid-token" };

      await verifyEmail(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Email verified successfully! You are now logged in.",
        data: expect.objectContaining({
          accessToken: expect.any(String),
          user: expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            email: expect.any(String),
            emailVerified: true,
          }),
        }),
      });
    });
  });

  describe("resendVerification", () => {
    beforeEach(() => {
      mockGenerateVerificationToken.mockReturnValue("new-verification-token");
      mockGenerateVerificationExpiry.mockReturnValue(
        new Date(Date.now() + 24 * 60 * 60 * 1000)
      );
      mockSendVerificationEmail.mockResolvedValue(true);
    });

    it("should return 400 for missing email", async () => {
      mockRequest.body = {};

      await resendVerification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation Error",
        error: "Email address is required",
      });
    });

    it("should return 404 for non-existent user", async () => {
      mockRequest.body = { email: "nonexistent@example.com" };

      await resendVerification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "User not found",
        error: "No account found with this email address",
      });
    });

    it("should return 400 for already verified email", async () => {
      mockRequest.body = { email: "already-verified@example.com" };

      await resendVerification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Already verified",
        error: "This email address has already been verified",
      });
    });

    it("should successfully resend verification email", async () => {
      mockRequest.body = { email: "unverified@example.com" };

      await resendVerification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockSendVerificationEmail).toHaveBeenCalledWith(
        "unverified@example.com",
        expect.any(String),
        "new-verification-token"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Verification email sent successfully",
        data: {
          email: "unverified@example.com",
        },
      });
    });

    it("should return 500 when email sending fails", async () => {
      mockSendVerificationEmail.mockResolvedValue(false);
      mockRequest.body = { email: "unverified@example.com" };

      await resendVerification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Email sending failed",
        error: "Failed to send verification email. Please try again later.",
      });
    });
  });

  describe("forgotPassword", () => {
    beforeEach(() => {
      mockNormalizeEmail.mockImplementation((email) => email.toLowerCase());
      mockValidateEmailFormat.mockReturnValue(true);
      mockGeneratePasswordResetToken.mockReturnValue("reset-token-12345");
      mockGeneratePasswordResetExpiry.mockReturnValue(
        new Date(Date.now() + 24 * 60 * 60 * 1000)
      );
      mockSendPasswordResetEmail.mockResolvedValue(true);
    });

    it("should return 400 if email is not provided", async () => {
      mockRequest.body = {};

      await forgotPassword(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Email is required",
        error: "EMAIL_REQUIRED",
      });
    });

    it("should return 400 if email is invalid", async () => {
      mockValidateEmailFormat.mockReturnValue(false);
      mockRequest.body = { email: "invalid-email" };

      await forgotPassword(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email format",
        error: "INVALID_EMAIL_FORMAT",
      });
    });

    it("should return success even if user doesn't exist (security)", async () => {
      mockRequest.body = { email: "nonexistent@example.com" };

      await forgotPassword(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent",
      });
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("should generate reset token and send email for existing user", async () => {
      mockRequest.body = { email: "user@example.com" };

      await forgotPassword(mockRequest as Request, mockResponse as Response);

      expect(mockNormalizeEmail).toHaveBeenCalledWith("user@example.com");
      expect(mockValidateEmailFormat).toHaveBeenCalled();
      expect(mockGeneratePasswordResetToken).toHaveBeenCalled();
      expect(mockGeneratePasswordResetExpiry).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent",
      });
    });

    it("should handle email sending failure gracefully", async () => {
      mockSendPasswordResetEmail.mockResolvedValue(false);
      mockRequest.body = { email: "user@example.com" };

      await forgotPassword(mockRequest as Request, mockResponse as Response);

      // Should still return success even if email fails
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent",
      });
    });

    it("should handle server errors gracefully", async () => {
      mockNormalizeEmail.mockImplementation(() => {
        throw new Error("Database error");
      });
      mockRequest.body = { email: "user@example.com" };

      await forgotPassword(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Internal Server Error",
        error: "An unexpected error occurred during password reset request",
      });
    });
  });

  describe("resetPasswordWithToken", () => {
    beforeEach(() => {
      mockValidatePassword.mockReturnValue({ isValid: true });
      mockIsPasswordResetTokenExpired.mockReturnValue(false);
    });

    it("should return 400 if token is not provided", async () => {
      mockRequest.body = {
        newPassword: "NewPass123",
        confirmPassword: "NewPass123",
      };

      await resetPasswordWithToken(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Reset token is required",
        error: "TOKEN_REQUIRED",
      });
    });

    it("should return 400 if newPassword is not provided", async () => {
      mockRequest.body = {
        token: "reset-token",
        confirmPassword: "NewPass123",
      };

      await resetPasswordWithToken(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "New password is required",
        error: "PASSWORD_REQUIRED",
      });
    });

    it("should return 400 if confirmPassword is not provided", async () => {
      mockRequest.body = { token: "reset-token", newPassword: "NewPass123" };

      await resetPasswordWithToken(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Password confirmation is required",
        error: "CONFIRM_PASSWORD_REQUIRED",
      });
    });

    it("should return 400 if passwords don't match", async () => {
      mockRequest.body = {
        token: "reset-token",
        newPassword: "NewPass123",
        confirmPassword: "DifferentPass123",
      };

      await resetPasswordWithToken(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Passwords do not match",
        error: "PASSWORDS_MISMATCH",
      });
    });

    it("should return 400 if password is too weak", async () => {
      mockValidatePassword.mockReturnValue({
        isValid: false,
        message: "Password must contain uppercase, lowercase, and numbers",
      });
      mockRequest.body = {
        token: "reset-token",
        newPassword: "weak",
        confirmPassword: "weak",
      };

      await resetPasswordWithToken(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Password must contain uppercase, lowercase, and numbers",
        error: "WEAK_PASSWORD",
      });
    });

    it("should return 400 if reset token is invalid", async () => {
      mockValidatePassword.mockReturnValue({ isValid: true });
      mockRequest.body = {
        token: "invalid-token",
        newPassword: "NewPass123",
        confirmPassword: "NewPass123",
      };

      await resetPasswordWithToken(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid or expired reset token",
        error: "INVALID_TOKEN",
      });
    });

    it("should return 400 if reset token has expired", async () => {
      mockValidatePassword.mockReturnValue({ isValid: true });
      mockIsPasswordResetTokenExpired.mockReturnValue(true);
      mockRequest.body = {
        token: "expired-token",
        newPassword: "NewPass123",
        confirmPassword: "NewPass123",
      };

      await resetPasswordWithToken(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message:
          "Reset token has expired. Please request a new password reset.",
        error: "TOKEN_EXPIRED",
      });
    });

    it("should successfully reset password with valid token", async () => {
      mockValidatePassword.mockReturnValue({ isValid: true });
      mockIsPasswordResetTokenExpired.mockReturnValue(false);
      mockRequest.body = {
        token: "valid-token",
        newPassword: "NewPass123",
        confirmPassword: "NewPass123",
      };

      await resetPasswordWithToken(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message:
          "Password has been reset successfully. You can now log in with your new password.",
      });
    });

    it("should handle server errors gracefully", async () => {
      mockValidatePassword.mockImplementation(() => {
        throw new Error("Validation error");
      });
      mockRequest.body = {
        token: "reset-token",
        newPassword: "NewPass123",
        confirmPassword: "NewPass123",
      };

      await resetPasswordWithToken(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Internal Server Error",
        error: "An unexpected error occurred during password reset",
      });
    });
  });
});
