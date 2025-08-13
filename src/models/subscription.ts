import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  user_id: mongoose.Types.ObjectId;
  user_email: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan_type: "free" | "pro" | "premium";
  subscription_status: string;
  subscription_start: Date;
  subscription_end: Date;
  amount: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

const SubscriptionSchema: Schema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  user_email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  stripe_customer_id: {
    type: String,
    required: true,
  },
  stripe_subscription_id: {
    type: String,
    required: true,
  },
  plan_type: {
    type: String,
    enum: ["free", "pro", "premium"],
    required: true,
  },
  subscription_status: {
    type: String,
    required: true,
  },
  subscription_start: {
    type: Date,
    default: Date.now,
  },
  subscription_end: {
    type: Date,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    default: 0,
  },
  currency: {
    type: String,
    default: "usd",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

SubscriptionSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

export default mongoose.model<ISubscription>(
  "Subscription",
  SubscriptionSchema
);
