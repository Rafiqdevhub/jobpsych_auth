import { Request, Response, NextFunction } from "express";
import { CreatePaymentRequest, PlanType } from "../types/payment";

const VALID_PLANS: PlanType[] = ["pro", "premium"];

export const validatePlanPaymentRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check if req.body exists and is an object
  if (!req.body || typeof req.body !== "object") {
    res.status(400).json({
      error: "Validation Error",
      message:
        "Request body is missing or invalid. Make sure to send JSON data with Content-Type: application/json",
      received_body: req.body,
      content_type: req.get("Content-Type"),
    });
    return;
  }

  const { plan, customer_email, customer_name } =
    req.body as CreatePaymentRequest;

  // Validate plan
  if (!plan || !VALID_PLANS.includes(plan)) {
    res.status(400).json({
      error: "Validation Error",
      message: "Plan must be either 'pro' or 'premium'",
      valid_plans: VALID_PLANS,
    });
    return;
  }

  // Validate customer email
  if (!customer_email || !isValidEmail(customer_email)) {
    res.status(400).json({
      error: "Validation Error",
      message: "Valid customer email is required",
    });
    return;
  }

  // Validate customer name if provided
  if (
    customer_name &&
    (typeof customer_name !== "string" || customer_name.trim().length === 0)
  ) {
    res.status(400).json({
      error: "Validation Error",
      message: "Customer name must be a non-empty string if provided",
    });
    return;
  }

  next();
};

export const validatePaymentId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { id } = req.params;

  if (!id || typeof id !== "string" || !id.startsWith("pi_")) {
    res.status(400).json({
      error: "Validation Error",
      message: "Invalid payment ID format",
    });
    return;
  }

  next();
};

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
