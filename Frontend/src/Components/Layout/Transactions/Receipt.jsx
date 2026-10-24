import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetReceiptQuery } from "../../../Redux/Api/Trans";
import "../../../Styles/Transactions/Transaction.css";

const Receipt = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useGetReceiptQuery(
    transactionId,
    {
      skip: !transactionId,
    },
  );

  const receipt = data?.receipt;

  const formatPKR = (amount) =>
    new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 2,
    }).format(Number(amount) || 0);

  const formatDate = (date) => {
    if (!date || Number.isNaN(new Date(date).getTime())) {
      return "Not available";
    }

    return new Date(date).toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (!transactionId) {
    return (
      <main className="transaction-page">
        <section className="receipt-card" data-testid="receipt">
          <h1>Receipt unavailable</h1>
          <p className="receipt-error" role="alert">
            Transaction ID is missing.
          </p>
          <button
            className="transaction-primary"
            onClick={() => navigate("/transactions")}
          >
            Back to transactions
          </button>
        </section>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="transaction-page">
        <section className="receipt-card" data-testid="receipt">
          <p>Loading receipt...</p>
        </section>
      </main>
    );
  }

  if (isError || !receipt) {
    return (
      <main className="transaction-page">
        <section className="receipt-card" data-testid="receipt">
          <h1>Receipt unavailable</h1>
          <p className="receipt-error" role="alert">
            {error?.data?.message ||
              error?.error ||
              "Unable to load transaction receipt."}
          </p>

          <button className="transaction-primary" onClick={() => refetch()}>
            Try again
          </button>

          <button
            className="transaction-secondary"
            onClick={() => navigate("/transactions")}
          >
            Back to transactions
          </button>
        </section>
      </main>
    );
  }

  const status = receipt.status || "Unknown";

  return (
    <main className="transaction-page">
      <section className="receipt-card" data-testid="receipt">
        <div className="receipt-brand">
          <span className="receipt-brand-icon">s</span>
          <span>
            sada<span>pay</span>
          </span>
        </div>

        <div className="receipt-heading">
          <div
            data-testid="receipt-status"
            className={
              status.toLowerCase() === "completed"
                ? "receipt-status completed"
                : "receipt-status"
            }
          >
            {status}
          </div>

          <h1>Transaction receipt</h1>
          <p className="receipt-subtitle">Your transaction details</p>
        </div>

        <div className="receipt-amount">
          <span>Amount</span>
          <h2>{formatPKR(receipt.amount)}</h2>
        </div>

        <div className="receipt-details">
          <div className="receipt-row">
            <span>Receipt ID</span>
            <strong data-testid="receipt-id">
              {receipt.receiptId || "Not available"}
            </strong>
          </div>

          <div className="receipt-row">
            <span>Transaction ID</span>
            <strong>{receipt.transactionId || "Not available"}</strong>
          </div>

          <div className="receipt-row">
            <span>Sender</span>
            <strong>{receipt.sender?.name || "Unknown user"}</strong>
          </div>

          {receipt.sender?.phone && (
            <div className="receipt-row">
              <span>Sender phone</span>
              <strong>{receipt.sender.phone}</strong>
            </div>
          )}

          <div className="receipt-row">
            <span>Receiver</span>
            <strong>{receipt.receiver?.name || "Unknown user"}</strong>
          </div>

          {receipt.receiver?.phone && (
            <div className="receipt-row">
              <span>Receiver phone</span>
              <strong>{receipt.receiver.phone}</strong>
            </div>
          )}

          <div className="receipt-row">
            <span>Date and time</span>
            <strong>{formatDate(receipt.date)}</strong>
          </div>

          <div className="receipt-row">
            <span>Currency</span>
            <strong>{receipt.currency || "PKR"}</strong>
          </div>

          {receipt.description && (
            <div className="receipt-row">
              <span>Description</span>
              <strong>{receipt.description}</strong>
            </div>
          )}
        </div>

        <p className="receipt-disclaimer">
          Keep this receipt for your records. Transaction status is provided by
          your account service.
        </p>

        <div className="receipt-actions no-print">
          <button
            className="transaction-primary"
            onClick={() => window.print()}
          >
            Print / Save as PDF
          </button>

          <button
            className="transaction-secondary"
            onClick={() => navigate("/transactions")}
          >
            Back to history
          </button>
        </div>
      </section>
    </main>
  );
};

export default Receipt;
