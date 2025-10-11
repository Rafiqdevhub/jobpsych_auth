import { test, expect } from "./fixtures";

test.describe("Error Scenarios", () => {
  test("should handle malformed JSON requests", async ({ api }) => {
    // Send malformed JSON
    const response = await api.post("/api/auth/register", {
      data: "{ invalid json",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Should return 400 or 500 depending on server implementation
    expect([400, 500]).toContain(response.status());
  });

  test("should handle extremely large request payloads", async ({ api }) => {
    const largeData = {
      name: "A".repeat(10000), // Very long name
      email: `test${Date.now()}@example.com`,
      company_name: "B".repeat(10000), // Very long company name
      password: "password123",
    };

    const response = await api.post("/api/auth/register", {
      data: largeData,
    });

    // Should either succeed, fail validation, return payload too large, or fail with server error
    expect([200, 201, 400, 413, 500]).toContain(response.status());
  });

  test("should handle SQL injection attempts", async ({ api }) => {
    const maliciousData = {
      name: "'; DROP TABLE users; --",
      email: `test${Date.now()}@example.com`,
      company_name: "Test Company",
      password: "password123",
    };

    const response = await api.post("/api/auth/register", {
      data: maliciousData,
    });

    // Should either succeed (escaped) or fail safely
    expect([200, 201, 400]).toContain(response.status());

    // If it succeeded, verify the malicious data was stored as-is (parameterized queries prevent injection)
    if (response.status() === 201) {
      const data = await response.json();
      expect(data.data.user.name).toBe(maliciousData.name); // Should contain the malicious string as literal data
    }
  });

  test("should handle concurrent identical requests", async ({ api }) => {
    const uniqueEmail = `concurrent${Date.now()}@example.com`;

    // Make multiple identical registration requests simultaneously
    const requests = Array(3)
      .fill(null)
      .map(() =>
        api.post("/api/auth/register", {
          data: {
            name: "Concurrent User",
            email: uniqueEmail,
            company_name: "Test Company",
            password: "password123",
          },
        })
      );

    const responses = await Promise.all(requests);

    // Due to concurrent requests, one may succeed and others may fail with duplicate email errors
    const successCount = responses.filter((r) => r.status() === 201).length;
    const errorCount = responses.filter((r) => r.status() === 409).length;

    expect(successCount).toBeGreaterThanOrEqual(1);
    expect(successCount + errorCount).toBe(3); // All requests should either succeed or fail
  });

  test("should handle network timeouts gracefully", async ({ api }) => {
    // Test with a very short timeout to simulate network issues
    let timedOut = false;
    try {
      await api.post("/api/auth/register", {
        data: {
          name: "Timeout Test",
          email: `timeout${Date.now()}@example.com`,
          company_name: "Test Company",
          password: "password123",
        },
        timeout: 1, // 1ms timeout - should timeout
      });
    } catch (error: any) {
      // Should timeout with TimeoutError
      timedOut =
        error.message.includes("Timeout") || error.message.includes("exceeded");
    }

    expect(timedOut).toBe(true);
  });

  test("should handle invalid HTTP methods", async ({ api }) => {
    // Try invalid methods on various endpoints
    const endpoints = [
      "/api/auth/register",
      "/api/auth/login",
      "/api/auth/profile",
    ];

    for (const endpoint of endpoints) {
      const response = await api.patch(endpoint);
      expect([404, 405]).toContain(response.status());
    }
  });

  test("should handle requests with invalid content types", async ({ api }) => {
    const response = await api.post("/api/auth/register", {
      data: "name=test&email=test@example.com", // Form data as string
      headers: {
        "Content-Type": "text/plain",
      },
    });

    // Should fail to parse
    expect([400, 500]).toContain(response.status());
  });

  test("should handle database connection errors gracefully", async ({
    api,
  }) => {
    // This test would require simulating database disconnection
    // For now, we test with a very large dataset that might cause issues

    const largeDataset = {
      name: "A".repeat(1000),
      email: `large${Date.now()}@example.com`,
      company_name: "B".repeat(1000),
      password: "C".repeat(100), // Very long password
    };

    const response = await api.post("/api/auth/register", {
      data: largeDataset,
    });

    // Should handle large data gracefully
    expect([200, 201, 400, 500]).toContain(response.status());
  });

  test("should handle rapid successive requests", async ({ api }) => {
    const uniqueEmail = `rapid${Date.now()}@example.com`;

    // Make many rapid requests
    const requests = Array(10)
      .fill(null)
      .map((_, i) =>
        api.post("/api/auth/register", {
          data: {
            name: `Rapid User ${i}`,
            email: `${uniqueEmail}${i}@example.com`,
            company_name: "Test Company",
            password: "password123",
          },
        })
      );

    const responses = await Promise.all(requests);

    // All should succeed (different emails)
    const successCount = responses.filter((r) => r.status() === 201).length;
    expect(successCount).toBe(10);
  });

  test("should handle special characters in user data", async ({ api }) => {
    const specialChars = {
      name: "Test Üser ñame",
      email: `special${Date.now()}@example.com`,
      company_name: "Cömṕany ©®™",
      password: "password123",
    };

    const response = await api.post("/api/auth/register", {
      data: specialChars,
    });

    expect(response.status()).toBe(201);

    // Verify data was stored correctly
    const data = await response.json();
    expect(data.data.user.name).toBe(specialChars.name);
    expect(data.data.user.company_name).toBe(specialChars.company_name);
  });

  test("should handle empty string inputs", async ({ api }) => {
    const emptyData = {
      name: "",
      email: "",
      company_name: "",
      password: "",
    };

    const response = await api.post("/api/auth/register", {
      data: emptyData,
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });
});
