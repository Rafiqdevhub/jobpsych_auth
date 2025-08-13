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

router.get("/", getAvailablePlans);

router.post("/subscription", validatePlanPaymentRequest, createPlanPayment);

router.get("/subscription/:id", validatePaymentId, getPaymentStatus);

router.post("/subscription/store", asyncHandler(storeSubscription));

export default router;
