import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const walletApi = createApi({
  reducerPath: "walletApi",

  baseQuery: fetchBaseQuery({
    baseUrl: "/api/wallet",
    credentials: "include",
  }),

  tagTypes: ["Wallet"],

  endpoints: (builder) => ({
    // Get existing wallet
    getWallet: builder.query({
      query: () => ({
        url: "/getwallet",
        method: "GET",
      }),
      providesTags: ["Wallet"],
    }),

    // Create new wallet
    createWallet: builder.mutation({
      query: () => ({
        url: "/createwallet",
        method: "POST",
      }),
      invalidatesTags: ["Wallet"],
    }),

    // Get logged-in user's balance
    getBalance: builder.query({
      query: () => ({
        url: "/balance",
        method: "GET",
      }),
      providesTags: ["Wallet"],
    }),
  }),
});

export const {
  useGetWalletQuery,
  useCreateWalletMutation,
  useGetBalanceQuery,
} = walletApi;
