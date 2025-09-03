import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  clerk_id: string;
  stripe_customer_id: string;
  plan_type: "free" | "pro" | "premium";
  subscription_status:
    | "active"
    | "inactive"
    | "canceled"
    | "trialing"
    | "past_due";
  created_at: Date;
  updated_at: Date;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  clerk_id: {
    type: String,
    required: true,
    unique: true,
  },
  stripe_customer_id: {
    type: String,
    required: true,
    unique: true,
  },
  plan_type: {
    type: String,
    enum: ["free", "pro", "premium"],
    default: "free",
  },
  subscription_status: {
    type: String,
    enum: ["active", "inactive", "canceled", "trialing", "past_due"],
    default: "inactive",
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

UserSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

export default mongoose.model<IUser>("User", UserSchema);
