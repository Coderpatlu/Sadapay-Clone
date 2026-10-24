import React from "react";
import Home from "./Pages/Home";
import Navbar from "./Components/Layout/Navbar/Navbar";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import Login from "./Pages/Auth/Login";
import Register from "./Pages/Auth/Register";
import UpdatePro from "./Pages/User/UpdatePro";
import DeleteUser from "./Pages/User/DeleteUser";
import GetWallet from "./Pages/User/GetWallet";
import ReviewTransfer from "./Components/Layout/Transactions/ReviewTransfer";
import Receipt from "./Components/Layout/Transactions/Receipt";
import { Toaster } from "react-hot-toast";
import History from "./Components/Home/Center/History";
import SendTrans from "./Pages/Trans/SendTrans";
import { useGetMeQuery } from "./Redux/Api/AuthApi";
import Users from "./Pages/User/Users";
import SetMpin from "./Pages/Auth/SetMpin";

const AuthLoading = () => (
  <main className="login-page">
    <section className="login-card">
      <p className="login-description">Checking your session...</p>
    </section>
  </main>
);

const ProtectedRoute = () => {
  const location = useLocation();
  const { data, isLoading, isFetching, isError } = useGetMeQuery();

  if (isLoading || isFetching) {
    return <AuthLoading />;
  }

  if (isError || !data?.user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!data.user.mpinSet) {
    if (location.pathname !== "/set-mpin") {
      return <Navigate to="/set-mpin" replace />;
    }

    return <Outlet />;
  }

  if (location.pathname === "/set-mpin") {
    return <Navigate to="/" replace />;
  }

  if (!data.user.onboardingCompleted) {
    if (location.pathname !== "/onboarding/profile" &&
        location.pathname !== "/onboarding/wallet") {
      return <Navigate to="/onboarding/profile" replace />;
    }
  } else if (
    !data.user.homeTourCompleted &&
    location.pathname !== "/"
  ) {
    return <Navigate to="/" replace />;
  } else if (location.pathname.startsWith("/onboarding/")) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const GuestRoute = () => {
  const { data, isLoading, isFetching, isError } = useGetMeQuery();

  if (isLoading || isFetching) {
    return <AuthLoading />;
  }

  return !isError && data?.user ? <Navigate to="/" replace /> : <Outlet />;
};

const App = () => {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#222",
            color: "#fff",
          },
        }}
      />
      <Navbar />
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/set-mpin" element={<SetMpin />} />
          <Route
            path="/onboarding/profile"
            element={<UpdatePro onboarding />}
          />
          <Route
            path="/onboarding/wallet"
            element={<GetWallet onboarding />}
          />
          <Route path="/update-profile" element={<UpdatePro />} />
          <Route path="/delete-user" element={<DeleteUser />} />
          <Route path="/users" element={<Users />} />
          <Route path="/load-money" element={<GetWallet />} />
          <Route path="/createwallet" element={<GetWallet />} />
          <Route path="/send" element={<SendTrans />} />
          <Route path="/review" element={<ReviewTransfer />} />
          <Route path="/receipt/:transactionId" element={<Receipt />} />
          <Route path="/transactions" element={<History />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
