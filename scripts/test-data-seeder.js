#!/usr/bin/env node

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

class TestDataSeeder {
  constructor() {
    this.client = new Client({
      connectionString:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/jobpsych_test",
    });
    this.testType = process.argv[2] || "all";
  }

  async connect() {
    try {
      await this.client.connect();
      console.log("✅ Connected to test database");
    } catch (error) {
      console.error("❌ Database connection failed:", error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.client.end();
      console.log("✅ Disconnected from test database");
    } catch (error) {
      console.error("❌ Error disconnecting:", error.message);
    }
  }

  async seedUnitTestData() {
    console.log("🌱 Seeding unit test data...");

    // Create test users for unit tests
    const testUsers = [
      {
        name: "Unit Test User 1",
        email: "unit-test-1@example.com",
        password_hash:
          "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfLkI0qQcO8K3G", // 'password123'
        company_name: "Unit Test Corp",
      },
      {
        name: "Unit Test User 2",
        email: "unit-test-2@example.com",
        password_hash:
          "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfLkI0qQcO8K3G", // 'password123'
        company_name: "Unit Test Inc",
      },
    ];

    for (const user of testUsers) {
      await this.client.query(
        `
        INSERT INTO users (name, email, password_hash, company_name, files_uploaded, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT (email) DO NOTHING
      `,
        [user.name, user.email, user.password_hash, user.company_name, 0]
      );
    }

    // Create test refresh tokens
    const testTokens = [
      {
        user_id: 1,
        token_hash: "unit-test-token-hash-1",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      {
        user_id: 2,
        token_hash: "unit-test-token-hash-2",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    ];

    for (const token of testTokens) {
      await this.client.query(
        `
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at, created_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT DO NOTHING
      `,
        [token.user_id, token.token_hash, token.expires_at]
      );
    }

    console.log("✅ Unit test data seeded");
  }

  async seedIntegrationTestData() {
    console.log("🌱 Seeding integration test data...");

    // Create more comprehensive test data for integration tests
    const integrationUsers = [
      {
        name: "Integration Test User",
        email: "integration-test@example.com",
        password_hash:
          "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfLkI0qQcO8K3G",
        company_name: "Integration Corp",
        files_uploaded: 5,
      },
      {
        name: "Rate Limit Test User",
        email: "rate-limit-test@example.com",
        password_hash:
          "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfLkI0qQcO8K3G",
        company_name: "Rate Limit Inc",
        files_uploaded: 8,
      },
    ];

    for (const user of integrationUsers) {
      await this.client.query(
        `
        INSERT INTO users (name, email, password_hash, company_name, files_uploaded, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT (email) DO NOTHING
      `,
        [
          user.name,
          user.email,
          user.password_hash,
          user.company_name,
          user.files_uploaded,
        ]
      );
    }

    // Create refresh tokens for integration tests
    const integrationTokens = [
      {
        user_id: 3, // Integration Test User
        token_hash: "integration-test-token-hash",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        user_id: 4, // Rate Limit Test User
        token_hash: "rate-limit-test-token-hash",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const token of integrationTokens) {
      await this.client.query(
        `
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at, created_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT DO NOTHING
      `,
        [token.user_id, token.token_hash, token.expires_at]
      );
    }

    console.log("✅ Integration test data seeded");
  }

  async seedE2ETestData() {
    console.log("🌱 Seeding E2E test data...");

    // Create E2E test users with realistic data
    const e2eUsers = [
      {
        name: "John Doe",
        email: "john.doe@example.com",
        password_hash:
          "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfLkI0qQcO8K3G",
        company_name: "Acme Corporation",
        files_uploaded: 12,
      },
      {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        password_hash:
          "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfLkI0qQcO8K3G",
        company_name: "Tech Solutions Ltd",
        files_uploaded: 3,
      },
      {
        name: "Bob Johnson",
        email: "bob.johnson@example.com",
        password_hash:
          "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfLkI0qQcO8K3G",
        company_name: "Global Industries",
        files_uploaded: 25,
      },
    ];

    for (const user of e2eUsers) {
      await this.client.query(
        `
        INSERT INTO users (name, email, password_hash, company_name, files_uploaded, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT (email) DO NOTHING
      `,
        [
          user.name,
          user.email,
          user.password_hash,
          user.company_name,
          user.files_uploaded,
        ]
      );
    }

    // Create refresh tokens for E2E tests
    const e2eTokens = [
      {
        user_id: 5,
        token_hash: "e2e-john-token",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        user_id: 6,
        token_hash: "e2e-jane-token",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        user_id: 7,
        token_hash: "e2e-bob-token",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const token of e2eTokens) {
      await this.client.query(
        `
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at, created_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT DO NOTHING
      `,
        [token.user_id, token.token_hash, token.expires_at]
      );
    }

    console.log("✅ E2E test data seeded");
  }

  async seedPerformanceTestData() {
    console.log("🌱 Seeding performance test data...");

    // Create a larger dataset for performance testing
    const performanceUsers = [];

    // Generate 100 test users for performance testing
    for (let i = 1; i <= 100; i++) {
      performanceUsers.push({
        name: `Performance User ${i}`,
        email: `perf-user-${i}@example.com`,
        password_hash:
          "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfLkI0qQcO8K3G",
        company_name: `Company ${i}`,
        files_uploaded: Math.floor(Math.random() * 50),
      });
    }

    // Insert users in batches
    for (let i = 0; i < performanceUsers.length; i += 10) {
      const batch = performanceUsers.slice(i, i + 10);
      const values = batch
        .map(
          (user) =>
            `('${user.name}', '${user.email}', '${user.password_hash}', '${user.company_name}', ${user.files_uploaded})`
        )
        .join(", ");

      await this.client.query(`
        INSERT INTO users (name, email, password_hash, company_name, files_uploaded, created_at, updated_at)
        VALUES ${values}, (NOW(), NOW())
        ON CONFLICT (email) DO NOTHING
      `);
    }

    // Create refresh tokens for performance users
    const perfTokens = [];
    for (let i = 8; i <= 107; i++) {
      // Assuming user IDs start from 8
      perfTokens.push({
        user_id: i,
        token_hash: `perf-token-${i}`,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }

    for (const token of perfTokens) {
      await this.client.query(
        `
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at, created_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT DO NOTHING
      `,
        [token.user_id, token.token_hash, token.expires_at]
      );
    }

    console.log("✅ Performance test data seeded (100 users)");
  }

  async seedLoadTestData() {
    console.log("🌱 Seeding load test data...");

    // Create load test users (subset of performance data)
    const loadUsers = [];

    // Generate 50 test users for load testing
    for (let i = 1; i <= 50; i++) {
      loadUsers.push({
        name: `Load Test User ${i}`,
        email: `load-user-${i}@example.com`,
        password_hash:
          "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfLkI0qQcO8K3G",
        company_name: `Load Company ${i}`,
        files_uploaded: Math.floor(Math.random() * 10), // Lower upload count for load tests
      });
    }

    // Insert users in batches
    for (let i = 0; i < loadUsers.length; i += 10) {
      const batch = loadUsers.slice(i, i + 10);
      const values = batch
        .map(
          (user) =>
            `('${user.name}', '${user.email}', '${user.password_hash}', '${user.company_name}', ${user.files_uploaded})`
        )
        .join(", ");

      await this.client.query(`
        INSERT INTO users (name, email, password_hash, company_name, files_uploaded, created_at, updated_at)
        VALUES ${values}, (NOW(), NOW())
        ON CONFLICT (email) DO NOTHING
      `);
    }

    console.log("✅ Load test data seeded (50 users)");
  }

  async run() {
    try {
      await this.connect();

      switch (this.testType) {
        case "unit":
          await this.seedUnitTestData();
          break;
        case "integration":
          await this.seedUnitTestData(); // Base data
          await this.seedIntegrationTestData();
          break;
        case "e2e":
          await this.seedUnitTestData(); // Base data
          await this.seedIntegrationTestData(); // Integration data
          await this.seedE2ETestData();
          break;
        case "performance":
          await this.seedPerformanceTestData();
          break;
        case "load":
          await this.seedLoadTestData();
          break;
        case "all":
        default:
          await this.seedUnitTestData();
          await this.seedIntegrationTestData();
          await this.seedE2ETestData();
          await this.seedPerformanceTestData();
          break;
      }

      console.log(`🎉 Test data seeding completed for: ${this.testType}`);
    } catch (error) {
      console.error("❌ Test data seeding failed:", error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Run seeder if called directly
if (require.main === module) {
  const seeder = new TestDataSeeder();
  seeder
    .run()
    .then(() => {
      console.log("✅ Test data seeding completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Test data seeding failed:", error.message);
      process.exit(1);
    });
}

module.exports = TestDataSeeder;
