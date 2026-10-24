import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useUpdateUserMutation } from "../../Redux/Api/AuthApi";
import "../../Styles/Auth/Login.css";

const UpdatePro = ({ onboarding = false }) => {
  const navigate = useNavigate();

  const [updateUser, { isLoading }] = useUpdateUserMutation();

  const [userId, setUserId] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [error, setError] = useState("");
  const [fetching, setFetching] = useState(true);

  // Load logged-in user's profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setError("");

        const response = await fetch("/api/user/me", {
          method: "GET",
          credentials: "include",
        });

        const contentType = response.headers.get("content-type");

        if (!contentType?.includes("application/json")) {
          throw new Error("Invalid server response. Check your API route.");
        }

        const data = await response.json();

        if (!response.ok || data?.success === false) {
          throw new Error(data?.message || "Unable to load profile.");
        }

        const user = data?.user;

        if (!user) {
          throw new Error("User profile not found.");
        }

        const id = user._id || user.id;

        if (!id) {
          throw new Error("User ID is missing from the profile response.");
        }

        setUserId(id);

        setFormData({
          fullName: user.fullName || "",
          email: user.email || "",
          phone: user.phone || "",
        });
      } catch (err) {
        setError(err?.message || "Unable to load your profile.");
      } finally {
        setFetching(false);
      }
    };

    loadProfile();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  // Save updated profile
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanPhone = formData.phone.replace(/\D/g, "");
    const fullName = formData.fullName.trim();
    const email = formData.email.trim().toLowerCase();

    if (!userId) {
      setError("User ID is missing. Please log in again.");
      return;
    }

    if (!fullName) {
      setError("Full name is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    if (!/^03\d{9}$/.test(cleanPhone)) {
      setError("Enter a valid Pakistani mobile number (03XXXXXXXXX).");
      return;
    }

    try {
      const result = await updateUser({
        userId,
        fullName,
        email,
        phone: cleanPhone,
      }).unwrap();

      const updatedUser = result?.user;

      if (updatedUser) {
        setFormData({
          fullName: updatedUser.fullName || fullName,
          email: updatedUser.email || email,
          phone: updatedUser.phone || cleanPhone,
        });
      } else {
        setFormData({
          fullName,
          email,
          phone: cleanPhone,
        });
      }

      toast.success(result?.message || "Profile updated successfully!");
      navigate(onboarding ? "/onboarding/wallet" : "/");
    } catch (err) {
      const message =
        err?.data?.message || err?.message || "Profile update failed.";

      setError(message);
      toast.error(message);
    }
  };

  // Loading state
  if (fetching) {
    return (
      <main className="login-page">
        <section className="login-card">
          <p className="login-description">Loading your profile...</p>
        </section>
      </main>
    );
  }

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
          <p className="login-eyebrow">
            {onboarding ? "STEP 1 OF 2 · PROFILE CHECK" : "ACCOUNT SETTINGS"}
          </p>

          <h1>{onboarding ? "Confirm your details." : "Update profile."}</h1>

          <p className="login-description">
            Review your details. Change anything that needs updating, or
            continue with your current information.
          </p>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <label htmlFor="fullName">Full name</label>

            <div className="phone-input">
              <input
                id="fullName"
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

            <label htmlFor="email">Email address</label>

            <div className="phone-input">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
                disabled={isLoading}
              />
            </div>

            <label htmlFor="phone">Mobile number</label>

            <div className="phone-input">
              <span className="country-code">🇵🇰 +92</span>

              <input
                id="phone"
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

            <button
              className="login-button"
              type="submit"
              disabled={isLoading || !userId}
            >
              {isLoading ? "Saving changes..." : "Save changes"}
              {!isLoading && <span aria-hidden="true"> →</span>}
            </button>

            <button
              className="profile-cancel"
              type="button"
              onClick={() =>
                navigate(onboarding ? "/onboarding/wallet" : "/")
              }
              disabled={isLoading}
            >
              Continue without changes →
            </button>
          </form>
        </div>

        <footer className="login-footer">Secure banking, made simple.</footer>
      </section>
    </main>
  );
};

export default UpdatePro;
