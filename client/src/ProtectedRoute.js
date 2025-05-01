// ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("fitnest_token");
  return token ? children : <Navigate to="/authflow" replace />;
}
