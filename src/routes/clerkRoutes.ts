import { Router } from "express";
import { handleClerkWebhook } from "../controllers/clerkWebhookController";

const router = Router();

// Clerk webhook endpoint
router.post("/webhook", handleClerkWebhook);

export default router;
