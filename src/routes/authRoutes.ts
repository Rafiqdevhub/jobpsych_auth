import express from "express";
import {
  register,
  login,
  resetPassword,
  refresh,
  logout,
  getProfile,
  updateProfile,
} from "../controllers/authController";
import { verifyToken, getJWTInfo } from "../controllers/jwtController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// Authentication routes
router.post("/register", register);
router.post("/login", login);
router.post("/reset-password", resetPassword);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.put("/update-profile", authenticate, updateProfile);
router.get("/profile", authenticate, getProfile);

//  (for cross-service communication)
router.post("/verify-token", verifyToken);
router.get("/jwt-info", getJWTInfo);

// Service info endpoint for health checks
router.get("/info", (req, res) => {
  res.json({
    api: "JobPsych Auth API",
    version: "3.0.0",
    status: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
  });
});

export default router;
