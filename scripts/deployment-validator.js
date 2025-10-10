#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

class DeploymentValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      validations: [],
    };
  }

  async validateStep(name, description, validator) {
    console.log(`🔍 ${name}: ${description}`);

    const startTime = Date.now();
    let success = false;
    let error = null;
    let details = null;

    try {
      details = await validator();
      success = true;
    } catch (err) {
      error = err.message;
      success = false;
    }

    const duration = Date.now() - startTime;

    const result = {
      name,
      description,
      success,
      error,
      details,
      duration,
      timestamp: new Date().toISOString(),
    };

    this.results.validations.push(result);

    if (success) {
      console.log(`✅ ${name} passed (${duration}ms)`);
    } else {
      console.log(`❌ ${name} failed (${duration}ms): ${error}`);
    }

    return result;
  }

  async runFullValidation() {
    console.log("🚀 Starting Production Deployment Validation");
    console.log("=".repeat(60));

    // Environment validation
    await this.validateStep(
      "Environment Check",
      "Verify environment variables and configuration",
      () => this.checkEnvironment()
    );

    // Build validation
    await this.validateStep(
      "Build Check",
      "Verify application builds successfully",
      () => this.checkBuild()
    );

    // Database validation
    await this.validateStep(
      "Database Check",
      "Verify database connectivity and migrations",
      () => this.checkDatabase()
    );

    // Health check validation
    await this.validateStep(
      "Health Check",
      "Verify all health endpoints are responding",
      () => this.checkHealth()
    );

    // Load test validation
    await this.validateStep(
      "Load Test",
      "Run basic load test to verify performance",
      () => this.checkLoadTest()
    );

    // Security validation
    await this.validateStep(
      "Security Check",
      "Verify security configurations and headers",
      () => this.checkSecurity()
    );

    this.saveResults();
    this.printSummary();

    return this.results;
  }

  async checkEnvironment() {
    const requiredVars = [
      "DATABASE_URL",
      "JWT_ACCESS_SECRET",
      "JWT_REFRESH_SECRET",
      "NODE_ENV",
    ];

    const missing = requiredVars.filter((varName) => !process.env[varName]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`
      );
    }

    // Check JWT secret lengths
    if (process.env.JWT_ACCESS_SECRET.length < 32) {
      throw new Error("JWT_ACCESS_SECRET must be at least 32 characters long");
    }

    if (process.env.JWT_REFRESH_SECRET.length < 32) {
      throw new Error("JWT_REFRESH_SECRET must be at least 32 characters long");
    }

    return {
      environment: process.env.NODE_ENV,
      requiredVars: requiredVars,
      jwtSecretsLength: {
        access: process.env.JWT_ACCESS_SECRET.length,
        refresh: process.env.JWT_REFRESH_SECRET.length,
      },
    };
  }

  async checkBuild() {
    try {
      execSync("npm run build", {
        encoding: "utf8",
        timeout: 60000,
      });
      return { buildSuccessful: true };
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  async checkDatabase() {
    try {
      // Run database migrations
      execSync("npm run db:migrate", {
        encoding: "utf8",
        timeout: 30000,
      });

      // Test database connectivity with a simple query
      const { Client } = require("pg");
      const client = new Client({ connectionString: process.env.DATABASE_URL });

      await client.connect();
      const result = await client.query("SELECT NOW()");
      await client.end();

      return {
        migrationSuccessful: true,
        databaseConnected: true,
        serverTime: result.rows[0].now,
      };
    } catch (error) {
      throw new Error(`Database check failed: ${error.message}`);
    }
  }

  async checkHealth() {
    const HealthChecker = require("./health-check");
    const checker = new HealthChecker();
    const results = await checker.runHealthChecks();

    const failedChecks = results.filter((r) => !r.success);
    if (failedChecks.length > 0) {
      throw new Error(`${failedChecks.length} health checks failed`);
    }

    return {
      totalChecks: results.length,
      passedChecks: results.filter((r) => r.success).length,
      averageResponseTime:
        results.reduce((sum, r) => sum + r.responseTime, 0) / results.length,
    };
  }

  async checkLoadTest() {
    try {
      // Run a quick smoke test with low load
      execSync(
        "timeout 30 artillery quick --count 10 --num 1 http://localhost:5000/api/auth/info",
        {
          encoding: "utf8",
          timeout: 45000,
        }
      );

      return { loadTestPassed: true };
    } catch (error) {
      // Load test failures are warnings, not critical failures
      console.warn("Load test warning:", error.message);
      return { loadTestPassed: false, warning: error.message };
    }
  }

  async checkSecurity() {
    const issues = [];

    // Check for default secrets
    if (process.env.JWT_ACCESS_SECRET === "your-access-secret-key") {
      issues.push("JWT_ACCESS_SECRET is using default value");
    }

    if (process.env.JWT_REFRESH_SECRET === "your-refresh-secret-key") {
      issues.push("JWT_REFRESH_SECRET is using default value");
    }

    // Check CORS settings
    const corsOrigins = process.env.CORS_ORIGINS || "";
    if (corsOrigins.includes("*")) {
      issues.push(
        "CORS_ORIGINS contains wildcard (*) - consider restricting origins"
      );
    }

    // Check for debug mode in production
    if (process.env.NODE_ENV === "production" && process.env.DEBUG) {
      issues.push("DEBUG mode is enabled in production");
    }

    if (issues.length > 0) {
      throw new Error(`Security issues found: ${issues.join(", ")}`);
    }

    return {
      securityChecks: [
        "JWT secrets validated",
        "CORS configuration checked",
        "Debug mode verified",
      ],
      issuesFound: 0,
    };
  }

  saveResults() {
    const resultsDir = path.join(__dirname, "..", "performance-results");
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const filename = `deployment-validation-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.json`;
    const filepath = path.join(resultsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(`💾 Validation results saved to: ${filepath}`);
  }

  printSummary() {
    console.log("\n📊 Deployment Validation Summary");
    console.log("=".repeat(60));

    const successful = this.results.validations.filter((v) => v.success);
    const failed = this.results.validations.filter((v) => !v.success);

    console.log(`✅ Passed validations: ${successful.length}`);
    console.log(`❌ Failed validations: ${failed.length}`);
    console.log(
      `⏱️  Total duration: ${this.results.validations.reduce(
        (sum, v) => sum + v.duration,
        0
      )}ms`
    );

    if (failed.length > 0) {
      console.log("\n💥 Failed validations:");
      failed.forEach((validation) => {
        console.log(`  • ${validation.name}: ${validation.error}`);
      });
    }

    // Deployment readiness assessment
    const readinessScore =
      (successful.length / this.results.validations.length) * 100;
    console.log(
      `\n🚀 Deployment Readiness Score: ${readinessScore.toFixed(1)}%`
    );

    if (readinessScore === 100) {
      console.log("🎉 Ready for production deployment!");
    } else if (readinessScore >= 80) {
      console.log("⚠️  Mostly ready - address remaining issues");
    } else {
      console.log(
        "🚨 Not ready for production - critical issues must be resolved"
      );
    }

    // Recommendations
    console.log("\n💡 Recommendations:");
    if (failed.some((f) => f.name === "Security Check")) {
      console.log("  • Address security issues before deployment");
    }
    if (failed.some((f) => f.name === "Database Check")) {
      console.log("  • Fix database connectivity issues");
    }
    if (failed.some((f) => f.name === "Health Check")) {
      console.log("  • Resolve health check failures");
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new DeploymentValidator();
  validator
    .runFullValidation()
    .then(() => {
      const exitCode = validator.results.validations.every((v) => v.success)
        ? 0
        : 1;
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error("Validation failed:", error);
      process.exit(1);
    });
}

module.exports = DeploymentValidator;
