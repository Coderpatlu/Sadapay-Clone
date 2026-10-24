import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetWalletQuery,
  useCreateWalletMutation,
} from "../../Redux/Api/WalletApi";
import { useCompleteOnboardingMutation } from "../../Redux/Api/AuthApi";
import toast from "react-hot-toast";
import "../../Styles/Auth/Login.css";

const GetWallet = ({ onboarding = false }) => {
  const navigate = useNavigate();

  const [showBalance, setShowBalance] = useState(true);
  const [copied, setCopied] = useState("");
  const [walletReady, setWalletReady] = useState(false);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetWalletQuery();

  const [createWallet, { isLoading: isCreating }] = useCreateWalletMutation();
  const [
    completeOnboarding,
    { isLoading: isCompletingOnboarding },
  ] = useCompleteOnboardingMutation();

  const wallet = data?.wallet;

  // Automatically create wallet if one does not exist
  useEffect(() => {
    const initializeWallet = async () => {
      if (isLoading || isFetching || walletReady) return;

      if (data?.success && data?.wallet) {
        setWalletReady(true);
        return;
      }

      // Only create when GET confirms that wallet doesn't exist
      if (isError && error?.status === 404) {
        try {
          await createWallet().unwrap();
          await refetch();
          setWalletReady(true);
          toast.success("Wallet created successfully!");
        } catch (createError) {
          // Another request may have created the wallet already
          if (createError?.status === 409) {
            await refetch();
            setWalletReady(true);
          } else {
            toast.error(
              createError?.data?.message || "Unable to create wallet.",
            );
          }
        }
      }
    };

    initializeWallet();
  }, [
    data,
    isLoading,
    isFetching,
    isError,
    error,
    walletReady,
    createWallet,
    refetch,
  ]);

  const formatBalance = (balance) =>
    new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 2,
    }).format(Number(balance || 0));

  const copyToClipboard = async (value, label) => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(label);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      toast.error("Unable to copy. Please copy manually.");
    }
  };

  const handleContinueHome = async () => {
    try {
      await completeOnboarding().unwrap();
      toast.success("Wallet setup complete. Welcome home!");
      navigate("/", { replace: true });
    } catch (completionError) {
      const message =
        completionError?.data?.message ||
        (completionError?.status === "PARSING_ERROR"
          ? "The backend returned an invalid response. Restart the backend server, then try again."
          : completionError?.status === "FETCH_ERROR"
            ? "Unable to reach the backend. Check that the backend server is running."
            : completionError?.error) ||
        "Unable to finish setup. Please try again.";

      toast.error(
        message,
      );
    }
  };

  // Initial loading or wallet creation
  if (isLoading || isCreating || (!wallet && isFetching)) {
    return (
      <main className="login-page">
        <section className="login-card wallet-card" data-testid="wallet-page">
          <p className="login-description">
            {isCreating
              ? "Setting up your wallet..."
              : "Loading your wallet..."}
          </p>
        </section>
      </main>
    );
  }

  // Show an error if wallet cannot be fetched or created
  if (isError && error?.status !== 404 && !wallet) {
    return (
      <main className="login-page">
        <section className="login-card wallet-card" data-testid="wallet-page">
          <div className="login-brand">
            <div className="brand-icon">s</div>
            <span>
              sada<span className="brand-light">pay</span>
            </span>
          </div>

          <div className="wallet-error" role="alert">
            {error?.data?.message ||
              error?.error ||
              "Unable to load your wallet."}
          </div>

          <button
            className="login-button"
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? "Retrying..." : "Try again"}
          </button>

          <button
            className="profile-cancel"
            type="button"
            onClick={() => navigate("/")}
          >
            Back to dashboard
          </button>
        </section>
      </main>
    );
  }

  // Wait until automatic creation/fetching finishes
  if (!wallet) {
    return (
      <main className="login-page">
        <section className="login-card wallet-card" data-testid="wallet-page">
          <p className="login-description">Preparing your wallet...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="login-page">
      <section className="login-card wallet-card" data-testid="wallet-page">
        <div className="login-brand">
          <div className="brand-icon">s</div>
          <span>
            sada<span className="brand-light">pay</span>
          </span>
        </div>

        <div className="login-content">
          <p className="login-eyebrow">
            {onboarding ? "STEP 2 OF 2 · WALLET CHECK" : "LOAD MONEY"}
          </p>
          <h1>{onboarding ? "Your wallet is ready." : "Top up your wallet."}</h1>

          <p className="login-description">
            {onboarding
              ? "Your account number and IBAN are ready. Save or copy them, then continue to your home screen."
              : "Transfer money using your account number or IBAN. Copy either detail below to use it in your bank transfer."}
          </p>

          <div className="wallet-balance" data-testid="wallet-balance">
            <div className="wallet-balance-header">
              <span>Available balance</span>

              <button
                type="button"
                className="balance-toggle"
                onClick={() => setShowBalance((previous) => !previous)}
              >
                {showBalance ? "Hide" : "Show"}
              </button>
            </div>

            <h2>
              {showBalance ? formatBalance(wallet.balance) : "PKR ••••••"}
            </h2>

            <span className="wallet-status" data-testid="wallet-active">
              <span className="wallet-status-dot" />
              Wallet active
            </span>
          </div>

          <div className="wallet-details">
            <div className="wallet-detail-row">
              <div>
                <span className="wallet-detail-label">Account number</span>
                <p>{wallet.accountNumber || "Not available"}</p>
              </div>

              {wallet.accountNumber && (
                <button
                  type="button"
                  className="copy-button"
                  onClick={() =>
                    copyToClipboard(wallet.accountNumber, "Account number")
                  }
                >
                  {copied === "Account number" ? "Copied" : "Copy"}
                </button>
              )}
            </div>

            <div className="wallet-detail-row">
              <div>
                <span className="wallet-detail-label">IBAN</span>
                <p className="wallet-iban">{wallet.iban || "Not available"}</p>
              </div>

              {wallet.iban && (
                <button
                  type="button"
                  className="copy-button"
                  onClick={() => copyToClipboard(wallet.iban, "IBAN")}
                >
                  {copied === "IBAN" ? "Copied" : "Copy"}
                </button>
              )}
            </div>
          </div>

          {onboarding ? (
            <button
              className="login-button"
              type="button"
              onClick={handleContinueHome}
              disabled={isCompletingOnboarding}
            >
              {isCompletingOnboarding ? "Finishing setup..." : "Go to Home"}
              {!isCompletingOnboarding && (
                <span aria-hidden="true"> →</span>
              )}
            </button>
          ) : (
            <>
              <button
                className="login-button"
                type="button"
                onClick={() => navigate("/transactions")}
              >
                View transactions →
              </button>

              <button
                className="profile-cancel"
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                {isFetching ? "Refreshing..." : "Refresh wallet"}
              </button>
            </>
          )}
        </div>

        <footer className="login-footer">Your money, your control.</footer>
      </section>
    </main>
  );
};

export default GetWallet;
