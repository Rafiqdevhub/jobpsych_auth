import { test, expect } from "./fixtures";

test.describe("Rate Limiting", () => {
  test("should track user upload count", async ({
    api,
    authToken,
    testUser,
  }) => {
    // Get initial upload count
    const initialStatsResponse = await api.get(
      `/api/auth/user-uploads/${testUser.email}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    expect(initialStatsResponse.status()).toBe(200);
    const initialStats = await initialStatsResponse.json();
    expect(initialStats).toHaveProperty("filesUploaded");
    const initialCount = initialStats.filesUploaded;

    // Increment upload count
    const incrementResponse = await api.post("/api/auth/increment-upload", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: { email: testUser.email },
    });

    expect(incrementResponse.status()).toBe(200);

    // Verify count increased
    const updatedStatsResponse = await api.get(
      `/api/auth/user-uploads/${testUser.email}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    expect(updatedStatsResponse.status()).toBe(200);
    const updatedStats = await updatedStatsResponse.json();
    expect(updatedStats.filesUploaded).toBe(initialCount + 1);
  });

  test("should return upload statistics", async ({ api, authToken }) => {
    const response = await api.get("/api/auth/upload-stats", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Validate response structure
    expect(data).toHaveProperty("stats");
    expect(data.stats).toHaveProperty("totalUploads");
    expect(typeof data.stats.totalUploads).toBe("number");
    expect(data.stats).toHaveProperty("limit");
    expect(data.stats).toHaveProperty("remaining");
    expect(data.stats).toHaveProperty("canUpload");
  });

  test("should handle multiple upload increments", async ({
    api,
    authToken,
    testUser,
  }) => {
    const increments = 3;

    // Get initial count
    const initialResponse = await api.get(
      `/api/auth/user-uploads/${testUser.email}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    const initialCount = (await initialResponse.json()).filesUploaded;

    // Increment multiple times
    for (let i = 0; i < increments; i++) {
      const incrementResponse = await api.post("/api/auth/increment-upload", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        data: { email: testUser.email },
      });
      expect(incrementResponse.status()).toBe(200);
    }

    // Verify final count
    const finalResponse = await api.get(
      `/api/auth/user-uploads/${testUser.email}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    const finalCount = (await finalResponse.json()).filesUploaded;
    expect(finalCount).toBe(initialCount + increments);
  });

  test("should reject upload increment without authentication", async ({
    api,
  }) => {
    const response = await api.post("/api/auth/increment-upload");

    expect(response.status()).toBe(401); // Requires authentication middleware
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Access token is required");
  });

  test("should reject upload stats access without authentication", async ({
    api,
  }) => {
    const response = await api.get("/api/auth/upload-stats");

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Access token is required");
  });

  test("should handle user uploads query for non-existent user", async ({
    api,
    authToken,
  }) => {
    const response = await api.get(
      "/api/auth/user-uploads/nonexistent@example.com",
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    // Should return 0 or appropriate default
    expect([200, 404]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty("filesUploaded");
      expect(typeof data.filesUploaded).toBe("number");
    }
  });

  test("should maintain upload count across requests", async ({
    api,
    authToken,
    testUser,
  }) => {
    // Increment count
    await api.post("/api/auth/increment-upload", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: { email: testUser.email },
    });

    // Make multiple requests to verify persistence
    for (let i = 0; i < 3; i++) {
      const response = await api.get(
        `/api/auth/user-uploads/${testUser.email}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.filesUploaded).toBeGreaterThan(0);
    }
  });

  test("should handle concurrent upload increments", async ({
    api,
    authToken,
    testUser,
  }) => {
    // Make multiple concurrent increment requests
    const incrementPromises = Array(5)
      .fill(null)
      .map(() =>
        api.post("/api/auth/increment-upload", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          data: { email: testUser.email },
        })
      );

    // Wait for all requests to complete
    const responses = await Promise.all(incrementPromises);

    // All should succeed
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });
});
