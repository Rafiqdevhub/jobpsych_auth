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
import { requireEmailVerification } from "../middleware/emailVerification";

const router = express.Router();

router.get("/user-uploads/:email", getUserUploads);
router.post(
  "/increment-upload",
  authenticate,
  requireEmailVerification,
  incrementUpload
);
router.get(
  "/upload-stats",
  authenticate,
  requireEmailVerification,
  getUploadStats
);

// Unified counter increment endpoint - NEW!
router.post(
  "/increment-counter",
  authenticate,
  requireEmailVerification,
  incrementCounter
);

// Feature usage endpoints
router.post(
  "/increment-batch-analysis",
  authenticate,
  requireEmailVerification,
  incrementBatchAnalysis
);
router.post(
  "/increment-compare-resumes",
  authenticate,
  requireEmailVerification,
  incrementCompareResumes
);
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
