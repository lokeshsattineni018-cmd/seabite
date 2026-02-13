// src/components/PrivateRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, status } = useAuth(); // ✅ Use AuthContext instead of duplicate API calls
  const location = useLocation();

  // ✅ Show loader instead of white screen
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-blue-500 font-medium animate-pulse mt-4">Checking authentication...</p>
      </div>
    );
  }

  // ✅ Redirect to login if not authenticated
  if (status === "unauthenticated" || !user) {
    localStorage.setItem("postLoginRedirect", location.pathname);
    return <Navigate to="/login" replace />;
  }

  // ✅ User is authenticated, show the protected page
  return children;
}