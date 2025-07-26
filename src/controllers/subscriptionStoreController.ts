import { Request, Response } from "express";
import Subscription from "../models/subscription";

export const storeSubscription = async (req: Request, res: Response) => {
  try {
    const {
      user_email,
      user_id,
      stripe_customer_id,
      stripe_subscription_id,
      subscription_status,
      subscription_end,
    } = req.body;

    if (
      !user_email ||
      !user_id ||
      !stripe_customer_id ||
      !stripe_subscription_id ||
      !subscription_status ||
      !subscription_end
    ) {
      return res.status(400).json({
        error: "Validation Error",
        message: "All fields are required.",
      });
    }

    const subscription = new Subscription({
      user_email,
      user_id,
      stripe_customer_id,
      stripe_subscription_id,
      subscription_status,
      subscription_end,
    });
    await subscription.save();
    res.status(201).json({ success: true, data: subscription });
  } catch (error: any) {
    res.status(500).json({ error: "Database Error", message: error.message });
  }
};
