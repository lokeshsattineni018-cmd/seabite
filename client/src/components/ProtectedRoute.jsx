// src/components/PrivateRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { status } = useAuth(); // "loading" | "authenticated" | "unauthenticated"
  const location = useLocation();

  // While we are still checking the session, render nothing or a small loader
  if (status === "loading") {
    return null; // you can replace this with a spinner component if you want
  }

  if (status === "unauthenticated") {
    // Remember where the user wanted to go
    localStorage.setItem("postLoginRedirect", location.pathname);
    return <Navigate to="/login" replace />;
  }

  // status === "authenticated"
  return children;
}
