import express from "express";
import {
  register,
  login,
  resetPassword,
  refresh,
  logout,
  getProfile,
  changePassword,
} from "../controllers/authController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/reset-password", resetPassword);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/change-password", authenticate, changePassword);
router.get("/profile", authenticate, getProfile);

export default router;
