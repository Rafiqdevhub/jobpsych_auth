// Global setup for Playwright tests
async function globalSetup() {
  console.log("🚀 Setting up E2E test environment...");

  // No database setup needed for API-only testing
  console.log("✅ E2E test environment setup complete");
}

export default globalSetup;
