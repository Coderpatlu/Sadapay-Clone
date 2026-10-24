import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      default: () => `TXN-${new mongoose.Types.ObjectId()}`,
      unique: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      min: 100,
      required: true,
    },
    type: {
      type: String,
      enum: ["SEND", "RECEIVER"],
      default: "SEND",
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
