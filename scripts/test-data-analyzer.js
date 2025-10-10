#!/usr/bin/env node

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

class TestDataAnalyzer {
  constructor() {
    this.client = new Client({
      connectionString:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/jobpsych_test",
    });
    this.resultsDir = path.join(__dirname, "..", "performance-results");
    this.testResultsDir = path.join(__dirname, "..", "test-results");
  }

  async connect() {
    try {
      await this.client.connect();
      console.log("✅ Connected to test database for analysis");
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

  async analyzeDatabaseUsage() {
    console.log("📊 Analyzing database usage...");

    const analysis = {
      timestamp: new Date().toISOString(),
      database: {
        totalUsers: 0,
        totalRefreshTokens: 0,
        usersByTestType: {},
        averageFilesUploaded: 0,
        dataGrowth: {},
      },
      performance: {},
      recommendations: [],
    };

    try {
      // Get total counts
      const userCount = await this.client.query(
        "SELECT COUNT(*) as count FROM users"
      );
      const tokenCount = await this.client.query(
        "SELECT COUNT(*) as count FROM refresh_tokens"
      );

      analysis.database.totalUsers = parseInt(userCount.rows[0].count);
      analysis.database.totalRefreshTokens = parseInt(tokenCount.rows[0].count);

      // Analyze users by email pattern (test type)
      const userPatterns = await this.client.query(`
        SELECT
          CASE
            WHEN email LIKE 'unit-test-%' THEN 'unit'
            WHEN email LIKE 'integration-test%' THEN 'integration'
            WHEN email LIKE 'john.doe%' OR email LIKE 'jane.smith%' OR email LIKE 'bob.johnson%' THEN 'e2e'
            WHEN email LIKE 'perf-user-%' THEN 'performance'
            WHEN email LIKE 'load-user-%' THEN 'load'
            ELSE 'other'
          END as test_type,
          COUNT(*) as count,
          AVG(files_uploaded) as avg_files
        FROM users
        GROUP BY test_type
      `);

      userPatterns.rows.forEach((row) => {
        analysis.database.usersByTestType[row.test_type] = {
          count: parseInt(row.count),
          averageFilesUploaded: parseFloat(row.avg_files || 0),
        };
      });

      // Calculate overall average
      const avgFiles = await this.client.query(
        "SELECT AVG(files_uploaded) as avg FROM users"
      );
      analysis.database.averageFilesUploaded = parseFloat(
        avgFiles.rows[0].avg || 0
      );

      // Analyze data growth patterns
      const dataGrowth = await this.client.query(`
        SELECT
          DATE_TRUNC('hour', created_at) as hour,
          COUNT(*) as records_created
        FROM users
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY hour
        ORDER BY hour DESC
        LIMIT 24
      `);

      analysis.database.dataGrowth = dataGrowth.rows.reduce((acc, row) => {
        acc[row.hour.toISOString()] = parseInt(row.records_created);
        return acc;
      }, {});
    } catch (error) {
      console.warn("⚠️ Database analysis partially failed:", error.message);
    }

    return analysis;
  }

  async analyzeTestResults() {
    console.log("📊 Analyzing test results...");

    const testAnalysis = {
      testResults: {
        unit: { passed: 0, failed: 0, total: 0 },
        integration: { passed: 0, failed: 0, total: 0 },
        e2e: { passed: 0, failed: 0, total: 0 },
        performance: { passed: 0, failed: 0, total: 0 },
        load: { passed: 0, failed: 0, total: 0 },
      },
      coverage: {},
      performance: {},
      trends: {},
    };

    // Analyze Jest test results
    const testResultFiles = [
      "test-results/unit-results.xml",
      "test-results/integration-results.xml",
    ];

    for (const file of testResultFiles) {
      const filePath = path.join(__dirname, "..", file);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, "utf8");
          // Simple XML parsing for test counts
          const tests = (content.match(/tests="(\d+)"/) || [])[1];
          const failures = (content.match(/failures="(\d+)"/) || [])[1];

          if (tests && failures) {
            const testType = file.includes("unit") ? "unit" : "integration";
            testAnalysis.testResults[testType] = {
              total: parseInt(tests),
              failed: parseInt(failures),
              passed: parseInt(tests) - parseInt(failures),
            };
          }
        } catch (error) {
          console.warn(`⚠️ Failed to analyze ${file}:`, error.message);
        }
      }
    }

    // Analyze coverage data
    const coverageDirs = [
      "coverage/unit",
      "coverage/integration",
      "coverage/e2e",
    ];
    for (const coverageDir of coverageDirs) {
      const coveragePath = path.join(
        __dirname,
        "..",
        coverageDir,
        "coverage-summary.json"
      );
      if (fs.existsSync(coveragePath)) {
        try {
          const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
          const testType = coverageDir.split("/")[1];
          testAnalysis.coverage[testType] = coverage.total;
        } catch (error) {
          console.warn(
            `⚠️ Failed to analyze coverage for ${coverageDir}:`,
            error.message
          );
        }
      }
    }

