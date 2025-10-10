#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

class PerformanceBenchmark {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
    };
  }

  async runBenchmark(testName, command, description) {
    console.log(`\n🚀 Running ${testName}...`);
    console.log(`📝 ${description}`);

    const startTime = Date.now();
    let success = false;
    let error = null;
    let output = "";

    try {
      output = execSync(command, {
        encoding: "utf8",
        timeout: 300000, // 5 minutes timeout
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });
      success = true;
    } catch (err) {
      error = err.message;
      success = false;
    }

    const duration = Date.now() - startTime;

    const result = {
      name: testName,
      description,
      command,
      duration,
      success,
      error,
      timestamp: new Date().toISOString(),
    };

    this.results.tests.push(result);

    if (success) {
      console.log(`✅ ${testName} completed in ${duration}ms`);
    } else {
      console.log(`❌ ${testName} failed in ${duration}ms: ${error}`);
    }

    return result;
  }

  async runAllBenchmarks() {
    console.log("🏁 Starting Performance Benchmark Suite");
    console.log("=".repeat(50));

    // Authentication benchmarks
    await this.runBenchmark(
      "Auth Load Test (Light)",
      "npm run loadtest:auth",
      "Testing authentication endpoints with moderate load"
    );

    await this.runBenchmark(
      "Rate Limit Test",
      "npm run loadtest:rate-limit",
      "Testing rate limiting under high concurrent usage"
    );

    await this.runBenchmark(
      "Mixed Workload Test",
      "npm run loadtest:mixed",
      "Testing realistic mixed usage patterns"
    );

    // Unit test performance
    await this.runBenchmark(
      "Unit Tests",
      "npm run test:unit",
      "Running unit test suite performance"
    );

    await this.runBenchmark(
      "Integration Tests",
      "npm run test:integration",
      "Running integration test suite performance"
    );

    // E2E test performance
    await this.runBenchmark(
      "E2E Tests",
      "npm run test:e2e:playwright",
      "Running end-to-end test suite performance"
    );

    this.saveResults();
    this.printSummary();
  }

  saveResults() {
    const resultsDir = path.join(__dirname, "..", "performance-results");
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const filename = `benchmark-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.json`;
    const filepath = path.join(resultsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Results saved to: ${filepath}`);
  }

  printSummary() {
    console.log("\n📊 Performance Benchmark Summary");
    console.log("=".repeat(50));

    const successful = this.results.tests.filter((t) => t.success);
    const failed = this.results.tests.filter((t) => !t.success);

    console.log(`✅ Successful tests: ${successful.length}`);
    console.log(`❌ Failed tests: ${failed.length}`);
    console.log(
      `⏱️  Total duration: ${this.results.tests.reduce(
        (sum, t) => sum + t.duration,
        0
      )}ms`
    );

    if (successful.length > 0) {
      console.log("\n🏆 Fastest tests:");
      successful
        .sort((a, b) => a.duration - b.duration)
        .slice(0, 3)
        .forEach((test) => {
          console.log(`  • ${test.name}: ${test.duration}ms`);
        });
    }

    if (failed.length > 0) {
      console.log("\n💥 Failed tests:");
      failed.forEach((test) => {
        console.log(`  • ${test.name}: ${test.error}`);
      });
    }

    console.log("\n🎯 Recommendations:");
    if (this.results.tests.some((t) => t.duration > 30000)) {
      console.log(
        "  • Some tests took longer than 30 seconds - consider optimization"
      );
    }
    if (failed.length > 0) {
      console.log("  • Address failed tests before production deployment");
    }
    if (successful.every((t) => t.duration < 10000)) {
      console.log(
        "  • All tests completed within 10 seconds - excellent performance!"
      );
    }
  }
}

// Run benchmarks if called directly
if (require.main === module) {
  const benchmark = new PerformanceBenchmark();
  benchmark.runAllBenchmarks().catch(console.error);
}

module.exports = PerformanceBenchmark;
