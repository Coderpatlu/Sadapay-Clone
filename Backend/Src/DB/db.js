import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    const uri = process.env.DB_URI?.trim();

    if (
      !uri ||
      (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://"))
    ) {
      throw new Error("Invalid MONGO_URI format");
    }

    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
