import { Request, Response } from "express";
import User from "../models/user";
import { stripe } from "../config/stripe";

export const handleClerkWebhook = async (req: Request, res: Response) => {
  const { type, data } = req.body;

  try {
    switch (type) {
      case "user.created":
        await handleUserCreated(data);
        break;
      case "user.updated":
        await handleUserUpdated(data);
        break;
      case "user.deleted":
        await handleUserDeleted(data);
        break;
      default:
        console.log(`Unhandled Clerk event type: ${type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error("Error handling Clerk webhook:", error);
    res.status(500).json({
      error: "Webhook processing failed",
      message: error.message,
    });
  }
};

async function handleUserCreated(userData: any) {
  try {
    const { id: clerkId, email_addresses, first_name, last_name } = userData;
    const email = email_addresses[0]?.email_address;
    const name = `${first_name || ""} ${last_name || ""}`.trim() || "Unknown";

    // Check if user already exists
    const existingUser = await User.findOne({ clerk_id: clerkId });
    if (existingUser) {
      console.log(`User with Clerk ID ${clerkId} already exists`);
      return;
    }

    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email: email,
      name: name,
      metadata: {
        clerk_id: clerkId,
        source: "Clerk Integration",
      },
    });

    // Create user in MongoDB
    const user = new User({
      email: email,
      name: name,
      clerk_id: clerkId,
      stripe_customer_id: stripeCustomer.id,
      plan_type: "free",
      subscription_status: "inactive",
    });

    await user.save();
    console.log(`User created for Clerk ID: ${clerkId}`);
  } catch (error) {
    console.error("Error handling user created:", error);
  }
}

async function handleUserUpdated(userData: any) {
  try {
    const { id: clerkId, email_addresses, first_name, last_name } = userData;
    const email = email_addresses[0]?.email_address;
    const name = `${first_name || ""} ${last_name || ""}`.trim() || "Unknown";

    // Update user in MongoDB
    await User.findOneAndUpdate(
      { clerk_id: clerkId },
      {
        email: email,
        name: name,
        updated_at: new Date(),
      }
    );

    console.log(`User updated for Clerk ID: ${clerkId}`);
  } catch (error) {
    console.error("Error handling user updated:", error);
  }
}

async function handleUserDeleted(userData: any) {
  try {
    const { id: clerkId } = userData;

    // Optionally, you can mark the user as deleted or remove them
    // For now, we'll just log it
    console.log(`User deleted for Clerk ID: ${clerkId}`);

    // If you want to delete the user:
    // await User.findOneAndDelete({ clerk_id: clerkId });
  } catch (error) {
    console.error("Error handling user deleted:", error);
  }
}
