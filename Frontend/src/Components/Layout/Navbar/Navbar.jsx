import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../../../Styles/Layout/Navbar.css";
import Payments from "./Payments";
import MoreMenu from "./MoreMenu";
import { useGetMeQuery, useLogoutMutation } from "../../../Redux/Api/AuthApi";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data, isError } = useGetMeQuery();
  const [logout, { isLoading }] = useLogoutMutation();
  const [showPayments, setShowPayments] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const user = isError ? null : data?.user;
  const personalPaths = [
    "/",
    "/load-money",
    "/createwallet",
  ];
  const paymentPaths = ["/send", "/review"];
  const isPersonalActive = personalPaths.includes(location.pathname);
  const isPaymentsActive =
    showPayments ||
    paymentPaths.includes(location.pathname) ||
    location.pathname.startsWith("/receipt/");
  const isMoreActive =
    showMore ||
    [
      "/update-profile",
      "/delete-user",
      "/users",
      "/load-money",
      "/createwallet",
      "/transactions",
    ].includes(location.pathname);

  const togglePayments = () => {
    setShowMore(false);
    setShowPayments((prev) => !prev);
  };

  const toggleMore = () => {
    setShowPayments(false);
    setShowMore((prev) => !prev);
  };

  const showComingSoon = () => {
    toast("Coming soon.");
  };

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      setShowPayments(false);
      setShowMore(false);
      toast.success("Logged out successfully.");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(
        err?.data?.message || err?.message || "Unable to log out. Try again.",
      );
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <section className="navbar">
        <nav>
          <button
            className={`navbar-item${isPersonalActive ? " active" : ""}`}
            type="button"
            onClick={() => {
              setShowPayments(false);
              setShowMore(false);
              navigate("/");
            }}
            aria-current={isPersonalActive ? "page" : undefined}
          >
            <i className="fa-solid fa-house"></i>
            <span>Personal</span>
          </button>

          <button
            className={`navbar-item${isPaymentsActive ? " active" : ""}`}
            type="button"
            onClick={togglePayments}
            aria-expanded={showPayments}
          >
            <i className="fa-solid fa-money-bill-transfer"></i>
            <span>Payments</span>
          </button>

          <button
            className="navbar-item"
            type="button"
            onClick={showComingSoon}
          >
            <i className="fa-solid fa-qrcode"></i>
            <span>Scan QR</span>
          </button>

          <button
            className={`navbar-item${isMoreActive ? " active" : ""}`}
            type="button"
            onClick={toggleMore}
            aria-expanded={showMore}
          >
            <i className="fa-solid fa-bars"></i>
            <span>More</span>
          </button>

          <button
            className="navbar-logout"
            data-testid="logout-button"
            type="button"
            onClick={handleLogout}
            disabled={isLoading}
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>{isLoading ? "Logging out..." : "Logout"}</span>
          </button>
        </nav>
      </section>

      {showPayments && <Payments />}
      {showMore && <MoreMenu onNavigate={() => setShowMore(false)} />}
    </>
  );
};

export default Navbar;