    // Analyze performance results
    if (fs.existsSync(this.resultsDir)) {
      const perfFiles = fs
        .readdirSync(this.resultsDir)
        .filter((f) => f.includes("performance"));
      for (const file of perfFiles) {
        try {
          const perfData = JSON.parse(
            fs.readFileSync(path.join(this.resultsDir, file), "utf8")
          );
          testAnalysis.performance[file] = perfData;
        } catch (error) {
          console.warn(
            `⚠️ Failed to analyze performance file ${file}:`,
            error.message
          );
        }
      }
    }

    return testAnalysis;
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    // Database usage recommendations
    if (analysis.database.totalUsers > 1000) {
      recommendations.push({
        type: "warning",
        category: "database",
        message:
          "High number of test users detected. Consider cleaning up old test data.",
        action: "Implement automated test data cleanup in CI/CD pipeline",
      });
    }

    // Test coverage recommendations
    Object.entries(analysis.testResults.coverage || {}).forEach(
      ([testType, coverage]) => {
        if (coverage.lines && coverage.lines.pct < 80) {
          recommendations.push({
            type: "info",
            category: "coverage",
            message: `${testType} test coverage is below 80% (${coverage.lines.pct}%)`,
            action: "Add more test cases to improve coverage",
          });
        }
      }
    );

    // Performance recommendations
    if (analysis.testResults.performance) {
      Object.values(analysis.testResults.performance).forEach((perf) => {
        if (perf.averageResponseTime > 500) {
          recommendations.push({
            type: "warning",
            category: "performance",
            message: "Average response time exceeds 500ms threshold",
            action: "Optimize database queries and application performance",
          });
        }
      });
    }

    // Test failure recommendations
    Object.entries(analysis.testResults.testResults).forEach(
      ([testType, results]) => {
        if (results.failed > 0) {
          recommendations.push({
            type: "error",
            category: "tests",
            message: `${results.failed} ${testType} tests failed`,
            action: "Review test failures and fix issues before deployment",
          });
        }
      }
    );

    return recommendations;
  }

  async generateReport() {
    console.log("📋 Generating comprehensive test data analysis report...");

    const analysis = {
      database: await this.analyzeDatabaseUsage(),
      testResults: await this.analyzeTestResults(),
      recommendations: [],
    };

    analysis.recommendations = this.generateRecommendations(analysis);

    // Save analysis report
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }

    const reportFile = path.join(
      this.resultsDir,
      `test-data-analysis-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.json`
    );
    fs.writeFileSync(reportFile, JSON.stringify(analysis, null, 2));

    console.log(`💾 Analysis report saved to: ${reportFile}`);

    return analysis;
  }

  printSummary(analysis) {
    console.log("\n📊 Test Data Analysis Summary");
    console.log("=".repeat(50));

    // Database summary
    console.log("\n🗄️ Database Usage:");
    console.log(`  • Total Users: ${analysis.database.totalUsers}`);
    console.log(
      `  • Total Refresh Tokens: ${analysis.database.totalRefreshTokens}`
    );
    console.log(
      `  • Average Files Uploaded: ${analysis.database.averageFilesUploaded.toFixed(
        1
      )}`
    );

    console.log("\n👥 Users by Test Type:");
    Object.entries(analysis.database.usersByTestType).forEach(
      ([type, data]) => {
        console.log(
          `  • ${type}: ${
            data.count
          } users (${data.averageFilesUploaded.toFixed(1)} avg files)`
        );
      }
    );

    // Test results summary
    console.log("\n🧪 Test Results:");
    Object.entries(analysis.testResults.testResults).forEach(
      ([type, results]) => {
        const passRate =
          results.total > 0
            ? ((results.passed / results.total) * 100).toFixed(1)
            : "0.0";
        console.log(
          `  • ${type}: ${results.passed}/${results.total} passed (${passRate}%)`
        );
      }
    );

    // Coverage summary
    console.log("\n📈 Code Coverage:");
    Object.entries(analysis.testResults.coverage).forEach(
      ([type, coverage]) => {
        if (coverage.lines) {
          console.log(
            `  • ${type}: ${coverage.lines.pct}% lines, ${coverage.functions.pct}% functions`
          );
        }
      }
    );

    // Recommendations
    if (analysis.recommendations.length > 0) {
      console.log("\n💡 Recommendations:");
      analysis.recommendations.forEach((rec, index) => {
        const icon =
          rec.type === "error" ? "❌" : rec.type === "warning" ? "⚠️" : "ℹ️";
        console.log(`  ${index + 1}. ${icon} ${rec.message}`);
        console.log(`     → ${rec.action}`);
      });
    } else {
      console.log("\n✅ No recommendations - all systems optimal!");
    }

    console.log("\n📄 Detailed report saved to performance-results/");
  }

  async run() {
    try {
      await this.connect();
      const analysis = await this.generateReport();
      this.printSummary(analysis);
    } catch (error) {
      console.error("❌ Test data analysis failed:", error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Run analyzer if called directly
if (require.main === module) {
  const analyzer = new TestDataAnalyzer();
  analyzer
    .run()
    .then(() => {
      console.log("✅ Test data analysis completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Test data analysis failed:", error.message);
      process.exit(1);
    });
}

module.exports = TestDataAnalyzer;
