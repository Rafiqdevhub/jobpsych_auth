import { Request, Response } from "express";
import Subscription from "../models/subscription";
import User from "../models/user";

export const storeSubscription = async (req: Request, res: Response) => {
  try {
    const {
      user_email,
      user_id,
      stripe_customer_id,
      stripe_subscription_id,
      plan_type,
      subscription_status,
      subscription_end,
      amount,
      currency,
    } = req.body;

    if (
      !user_email ||
      !user_id ||
      !stripe_customer_id ||
      !stripe_subscription_id ||
      !plan_type ||
      !subscription_status ||
      !subscription_end
    ) {
      return res.status(400).json({
        success: false,
        error: "Validation Error",
        message:
          "user_email, user_id, stripe_customer_id, stripe_subscription_id, plan_type, subscription_status, and subscription_end are required.",
      });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User Not Found",
        message: "User with the specified ID does not exist.",
      });
    }

    const subscription = new Subscription({
      user_id,
      user_email: user_email.toLowerCase(),
      stripe_customer_id,
      stripe_subscription_id,
      plan_type,
      subscription_status,
      subscription_end: new Date(subscription_end),
      amount: amount || 0,
      currency: currency || "usd",
    });

    await subscription.save();

    user.plan_type = plan_type;
    user.subscription_status = subscription_status;
    await user.save();

    res.status(201).json({
      success: true,
      message: "Subscription stored successfully",
      data: {
        subscription_id: subscription._id,
        user_id: subscription.user_id,
        user_email: subscription.user_email,
        stripe_customer_id: subscription.stripe_customer_id,
        stripe_subscription_id: subscription.stripe_subscription_id,
        plan_type: subscription.plan_type,
        subscription_status: subscription.subscription_status,
        subscription_start: subscription.subscription_start,
        subscription_end: subscription.subscription_end,
        amount: subscription.amount,
        currency: subscription.currency,
        created_at: subscription.created_at,
      },
    });
  } catch (error: any) {
    console.error("Error storing subscription:", error);
    res.status(500).json({
      success: false,
      error: "Database Error",
      message: error.message || "Failed to store subscription",
    });
  }
};
