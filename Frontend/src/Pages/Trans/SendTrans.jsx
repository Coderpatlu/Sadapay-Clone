import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLookupRecipientMutation } from "../../Redux/Api/Trans";
import "../../Styles/Trans/Transactions.css";

const SendTrans = () => {
  const location = useLocation();
  const [formData, setFormData] = useState(
    location.state?.formData || {
      receiverAccount: "",
      amount: "",
      description: "",
    },
  );
  const [error, setError] = useState("");
  const [lookupRecipient, { isLoading }] = useLookupRecipientMutation();
  const navigate = useNavigate();

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

    const amount = Number(formData.amount);

    if (!Number.isFinite(amount) || amount < 100) {
      setError("The minimum transfer amount is PKR 100.");
      return;
    }

    try {
      const { recipient } = await lookupRecipient(
        formData.receiverAccount.trim(),
      ).unwrap();

      navigate("/review", {
        state: {
          formData: {
            receiverAccount: formData.receiverAccount.trim(),
            amount,
            description: formData.description.trim(),
          },
          recipient,
        },
      });
    } catch (err) {
      setError(
        err?.data?.message ||
          err?.error ||
          "Unable to find that recipient. Check the account number or IBAN.",
      );
    }
  };

  return (
    <div className="sendTrans">
      <h2>Send Money</h2>

      <form onSubmit={handleSubmit} data-testid="send-form">
        <label htmlFor="receiverAccount">Receiver phone number or IBAN</label>

        <input
          id="receiverAccount"
          data-testid="send-recipient"
          name="receiverAccount"
          type="text"
          value={formData.receiverAccount}
          onChange={handleChange}
          placeholder="Enter phone number or IBAN"
          autoComplete="off"
          required
        />

        <label htmlFor="amount">Amount (PKR)</label>

        <input
          id="amount"
          data-testid="send-amount"
          name="amount"
          type="number"
          value={formData.amount}
          onChange={handleChange}
          placeholder="Enter amount"
          min="100"
          step="0.01"
          required
        />

        <label htmlFor="description">Description</label>

        <textarea
          id="description"
          data-testid="send-description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="e.g. Test transfer"
        />

        {error && (
          <p className="error" role="alert" data-testid="send-error">
            {error}
          </p>
        )}

        <button type="submit" disabled={isLoading} data-testid="send-submit">
          {isLoading ? "Finding recipient..." : "Review transfer"}
        </button>
      </form>
    </div>
  );
};

export default SendTrans;
