import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import "./Dashboard.css";
import logo from '../Assets/FitNestVLF.svg';

export default function Dashboard() {
  const { logout } = useAuth();

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/authflow";
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleUserIconClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleClickOutside = (event) => {
    if (
      !event.target.closest(".user-circle") &&
      !event.target.closest(".user-dropdown")
    ) {
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  //Dummy data for the charts
  const calorie_BData = [
     { day: "Mon", calories: 400 },
     { day: "Tue", calories: 500 },
     { day: "Wed", calories: 600 },
     { day: "Thu", calories: 550 },
     { day: "Fri", calories: 700 },
     { day: "Sat", calories: 450 },
     { day: "Sun", calories: 500 },
  ];

  const calorie_GData = [
     { day: "Mon", calories: 500 },
     { day: "Tue", calories: 550 },
     { day: "Wed", calories: 460 },
     { day: "Thu", calories: 580 },
     { day: "Fri", calories: 650 },
     { day: "Sat", calories: 450 },
     { day: "Sun", calories: 680 },
  ];

  const stepData = [
     { day: "Mon", steps: 5000 },
     { day: "Tue", steps: 7000 },
     { day: "Wed", steps: 6500 },
     { day: "Thu", steps: 5200 },
     { day: "Fri", steps: 4000 },
     { day: "Sat", steps: 6300 },
     { day: "Sun", steps: 3020 },
  ];

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="logo-section">
        <img src={logo} alt="FitNest Logo" className="logo-image" />
        </div>
        <nav className="nav-links">
          <ul>
            <li>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
                Dashboard
              </NavLink>
            </li>
            <li>Routines</li>
            <li>Workouts</li>
            <li>Cardio</li>
            <li>Diet</li>
            <li>
              <NavLink to="/progress" className={({ isActive }) => isActive ? "active" : ""}>
                Progress
              </NavLink>
            </li>
            <li>Update</li>
            <li>Settings</li>
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        <div className="top-bar">
          <div className="user-circle" onClick={handleUserIconClick}>
            <div className="circle-icon">U</div>
            {isDropdownOpen && (
              <nav className="user-dropdown">
                  <li className="dropdown-item">Account</li>
                  <div className="dropdown-item" onClick={logout}>
                      Sign Out
                  </div>
              </nav>
            )}
          </div>
        </div>

        <div className="dashboard-title">
          <h1>FitNest Dashboard</h1>
        </div>

        <div className="dashboard-content">
          <div className="top-row">
            <div className="box">
              <h2>Calorie Burnt</h2>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={calorie_BData}>
                  <XAxis dataKey="day" stroke="#fff" />
                  <YAxis stroke="#fff" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#333", border: "none" }}
                    labelStyle={{ color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="calories"
                    stroke="#dda8fb"
                    strokeWidth={2}
                    dot={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="box">
              <h2>Calorie Intake</h2>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={calorie_GData}>
                  <XAxis dataKey="day" stroke="#fff" />
                  <YAxis stroke="#fff" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#333", border: "none" }}
                    labelStyle={{ color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="calories"
                    stroke="#dda8fb"
                    strokeWidth={2}
                    dot={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bottom-row">
            <div className="box">
              <h2>Daily Step Count</h2>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={stepData}>
                  <XAxis dataKey="day" stroke="#fff" />
                  <YAxis stroke="#fff" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#333", border: "none" }}
                    labelStyle={{ color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="steps" fill="#dda8fb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="box">
              <h2>User Stats</h2>
              <ul>
                <li>Weight: 70kg</li>
                <li>BMI: 24.5</li>
                <li>Muscle Mass: 40kg</li>
                <li>Calorie Condition: Calorie Surplus</li>
              </ul>
            </div>
            <div className="box">
              <h2>Goal Stats</h2>
              <ul>
                <li>Weight: 65kg</li>
                <li>BMI: 22</li>
                <li>Muscle Mass: 42kg</li>
                <li>Calorie Condition: Calorie Deficit</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

