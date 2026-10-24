import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const options = [
  {
    label: "Update profile",
    description: "Manage your personal details",
    icon: "fa-user-pen",
    path: "/update-profile",
  },
  {
    label: "Wallet details",
    description: "View your account number and IBAN",
    icon: "fa-wallet",
    path: "/load-money",
  },
  {
    label: "Transaction history",
    description: "Review your recent activity",
    icon: "fa-clock-rotate-left",
    path: "/transactions",
  },
  {
    label: "Users",
    description: "Browse names and account phone numbers",
    icon: "fa-users",
    path: "/users",
  },
  {
    label: "Delete account",
    description: "Permanently remove your account",
    icon: "fa-trash",
    path: "/delete-user",
    destructive: true,
  },
];

const MoreMenu = ({ onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <section className="more-menu" aria-label="More options">
      <h2>More</h2>
      <div className="more-menu-list">
        {options.map((option) => (
          <button
            className={`more-menu-item${option.destructive ? " destructive" : ""}`}
            type="button"
            key={option.path}
            aria-current={location.pathname === option.path ? "page" : undefined}
            onClick={() => {
              onNavigate();
              navigate(option.path);
            }}
          >
            <span className="more-menu-icon" aria-hidden="true">
              <i className={`fa-solid ${option.icon}`} />
            </span>
            <span className="more-menu-copy">
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </span>
            <i className="fa-solid fa-chevron-right more-menu-chevron" aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
};

export default MoreMenu;
