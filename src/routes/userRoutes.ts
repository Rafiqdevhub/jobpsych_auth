import { Router } from "express";
import {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
} from "../controllers/userController";
import { asyncHandler } from "../middleware/errorHandler";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Public routes
router.post("/", asyncHandler(createUser));

// Protected routes (require authentication)
router.get("/:id", authenticateToken, asyncHandler(getUserById));
router.get("/email/:email", authenticateToken, asyncHandler(getUserByEmail));
router.put("/:id", authenticateToken, asyncHandler(updateUser));

export default router;
