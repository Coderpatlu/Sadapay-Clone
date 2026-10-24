import express from "express";
import rateLimit from "express-rate-limit";

import { sendOtp, verifyOtp } from "../Controllers/OtpController.js";

import { isAuthenticated } from "../Middlewares/Auth.js";

const router = express.Router();

const sendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP requests. Try again later.",
  },
});

const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification requests. Try again later.",
  },
});

router.post("/send", isAuthenticated, sendOtpLimiter, sendOtp);

router.post("/verify", isAuthenticated, verifyOtpLimiter, verifyOtp);

export default router;
