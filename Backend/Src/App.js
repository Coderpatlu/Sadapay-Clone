import express from "express";
import dotenv from "dotenv";
import connectDb from "./DB/db.js";
import cookieParser from "cookie-parser";
import userRoute from "./Routes/UserRoutes.js";
import walletRoute from "./Routes/WalletRoute.js";
import transactionRoute from "./Routes/TransactionRoute.js";
import ErrorMiddleware from "./Middleware/ErrorMiddleware.js";

dotenv.config();
const app = express();
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(async (req, res, next) => {
  try {
    await connectDb();
    next();
  } catch (error) {
    next(error);
  }
});

app.use("/api/user", userRoute);
app.use("/api/wallet", walletRoute);
app.use("/api/transaction", transactionRoute);

app.use(ErrorMiddleware);

export default app;
