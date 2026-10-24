import React from "react";
import toast from "react-hot-toast";
import "../Styles/Home/Home.css";

import Balance from "../Components/Home/Header/Balance";
import Actions from "../Components/Home/Header/Actions";
import History from "../Components/Home/Center/History";
import {
  useCompleteHomeTourMutation,
  useGetMeQuery,
} from "../Redux/Api/AuthApi";


const Home = () => {
  const { data } = useGetMeQuery();
  const [completeHomeTour, { isLoading }] = useCompleteHomeTourMutation();

  const finishTour = async () => {
    try {
      await completeHomeTour().unwrap();
      toast.success("You're all set. Welcome to SadaPay!");
    } catch (error) {
      toast.error(
        error?.data?.message || "Unable to finish the welcome tour.",
      );
    }
  };

  return (
    <main data-testid="dashboard">
      {data?.user && !data.user.homeTourCompleted && (
        <section className="home-onboarding" aria-labelledby="home-onboarding-title">
          <p className="home-onboarding-eyebrow">WELCOME TO SADAPAY</p>
          <h1 id="home-onboarding-title">
            Your account is ready, {data.user.fullName}.
          </h1>
          <p>
            Check your balance, load money using your account details, send
            payments, and keep track of everything in your transaction history.
          </p>
          <button
            type="button"
            onClick={finishTour}
            disabled={isLoading}
          >
            {isLoading ? "Finishing..." : "Start using SadaPay"}
          </button>
        </section>
      )}
      <section className="header">
        <Balance />
        <Actions />
      </section>

      <section className="center">
        <History limit={3} />
      </section>
    </main>
  );
};

export default Home;
