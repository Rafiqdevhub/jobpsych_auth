import { Router } from "express";
import {
  createUser,
  getUserById,
  getUserByEmail,
  getUserByClerkId,
  updateUser,
} from "../controllers/userController";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();
router.post("/", asyncHandler(createUser));
router.get("/:id", asyncHandler(getUserById));
router.get("/email/:email", asyncHandler(getUserByEmail));
router.get("/clerk/:clerkId", asyncHandler(getUserByClerkId));
router.put("/:id", asyncHandler(updateUser));

export default router;
