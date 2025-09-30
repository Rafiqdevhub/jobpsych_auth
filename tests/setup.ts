import "dotenv/config";

// Mock environment variables for testing
process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  "postgresql://test:test@localhost:5432/test_db?sslmode=disable";
process.env.JWT_ACCESS_SECRET =
  "test-access-secret-key-for-jest-testing-minimum-32-chars";
process.env.JWT_REFRESH_SECRET =
  "test-refresh-secret-key-for-jest-testing-minimum-32-chars";
process.env.JWT_ACCESS_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";

// Increase timeout for async operations
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  // Any global setup can go here
});

afterAll(async () => {
  // Any global cleanup can go here
});
