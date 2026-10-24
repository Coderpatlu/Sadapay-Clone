import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    channel: {
      type: String,
      enum: ["phone", "email"],
      required: true,
    },

    purpose: {
      type: String,
      enum: ["registration", "profile-update"],
      required: true,
    },

    destination: {
      type: String,
      required: true,
    },

    codeHash: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },

    attempts: {
      type: Number,
      default: 0,
    },

    lastSentAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

otpSchema.index({ user: 1, channel: 1, purpose: 1 }, { unique: true });

export default mongoose.model("Otp", otpSchema);
