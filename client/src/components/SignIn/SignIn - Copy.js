import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
//import "./SignIn.css";
import logo from './FitNestV2.svg';
import "./SignIn.css";



function SignIn() {
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
        <h4>User Sign In</h4>
      </div>
      <div className="signin-form">
            <form onSubmit={handleSubmit}>
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
                    <label>Enter your Password:
                        <input
                            type="password"
                            name="pass"
                            value={inputs.pass || ""}
                            onChange={handleChange} />
                    </label>
                </div>
                <div>
                    <input type="submit" 
                    value="Sign In"/>
                </div>
            </form>
            <div>
                    Not a user? 
                    <nav className="register">
                      <NavLink to="/register" className={({ isActive }) => isActive ? "active" : ""}>
                        Register here!
                      </NavLink>
                    </nav>
            </div>
        </div></>
    )
  }
  

  export default SignIn;