import mongoose, { Schema, Document } from "mongoose";

export type UserType = "candidate" | "recruiter";

export interface IUser extends Document {
  email: string;
  name: string;
  password: string;
  user_type: UserType;
  stripe_customer_id?: string; // Optional for backward compatibility
  plan_type: "free" | "pro" | "premium";
  subscription_status:
    | "active"
    | "inactive"
    | "canceled"
    | "trialing"
    | "past_due";
  refresh_token?: string;
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
  password: {
    type: String,
    required: true,
  },
  user_type: {
    type: String,
    enum: ["candidate", "recruiter"],
    required: true,
  },
  stripe_customer_id: {
    type: String,
    unique: true,
    sparse: true, // Allow null values but ensure uniqueness when present
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
  refresh_token: {
    type: String,
    default: null,
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
