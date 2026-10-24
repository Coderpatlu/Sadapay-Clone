import React from "react";
import { Link } from "react-router-dom";

const Actions = () => {
  return (
    <div className="actions">
      <Link to="/load-money" className="loadMoney" data-testid="dashboard-load-money">
        <div className="icons">
          <i className="fa-solid fa-arrow-down"></i>
        </div>
        <h1>
          Load <br />
          Money
        </h1>
      </Link>

      <Link to="/send" className="sendMoney" data-testid="dashboard-send-money">
        <div className="icons">
          <i className="fa-solid fa-arrow-up"></i>
        </div>
        <h1>
          Send <br />
          Money
        </h1>
      </Link>
    </div>
  );
};

export default Actions;
