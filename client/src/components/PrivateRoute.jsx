// src/components/PrivateRoute.jsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app";

export default function PrivateRoute({ children }) {
  const [status, setStatus] = useState("loading"); // "loading" | "authenticated" | "unauthenticated"
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auth/me`, {
          withCredentials: true,
        });
        console.log("PrivateRoute /me success", res.data);
        if (!cancelled) setStatus("authenticated");
      } catch (err) {
        console.log(
          "PrivateRoute /me error",
          err?.response?.status,
          err?.response?.data
        );
        if (!cancelled) setStatus("unauthenticated");
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  if (status === "loading") return null;

  if (status === "unauthenticated") {
    localStorage.setItem("postLoginRedirect", location.pathname);
    return <Navigate to="/login" replace />;
  }

  return children;
}
