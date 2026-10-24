import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../Models/UserModel.js";
import Wallet from "../Models/WalletModel.js";
import Transaction from "../Models/TransactionModel.js";
import AsyncHandler from "../Middleware/AsyncHandler.js";
import ErrorHandler from "../Utils/ErrorHandler.js";

const resolveReceiver = async (receiverAccount) => {
  const account = String(receiverAccount ?? "").trim();

  if (!account) {
    return null;
  }

  const normalizedIban = account.replace(/\s/g, "").toUpperCase();
  const accountDigits = account.replace(/\D/g, "");
  const normalizedPhone =
    accountDigits.length === 12 && accountDigits.startsWith("92")
      ? `0${accountDigits.slice(2)}`
      : accountDigits;

  let wallet = await Wallet.findOne({ iban: normalizedIban });

  if (!wallet && /^03\d{9}$/.test(normalizedPhone)) {
    const user = await User.findOne({ phone: normalizedPhone }).select("_id");

    if (user) {
      wallet = await Wallet.findOne({ user: user._id });
    }
  }

  if (!wallet) {
    return null;
  }

  const user = await User.findById(wallet.user).select("fullName");

  if (!user) {
    return null;
  }

  return { wallet, user };
};

export const lookupRecipient = AsyncHandler(async (req, res, next) => {
  const { receiverAccount } = req.body;

  if (!receiverAccount?.trim()) {
    return next(new ErrorHandler("Receiver account is required", 400));
  }

  const recipient = await resolveReceiver(receiverAccount);

  if (!recipient) {
    return next(new ErrorHandler("Receiver account not found", 404));
  }

  if (req.user._id.toString() === recipient.wallet.user.toString()) {
    return next(new ErrorHandler("You cannot send money to yourself", 400));
  }

  if (recipient.wallet.status !== "ACTIVE") {
    return next(new ErrorHandler("Recipient wallet is not active", 403));
  }

  return res.status(200).json({
    success: true,
    recipient: {
      fullName: recipient.user.fullName,
      accountNumber: recipient.wallet.iban,
    },
  });
});

export const sendMoney = AsyncHandler(async (req, res, next) => {
  const {
    receiverAccount,
    amount: rawAmount,
    description = "",
    mpin,
  } = req.body;

  const senderId = req.user?._id;

  // 1. Authentication
  if (!senderId) {
    return next(new ErrorHandler("User not authenticated", 401));
  }

  // 2. Validate input
  if (
    !receiverAccount?.trim() ||
    rawAmount === undefined ||
    rawAmount === null ||
    rawAmount === ""
  ) {
    return next(
      new ErrorHandler("Receiver account and amount are required", 400),
    );
  }

  const amount = Number(rawAmount);

  if (!Number.isFinite(amount) || amount < 100) {
    return next(
      new ErrorHandler("The minimum transfer amount is PKR 100", 400),
    );
  }

  if (!/^\d{4}$/.test(String(mpin ?? ""))) {
    return next(new ErrorHandler("Enter your 4-digit MPIN to confirm", 400));
  }

  const sender = await User.findById(senderId).select("+mpinHash");

  if (
    !sender?.mpinSet ||
    !(await bcrypt.compare(mpin, sender.mpinHash))
  ) {
    return next(new ErrorHandler("Invalid MPIN", 401));
  }

  // 3. Resolve receiver wallet by IBAN or phone number
  const recipient = await resolveReceiver(receiverAccount);
  const receiverWallet = recipient?.wallet;

  if (!receiverWallet) {
    return next(new ErrorHandler("Receiver account not found", 404));
  }

  // 4. Resolve receiver's actual User ID
  const receiverId = receiverWallet.user;

  if (senderId.toString() === receiverId.toString()) {
    return next(new ErrorHandler("You cannot send money to yourself", 400));
  }

  let transaction;
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const senderWallet = await Wallet.findOne({ user: senderId }).session(
        session,
      );
      const currentReceiverWallet = await Wallet.findOne({
        user: receiverId,
      }).session(session);

      if (!senderWallet) {
        throw new ErrorHandler("Your wallet was not found", 404);
      }

      if (!currentReceiverWallet) {
        throw new ErrorHandler("Receiver account not found", 404);
      }

      if (
        senderWallet.status !== "ACTIVE" ||
        currentReceiverWallet.status !== "ACTIVE"
      ) {
        throw new ErrorHandler("Both wallets must be active", 403);
      }

      if (senderWallet.balance < amount) {
        throw new ErrorHandler("Insufficient balance", 400);
      }

      const debitResult = await Wallet.updateOne(
        {
          user: senderId,
          status: "ACTIVE",
          balance: { $gte: amount },
        },
        { $inc: { balance: -amount } },
        { session },
      );

      if (debitResult.matchedCount !== 1) {
        throw new ErrorHandler("Insufficient balance", 400);
      }

      const creditResult = await Wallet.updateOne(
        { user: receiverId, status: "ACTIVE" },
        { $inc: { balance: amount } },
        { session },
      );

      if (creditResult.matchedCount !== 1) {
        throw new ErrorHandler("Recipient wallet is not active", 403);
      }

      transaction = new Transaction({
        transactionId: `TXN-${new mongoose.Types.ObjectId()}`,
        sender: senderId,
        receiver: receiverId,
        amount,
        type: "SEND",
        status: "SUCCESS",
        description,
      });

      await transaction.save({ session });
    });
  } finally {
    await session.endSession();
  }

  // 10. Send response
  return res.status(201).json({
    success: true,
    message: "Money sent successfully",
    transaction,
  });
});

