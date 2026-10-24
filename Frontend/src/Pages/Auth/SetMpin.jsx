import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useSetMpinMutation } from "../../Redux/Api/AuthApi";
import "../../Styles/Auth/Login.css";

const SetMpin = () => {
  const navigate = useNavigate();
  const [mpin, setMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [error, setError] = useState("");
  const [setMpinRequest, { isLoading }] = useSetMpinMutation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!/^\d{4}$/.test(mpin)) {
      setError("MPIN must be exactly 4 digits.");
      return;
    }

    if (mpin !== confirmMpin) {
      setError("MPIN values do not match.");
      return;
    }

    try {
      await setMpinRequest({ mpin, confirmMpin }).unwrap();
      toast.success("Your MPIN is ready.");
      setMpin("");
      setConfirmMpin("");
      navigate("/onboarding/profile", { replace: true });
    } catch (requestError) {
      const message =
        requestError?.data?.message ||
        requestError?.error ||
        "Unable to set your MPIN. Please try again.";
      setError(message);
      toast.error(message);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="brand-icon">s</div>
          <span>
            sada<span className="brand-light">pay</span>
          </span>
        </div>

        <div className="login-content">
          <p className="login-eyebrow">SECURE YOUR ACCOUNT</p>
          <h1>Create your MPIN.</h1>
          <p className="login-description">
            Choose a 4-digit MPIN for future logins and transfer confirmation.
          </p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="new-mpin">4-digit MPIN</label>
            <div className="phone-input">
              <input
                id="new-mpin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                autoComplete="new-password"
                placeholder="Choose your MPIN"
                value={mpin}
                onChange={(event) => {
                  setMpin(event.target.value.replace(/\D/g, "").slice(0, 4));
                  setError("");
                }}
                required
                disabled={isLoading}
              />
            </div>

            <label htmlFor="confirm-new-mpin">Confirm MPIN</label>
            <div className="phone-input">
              <input
                id="confirm-new-mpin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                autoComplete="new-password"
                placeholder="Re-enter your MPIN"
                value={confirmMpin}
                onChange={(event) => {
                  setConfirmMpin(
                    event.target.value.replace(/\D/g, "").slice(0, 4),
                  );
                  setError("");
                }}
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button className="login-button" type="submit" disabled={isLoading}>
              {isLoading ? "Saving MPIN..." : "Save MPIN"}
              {!isLoading && <span aria-hidden="true"> →</span>}
            </button>
          </form>
        </div>
        <footer className="login-footer">
          Keep your MPIN private. We store it securely.
        </footer>
      </section>
    </main>
  );
};

export default SetMpin;
