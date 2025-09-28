import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoURI = process.env.MONGODB_URI || "";

let isConnected = false;

export const connectMongoDB = async (): Promise<void> => {
  if (isConnected) {
    console.log("✅ MongoDB already connected");
    return;
  }

  try {
    await mongoose.connect(mongoURI);
    isConnected = true;
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error; // Re-throw to handle in serverless
  }
};

// For serverless environments, ensure connection before operations
export const ensureMongoDBConnection = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) {
    await connectMongoDB();
  }
};