// Get all transactions for logged-in user
export const getTransactions = AsyncHandler(async (req, res, next) => {
  const userId = req.user?._id;

  if (!userId) {
    return next(new ErrorHandler("User not authenticated", 401));
  }

  const transactions = await Transaction.find({
    $or: [{ sender: userId }, { receiver: userId }],
  })
    .populate("sender", "fullName phone")
    .populate("receiver", "fullName phone")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    count: transactions.length,
    transactions,
  });
});

// Find a transaction by MongoDB ID or custom transaction ID
const findAccessibleTransaction = async (id, userId) => {
  const identifier = mongoose.isValidObjectId(id)
    ? { _id: id }
    : { transactionId: id };

  return Transaction.findOne({
    ...identifier,
    $or: [{ sender: userId }, { receiver: userId }],
  })
    .populate("sender", "fullName phone")
    .populate("receiver", "fullName phone");
};

// Get a specific transaction
export const getTransactionById = AsyncHandler(async (req, res, next) => {
  const { transactionId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return next(new ErrorHandler("User not authenticated", 401));
  }

  if (!transactionId) {
    return next(new ErrorHandler("Transaction ID is required", 400));
  }

  const transaction = await findAccessibleTransaction(transactionId, userId);

  if (!transaction) {
    return next(new ErrorHandler("Transaction not found", 404));
  }

  return res.status(200).json({
    success: true,
    transaction,
  });
});

// Get transaction receipt
export const getReceipt = AsyncHandler(async (req, res, next) => {
  const { transactionId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return next(new ErrorHandler("User not authenticated", 401));
  }

  if (!transactionId) {
    return next(new ErrorHandler("Transaction ID is required", 400));
  }

  const transaction = await findAccessibleTransaction(transactionId, userId);

  if (!transaction) {
    return next(new ErrorHandler("Transaction not found", 404));
  }

  const receipt = {
    receiptId: `RCP-${transaction.transactionId || transaction._id}`,
    transactionId: transaction.transactionId || transaction._id.toString(),

    sender: {
      name: transaction.sender?.fullName || "Unknown user",
      phone: transaction.sender?.phone || "",
    },

    receiver: {
      name: transaction.receiver?.fullName || "Unknown user",
      phone: transaction.receiver?.phone || "",
    },

    amount: transaction.amount,
    currency: "PKR",
    description: transaction.description || "",
    status: transaction.status,
    date: transaction.createdAt,
  };

  return res.status(200).json({
    success: true,
    receipt,
  });
});
