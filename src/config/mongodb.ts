import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoURI = process.env.MONGODB_URI || "";

export const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};
