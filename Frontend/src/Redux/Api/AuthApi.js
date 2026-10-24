import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const authApi = createApi({
  reducerPath: "authApi",

  baseQuery: fetchBaseQuery({
    baseUrl: "/api/user",
    credentials: "include",
  }),

  tagTypes: ["User"],

  endpoints: (builder) => ({
    register: builder.mutation({
      query: (userData) => ({
        url: "/register",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: (result) => (result ? ["User"] : []),
    }),

    login: builder.mutation({
      query: (userData) => ({
        url: "/login",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: (result) => (result ? ["User"] : []),
    }),

    setMpin: builder.mutation({
      query: (credentials) => ({
        url: "/mpin/set",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User"],
    }),

    resetMpin: builder.mutation({
      query: (credentials) => ({
        url: "/mpin/reset",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User"],
    }),

    logout: builder.mutation({
      query: () => ({
        url: "/logout",
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),

    completeOnboarding: builder.mutation({
      query: () => ({
        url: "/onboarding/complete",
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),

    completeHomeTour: builder.mutation({
      query: () => ({
        url: "/onboarding/home-tour/complete",
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),

    updateUser: builder.mutation({
      query: ({ userId, ...updatedData }) => ({
        url: `/me/${userId}`,
        method: "PATCH",
        body: updatedData,
      }),
      invalidatesTags: ["User"],
    }),

    getMe: builder.query({
      query: () => "/me",
      providesTags: ["User"],
    }),

    getUsers: builder.query({
      query: () => "/users",
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useSetMpinMutation,
  useResetMpinMutation,
  useLogoutMutation,
  useCompleteOnboardingMutation,
  useCompleteHomeTourMutation,
  useGetMeQuery,
  useGetUsersQuery,
  useUpdateUserMutation,
} = authApi;
