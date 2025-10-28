import express from "express";
import {
  getUserUploads,
  incrementUpload,
  getUploadStats,
  incrementBatchAnalysis,
  incrementCompareResumes,
  getFeatureUsage,
  incrementCounter,
  incrementSelectedCandidate,
} from "../controllers/rateLimitController";

const router = express.Router();

router.get("/user-uploads/:email", getUserUploads);
router.post("/increment-upload", incrementUpload);
router.post("/increment-batch-analysis", incrementBatchAnalysis);
router.post("/increment-compare-resumes", incrementCompareResumes);
router.post("/increment-selected-candidate", incrementSelectedCandidate);
router.get("/feature-usage/:email", getFeatureUsage);
router.get("/auth/upload-stats", getUploadStats);
router.post("/auth/increment-counter", incrementCounter);

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
      selectedCandidate: true,
    },
  });
});

export default router;
