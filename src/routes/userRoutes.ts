import { Router } from "express";
import {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
} from "../controllers/userController";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();
router.post("/", asyncHandler(createUser));
router.get("/:id", asyncHandler(getUserById));
router.get("/email/:email", asyncHandler(getUserByEmail));
router.put("/:id", asyncHandler(updateUser));

export default router;
