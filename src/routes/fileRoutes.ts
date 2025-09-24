import express from "express";
import { uploadFile, getUploadStats } from "../controllers/fileController";
import { authenticate } from "../middleware/auth";
import { upload } from "../config/multer";

const router = express.Router();

// Protected routes - require authentication
router.post("/upload", authenticate, upload.single("file"), uploadFile);
router.get("/stats", authenticate, getUploadStats);

export default router;
