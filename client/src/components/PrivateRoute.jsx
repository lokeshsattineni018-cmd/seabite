import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SeaBiteLoader from "./common/SeaBiteLoader";

export default function PrivateRoute({ children }) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <SeaBiteLoader fullScreen />;
  }

  if (status === "unauthenticated" || !user) {
    localStorage.setItem("postLoginRedirect", location.pathname);
    return <Navigate to="/login" replace />;
  }

  return children;
}