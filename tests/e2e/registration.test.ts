import { test, expect } from "./fixtures";

test.describe("User Registration", () => {
  test("should successfully register a new user with valid data", async ({
    api,
    testUser,
  }) => {
    // This test uses the fixture which already registers a user
    // We verify the registration was successful by checking the response structure
    expect(testUser.email).toContain("@example.com");
    expect(testUser.name).toBe("Test User");
    expect(testUser.company_name).toBe("Test Company");
  });

  test("should reject registration with duplicate email", async ({ api }) => {
    const uniqueEmail = `duplicate${Date.now()}@example.com`;

    // First register a user
    const firstResponse = await api.post("/api/auth/register", {
      data: {
        name: "First User",
        email: uniqueEmail,
        company_name: "Test Company",
        password: "password123",
      },
    });

    expect(firstResponse.status()).toBe(201);

    // Try to register with the same email
    const duplicateResponse = await api.post("/api/auth/register", {
      data: {
        name: "Second User",
        email: uniqueEmail,
        company_name: "Another Company",
        password: "password123",
      },
    });

    expect(duplicateResponse.status()).toBe(409);
    const data = await duplicateResponse.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("User already exists");
  });

  test("should reject registration with missing required fields", async ({
    api,
  }) => {
    const testCases = [
      {
        name: "Missing name",
        data: {
          email: "test@example.com",
          company_name: "Test Company",
          password: "password123",
        },
      },
      {
        name: "Missing email",
        data: {
          name: "Test User",
          company_name: "Test Company",
          password: "password123",
        },
      },
      {
        name: "Missing password",
        data: {
          name: "Test User",
          email: "test@example.com",
          company_name: "Test Company",
        },
      },
      {
        name: "Missing company_name",
        data: {
          name: "Test User",
          email: "test@example.com",
          password: "password123",
        },
      },
    ];

    for (const testCase of testCases) {
      const response = await api.post("/api/auth/register", {
        data: testCase.data,
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe("Validation Error");
      expect(data.error).toBe(
        "Name, email, password, and company name are required"
      );
    }
  });

  test("should accept various password lengths during registration", async ({
    api,
  }) => {
    const testPasswords = [
      "short", // 5 chars
      "password", // 8 chars
      "verylongpassword123", // longer
    ];

    for (const password of testPasswords) {
      const response = await api.post("/api/auth/register", {
        data: {
          name: "Test User",
          email: `test${Date.now()}${Math.random()}@example.com`,
          company_name: "Test Company",
          password,
        },
      });

      // Registration accepts any password length
      expect(response.status()).toBe(201);
    }
  });

  test("should return proper response structure on successful registration", async ({
    api,
  }) => {
    const uniqueEmail = `test${Date.now()}@example.com`;

    const response = await api.post("/api/auth/register", {
      data: {
        name: "Test User",
        email: uniqueEmail,
        company_name: "Test Company",
        password: "password123",
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.message).toBe("User registered successfully");
    expect(data.data).toBeDefined();
    expect(data.data.accessToken).toBeDefined();
    expect(data.data.user).toBeDefined();
    expect(data.data.user.email).toBe(uniqueEmail);
    expect(data.data.user.name).toBe("Test User");
    expect(data.data.user.company_name).toBe("Test Company");
  });
});
