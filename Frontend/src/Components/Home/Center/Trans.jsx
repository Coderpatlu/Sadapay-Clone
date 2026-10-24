import React from "react";

import "../../../Styles/Home/Home.css";

const Trans = ({ transactions = [], limit, userId }) => {
  const visibleTransactions =
    limit == null ? transactions : transactions.slice(0, limit);
  const loggedInUserId = userId?.toString() || null;

  const formatAmount = (amount) =>
    Math.abs(Number(amount) || 0).toLocaleString("en-PK");

  const formatTime = (date) => {
    if (!date) return "--";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "--";

    return parsedDate.toLocaleTimeString("en-PK", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getUserId = (user) => {
    if (!user) return null;

    if (typeof user === "string") return user;

    return user._id?.toString() || user.id?.toString() || null;
  };

  const getUserName = (user) => {
    if (!user || typeof user !== "object") {
      return "Unknown user";
    }

    return user.fullName || user.name || "Unknown user";
  };

  if (!visibleTransactions.length) {
    return <p className="transaction-empty">No transactions yet.</p>;
  }

  return (
    <div className="content-area">
      {visibleTransactions.map((transaction, index) => {
        const senderId = getUserId(transaction.sender);
        const receiverId = getUserId(transaction.receiver);
        let direction = null;

        if (loggedInUserId && receiverId === loggedInUserId) {
          direction = "income";
        } else if (loggedInUserId && senderId === loggedInUserId) {
          direction = "outcome";
        } else if (!loggedInUserId) {
          const type = transaction.type?.toUpperCase();

          if (["INCOME", "RECEIVE", "RECEIVER"].includes(type)) {
            direction = "income";
          } else if (type === "OUTCOME") {
            direction = "outcome";
          }
        }

        const isIncome = direction === "income";
        const isOutcome = direction === "outcome";
        const directionClass = isIncome
          ? "ractangular-income"
          : isOutcome
            ? "ractangular-outcome"
            : "ractangular-unknown";
        const directionLabel = isIncome
          ? "Money received"
          : isOutcome
            ? "Money sent"
            : "Direction unavailable";
        const otherParty = isIncome
          ? getUserName(transaction.sender)
          : getUserName(transaction.receiver);

        return (
          <div
            className={directionClass}
            key={transaction._id || transaction.transactionId || index}
          >
            <div className="icon" aria-hidden="true" title={directionLabel}>
              {isIncome ? "↓" : isOutcome ? "↑" : "?"}
            </div>

            <div className="text-area">
              <h1>
                {isIncome
                  ? `${otherParty}`
                  : isOutcome
                    ? `${otherParty}`
                    : "Transaction"}
              </h1>

              <span className="time">{formatTime(transaction.createdAt)}</span>
            </div>

            <div className="pricing">
              <h1>
                {isIncome ? "+" : isOutcome ? "-" : ""}
                Rs. <span>{formatAmount(transaction.amount)}</span>
              </h1>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Trans;
