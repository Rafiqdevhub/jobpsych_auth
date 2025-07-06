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

const router = Router();

// Home route for the API - renamed from /plans to /
router.get("/", getAvailablePlans);

// Subscription route - handles both free and pro plans
router.post("/subscription", validatePlanPaymentRequest, createPlanPayment);

// Payment status checking - kept for tracking pro plan payments
router.get("/subscription/:id", validatePaymentId, getPaymentStatus);

export default router;
