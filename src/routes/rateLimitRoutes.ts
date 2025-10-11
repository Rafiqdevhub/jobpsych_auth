import express from "express";
import {
  getUserUploads,
  incrementUpload,
  getUploadStats,
} from "../controllers/rateLimitController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

router.get("/user-uploads/:email", getUserUploads);
router.post("/increment-upload", incrementUpload);
router.get("/upload-stats", authenticate, getUploadStats);

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
    },
  });
});

export default router;
