import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import logo from './FitNestV2.svg';
import "./Register.css";
//<script src="https://www.google.com/recaptcha/api.js" async defer></script>

function onSubmit(token) {
  document.getElementById("demo-form").submit();
}

function Register() {
    const [inputs, setInputs] = useState({});
  
    const handleChange = (event) => {
      const name = event.target.name;
      const value = event.target.value;
      setInputs(values => ({...values, [name]: value}))
    }
  
    const handleSubmit = (event) => {
      event.preventDefault();
      alert(inputs);
    }
  
    return (

      <><img src={logo} alt="FitNest Logo" className="logo-image" />
      <div className="app-title">
        <h2>FitNest - A Fitness Helper App</h2>
        <h4>User Registration</h4>
      </div>
      <div className="registration-form">
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Enter your First name:
                        <input
                            type="text"
                            name="firstname"
                            value={inputs.firstname || ""}
                            onChange={handleChange} />
                    </label>
                    <label>Enter your Last name:
                        <input
                            type="text"
                            name="lastname"
                            value={inputs.lastname || ""}
                            onChange={handleChange} />
                    </label>
                </div>
                <div>
                    <label>Enter your Username:
                        <input
                            type="text"
                            name="username"
                            value={inputs.username || ""}
                            onChange={handleChange} />
                    </label>
                </div>
                <div>
                    <label>Enter your Email:
                        <input
                            type="email"
                            name="email"
                            value={inputs.email || ""}
                            onChange={handleChange} />
                    </label>
                </div>
                <div>
                    <label>Enter your Password:
                        <input
                            type="password"
                            name="pass"
                            value={inputs.pass || ""}
                            onChange={handleChange} />
                    </label>
                </div>
                <div>
                    <label>Confirm your Password:
                        <input
                            type="password"
                            name="repass"
                            value={inputs.repass || ""}
                            onChange={handleChange} />
                    </label>
                </div>
                <div>
                    <input type="submit" 
                    value="Register"/>
                </div>
            </form>
            <div>
                    Already a user?
                    <nav className="signin">
                        <NavLink to="/signin" className={({ isActive }) => isActive ? "active" : ""}>
                            Sign in!
                        </NavLink>
                    </nav>
            </div>
        </div></>
    )
  }

  export default Register;