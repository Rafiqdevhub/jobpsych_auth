#!/usr/bin/env node

const http = require("http");
const https = require("https");

class HealthChecker {
  constructor(baseUrl = "http://localhost:5000") {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.checks = [];
  }

  async checkEndpoint(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = Date.now();

    return new Promise((resolve) => {
      const protocol = url.startsWith("https") ? https : http;

      const req = protocol.request(
        url,
        {
          method: options.method || "GET",
          headers: options.headers || {},
          timeout: options.timeout || 10000,
        },
        (res) => {
          const responseTime = Date.now() - startTime;
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            const result = {
              endpoint,
              status: res.statusCode,
              responseTime,
              success: res.statusCode >= 200 && res.statusCode < 300,
              data: data.length > 500 ? data.substring(0, 500) + "..." : data,
              timestamp: new Date().toISOString(),
            };
            resolve(result);
          });
        }
      );

      req.on("error", (error) => {
        const responseTime = Date.now() - startTime;
        resolve({
          endpoint,
          status: null,
          responseTime,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      });

      req.on("timeout", () => {
        req.destroy();
        const responseTime = Date.now() - startTime;
        resolve({
          endpoint,
          status: null,
          responseTime,
          success: false,
          error: "Request timeout",
          timestamp: new Date().toISOString(),
        });
      });

      // Send request body if provided
      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  async runHealthChecks() {
    console.log("🏥 Running Health Checks...");
    console.log(`🔗 Target: ${this.baseUrl}`);
    console.log("=".repeat(50));

    // Basic connectivity check
    const connectivity = await this.checkEndpoint("/");
    this.checks.push(connectivity);
    this.logResult("Connectivity", connectivity);

    // Authentication endpoints
    const authHealth = await this.checkEndpoint("/api/auth/info");
    this.checks.push(authHealth);
    this.logResult("Auth Service", authHealth);

    // Rate limiting endpoints
    const rateLimitHealth = await this.checkEndpoint(
      "/api/auth/rate-limit-info"
    );
    this.checks.push(rateLimitHealth);
    this.logResult("Rate Limiting", rateLimitHealth);

    // Database connectivity (via auth endpoint)
    const dbCheck = await this.checkEndpoint("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "HealthCheck",
        email: "healthcheck@example.com",
        companyName: "Health Check",
        password: "HealthCheck123!",
      }),
    });
    this.checks.push(dbCheck);
    this.logResult("Database", dbCheck);

    this.printSummary();
    return this.checks;
  }

  logResult(name, result) {
    const status = result.success ? "✅" : "❌";
    const time = result.responseTime ? `${result.responseTime}ms` : "N/A";
    console.log(`${status} ${name}: ${result.status || "ERROR"} (${time})`);

    if (!result.success) {
      console.log(`   Error: ${result.error || "Unknown error"}`);
    }
  }

  printSummary() {
    console.log("\n📊 Health Check Summary");
    console.log("=".repeat(50));

    const successful = this.checks.filter((c) => c.success);
    const failed = this.checks.filter((c) => !c.success);

    console.log(`✅ Healthy endpoints: ${successful.length}`);
    console.log(`❌ Unhealthy endpoints: ${failed.length}`);

    const avgResponseTime =
      this.checks
        .filter((c) => c.responseTime)
        .reduce((sum, c) => sum + c.responseTime, 0) /
      this.checks.filter((c) => c.responseTime).length;

    console.log(`⏱️  Average response time: ${avgResponseTime.toFixed(0)}ms`);

    if (failed.length > 0) {
      console.log("\n💥 Failed checks:");
      failed.forEach((check) => {
        console.log(`  • ${check.endpoint}: ${check.error || "Failed"}`);
      });
    }

    // Overall health assessment
    const healthScore = (successful.length / this.checks.length) * 100;
    console.log(`\n🏥 Overall Health Score: ${healthScore.toFixed(1)}%`);

    if (healthScore === 100) {
      console.log("🎉 All systems operational!");
    } else if (healthScore >= 75) {
      console.log("⚠️  Minor issues detected");
    } else {
      console.log("🚨 Critical issues detected - immediate attention required");
    }
  }

  saveResults() {
    const fs = require("fs");
    const path = require("path");

    const resultsDir = path.join(__dirname, "..", "performance-results");
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const filename = `health-check-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.json`;
    const filepath = path.join(resultsDir, filename);

    fs.writeFileSync(
      filepath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          target: this.baseUrl,
          checks: this.checks,
        },
        null,
        2
      )
    );

    console.log(`💾 Health check results saved to: ${filepath}`);
  }
}

// Run health checks if called directly
if (require.main === module) {
  const baseUrl = process.argv[2] || "http://localhost:5000";
  const checker = new HealthChecker(baseUrl);

  checker
    .runHealthChecks()
    .then(() => {
      checker.saveResults();
    })
    .catch(console.error);
}

module.exports = HealthChecker;
