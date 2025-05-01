// client/src/pages/SignIn.js
import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import logo from "../Assets/FitNestV2.svg";
import "./SignIn.css";

export default function SignIn({onSwitch}) {
  const [inputs, setInputs] = useState({
    usernameOrEmail: "",
    password: ""
  });
  
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  const [hcaptchaToken, setHcaptchaToken] = useState("");
  
  useEffect(() => {
    setInputs({ usernameOrEmail: "", password: ""});
    setError("");
  },[]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hcaptchaToken) {
      return setError("Please complete the captcha.");
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernameOrEmail: inputs.usernameOrEmail,
          password: inputs.password,
          hcaptchaToken: hcaptchaToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Login failed");
      //Store token
      localStorage.setItem("fitnest_token", data.token);
      //Optionally store user info
      localStorage.setItem("fitnest_user", JSON.stringify(data.user));
      //Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="signin-page">
      <div className="background-box" />
      <div className="signin-container">
        <img src={logo} alt="FitNest Logo" className="logo-image" />
        <div className="app-title">
          <h2>FitNest - A Fitness Helper App</h2>
        </div>

        <form className="form-box" onSubmit={handleSubmit}>
          <input
            type="text"
            name="usernameOrEmail"
            placeholder="Username or Email"
            value={inputs.usernameOrEmail}
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={inputs.password}
            onChange={handleChange}
          />

          {/* hCaptcha */}
          <div className="captcha">
            <HCaptcha
              sitekey={process.env.REACT_APP_HCAPTCHA_SITE_KEY}
              onVerify={(token) => setHcaptchaToken(token)}
              size="normal"
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="signin-button">
            Sign In
          </button>
        </form>

        <div className="redirect-text">
          Not a user?{" "}
          <span className="redirect-link"
            onClick={() => onSwitch("register", false)}>
            Register here
          </span>
        </div>
      </div>
    </div>
  );
}
