import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshTokenSignature,
  extractTokenFromHeader,
  extractRefreshTokenFromCookie,
} from "../../src/utils/auth";

describe("Auth Utils", () => {
  describe("Password Functions", () => {
    it("should hash password correctly", async () => {
      const password = "testPassword123";
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it("should verify correct password", async () => {
      const password = "testPassword123";
      const hashedPassword = await hashPassword(password);

      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "testPassword123";
      const wrongPassword = "wrongPassword";
      const hashedPassword = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });
  });

  describe("JWT Token Functions", () => {
    const mockPayload = {
      userId: "123",
      email: "test@example.com",
    };

    it("should generate access token", () => {
      const token = generateAccessToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT format: header.payload.signature
    });

    it("should generate refresh token", () => {
      const token = generateRefreshToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });

    it("should verify valid access token", () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
    });

    it("should throw error for invalid access token", () => {
      const invalidToken = "invalid.token.here";

      expect(() => {
        verifyAccessToken(invalidToken);
      }).toThrow();
    });

    it("should verify refresh token signature", () => {
      const token = generateRefreshToken();

      expect(() => {
        verifyRefreshTokenSignature(token);
      }).not.toThrow();
    });
  });

  describe("Token Extraction Functions", () => {
    it("should extract token from Bearer header", () => {
      const token = "sample.jwt.token";
      const header = `Bearer ${token}`;

      const extracted = extractTokenFromHeader(header);
      expect(extracted).toBe(token);
    });

    it("should return null for invalid header format", () => {
      const invalidHeader = "InvalidToken sample.jwt.token";

      const extracted = extractTokenFromHeader(invalidHeader);
      expect(extracted).toBeNull();
    });

    it("should return null for undefined header", () => {
      const extracted = extractTokenFromHeader(undefined);
      expect(extracted).toBeNull();
    });

    it("should extract refresh token from cookies", () => {
      const token = "sample.refresh.token";
      const cookies = { refreshToken: token };

      const extracted = extractRefreshTokenFromCookie(cookies);
      expect(extracted).toBe(token);
    });

    it("should return null for missing refresh token cookie", () => {
      const cookies = { otherCookie: "value" };

      const extracted = extractRefreshTokenFromCookie(cookies);
      expect(extracted).toBeNull();
    });

    it("should return null for undefined cookies", () => {
      const extracted = extractRefreshTokenFromCookie(undefined);
      expect(extracted).toBeNull();
    });
  });
});
