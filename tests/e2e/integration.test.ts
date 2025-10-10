import { test, expect } from "./fixtures";

test.describe("Integration Tests", () => {
  test("should verify valid JWT token via dedicated endpoint", async ({
    api,
    authToken,
  }) => {
    const response = await api.post("/api/auth/verify-token", {
      data: {
        token: authToken,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe("Token is valid");
    expect(data.decoded).toBeDefined();
    expect(data.decoded.userId).toBeDefined();
    expect(data.decoded.email).toBeDefined();
    expect(data.tokenInfo).toBeDefined();
    expect(data.tokenInfo.algorithm).toBe("HS256");
  });

  test("should reject invalid JWT token via verification endpoint", async ({
    api,
  }) => {
    const invalidTokens = [
      "invalid.jwt.token",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid",
      "",
      null,
      undefined,
    ];

    for (const token of invalidTokens) {
      const response = await api.post("/api/auth/verify-token", {
        data: { token },
      });

      // Empty/null/undefined tokens return 400, invalid format returns 401
      if (token === "" || token === null || token === undefined) {
        expect(response.status()).toBe(400);
      } else {
        expect(response.status()).toBe(401);
      }
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe(
        token ? "Invalid or expired token" : "Token is required"
      );
    }
  });

  test("should return JWT token information", async ({ api }) => {
    const response = await api.get("/api/auth/jwt-info");

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Should return JWT configuration info
    expect(data).toHaveProperty("jwtInfo");
    expect(data.jwtInfo).toHaveProperty("algorithm");
    expect(data.jwtInfo).toHaveProperty("accessTokenExpiry");
    expect(data.jwtInfo.algorithm).toBe("HS256"); // Based on our implementation
  });

  test("should handle token verification without token parameter", async ({
    api,
  }) => {
    const response = await api.post("/api/auth/verify-token", {
      data: {},
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Token is required");
  });

  test("should verify token consistency between auth and verification endpoints", async ({
    api,
    authToken,
    testUser,
  }) => {
    // Get user info from profile endpoint
    const profileResponse = await api.get("/api/auth/profile", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(profileResponse.status()).toBe(200);
    const profileData = await profileResponse.json();

    // Verify same token via verification endpoint
    const verifyResponse = await api.post("/api/auth/verify-token", {
      data: {
        token: authToken,
      },
    });

    expect(verifyResponse.status()).toBe(200);
    const verifyData = await verifyResponse.json();

    // User data should match
    expect(verifyData.success).toBe(true);
    expect(verifyData.decoded.userId).toBe(profileData.data.id);
    expect(verifyData.decoded.email).toBe(profileData.data.email);
  });

  test("should handle expired token verification", async ({ api }) => {
    // This test would require creating an expired token
    // For now, we test with a clearly invalid token
    const expiredToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwibmFtZSI6IlRlc3QiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjIzOTAyMn0.invalid";

    const response = await api.post("/api/auth/verify-token", {
      data: {
        token: expiredToken,
      },
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Invalid or expired token");
  });

  test("should support cross-service token validation workflow", async ({
    api,
    authToken,
    testUser,
  }) => {
    // Simulate cross-service communication:
    // 1. Service A has a token
    // 2. Service A calls verify-token endpoint
    // 3. Service B receives validation result

    const verifyResponse = await api.post("/api/auth/verify-token", {
      data: {
        token: authToken,
      },
    });

    expect(verifyResponse.status()).toBe(200);
    const verifyData = await verifyResponse.json();

    // Verify the response contains all necessary user information
    expect(verifyData.success).toBe(true);
    expect(verifyData.decoded).toHaveProperty("userId");
    expect(verifyData.decoded).toHaveProperty("email");
    expect(verifyData.decoded).toHaveProperty("iat"); // Issued at time
    expect(verifyData.decoded).toHaveProperty("exp"); // Expiration time

    // Ensure userId is a string (as stored in token)
    expect(typeof verifyData.decoded.userId).toBe("string");
    expect(typeof verifyData.decoded.email).toBe("string");
  });

  test("should handle malformed token verification requests", async ({
    api,
  }) => {
    const malformedRequests = [
      { token: 123 }, // Number instead of string
      { token: {} }, // Object instead of string
      { token: [] }, // Array instead of string
      { token: true }, // Boolean instead of string
    ];

    for (const requestData of malformedRequests) {
      const response = await api.post("/api/auth/verify-token", {
        data: requestData,
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe("Invalid or expired token");
    }
  });

  test("should maintain token verification performance", async ({
    api,
    authToken,
  }) => {
    const startTime = Date.now();

    // Make multiple verification requests
    const requests = Array(5)
      .fill(null)
      .map(() =>
        api.post("/api/auth/verify-token", {
          data: { token: authToken },
        })
      );

    const responses = await Promise.all(requests);
    const endTime = Date.now();

    // All should succeed
    for (const response of responses) {
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.decoded).toBeDefined();
    }

    // Should complete within reasonable time (less than 1 second per request)
    const totalTime = endTime - startTime;
    expect(totalTime).toBeLessThan(5000); // 5 seconds for 5 requests
  });
});
