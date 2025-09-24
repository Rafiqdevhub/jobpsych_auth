import mongoose, { Document, Schema } from "mongoose";

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string; // hashed refresh token
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for automatic expiration
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for user lookup
refreshTokenSchema.index({ userId: 1 });

export default mongoose.model<IRefreshToken>(
  "RefreshToken",
  refreshTokenSchema
);
