import Stripe from "stripe";
import dotenv from "dotenv";

// Ensure dotenv is configured
dotenv.config();

// Use a dummy key for development if not provided
const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_for_development";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(
    "⚠️  STRIPE_SECRET_KEY not set - using dummy key for development"
  );
  console.warn(
    "   Add your real Stripe keys to .env file for full functionality"
  );
} else {
  console.log("✅ Stripe keys loaded successfully");
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-06-30.basil",
  typescript: true,
});

export const stripeConfig = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  currency: "usd",
  defaultReturnUrl: process.env.FRONTEND_URL || "http://localhost:3000",
};
