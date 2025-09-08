import { Router } from "express";
import {
  register,
  login,
  refreshToken,
  verifyToken,
} from "../controllers/authController";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/refresh", asyncHandler(refreshToken));
router.get("/verify", asyncHandler(verifyToken));

export default router;
