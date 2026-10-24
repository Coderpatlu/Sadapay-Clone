import React from "react";
import { useGetBalanceQuery } from "../../../Redux/Api/WalletApi";

const Balance = () => {
  const { data, isLoading, isError, refetch } = useGetBalanceQuery();

  const balance = data?.wallet?.balance ?? 0;

  return (
    <div className="currentBalance" data-testid="dashboard-balance">
      <h6>Current Balance</h6>

      <h1>
        Rs.{" "}
        <span>
          {isLoading
            ? "Loading..."
            : isError
              ? "Unavailable"
              : balance.toLocaleString("en-PK")}
        </span>
      </h1>

      {isError && <button onClick={refetch}>Retry</button>}

      <div className="footer">
        <div className="logo">
          <img src="./masterCard.png" alt="MasterCard" />
        </div>

        <div className="icons">
          <i className="fa-solid fa-arrow-right"></i>
        </div>
      </div>
    </div>
  );
};

export default Balance;
