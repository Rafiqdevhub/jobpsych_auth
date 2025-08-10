import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

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
  typescript: true,
});

export const stripeConfig = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  currency: "usd",
  defaultReturnUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};
