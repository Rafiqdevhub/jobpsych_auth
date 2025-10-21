import { defineConfig, devices } from "@playwright/test";
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables only when not in CI (CI sets env vars directly)
if (!process.env.CI) {
  dotenv.config({ path: path.resolve(__dirname, ".env") });
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  /* Global setup and teardown */
  globalSetup: "./tests/e2e/global-setup.ts",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? "github" : "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: "http://localhost:5000",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for API testing */
  projects: [
    {
      name: "api",
      testMatch: "**/*.test.ts",
      use: {
        ...devices["Desktop Chrome"], // Base config, but we'll use API context
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command:
      process.env.DATABASE_URL && process.env.DATABASE_URL.trim()
        ? `cross-env DATABASE_URL="${
            process.env.DATABASE_URL
          }" JWT_ACCESS_SECRET="${
            process.env.JWT_ACCESS_SECRET ||
            "test-access-secret-key-for-github-actions-testing-minimum-32-chars"
          }" JWT_REFRESH_SECRET="${
            process.env.JWT_REFRESH_SECRET ||
            "test-refresh-secret-key-for-github-actions-testing-minimum-32-chars"
          }" NODE_ENV="${
            process.env.NODE_ENV || "test"
          }" PORT="5000" npm run dev`
        : 'echo "❌ ERROR: DATABASE_URL environment variable is not set or empty. Please configure DATABASE_URL in .env file." && exit 1',
    url: "http://localhost:5000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
  },
});
