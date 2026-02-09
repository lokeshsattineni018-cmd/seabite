// src/components/PrivateRoute.jsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app";

export default function PrivateRoute({ children }) {
  const [status, setStatus] = useState("loading"); // "loading" | "authenticated" | "unauthenticated"

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
        if (!cancelled) setStatus("authenticated");
      } catch (err) {
        if (!cancelled) setStatus("unauthenticated");
      }
    };

    checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return null; // or a small loader
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return children;
}
