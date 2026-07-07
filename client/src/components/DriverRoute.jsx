import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SeaBiteLoader from "./common/SeaBiteLoader";

export default function DriverRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <SeaBiteLoader fullScreen />;
  }

  // Allow if driver OR admin
  if (user && (user.role === "driver" || user.role === "admin")) {
    return children;
  }

  return <Navigate to="/login" replace />;
}
