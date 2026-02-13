// src/components/AdminRoute.jsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function AdminRoute({ children }) {
  const [status, setStatus] = useState("loading");
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    const checkAdmin = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auth/me`, {
          withCredentials: true,
        });
        
        if (!cancelled) {
          if (res.data.role === "admin") {
            setStatus("admin");
          } else {
            setStatus("unauthorized");
          }
        }
      } catch (err) {
        if (!cancelled) setStatus("unauthorized");
      }
    };

    checkAdmin();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  // Show loader instead of white screen
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (status === "unauthorized") {
    return <Navigate to="/login" replace />;
  }

  return children;
}