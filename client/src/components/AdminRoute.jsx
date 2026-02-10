// src/components/AdminRoute.jsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app";

export default function AdminRoute({ children }) {
  const [status, setStatus] = useState("loading"); // "loading" | "admin" | "unauthorized"
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    const checkAdmin = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auth/me`, {
          withCredentials: true,
        });
        console.log("AdminRoute /me", res.data);
        if (!cancelled) {
          if (res.data.role === "admin") {
            setStatus("admin");
          } else {
            setStatus("unauthorized");
          }
        }
      } catch (err) {
        console.log(
          "AdminRoute error",
          err?.response?.status,
          err?.response?.data
        );
        if (!cancelled) setStatus("unauthorized");
      }
    };

    checkAdmin();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  if (status === "loading") return null;

  if (status === "unauthorized") {
    // If not admin, send to home or login
    return <Navigate to="/login" replace />;
  }

  // status === "admin"
  return children;
}
