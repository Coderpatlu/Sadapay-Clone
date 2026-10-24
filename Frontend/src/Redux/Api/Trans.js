import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const transactionApi = createApi({
  reducerPath: "transactionApi",

  baseQuery: fetchBaseQuery({
    baseUrl: "/api/transaction",
    credentials: "include",
  }),

  tagTypes: ["Transaction"],

  endpoints: (builder) => ({
    // Get logged-in user's transactions
    getTransactions: builder.query({
      query: () => ({
        url: "/transactions",
        method: "GET",
      }),
      providesTags: ["Transaction"],
    }),

    // Send money
    sendMoney: builder.mutation({
      query: (data) => ({
        url: "/send",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Transaction"],
    }),

    // Look up recipient details before confirming a transfer
    lookupRecipient: builder.mutation({
      query: (receiverAccount) => ({
        url: "/recipient/lookup",
        method: "POST",
        body: { receiverAccount },
      }),
    }),

    // Get a transaction receipt
    getReceipt: builder.query({
      query: (transactionId) => ({
        url: `/receipt/${encodeURIComponent(transactionId)}`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useGetTransactionsQuery,
  useSendMoneyMutation,
  useLookupRecipientMutation,
  useGetReceiptQuery,
} = transactionApi;
