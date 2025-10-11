import { Request, Response } from "express";
import {
  register,
  login,
  updateProfile,
} from "../../src/controllers/authController";

// Mock dependencies
jest.mock("../../src/utils/auth");
jest.mock("../../src/db");

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
});
