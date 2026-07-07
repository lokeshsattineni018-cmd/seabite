import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SeaBiteLoader from "./common/SeaBiteLoader";

export default function SupportRoute({ children }) {
  const { user, status } = useAuth();

  if (status === "loading") {
    return <SeaBiteLoader fullScreen />;
  }

  // Allow if support OR admin
  if (user && (user.role === "support" || user.role === "admin")) {
    return children;
  }

  return <Navigate to="/login" replace />;
}
