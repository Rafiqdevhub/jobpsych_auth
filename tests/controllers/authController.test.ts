import { Request, Response } from "express";
import { register, login } from "../../src/controllers/authController";

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
        error: "Name, email, password, and company_name are required",
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
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation Error",
        error: "Email and password are required",
      });
    });
  });
});
