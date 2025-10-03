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

export default router;
