import { test, expect } from "./fixtures";

test.describe("Authentication Flow E2E", () => {
  test("should complete full authentication flow", async ({
    api,
    testUser,
    authToken,
  }) => {
    // Test user registration (already done in fixture)
    expect(authToken).toBeDefined();
    expect(typeof authToken).toBe("string");
    expect(authToken.length).toBeGreaterThan(0);

    // Test accessing protected route with valid token
    const profileResponse = await api.get("/api/auth/profile", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(profileResponse.ok()).toBe(true);
    const profileData = await profileResponse.json();
    expect(profileData.success).toBe(true);
    expect(profileData.data).toBeDefined();
    expect(profileData.data.email).toBe(testUser.email);
  });

  test("should handle invalid login credentials", async ({ api }) => {
    const response = await api.post("/api/auth/login", {
      data: {
        email: "nonexistent@example.com",
        password: "wrongpassword",
      },
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Invalid credentials");
  });

  test("should reject access to protected routes without token", async ({
    api,
  }) => {
    const response = await api.get("/api/auth/profile");

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Access token is required");
  });

  test("should reject access with invalid token", async ({ api }) => {
    const response = await api.get("/api/auth/profile", {
      headers: {
        Authorization: "Bearer invalid.token.here",
      },
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Invalid or expired access token");
  });
});
