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

// Main payment route - only supports pro and premium plans
router.post("/pay", validatePlanPaymentRequest, createPlanPayment);

// Get available plans and pricing
router.get("/plans", getAvailablePlans);

// Get payment status
router.get("/status/:id", validatePaymentId, getPaymentStatus);

export default router;
