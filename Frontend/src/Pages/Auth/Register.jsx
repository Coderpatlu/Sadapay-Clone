import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

import "../../Styles/Auth/Login.css";
import { useRegisterMutation } from "../../Redux/Api/AuthApi";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const [register, { isLoading }] = useRegisterMutation();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanPhone = formData.phone.replace(/\D/g, "");

    // Validate full name
    if (!formData.fullName.trim()) {
      const message = "Full name is required.";
      setError(message);
      toast.error(message);
      return;
    }

    // Validate Pakistani mobile number
    if (!/^03\d{9}$/.test(cleanPhone)) {
      const message = "Enter a valid Pakistani mobile number.";
      setError(message);
      toast.error(message);
      return;
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      const message = "Enter a valid email address.";
      setError(message);
      toast.error(message);
      return;
    }

    // Validate password
    if (formData.password.length < 8) {
      const message = "Password must contain at least 8 characters.";
      setError(message);
      toast.error(message);
      return;
    }

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        phone: cleanPhone,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      console.log("REGISTER REQUEST:", {
        ...payload,
        password: "[REDACTED]",
      });

      const data = await register(payload).unwrap();

      console.log("REGISTER SUCCESS:", data);

      toast.success(data?.message || "Account created successfully!");

      setFormData({
        fullName: "",
        phone: "",
        email: "",
        password: "",
      });

      navigate("/login");
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      console.error("ERROR STATUS:", err?.status);
      console.error("ERROR DATA:", err?.data);

      let message;

      if (err?.status === "FETCH_ERROR") {
        message = "Unable to connect to the server. Check your connection.";
      } else if (typeof err?.data === "string") {
        message =
          err.data.match(/Error: ([^<]+)/)?.[1] ||
          "Registration failed. Please try again.";
      } else {
        message =
          err?.data?.message ||
          err?.error ||
          "Registration failed. Please try again.";
      }

      setError(message);
      toast.error(message);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card register-card">
        <div className="login-brand">
          <div className="brand-icon">s</div>

          <span>
            sada<span className="brand-light">pay</span>
          </span>
        </div>

        <div className="login-content">
          <p className="login-eyebrow">CREATE YOUR ACCOUNT</p>

          <h1>Let's get started.</h1>

          <p className="login-description">
            Create your account to get started with your digital wallet.
          </p>

          <form onSubmit={handleSubmit} data-testid="signup-form">
            <label htmlFor="fullName">Full name</label>

            <div className="phone-input">
              <input
                id="fullName"
                data-testid="signup-full-name"
                name="fullName"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                autoComplete="name"
                required
                disabled={isLoading}
              />
            </div>

            <label htmlFor="phone">Mobile number</label>

            <div className="phone-input">
              <span className="country-code">🇵🇰 +92</span>

              <input
                id="phone"
                data-testid="signup-phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                placeholder="03XXXXXXXXX"
                value={formData.phone}
                onChange={handleChange}
                maxLength={11}
                autoComplete="tel-national"
                required
                disabled={isLoading}
              />
            </div>

            <label htmlFor="email">Email address</label>

            <div className="phone-input">
              <input
                id="email"
                data-testid="signup-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
                disabled={isLoading}
              />
            </div>

            <label htmlFor="password">Password</label>

            <div className="phone-input">
              <input
                id="password"
                data-testid="signup-password"
                name="password"
                type="password"
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={handleChange}
                minLength={8}
                autoComplete="new-password"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <p className="login-error" role="alert" data-testid="signup-error">
                {error}
              </p>
            )}

            <button
              className="login-button"
              type="submit"
              disabled={isLoading}
              data-testid="signup-submit"
            >
              {isLoading ? "Creating account..." : "Create account"}

              {!isLoading && <span aria-hidden="true"> →</span>}
            </button>
          </form>

          <p className="login-terms">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>

        <footer className="login-footer">Secure banking, made simple.</footer>
      </section>
    </main>
  );
};

export default Register;
