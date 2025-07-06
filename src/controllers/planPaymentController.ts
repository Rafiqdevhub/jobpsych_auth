import { Request, Response } from "express";
import { stripe } from "../config/stripe";
import {
  CreatePaymentRequest,
  PaymentResponse,
  ErrorResponse,
  PlanType,
  PlanConfig,
} from "../types/payment";

// Plan configurations with pricing
const PLANS: Record<PlanType, PlanConfig> = {
  free: {
    name: "JobPsych Free",
    price: 0,
    description: "Basic plan with limited features",
    features: [
      "Upload up to 2 resumes",
      "Basic job matching",
      "Basic career insights",
    ],
    resumeLimit: 2,
  },
  pro: {
    name: "JobPsych Pro",
    price: 50,
    description: "Professional plan with unlimited resume uploads",
    features: [
      "Unlimited resume uploads",
      "Advanced job matching",
      "Detailed personality insights",
      "Career recommendations",
      "Priority support",
    ],
    resumeLimit: -1, // -1 indicates unlimited
  },
};

export const createPlanPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      plan,
      customer_email,
      customer_name,
      metadata = {},
    } = req.body as CreatePaymentRequest;

    // Get plan configuration
    const planConfig = PLANS[plan];
    if (!planConfig) {
      res.status(400).json({
        error: "Invalid Plan",
        message: "Plan must be either 'free' or 'pro'",
      });
      return;
    }

    // Handle free plan differently - no payment needed
    if (plan === "free") {
      const response = {
        success: true,
        data: {
          plan: "free",
          status: "active",
          amount: 0,
          currency: "usd",
          created: Date.now(),
          customer_email: customer_email,
          description: planConfig.description,
          resumeLimit: planConfig.resumeLimit,
        },
        plan_details: planConfig,
      };

      res.status(200).json(response);
      return;
    }

    // For paid plans, convert amount to cents for Stripe
    const amountInCents = Math.round(planConfig.price * 100);

    // Create payment intent with plan details
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      description: `${planConfig.name} - ${planConfig.description}`,
      receipt_email: customer_email,
      metadata: {
        ...metadata,
        plan: plan,
        plan_name: planConfig.name,
        plan_price: planConfig.price.toString(),
        customer_email: customer_email,
        customer_name: customer_name || "",
        service: "JobPsych Payment Service",
        created_at: new Date().toISOString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    const response: PaymentResponse = {
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret!,
      status: paymentIntent.status,
      plan: plan,
      amount: planConfig.price,
      currency: paymentIntent.currency,
      created: paymentIntent.created,
      customer_email: customer_email,
      description: paymentIntent.description!,
      metadata: paymentIntent.metadata,
    };

    res.status(201).json({
      success: true,
      data: response,
      plan_details: {
        name: planConfig.name,
        price: planConfig.price,
        description: planConfig.description,
        features: planConfig.features,
      },
    });
  } catch (error: any) {
    console.error("Error creating plan payment:", error);

    const errorResponse: ErrorResponse = {
      error: "Payment Creation Failed",
      message: error.message || "Failed to create payment for plan",
      code: error.code,
    };

    res.status(400).json(errorResponse);
  }
};

// Get available plans - This is the home route for the subscription API
export const getAvailablePlans = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Enhanced response with more details about resume limits
    res.json({
      success: true,
      data: {
        plans: PLANS,
        currency: "usd",
        supported_payment_methods: ["card"],
        publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
      },
      plan_comparison: [
        {
          feature: "Resume Upload Limit",
          free: "2 resumes",
          pro: "Unlimited",
        },
        {
          feature: "Price",
          free: "Free",
          pro: "$50 per user",
        },
        {
          feature: "Job Matching",
          free: "Basic",
          pro: "Advanced",
        },
        {
          feature: "Support",
          free: "Standard",
          pro: "Priority",
        },
      ],
      recommended_plan: "pro",
    });
  } catch (error: any) {
    console.error("Error getting plans:", error);

    const errorResponse: ErrorResponse = {
      error: "Plans Retrieval Failed",
      message: error.message || "Failed to retrieve available plans",
      code: error.code,
    };

    res.status(500).json(errorResponse);
  }
};

// Get payment status by ID
export const getPaymentStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const paymentIntent = await stripe.paymentIntents.retrieve(id);

    const plan = paymentIntent.metadata?.plan as PlanType;
    const planConfig = plan ? PLANS[plan] : null;

    const response: PaymentResponse = {
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret || "",
      status: paymentIntent.status,
      plan: plan || "pro", // fallback
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      created: paymentIntent.created,
      customer_email: paymentIntent.metadata?.customer_email || "",
      description: paymentIntent.description || "",
      metadata: paymentIntent.metadata,
    };

    res.json({
      success: true,
      data: response,
      plan_details: planConfig || null,
    });
  } catch (error: any) {
    console.error("Error retrieving payment status:", error);

    const errorResponse: ErrorResponse = {
      error: "Payment Retrieval Failed",
      message: error.message || "Failed to retrieve payment status",
      code: error.code,
    };

    res.status(404).json(errorResponse);
  }
};
