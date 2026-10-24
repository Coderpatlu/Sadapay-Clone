import User from "../Models/UserModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import asyncHandler from "../Middleware/AsyncHandler.js";
import errorhandler from "../Utils/ErrorHandler.js";
import Wallet from "../Models/WalletModel.js";

const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
};

const clearAuthCookie = (res) => {
  res.clearCookie("token", authCookieOptions);
};

export const createUser = asyncHandler(async (req, res, next) => {
  const { fullName, email, password, phone } = req.body;
  if (!fullName || !email || !password || !phone) {
    return next(
      new errorhandler(
        "Full name, email, password and phone are required",
        400,
      ),
    );
  }

  // Check if user already exists
  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
  if (existingUser) {
    return next(new errorhandler("User already exists", 401));
  }

  // Create new user
  const newUser = new User({
    fullName,
    email,
    password,
    phone,
  });

  await newUser.save();

  // Generate JWT token
  const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  res.status(201).json({
    message: "User created successfully",
    token,
    user: {
      id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      onboardingCompleted: newUser.onboardingCompleted,
    },
  });
});

export const loginUser = asyncHandler(async (req, res, next) => {
  const { email, phone, password, mpin } = req.body;

  // Validate required fields
  if ((!email && !phone) || (!password && !mpin)) {
    return next(
      new errorhandler("Email or phone and password are required", 400),
    );
  }

  // Find user by email or phone
  const query = email
    ? { email: email.trim().toLowerCase() }
    : { phone: phone.replace(/\D/g, "") };

  const user = await User.findOne(query).select("+password +mpinHash");

  if (!user) {
    clearAuthCookie(res);
    return next(new errorhandler("Invalid credentials", 401));
  }

  let isMatch = false;

  if (user.mpinSet) {
    if (mpin && user.mpinHash && /^\d{4}$/.test(mpin)) {
      isMatch = await bcrypt.compare(mpin, user.mpinHash);
    }
  } else if (password) {
    isMatch = await bcrypt.compare(password, user.password);
  }

  if (!isMatch) {
    clearAuthCookie(res);
    const message =
      user.mpinSet && password
        ? "This account uses an MPIN to log in. Reset your MPIN with your password if needed."
        : "Invalid credentials";
    return next(new errorhandler(message, 401));
  }

  // Generate JWT
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  // Set HTTP-only cookie
  res.cookie("token", token, {
    ...authCookieOptions,
    maxAge: 60 * 60 * 1000,
  });

  return res.status(200).json({
    success: true,
    message: "Login successful",
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      onboardingCompleted: user.onboardingCompleted,
      mpinSet: user.mpinSet,
    },
    requiresMpinSetup: !user.mpinSet,
  });
});

const validateMpin = (mpin) => /^\d{4}$/.test(String(mpin ?? ""));

export const setMpin = asyncHandler(async (req, res, next) => {
  const { mpin, confirmMpin } = req.body;

  if (!validateMpin(mpin)) {
    return next(new errorhandler("MPIN must be exactly 4 digits.", 400));
  }

  if (mpin !== confirmMpin) {
    return next(new errorhandler("MPIN values do not match.", 400));
  }

  if (req.user.mpinSet) {
    return next(
      new errorhandler(
        "MPIN is already set. Use password verification to reset it.",
        409,
      ),
    );
  }

  const mpinHash = await bcrypt.hash(mpin, 10);
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { mpinHash, mpinSet: true } },
    { new: true },
  );

  return res.status(200).json({
    success: true,
    message: "MPIN set successfully.",
    user,
  });
});

export const resetMpin = asyncHandler(async (req, res, next) => {
  const { phone, password, mpin, confirmMpin } = req.body;

  if (!phone || !password) {
    return next(
      new errorhandler("Phone number and password are required.", 400),
    );
  }

  if (!validateMpin(mpin)) {
    return next(new errorhandler("MPIN must be exactly 4 digits.", 400));
  }

  if (mpin !== confirmMpin) {
    return next(new errorhandler("MPIN values do not match.", 400));
  }

  const normalizedPhone = String(phone).replace(/\D/g, "");
  const user = await User.findOne({ phone: normalizedPhone }).select(
    "+password",
  );

  if (!user || !(await bcrypt.compare(password, user.password))) {
    clearAuthCookie(res);
    return next(new errorhandler("Invalid phone number or password.", 401));
  }

  const mpinHash = await bcrypt.hash(mpin, 10);
  user.mpinHash = mpinHash;
  user.mpinSet = true;
  await user.save();

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  res.cookie("token", token, {
    ...authCookieOptions,
    maxAge: 60 * 60 * 1000,
  });

  return res.status(200).json({
    success: true,
    message: "MPIN reset successfully.",
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      onboardingCompleted: user.onboardingCompleted,
      mpinSet: true,
    },
  });
});

export const logoutUser = asyncHandler(async (req, res, next) => {
  res.clearCookie("token");

  res.status(200).json({
    success: true,
    message: "Logout successfully",
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

export const completeOnboarding = asyncHandler(async (req, res, next) => {
  const wallet = await Wallet.findOne({ user: req.user._id });

  if (!wallet) {
    return next(new errorhandler("Create your wallet before continuing.", 400));
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { onboardingCompleted: true } },
    { new: true },
  );

  return res.status(200).json({
    success: true,
    message: "Onboarding completed",
    user,
  });
});

export const completeHomeTour = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { homeTourCompleted: true } },
    { new: true },
  );

  return res.status(200).json({
    success: true,
    message: "Home tour completed",
    user,
  });
});

export const getUserById = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId);

  if (!user) {
    return next(new errorhandler("user not found", 404));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .select("fullName phone")
    .sort({ fullName: 1 })
    .lean();

  return res.status(200).json({
    success: true,
    count: users.length,
    users,
  });
});

export const updateUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { fullName, email, phone } = req.body;

  const updates = {};

  if (fullName !== undefined) updates.fullName = fullName;
  if (email !== undefined) updates.email = email.trim().toLowerCase();
  if (phone !== undefined) updates.phone = phone;

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!user) {
    return next(new errorhandler("User not found", 404));
  }

  return res.status(200).json({
    success: true,
    message: "User updated successfully",
    user,
  });
});

export const deleteUser = asyncHandler(async (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return next(
      new errorhandler("Password is required to delete your account.", 400),
    );
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    return next(new errorhandler("User not found", 404));
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    return next(new errorhandler("Incorrect password.", 401));
  }

  await Wallet.findOneAndDelete({ user: user._id });
  await user.deleteOne();
  res.clearCookie("token");

  return res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});
