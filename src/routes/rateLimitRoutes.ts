import express from "express";
import {
  getUserUploads,
  incrementUpload,
  getUploadStats,
  incrementBatchAnalysis,
  incrementCompareResumes,
  getFeatureUsage,
  incrementCounter,
} from "../controllers/rateLimitController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

router.get("/user-uploads/:email", getUserUploads);
router.post("/increment-upload", incrementUpload);
router.get("/upload-stats", authenticate, getUploadStats);

// Unified counter increment endpoint - NEW!
router.post("/increment-counter", incrementCounter);

// Feature usage endpoints
router.post("/increment-batch-analysis", incrementBatchAnalysis);
router.post("/increment-compare-resumes", incrementCompareResumes);
router.get("/feature-usage/:email", getFeatureUsage);

// Rate limit info endpoint for health checks
router.get("/rate-limit-info", (req, res) => {
  res.json({
    success: true,
    uploadLimit: 10,
    message: "Rate limit info endpoint",
    timestamp: new Date().toISOString(),
    features: {
      userUploadTracking: true,
      rateLimiting: true,
      fastapiIntegration: true,
      batchAnalysis: true,
      compareResumes: true,
    },
  });
});

export default router;
