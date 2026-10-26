import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let connectionPromise;

const getFailureReason = (error) => {
  const message = error instanceof Error ? error.message : "";

  if (/bad auth|authentication failed/i.test(message)) {
    return "Authentication failed; verify the MongoDB database user configured in DB_URI.";
  }

  if (/DB_URI is missing or invalid/i.test(message)) {
    return "DB_URI is missing or invalid.";
  }

  if (/ENOTFOUND|EAI_AGAIN/i.test(message)) {
    return "DNS lookup failed; verify the cluster hostname.";
  }

  if (/timed out|ETIMEOUT|ETIMEDOUT/i.test(message)) {
    return "Connection timed out; verify Atlas network access.";
  }

  return "Connection attempt failed; verify DB_URI and Atlas network access.";
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!connectionPromise) {
    connectionPromise = (async () => {
      const uri = process.env.DB_URI?.trim();

      if (
        !uri ||
        (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://"))
      ) {
        throw new Error("DB_URI is missing or invalid.");
      }

      await mongoose.connect(uri);
      console.log("MongoDB connected successfully");
    })().catch((error) => {
      console.error("MongoDB connection failed:", getFailureReason(error));
      connectionPromise = undefined;

      const unavailableError = new Error("Database connection unavailable.");
      unavailableError.name = "DatabaseConnectionError";
      unavailableError.statusCode = 503;
      unavailableError.status = "error";
      throw unavailableError;
    });
  }

  return connectionPromise;
};

export default connectDB;
