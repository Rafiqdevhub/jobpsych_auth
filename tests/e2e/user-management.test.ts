import { test, expect } from "./fixtures";

test.describe("User Management", () => {
  test("should successfully update user profile", async ({
    api,
    authToken,
    testUser,
  }) => {
    const updatedData = {
      name: "Updated Name",
      // Note: company_name is not updatable via this endpoint
    };

    const response = await api.put("/api/auth/update-profile", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: updatedData,
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain("updated");

    // Verify changes persisted
    const profileResponse = await api.get("/api/auth/profile", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(profileResponse.status()).toBe(200);
    const profile = await profileResponse.json();
    expect(profile.data.name).toBe(updatedData.name);
    // company_name should remain unchanged
    expect(profile.data.company_name).toBe(testUser.company_name);
  });

  test("should reject profile update without authentication", async ({
    api,
  }) => {
    const response = await api.put("/api/auth/update-profile", {
      data: {
        name: "Unauthorized Update",
        company_name: "Test Company",
      },
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Access token is required");
  });

  test("should handle partial profile updates", async ({
    api,
    authToken,
    testUser,
  }) => {
    const originalProfileResponse = await api.get("/api/auth/profile", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const originalProfile = await originalProfileResponse.json();

    // Update only name
    const response = await api.put("/api/auth/update-profile", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        name: "Partially Updated Name",
      },
    });

    expect(response.status()).toBe(200);

    // Verify only name changed, company_name remained the same
    const updatedProfileResponse = await api.get("/api/auth/profile", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const updatedProfile = await updatedProfileResponse.json();

    expect(updatedProfile.data.name).toBe("Partially Updated Name");
    expect(updatedProfile.data.company_name).toBe(
      originalProfile.data.company_name
    );
  });

  test("should successfully reset password", async ({ api }) => {
    const uniqueEmail = `reset${Date.now()}@example.com`;

    // Register user
    await api.post("/api/auth/register", {
      data: {
        name: "Reset Test User",
        email: uniqueEmail,
        company_name: "Test Company",
        password: "oldpassword123",
      },
    });

    // Verify email for testing
    await api.post("/api/auth/internal/verify-email-for-test", {
      data: {
        email: uniqueEmail,
      },
    });

    // Reset password
    const resetResponse = await api.post("/api/auth/reset-password", {
      data: {
        email: uniqueEmail,
        newPassword: "newpassword123",
      },
    });

    expect(resetResponse.status()).toBe(200);
    const resetData = await resetResponse.json();
    expect(resetData.success).toBe(true);
    expect(resetData.message).toBe("Password reset successfully");

    // Verify can login with new password
    const loginResponse = await api.post("/api/auth/login", {
      data: {
        email: uniqueEmail,
        password: "newpassword123",
      },
    });

    expect(loginResponse.status()).toBe(200);
  });

  test("should reject password reset for non-existent user", async ({
    api,
  }) => {
    const response = await api.post("/api/auth/reset-password", {
      data: {
        email: "nonexistent@example.com",
        newPassword: "newpassword123",
      },
    });

    expect(response.status()).toBe(404);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("User not found");
  });

  test("should reject password reset with weak password", async ({ api }) => {
    const uniqueEmail = `weakreset${Date.now()}@example.com`;

    // Register user
    await api.post("/api/auth/register", {
      data: {
        name: "Weak Reset User",
        email: uniqueEmail,
        company_name: "Test Company",
        password: "password123",
      },
    });

    // Try to reset with weak password
    const response = await api.post("/api/auth/reset-password", {
      data: {
        email: uniqueEmail,
        newPassword: "weak", // Less than 8 characters
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Validation error");
  });

  test("should reject password reset with missing fields", async ({ api }) => {
    const testCases = [
      { email: "test@example.com" }, // Missing newPassword
      { newPassword: "newpassword123" }, // Missing email
      {}, // Missing both
    ];

    for (const testCase of testCases) {
      const response = await api.post("/api/auth/reset-password", {
        data: testCase,
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe("Validation Error");
    }
  });

  test("should successfully logout user", async ({ api, authToken }) => {
    // Verify user is logged in
    const preLogoutResponse = await api.get("/api/auth/profile", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(preLogoutResponse.status()).toBe(200);

    // Logout (doesn't require authentication)
    const logoutResponse = await api.post("/api/auth/logout");

    expect(logoutResponse.status()).toBe(200);
    const logoutData = await logoutResponse.json();
    expect(logoutData.success).toBe(true);
    expect(logoutData.message).toBe("Logged out successfully");

    // Note: Access token remains valid until expiration
    // Only refresh token is invalidated
    const postLogoutResponse = await api.get("/api/auth/profile", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(postLogoutResponse.status()).toBe(200); // Token still works
  });

  test("should handle logout without authentication", async ({ api }) => {
    const response = await api.post("/api/auth/logout");

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe("Logged out successfully");
  });

  test("should maintain profile data integrity after updates", async ({
    api,
    authToken,
    testUser,
  }) => {
    // Update profile multiple times (only name can be updated via this endpoint)
    const updates = [
      { name: "First Update" },
      { name: "Second Update" },
      { name: "Third Update" },
    ];

    for (const update of updates) {
      const response = await api.put("/api/auth/update-profile", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        data: update,
      });
      expect(response.status()).toBe(200);
    }

    // Verify final state
    const profileResponse = await api.get("/api/auth/profile", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(profileResponse.status()).toBe(200);
    const profile = await profileResponse.json();

    expect(profile.data.name).toBe("Third Update");
    expect(profile.data.company_name).toBe(testUser.company_name); // company_name unchanged
    expect(profile.data.email).toBe(testUser.email); // Email should remain unchanged
  });
});
