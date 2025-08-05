import { Router } from "express";
import {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
} from "../controllers/userController";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

// Create a new user with Stripe customer
router.post("/", asyncHandler(createUser));

// Get user by ID
router.get("/:id", asyncHandler(getUserById));

// Get user by email
router.get("/email/:email", asyncHandler(getUserByEmail));

// Update user information
router.put("/:id", asyncHandler(updateUser));

export default router;
