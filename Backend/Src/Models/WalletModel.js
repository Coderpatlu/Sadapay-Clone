import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    iban: {
      type: String,
      required: true,
      unique: true,
    },

    balance: {
      type: Number,
      default: 10000,
      min: 0,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "BLOCKED"],
      default: "ACTIVE",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Wallet = mongoose.model("Wallet", walletSchema);

export default Wallet;
