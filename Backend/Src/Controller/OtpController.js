import crypto from "node:crypto";
import Otp from "../Models/OtpModel.js";
import User from "../Models/UserModel.js";
import { sendEmailOtp, sendPhoneOtp } from "../Utils/OtpDelivery.js";
import ErrorHandler from "../Utils/ErrorHandler.js";
import asyncHandler from "../Middleware/AsyncHandler.js";

const OTP_TTL_MS = Number(process.env.OTP_EXPIRY_MINUTES || 5) * 60 * 1000;

const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

// Generate a cryptographically secure 6-digit OTP.
const generateOtp = () =>
  crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");

// Hash OTP before storing it.
const hashOtp = (otp) =>
  crypto.createHmac("sha256", process.env.OTP_SECRET).update(otp).digest("hex");

const safeCompare = (a, b) => {
  const bufferA = Buffer.from(a, "hex");
  const bufferB = Buffer.from(b, "hex");

  return (
    bufferA.length === bufferB.length &&
    crypto.timingSafeEqual(bufferA, bufferB)
  );
};

// Convert Pakistani phone numbers to international format.
const normalizePhone = (phone) => {
  const digits = String(phone ?? "").replace(/\D/g, "");

  if (/^03\d{9}$/.test(digits)) {
    return `92${digits.slice(1)}`;
  }

  if (/^923\d{9}$/.test(digits)) {
    return digits;
  }

  throw new ErrorHandler("Invalid Pakistani phone number", 400);
};

