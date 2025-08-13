import { Request, Response } from "express";
import { stripe } from "../config/stripe";
import User from "../models/user";
import Subscription from "../models/subscription";

export const handleStripeWebhook = async (req: Request, res: Response) => {
  let event;

  try {
    const sig = req.headers["stripe-signature"] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.warn("Stripe webhook secret not configured");
      return res.status(400).json({
        error: "Webhook secret not configured",
      });
    }

    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({
      error: "Webhook signature verification failed",
    });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error("Error handling webhook:", error);
    res.status(500).json({
      error: "Webhook processing failed",
      message: error.message,
    });
  }
};

async function handleSubscriptionCreated(subscription: any) {
  try {
    const user = await User.findOne({
      stripe_customer_id: subscription.customer,
    });

    if (user) {
      user.subscription_status = subscription.status;
      await user.save();

      const subscriptionRecord = new Subscription({
        user_id: user._id,
        user_email: user.email,
        stripe_customer_id: subscription.customer,
        stripe_subscription_id: subscription.id,
        plan_type: subscription.items.data[0]?.price?.lookup_key || "pro",
        subscription_status: subscription.status,
        subscription_start: new Date(subscription.start_date * 1000),
        subscription_end: new Date(subscription.current_period_end * 1000),
        amount: subscription.items.data[0]?.price?.unit_amount / 100 || 0,
        currency: subscription.currency,
      });

      await subscriptionRecord.save();
      console.log(`Subscription created for user: ${user.email}`);
    }
  } catch (error) {
    console.error("Error handling subscription created:", error);
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    const user = await User.findOne({
      stripe_customer_id: subscription.customer,
    });

    if (user) {
      user.subscription_status = subscription.status;
      await user.save();

      await Subscription.findOneAndUpdate(
        { stripe_subscription_id: subscription.id },
        {
          subscription_status: subscription.status,
          subscription_end: new Date(subscription.current_period_end * 1000),
          updated_at: new Date(),
        }
      );

      console.log(`Subscription updated for user: ${user.email}`);
    }
  } catch (error) {
    console.error("Error handling subscription updated:", error);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  try {
    const user = await User.findOne({
      stripe_customer_id: subscription.customer,
    });

    if (user) {
      user.plan_type = "free";
      user.subscription_status = "canceled";
      await user.save();

      await Subscription.findOneAndUpdate(
        { stripe_subscription_id: subscription.id },
        {
          subscription_status: "canceled",
          updated_at: new Date(),
        }
      );

      console.log(`Subscription canceled for user: ${user.email}`);
    }
  } catch (error) {
    console.error("Error handling subscription deleted:", error);
  }
}

async function handlePaymentSucceeded(invoice: any) {
  try {
    const user = await User.findOne({
      stripe_customer_id: invoice.customer,
    });

    if (user && invoice.subscription) {
      user.subscription_status = "active";
      await user.save();

      await Subscription.findOneAndUpdate(
        { stripe_subscription_id: invoice.subscription },
        {
          subscription_status: "active",
          updated_at: new Date(),
        }
      );

      console.log(`Payment succeeded for user: ${user.email}`);
    }
  } catch (error) {
    console.error("Error handling payment succeeded:", error);
  }
}

async function handlePaymentFailed(invoice: any) {
  try {
    const user = await User.findOne({
      stripe_customer_id: invoice.customer,
    });

    if (user && invoice.subscription) {
      user.subscription_status = "past_due";
      await user.save();

      await Subscription.findOneAndUpdate(
        { stripe_subscription_id: invoice.subscription },
        {
          subscription_status: "past_due",
          updated_at: new Date(),
        }
      );

      console.log(`Payment failed for user: ${user.email}`);
    }
  } catch (error) {
    console.error("Error handling payment failed:", error);
  }
}
