import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from '../Assets/FitNestV2.svg';
import "./Register.css";

export default function Register({onSwitch}) {
  const [inputs, setInputs] = useState({
    firstname: "",
    lastname:  "",
    username:  "",
    email:     "",
    password:  "",
    repass:    ""
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setInputs(values => ({ ...values, [name]: value }));
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (inputs.password !== inputs.repass) {
      return setError("Passwords do not match");
    }
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: inputs.firstname,
          lastname:  inputs.lastname,
          username:  inputs.username,
          email:     inputs.email,
          password:  inputs.password
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Registration failed");
      onSwitch("signin", true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="register-page">
      <div className="background-box" />
      <div className="register-container">
        <img src={logo} alt="FitNest Logo" className="logo-image" />
        <div className="app-title">
          <h2>FitNest - A Fitness Helper App</h2>
        </div>

        <form className="form-box" onSubmit={handleSubmit}>
          <div className="name-row">
            <input
              type="text"
              name="firstname"
              placeholder="First Name"
              value={inputs.firstname}
              onChange={handleChange}
            />
            <input
              type="text"
              name="lastname"
              placeholder="Last Name"
              value={inputs.lastname}
              onChange={handleChange}
            />
          </div>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={inputs.username}
            onChange={handleChange}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={inputs.email}
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={inputs.password}
            onChange={handleChange}
          />
          <input
            type="password"
            name="repass"
            placeholder="Re-type Password"
            value={inputs.repass}
            onChange={handleChange}
          />
          {error ? <div className="form-error">{error}</div> : null}
          <button type="submit" className="register-button">Register</button>
        </form>

        <div className="signin-redirect">
          Already a user?{" "}
          <span className="signin-link"
            onClick={() => onSwitch("signin", false)}>
            Sign in
          </span>
        </div>
      </div>
    </div>
  );
}

