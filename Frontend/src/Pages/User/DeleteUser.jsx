import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../Styles/Auth/Login.css";

const DeleteUser = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Enter your password to confirm account deletion.");
      return;
    }

    if (!confirmDelete) {
      setError("Please confirm that you want to delete your account.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to delete account.");
      }

      // Clear the password from component state.
      setPassword("");

      // Backend should invalidate the JWT cookie on deletion.
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card delete-card">
        <div className="login-brand">
          <div className="brand-icon">s</div>
          <span>
            sada<span className="brand-light">pay</span>
          </span>
        </div>

        <div className="login-content">
          <div className="delete-icon" aria-hidden="true">
            !
          </div>

          <p className="login-eyebrow delete-eyebrow">ACCOUNT SETTINGS</p>

          <h1>Delete account?</h1>

          <p className="login-description">
            You are about to permanently delete your account. This action may
            remove access to your profile and wallet history.
          </p>

          <div className="delete-warning">
            <strong>This action cannot be undone.</strong>
            <p>
              Make sure any outstanding transactions and wallet balances are
              handled before proceeding.
            </p>
          </div>

          <form onSubmit={handleDelete}>
            <label htmlFor="delete-password">Confirm your password</label>

            <div className="phone-input">
              <input
                id="delete-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                autoComplete="current-password"
                required
                disabled={loading}
              />
            </div>

            <label className="delete-confirm">
              <input
                type="checkbox"
                checked={confirmDelete}
                onChange={(e) => {
                  setConfirmDelete(e.target.checked);
                  setError("");
                }}
                disabled={loading}
              />
              <span>I understand that this action is permanent.</span>
            </label>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button className="delete-button" type="submit" disabled={loading}>
              {loading ? "Deleting account..." : "Permanently delete account"}
            </button>

            <button
              className="profile-cancel"
              type="button"
              onClick={() => navigate("/")}
              disabled={loading}
            >
              Cancel
            </button>
          </form>
        </div>

        <footer className="login-footer">Your security matters.</footer>
      </section>
    </main>
  );
};

export default DeleteUser;
