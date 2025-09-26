import express from "express";
import { countFile, getUploadStats } from "../controllers/fileController";
import { authenticate } from "../middleware/auth";
import { upload } from "../config/multer";

const router = express.Router();

router.post("/count", authenticate, upload.single("file"), countFile);
router.get("/stats", authenticate, getUploadStats);

export default router;
