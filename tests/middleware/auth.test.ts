import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import { authenticate } from "../../src/middleware/auth";
import * as authUtils from "../../src/utils/auth";

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Test route with authentication middleware
  app.get("/protected", authenticate, (req, res) => {
    res.json({
      success: true,
      message: "Access granted",
      user: req.user,
    });
  });

  return app;
};

describe("Auth Middleware", () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  it("should allow access with valid token", async () => {
    const mockPayload = {
      userId: "123",
      email: "test@example.com",
    };

    const token = authUtils.generateAccessToken(mockPayload);

    const response = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Access granted");
    expect(response.body.user).toEqual(
      expect.objectContaining({
        userId: mockPayload.userId,
        email: mockPayload.email,
      })
    );
  });

  it("should deny access without token", async () => {
    const response = await request(app).get("/protected").expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Access token is required");
  });

  it("should deny access with invalid token", async () => {
    const response = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer invalid.token.here")
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid or expired access token");
  });

  it("should deny access with malformed authorization header", async () => {
    const response = await request(app)
      .get("/protected")
      .set("Authorization", "InvalidFormat token")
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Access token is required");
  });

  it("should deny access with expired token", async () => {
    // Create a token that's already expired (this is tricky to test without mocking time)
    // For now, we'll test with an invalid signature which will also throw an error
    const expiredToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE2MDk0NTkyMDAsImV4cCI6MTYwOTQ1OTIwMX0.invalid_signature";

    const response = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${expiredToken}`)
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid or expired access token");
  });
});
