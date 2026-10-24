import Wallet from "../Models/WalletModel.js";
import asyncHandler from "../Middleware/AsyncHandler.js";
import errorHandler from "../Utils/ErrorHandler.js";
import User from "../Models/UserModel.js";

// CREATE WALLET
export const createWallet = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  // Check if wallet already exists
  const existWallet = await Wallet.findOne({
    user: userId,
  });

  if (existWallet) {
    return next(new errorHandler("Wallet already exists", 409));
  }

  // Generate demo IBAN
  const iban = `PK${Date.now()}${Math.floor(Math.random() * 1000)}`;

  // Create wallet
  const wallet = await Wallet.create({
    user: userId,
    iban,
  });

  return res.status(201).json({
    success: true,
    message: "Wallet created successfully",
    wallet: {
      accountNumber: req.user.phone,
      iban: wallet.iban,
      balance: wallet.balance,
    },
  });
});

// GET EXISTING WALLET
export const getWallet = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const wallet = await Wallet.findOne({
    user: userId,
  });

  if (!wallet) {
    return res.status(404).json({
      success: false,
      message: "Wallet not found. Please create your wallet first.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Wallet fetched successfully",
    wallet: {
      accountNumber: req.user.phone,
      iban: wallet.iban,
      balance: wallet.balance,
    },
  });
});

export const getBalance = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;

  if (!userId) {
    return next(new errorHandler("User not authenticated", 401));
  }

  const wallet = await Wallet.findOne({ user: userId });

  if (!wallet) {
    return next(new errorHandler("Wallet not found", 404));
  }

  return res.status(200).json({
    success: true,
    wallet: {
      balance: wallet.balance,
      status: wallet.status,
      iban: wallet.iban,
    },
  });
});
