import './App.css';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from './components/Dashboard/Dashboard';
import Progress from "./components/Progress/Progress";
import SignIn from "./components/SignIn/SignIn";
import Register from "./components/Register/Register";
import AuthFlow from "./components/AuthFlow/AuthFlow";
import Profile from "./components/Profile/Profile";
import DietLanding from "./components/DietLanding/DietLanding";
import MealPlanner from "./components/MealPlanner/MealPlanner";
import ProtectedRoute from "./ProtectedRoute";

// …
<Route path="/progress" element={<Progress />} />

function App() {
  return (
    <><BrowserRouter>
      <Routes>
          {/* Redirect root to landing */}
          <Route path="/" element={<Navigate to="/authflow" replace />} />

          {/* Landing route */}
          <Route path="/authflow" element={<AuthFlow />} />

          {/* Dashboard route */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* Profile route */}
          <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
          />

          {/* Diet route */}
          <Route
              path="/diet"
              element={
                <ProtectedRoute>
                  <DietLanding />
                </ProtectedRoute>
              }
          />

          {/* Weekly Meal Plan */}
          <Route
              path="/diet/planner"
              element={
                <ProtectedRoute>
                  <MealPlanner /> {/* you’ll implement this next */}
                </ProtectedRoute>
              }
          />

          {/* Progress route */}
          <Route 
              path="/progress" 
              element={
                <ProtectedRoute>
                  <Progress />
                </ProtectedRoute>
              } 
          />

          {/* SignIn route */}
          <Route path="/signin" element={<SignIn />} />

          {/* Register Route */}
          <Route path="/register" element={<Register />} />

          {/* Fallback for unknown routes */}
          <Route path="*" element={<h1>404: Page Not Found</h1>} />
      </Routes>
    </BrowserRouter></>
  );
}

export default App;
