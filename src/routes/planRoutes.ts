import { Router } from "express";
import {
  createPlanPayment,
  getAvailablePlans,
  getPaymentStatus,
} from "../controllers/planPaymentController";
import {
  validatePlanPaymentRequest,
  validatePaymentId,
} from "../middleware/planValidation";
import { storeSubscription } from "../controllers/subscriptionStoreController";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

// Home route for the API - renamed from /plans to /
router.get("/", getAvailablePlans);

// Subscription route - handles both free and pro plans
router.post("/subscription", validatePlanPaymentRequest, createPlanPayment);

// Payment status checking - kept for tracking pro plan payments
router.get("/subscription/:id", validatePaymentId, getPaymentStatus);

// Route to store subscription data in MongoDB
router.post("/subscription/store", asyncHandler(storeSubscription));

export default router;
