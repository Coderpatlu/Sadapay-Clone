import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import "../../Styles/Auth/Login.css";
import {
  useLoginMutation,
  useResetMpinMutation,
} from "../../Redux/Api/AuthApi";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [mpin, setMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [mode, setMode] = useState("mpin");
  const [error, setError] = useState("");
  const [login, { isLoading }] = useLoginMutation();
  const [resetMpin, { isLoading: isResetting }] = useResetMpinMutation();
  const loading = isLoading || isResetting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanPhone = phone.replace(/\D/g, "");

    if (!/^03\d{9}$/.test(cleanPhone)) {
      const message = "Enter a valid Pakistani mobile number.";
      setError(message);
      toast.error(message);
      return;
    }

    if (mode !== "mpin" && !password.trim()) {
      const message = "Password is required.";
      setError(message);
      toast.error(message);
      return;
    }

    if (mode !== "password" && mode !== "mpin") {
      if (!/^\d{4}$/.test(mpin)) {
        const message = "MPIN must be exactly 4 digits.";
        setError(message);
        toast.error(message);
        return;
      }

      if (mpin !== confirmMpin) {
        const message = "MPIN values do not match.";
        setError(message);
        toast.error(message);
        return;
      }
    }

    if (mode === "mpin" && !/^\d{4}$/.test(mpin)) {
      const message = "Enter your 4-digit MPIN.";
      setError(message);
      toast.error(message);
      return;
    }

    try {
      const data =
        mode === "reset"
          ? await resetMpin({
              phone: cleanPhone,
              password,
              mpin,
              confirmMpin,
            }).unwrap()
          : await login({
              phone: cleanPhone,
              ...(mode === "mpin" ? { mpin } : { password }),
            }).unwrap();

      setPassword("");
      setMpin("");
      setConfirmMpin("");

      toast.success(data?.message || "Login successful!");

      const destination = !data?.user?.mpinSet
        ? "/set-mpin"
        : data?.user?.onboardingCompleted
          ? location.state?.from?.pathname || "/"
          : "/onboarding/profile";

      navigate(destination, { replace: true });
    } catch (err) {
      const message =
        err?.data?.message ||
        (err?.status === "FETCH_ERROR"
          ? "Unable to connect to the server."
          : err?.message) ||
        "Login failed. Check your credentials.";

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
          <p className="login-eyebrow">
            {mode === "reset" ? "RESET MPIN" : "WELCOME BACK"}
          </p>

          <h1>
            {mode === "reset"
              ? "Create a new MPIN."
              : mode === "password"
                ? "Set up your MPIN."
                : "Let's get you in."}
          </h1>

          <p className="login-description">
            {mode === "mpin"
              ? "Enter your mobile number and 4-digit MPIN."
              : mode === "password"
                ? "For first-time setup, verify your account with your password."
                : "Verify your account with your password, then choose a new 4-digit MPIN."}
          </p>

          <form onSubmit={handleSubmit} data-testid="login-form">
            <label htmlFor="phone">Mobile number</label>

            <div className="phone-input">
              <span className="country-code">🇵🇰 +92</span>

              <input
                id="phone"
                data-testid="login-phone"
                type="tel"
                inputMode="numeric"
                placeholder="03XXXXXXXXX"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError("");
                }}
                maxLength={11}
                autoComplete="tel-national"
                required
                disabled={isLoading}
              />
            </div>

            {mode === "mpin" ? (
              <>
                <label htmlFor="mpin">4-digit MPIN</label>
                <div className="phone-input">
                  <input
                    id="mpin"
                    data-testid="login-mpin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    placeholder="Enter your MPIN"
                    value={mpin}
                    onChange={(e) => {
                      setMpin(e.target.value.replace(/\D/g, "").slice(0, 4));
                      setError("");
                    }}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />
                </div>
              </>
            ) : (
              <>
                <label htmlFor="password">Account password</label>
                <div className="phone-input">
                  <input
                    id="password"
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

                {mode === "reset" && (
                  <>
                    <label htmlFor="new-mpin">New 4-digit MPIN</label>
                    <div className="phone-input">
                      <input
                        id="new-mpin"
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="Choose a new MPIN"
                        value={mpin}
                        onChange={(e) => {
                          setMpin(e.target.value.replace(/\D/g, "").slice(0, 4));
                          setError("");
                        }}
                        required
                        disabled={loading}
                      />
                    </div>
                    <label htmlFor="confirm-mpin">Confirm new MPIN</label>
                    <div className="phone-input">
                      <input
                        id="confirm-mpin"
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="Re-enter your MPIN"
                        value={confirmMpin}
                        onChange={(e) => {
                          setConfirmMpin(
                            e.target.value.replace(/\D/g, "").slice(0, 4),
                          );
                          setError("");
                        }}
                        required
                        disabled={loading}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {error && (
              <p className="login-error" role="alert" data-testid="login-error">
                {error}
              </p>
            )}

            <button
              className="login-button"
              type="submit"
              disabled={loading}
              data-testid="login-submit"
            >
              {loading
                ? mode === "reset"
                  ? "Resetting MPIN..."
                  : "Signing in..."
                : mode === "reset"
                  ? "Reset MPIN and continue"
                  : mode === "password"
                    ? "Continue with password"
                    : "Login with MPIN"}

              {!loading && <span aria-hidden="true"> →</span>}
            </button>
          </form>

          <p className="login-terms">
            {mode === "mpin" ? (
              <>
                First time here?{" "}
                <button
                  className="auth-mode-link"
                  type="button"
                  onClick={() => {
                    setMode("password");
                    setError("");
                  }}
                >
                  Set up MPIN with password
                </button>
                {" · "}
                <button
                  className="auth-mode-link"
                  type="button"
                  onClick={() => {
                    setMode("reset");
                    setError("");
                  }}
                >
                  Forgot MPIN?
                </button>
              </>
            ) : (
              <button
                className="auth-mode-link"
                type="button"
                onClick={() => {
                  setMode("mpin");
                  setPassword("");
                  setMpin("");
                  setConfirmMpin("");
                  setError("");
                }}
              >
                Back to MPIN login
              </button>
            )}
          </p>

          <p className="login-terms">
            By continuing, you agree to our{" "}
            <Link to="/terms">Terms of Service</Link> and{" "}
            <Link to="/privacy">Privacy Policy</Link>.
          </p>
        </div>

        <footer className="login-footer">Secure banking, made simple.</footer>
      </section>
    </main>
  );
};

export default Login;
