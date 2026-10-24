import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSendMoneyMutation } from "../../../Redux/Api/Trans";
import "../../../Styles/Transactions/Transaction.css";

const formatPKR = (value) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 2,
  }).format(value);

const ReviewTransfer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sendMoney, { isLoading }] = useSendMoneyMutation();
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [mpin, setMpin] = useState("");

  const formData = location.state?.formData;
  const recipient = location.state?.recipient;

  if (!formData || !recipient) {
    return (
      <main className="transaction-page">
        <section className="transaction-card" data-testid="transfer-review">
          <div className="transaction-heading">
            <p className="transaction-eyebrow">TRANSFER</p>
            <h1>Review unavailable</h1>
            <p className="transaction-description">
              Start a new transfer to review the recipient and amount.
            </p>
          </div>
          <button
            className="transaction-primary"
            type="button"
            onClick={() => navigate("/send", { replace: true })}
          >
            Start a transfer
          </button>
        </section>
      </main>
    );
  }

  const amount = Number(formData.amount);

  const handleConfirm = async () => {
    if (!confirmed || !/^\d{4}$/.test(mpin)) {
      setError("Confirm the details and enter your 4-digit MPIN.");
      return;
    }

    setError("");

    try {
      const response = await sendMoney({
        receiverAccount: formData.receiverAccount,
        amount,
        description: formData.description || "",
        mpin,
      }).unwrap();

      const transactionId = response?.transaction?.transactionId;

      if (!transactionId) {
        setError("The transfer completed, but no receipt ID was returned.");
        return;
      }

      navigate(`/receipt/${encodeURIComponent(transactionId)}`, {
        replace: true,
      });
    } catch (transferError) {
      setError(
        transferError?.data?.message ||
          transferError?.error ||
          "Unable to process the transfer. Please try again.",
      );
    }
  };

  return (
    <main className="transaction-page">
      <section className="transaction-card" data-testid="transfer-review">
        <div className="transaction-brand">
          <span className="transaction-brand-icon">s</span>
          <span>
            sada<span>pay</span>
          </span>
        </div>

        <div className="transaction-heading">
          <p className="transaction-eyebrow">FINAL STEP</p>
          <h1>Review transfer</h1>
          <p className="transaction-description">
            Confirm the recipient and amount before the payment is sent.
          </p>
        </div>

        <div className="review-amount-card">
          <span>You&apos;re sending</span>
          <h2>{formatPKR(amount)}</h2>
          <span>Pakistani Rupees</span>
        </div>

        <div className="review-details">
          <div className="transaction-info">
            <span>Recipient</span>
            <strong>{recipient.fullName}</strong>
          </div>

          <div className="transaction-info">
            <span>Recipient IBAN</span>
            <strong>{recipient.accountNumber}</strong>
          </div>

          {formData.description && (
            <div className="transaction-info">
              <span>Payment note</span>
              <strong>{formData.description}</strong>
            </div>
          )}

          <div className="transaction-info">
            <span>Transfer fee</span>
            <strong>{formatPKR(0)}</strong>
          </div>

          <div className="transaction-info review-total">
            <span>Total debit</span>
            <strong>{formatPKR(amount)}</strong>
          </div>
        </div>

        <label className="review-confirm">
          <input
            type="checkbox"
            data-testid="transfer-confirm"
            checked={confirmed}
            onChange={(event) => {
              setConfirmed(event.target.checked);
              setError("");
            }}
            disabled={isLoading}
          />
          <span>I have verified the recipient and transfer amount.</span>
        </label>

        <label className="review-mpin-label" htmlFor="transfer-mpin">
          Enter MPIN to authorize this transfer
        </label>
        <input
          className="review-mpin-input"
          id="transfer-mpin"
          data-testid="transfer-mpin"
          type="password"
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          autoComplete="current-password"
          value={mpin}
          onChange={(event) => {
            setMpin(event.target.value.replace(/\D/g, "").slice(0, 4));
            setError("");
          }}
          disabled={isLoading}
        />

        {error && (
          <p className="transaction-error" role="alert" data-testid="transfer-error">
            {error}
          </p>
        )}

        <button
          className="transaction-primary"
          type="button"
          onClick={handleConfirm}
          disabled={isLoading || !confirmed || !/^\d{4}$/.test(mpin)}
          data-testid="transfer-submit"
        >
          {isLoading ? "Processing transfer..." : "Confirm and send"}
        </button>

        <button
          className="transaction-secondary"
          type="button"
          onClick={() =>
            navigate("/send", {
              state: { formData },
            })
          }
          disabled={isLoading}
        >
          Go back and edit
        </button>

        <p className="transaction-security">
          Transfers may not be reversible. Verify the recipient before
          confirming.
        </p>
      </section>
    </main>
  );
};

export default ReviewTransfer;
