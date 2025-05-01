// client/src/components/AuthFlow/AuthFlow.js
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import SignIn    from "../SignIn/SignIn";
import Register  from "../Register/Register";
import logo      from "../Assets/FitNestV2.svg";
import landingback from "../Assets/fit_back.jpg";
import formback  from "../Assets/fit_back.jpg";
import "./AuthFlow.css";

export default function AuthFlow() {
  const location = useLocation();

  const initialView = location.state?.view || "landing";

  const [view, setView] = useState(initialView);

  const [regSuccess, setRegSuccess] = useState(false);

  const handleSwitch = (targetView, showSuccess = false) => {
    setView(targetView);
    setRegSuccess(showSuccess);
  };

  useEffect(() => {
    if (location.state) {
      window.history.replaceState({}, document.title);
    }
  }, []);

  // Helper to render each background
  const backStyle = (img, extraFilter = "") => ({
    backgroundImage: `url(${img})`,
    filter: `brightness(0.4) blur(6px) ${extraFilter}`,
  });

  return (
    <div className="authflow-page">
      {/* Landing background (less blur) */}
      <div
        className={`background-box ${view === "landing" ? "visible" : ""}`}
        style={backStyle(landingback, "brightness(0.6)")}
      />

      {/* SignIn background */}
      <div
        className={`background-box ${view === "signin" ? "visible" : ""}`}
        style={backStyle(formback)}
      />

      {/* Register background */}
      <div
        className={`background-box ${view === "register" ? "visible" : ""}`}
        style={backStyle(formback)}
      />

      {/* Landing View */}
      {view === "landing" && (
        <div className="panel landing-panel">
          <img src={logo} alt="FitNest Logo" className="logo-large" />
          <p className="tagline">Fitness App for your core and more</p>
          <div className="cta-buttons">
            <button className="cta" onClick={() => setView("signin")}>
              Sign In
            </button>
            <button className="cta" onClick={() => setView("register")}>
              Register
            </button>
          </div>
        </div>
      )}

      {/* Sign In View */}
      {view === "signin" && (
        <div className="panel signin-panel">
          {regSuccess && (
            <div className="success-mssg">
              Registration successful. Please sign in.
            </div>
          )}
          <SignIn onSwitch={handleSwitch} />
        </div>
      )}

      {/* Register View */}
      {view === "register" && (
        <div className="panel register-panel">
          <Register onSwitch={handleSwitch} />
        </div>
      )}
    </div>
  );
}
