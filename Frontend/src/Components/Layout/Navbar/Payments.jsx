import React from "react";

const Payments = () => {
  return (
    <div className="payment">
      <h1>Payments</h1>

      <div className="pay-cont">
        <div className="pay-card">
          <div className="icons"></div>
          <div className="text-area">
            <h2>Mobile top up</h2>
            <p>Instantly top up your Mobile.</p>
          </div>
        </div>

        <div className="pay-card">
          <div className="icons"></div>
          <div className="text-area">
            <h2>Bills &amp; Utilities</h2>
            <p>Pay for your utilities.</p>
          </div>
        </div>

        <div className="pay-card">
          <div className="icons"></div>
          <div className="text-area">
            <h2>Money Requests</h2>
            <p>Review pending money requests.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;