const normalizeEmail = (email) =>
  String(email ?? "")
    .trim()
    .toLowerCase();

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Send OTP
export const sendOtp = asyncHandler(async (req, res) => {
  const { channel, purpose } = req.body;

  if (!["phone", "email"].includes(channel)) {
    throw new ErrorHandler("Channel must be phone or email", 400);
  }

  if (!["registration", "profile-update"].includes(purpose)) {
    throw new ErrorHandler("Invalid OTP purpose", 400);
  }

  if (!process.env.OTP_SECRET) {
    throw new ErrorHandler("OTP configuration error", 500);
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ErrorHandler("User not found", 404);
  }

  let destination;

  if (purpose === "registration") {
    destination = channel === "phone" ? user.phone : user.email;
  } else {
    destination = channel === "phone" ? req.body.newPhone : req.body.newEmail;

    if (!destination) {
      throw new ErrorHandler(`New ${channel} is required`, 400);
    }
  }

  if (channel === "phone") {
    destination = normalizePhone(destination);
  } else {
    destination = normalizeEmail(destination);

    if (!isValidEmail(destination)) {
      throw new ErrorHandler("Invalid email address", 400);
    }
  }

  const currentDestination =
    channel === "phone"
      ? user.phone
        ? normalizePhone(user.phone)
        : null
      : user.email
        ? normalizeEmail(user.email)
        : null;

  const alreadyVerified =
    channel === "phone" ? user.phoneVerified : user.emailVerified;

  const sameContact = currentDestination === destination;

  if (purpose === "registration" && !sameContact) {
    throw new ErrorHandler(
      "Registration contact does not match the user's contact",
      400,
    );
  }

  if (purpose === "registration" && alreadyVerified) {
    throw new ErrorHandler("This contact is already verified", 400);
  }

  if (purpose === "profile-update" && sameContact) {
    throw new ErrorHandler("This is already your current contact", 400);
  }

  // Prevent using another user's contact.
  // Existing phone values must use the same canonical format
  // as the normalized destination.
  const conflict =
    channel === "phone"
      ? await User.findOne({
          phone: destination,
          _id: { $ne: user._id },
        })
      : await User.findOne({
          email: destination,
          _id: { $ne: user._id },
        });

  if (conflict) {
    throw new ErrorHandler("This contact is already in use", 409);
  }

  const now = new Date();

  const existing = await Otp.findOne({
    user: user._id,
    channel,
    purpose,
  });

  if (
    existing &&
    now.getTime() - existing.lastSentAt.getTime() < RESEND_COOLDOWN_MS
  ) {
    throw new ErrorHandler("Please wait before requesting another OTP", 429);
  }

  const otp = generateOtp();
  const codeHash = hashOtp(otp);

  // Deliver the OTP before replacing an existing challenge.
  if (channel === "phone") {
    await sendPhoneOtp(destination, otp);
  } else {
    await sendEmailOtp(destination, otp);
  }

  await Otp.findOneAndUpdate(
    {
      user: user._id,
      channel,
      purpose,
    },
    {
      $set: {
        destination,
        codeHash,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
        attempts: 0,
        lastSentAt: now,
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    },
  );

  return res.status(200).json({
    success: true,
    message: `OTP sent to your ${channel}`,
    expiresInSeconds: OTP_TTL_MS / 1000,
  });
});

// Verify OTP
export const verifyOtp = asyncHandler(async (req, res) => {
  const { channel, purpose, otp } = req.body;

  if (
    !["phone", "email"].includes(channel) ||
    !["registration", "profile-update"].includes(purpose) ||
    typeof otp !== "string" ||
    !/^\d{6}$/.test(otp)
  ) {
    throw new ErrorHandler("Invalid verification request", 400);
  }

  if (!process.env.OTP_SECRET) {
    throw new ErrorHandler("OTP configuration error", 500);
  }

  const challenge = await Otp.findOne({
    user: req.user._id,
    channel,
    purpose,
  });

  if (!challenge) {
    throw new ErrorHandler("OTP not found or already used", 400);
  }

  if (challenge.expiresAt <= new Date()) {
    await Otp.deleteOne({ _id: challenge._id });

    throw new ErrorHandler("OTP expired. Request a new code.", 400);
  }

  if (challenge.attempts >= MAX_ATTEMPTS) {
    await Otp.deleteOne({ _id: challenge._id });

    throw new ErrorHandler("Too many attempts. Request a new OTP.", 429);
  }

  const submittedHash = hashOtp(otp);

  if (!safeCompare(submittedHash, challenge.codeHash)) {
    challenge.attempts += 1;

    if (challenge.attempts >= MAX_ATTEMPTS) {
      await Otp.deleteOne({ _id: challenge._id });
    } else {
      await challenge.save();
    }

    throw new ErrorHandler(
      `Incorrect OTP. ${MAX_ATTEMPTS - challenge.attempts} attempts remaining.`,
      400,
    );
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ErrorHandler("User not found", 404);
  }

  if (purpose === "profile-update") {
    // Recheck contact uniqueness before applying the change.
    const conflict =
      channel === "phone"
        ? await User.findOne({
            phone: challenge.destination,
            _id: { $ne: user._id },
          })
        : await User.findOne({
            email: challenge.destination,
            _id: { $ne: user._id },
          });

    if (conflict) {
      throw new ErrorHandler("This contact is already in use", 409);
    }

    if (channel === "phone") {
      user.phone = challenge.destination;
    } else {
      user.email = challenge.destination;
    }
  } else {
    const currentDestination =
      channel === "phone"
        ? user.phone
          ? normalizePhone(user.phone)
          : null
        : user.email
          ? normalizeEmail(user.email)
          : null;

    if (currentDestination !== challenge.destination) {
      throw new ErrorHandler("Contact changed. Request a new OTP.", 409);
    }
  }

  if (channel === "phone") {
    user.phoneVerified = true;
  } else {
    user.emailVerified = true;
  }

  await user.save();

  // Consume OTP after successful verification.
  await Otp.deleteOne({ _id: challenge._id });

  return res.status(200).json({
    success: true,
    message: `${channel} verified successfully`,
    verification: {
      phoneVerified: user.phoneVerified,
      emailVerified: user.emailVerified,
    },
  });
});
