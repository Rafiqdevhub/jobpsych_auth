import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoURI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/jobpsych";

let isConnected = false;

export const connectMongoDB = async (): Promise<void> => {
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log("✅ MongoDB already connected");
    return;
  }

  try {
    // Reset connection flag
    isConnected = false;

    await mongoose.connect(mongoURI, {
      // Connection options optimized for MongoDB Atlas
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
      family: 4, // Use IPv4, skip trying IPv6
    });

    isConnected = true;
    console.log("✅ MongoDB connected successfully to:", mongoURI);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️  MongoDB disconnected");
      isConnected = false;
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected");
      isConnected = true;
    });
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    isConnected = false;
    throw error;
  }
};

// For serverless environments, ensure connection before operations
export const ensureMongoDBConnection = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) {
    console.log("🔄 Ensuring MongoDB connection...");
    await connectMongoDB();
  }
};

// Check if database is available
export const isMongoDBConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};
