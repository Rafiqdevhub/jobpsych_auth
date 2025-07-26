import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  user_email: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  subscription_status: string;
  subscription_end: Date;
}

const SubscriptionSchema: Schema = new Schema({
  user_email: { type: String, required: true },
  user_id: { type: String, required: true },
  stripe_customer_id: { type: String, required: true },
  stripe_subscription_id: { type: String, required: true },
  subscription_status: { type: String, required: true },
  subscription_end: { type: Date, required: true },
});

export default mongoose.model<ISubscription>(
  "Subscription",
  SubscriptionSchema
);
