import express from "express";
// import { getWallet } from "../Controller/WalletControl.js";
import { isAuthenticated } from "../Middleware/IsAuthenticated.js";
import {
  getReceipt,
  getTransactionById,
  getTransactions,
  lookupRecipient,
  sendMoney,
} from "../Controller/TransactionController.js";

const router = express.Router();

router.post("/recipient/lookup", isAuthenticated, lookupRecipient);
router.post("/send", isAuthenticated, sendMoney);
router.get("/transactions", isAuthenticated, getTransactions);
router.get("/transaction/:transactionId", isAuthenticated, getTransactionById);
router.get("/receipt/:transactionId", isAuthenticated, getReceipt);

export default router;
