import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./Api/AuthApi";
import { walletApi } from "./Api/WalletApi";
import { transactionApi } from "./Api/Trans";

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [walletApi.reducerPath]: walletApi.reducer,
    [transactionApi.reducerPath]: transactionApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      walletApi.middleware,
      transactionApi.middleware,
    ),
});
