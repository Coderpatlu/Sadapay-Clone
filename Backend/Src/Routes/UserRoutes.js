import express from "express";
import rateLimit from "express-rate-limit";
import {
  createUser,
  completeHomeTour,
  completeOnboarding,
  deleteUser,
  getAllUsers,
  getMe,
  getUserById,
  loginUser,
  logoutUser,
  resetMpin,
  setMpin,
  updateUser,
} from "../Controller/UserController.js";
import { isAuthenticated } from "../Middleware/IsAuthenticated.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Try again later.",
  },
});

const resetMpinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many MPIN reset attempts. Try again later.",
  },
});

router.post("/register", createUser);
router.post("/login", loginLimiter, loginUser);
router.post("/mpin/reset", resetMpinLimiter, resetMpin);
router.get("/me", isAuthenticated, getMe);
router.post("/mpin/set", isAuthenticated, setMpin);
router.post("/onboarding/complete", isAuthenticated, completeOnboarding);
router.post("/onboarding/home-tour/complete", isAuthenticated, completeHomeTour);
router.get("/users", isAuthenticated, getAllUsers);
router.get("/me/:userId", isAuthenticated, getUserById);
router.patch("/me/:userId", isAuthenticated, updateUser);
router.post("/logout", isAuthenticated, logoutUser);
router.delete("/delete", isAuthenticated, deleteUser);

export default router;
