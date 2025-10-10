import { test as base, APIRequestContext } from "@playwright/test";

// Test data interfaces
export interface TestUser {
  id: number;
  name: string;
  email: string;
  company_name: string;
  password: string;
  refreshToken: string | null;
  filesUploaded: number;
  created_at: Date;
  updated_at: Date;
}

// Test fixtures
type TestFixtures = {
  api: APIRequestContext;
  testUser: TestUser;
  authToken: string;
};

// Create test user factory
export const createTestUser = (
  overrides: Partial<TestUser> = {}
): TestUser => ({
  id: Math.floor(Math.random() * 10000),
  name: "Test User",
  email: `test${Date.now()}@example.com`,
  company_name: "Test Company",
  password: "password123",
  refreshToken: null,
  filesUploaded: 0,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

// Export configured test
export const test = base.extend<TestFixtures>({
  api: async ({ playwright }, use) => {
    const apiContext = await playwright.request.newContext({
      baseURL: "http://localhost:5000",
    });
    await use(apiContext);
    await apiContext.dispose();
  },

  testUser: async ({}, use) => {
    const user = createTestUser();
    await use(user);
  },

  authToken: async ({ api, testUser }, use) => {
    // Register the test user
    const registerResponse = await api.post("/api/auth/register", {
      data: {
        name: testUser.name,
        email: testUser.email,
        company_name: testUser.company_name,
        password: testUser.password,
      },
    });

    if (!registerResponse.ok()) {
      const errorText = await registerResponse.text();
      throw new Error(
        `Failed to register test user: ${registerResponse.status()} - ${errorText}`
      );
    }

    // Login to get token
    const loginResponse = await api.post("/api/auth/login", {
      data: {
        email: testUser.email,
        password: testUser.password,
      },
    });

    if (!loginResponse.ok()) {
      const errorText = await loginResponse.text();
      throw new Error(
        `Failed to login test user: ${loginResponse.status()} - ${errorText}`
      );
    }

    const loginData = await loginResponse.json();
    const token = loginData.data?.accessToken;

    if (!token) {
      throw new Error("No access token received from login");
    }

    await use(token);
  },
});

// Export for use in tests
export { expect } from "@playwright/test";
