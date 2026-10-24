import React from "react";
import { useGetTransactionsQuery } from "../../../Redux/Api/Trans";
import { useGetMeQuery } from "../../../Redux/Api/AuthApi";
import Trans from "./Trans";
import "../../../Styles/Home/Home.css";

const History = () => {
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetTransactionsQuery();
  const { data: currentUserData } = useGetMeQuery();

  const transactions = data?.transactions || [];
  const userId = currentUserData?.user?._id || currentUserData?.user?.id;

  const formatDate = (createdAt) => {
    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
      return "Unknown date";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = formatDate(transaction.createdAt);

    if (!groups[date]) {
      groups[date] = [];
    }

    groups[date].push(transaction);

    return groups;
  }, {});

  const getTransactionImpact = (transaction) => {
    const amount = Number(transaction.amount) || 0;
    const senderId =
      typeof transaction.sender === "string"
        ? transaction.sender
        : transaction.sender?._id || transaction.sender?.id;
    const receiverId =
      typeof transaction.receiver === "string"
        ? transaction.receiver
        : transaction.receiver?._id || transaction.receiver?.id;

    if (userId && receiverId?.toString() === userId.toString()) {
      return amount;
    }

    if (userId && senderId?.toString() === userId.toString()) {
      return -amount;
    }

    if (!userId) {
      const type = transaction.type?.toUpperCase();

      if (["INCOME", "RECEIVE", "RECEIVER"].includes(type)) return amount;
      if (type === "OUTCOME") return -amount;
    }

    return null;
  };

  return (
    <main className="history-page">
      <header className="history-title">
        <h1>Transactions History</h1>
        <p>All your money movements in one place.</p>
      </header>

      {isLoading && <p>Loading transactions...</p>}

      {isError && (
        <div>
          <p className="transaction-error" role="alert">
            {error?.data?.message ||
              error?.error ||
              "Unable to load transactions."}
          </p>

          <button type="button" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "Retrying..." : "Try again"}
          </button>
        </div>
      )}

      {!isLoading && !isError && transactions.length === 0 && (
        <p className="transaction-empty">No transactions found.</p>
      )}

      {!isLoading &&
        !isError &&
        Object.entries(groupedTransactions).map(([date, items]) => {
          const impacts = items
            .map(getTransactionImpact)
            .filter((impact) => impact !== null);
          const netAmount = impacts.reduce((total, impact) => total + impact, 0);

          return (
            <section className="history-group" key={date}>
              <div className="center-header">
                <div className="center-heading">
                  <h2>{date}</h2>
                </div>

                {impacts.length > 0 && (
                  <p
                    className={
                      netAmount >= 0 ? "history-positive" : "history-negative"
                    }
                  >
                    {netAmount >= 0 ? "+" : "-"} Rs.{" "}
                    {Math.abs(netAmount).toLocaleString("en-PK")}
                  </p>
                )}
              </div>

              <Trans transactions={items} userId={userId} />
            </section>
          );
        })}
    </main>
  );
};

export default History;
