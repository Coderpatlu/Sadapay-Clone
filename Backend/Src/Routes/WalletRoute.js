import express from "express";
import {
  createWallet,
  getBalance,
  getWallet,
} from "../Controller/WalletControl.js";
import { isAuthenticated } from "../Middleware/IsAuthenticated.js";

const router = express.Router();

router.get("/getwallet", isAuthenticated, getWallet);
router.post("/createwallet", isAuthenticated, createWallet);
router.get("/balance", isAuthenticated, getBalance);

export default router;
