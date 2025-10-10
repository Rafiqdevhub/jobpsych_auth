#!/usr/bin/env node

const os = require("os");
const fs = require("fs");
const path = require("path");

class PerformanceMonitor {
  constructor(interval = 5000) {
    this.interval = interval;
    this.monitoring = false;
    this.metrics = [];
    this.startTime = null;
  }

  startMonitoring() {
    console.log("📊 Starting Performance Monitoring...");
    this.monitoring = true;
    this.startTime = Date.now();
    this.monitoringInterval = setInterval(
      () => this.collectMetrics(),
      this.interval
    );
  }

  stopMonitoring() {
    console.log("🛑 Stopping Performance Monitoring...");
    this.monitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.saveMetrics();
    this.printSummary();
  }

  collectMetrics() {
    if (!this.monitoring) return;

    const timestamp = Date.now();
    const elapsed = timestamp - this.startTime;

    const metrics = {
      timestamp,
      elapsed,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usedPercentage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
      },
      cpu: {
        loadAverage: os.loadavg(),
        cpus: os.cpus().length,
      },
      system: {
        uptime: os.uptime(),
        platform: os.platform(),
        arch: os.arch(),
      },
    };

    this.metrics.push(metrics);
  }

  saveMetrics() {
    const resultsDir = path.join(__dirname, "..", "performance-results");
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const filename = `monitoring-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.json`;
    const filepath = path.join(resultsDir, filename);

    const summary = {
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      totalSamples: this.metrics.length,
      averageInterval:
        this.metrics.length > 1
          ? (this.metrics[this.metrics.length - 1].elapsed -
              this.metrics[0].elapsed) /
            (this.metrics.length - 1)
          : 0,
      metrics: this.metrics,
    };

    fs.writeFileSync(filepath, JSON.stringify(summary, null, 2));
    console.log(`💾 Monitoring data saved to: ${filepath}`);
  }

  printSummary() {
    if (this.metrics.length === 0) {
      console.log("No metrics collected");
      return;
    }

    console.log("\n📈 Performance Monitoring Summary");
    console.log("=".repeat(50));

    const memoryUsage = this.metrics.map((m) => m.memory.usedPercentage);
    const avgMemoryUsage =
      memoryUsage.reduce((sum, m) => sum + m, 0) / memoryUsage.length;
    const maxMemoryUsage = Math.max(...memoryUsage);
    const minMemoryUsage = Math.min(...memoryUsage);

    const loadAverage = this.metrics.map((m) => m.cpu.loadAverage[0]);
    const avgLoad =
      loadAverage.reduce((sum, l) => sum + l, 0) / loadAverage.length;
    const maxLoad = Math.max(...loadAverage);

    console.log(
      `⏱️  Monitoring duration: ${Math.round(
        (Date.now() - this.startTime) / 1000
      )}s`
    );
    console.log(`📊 Samples collected: ${this.metrics.length}`);
    console.log(
      `🧠 Memory usage: ${avgMemoryUsage.toFixed(
        1
      )}% avg (${minMemoryUsage.toFixed(1)}% min, ${maxMemoryUsage.toFixed(
        1
      )}% max)`
    );
    console.log(
      `⚡ CPU load average: ${avgLoad.toFixed(2)} (max: ${maxLoad.toFixed(2)})`
    );
    console.log(`🖥️  CPU cores: ${this.metrics[0].cpu.cpus}`);

    // Performance recommendations
    console.log("\n🎯 Performance Analysis:");
    if (maxMemoryUsage > 90) {
      console.log(
        "  ⚠️  High memory usage detected - consider memory optimization"
      );
    } else if (avgMemoryUsage < 50) {
      console.log("  ✅ Memory usage is healthy");
    }

    if (maxLoad > this.metrics[0].cpu.cpus * 0.8) {
      console.log("  ⚠️  High CPU load detected - system may be overloaded");
    } else if (avgLoad < this.metrics[0].cpu.cpus * 0.5) {
      console.log("  ✅ CPU usage is within normal range");
    }

    const memoryTrend = this.calculateTrend(memoryUsage);
    if (memoryTrend > 5) {
      console.log("  📈 Memory usage trending upward - monitor for leaks");
    } else if (memoryTrend < -5) {
      console.log("  📉 Memory usage trending downward - good cleanup");
    }
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

    return secondAvg - firstAvg;
  }

  async monitorDuringLoadTest(testCommand) {
    console.log("🔬 Starting comprehensive load test monitoring...");
    console.log(`📝 Test command: ${testCommand}`);

    this.startMonitoring();

    try {
      const { execSync } = require("child_process");
      execSync(testCommand, {
        stdio: "inherit",
        timeout: 600000, // 10 minutes timeout
      });
    } catch (error) {
      console.log("⚠️  Load test completed with exit code:", error.status);
    }

    this.stopMonitoring();
  }
}

// CLI interface
if (require.main === module) {
  const monitor = new PerformanceMonitor();

  const args = process.argv.slice(2);
  if (args.length > 0 && args[0] === "during") {
    // Monitor during a specific command
    const testCommand = args.slice(1).join(" ");
    monitor.monitorDuringLoadTest(testCommand);
  } else {
    // Interactive monitoring
    console.log("Press Ctrl+C to stop monitoring...");
    monitor.startMonitoring();

    process.on("SIGINT", () => {
      monitor.stopMonitoring();
      process.exit(0);
    });
  }
}

module.exports = PerformanceMonitor;
