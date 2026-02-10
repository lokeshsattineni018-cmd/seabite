// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");

  const fetchMe = async () => {
    console.log("fetchMe called");
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true,
      });
      console.log("fetchMe success", res.data);
      setUser(res.data);
      setStatus("authenticated");
    } catch (err) {
      console.log(
        "fetchMe error",
        err?.response?.status,
        err?.response?.data
      );
      setUser(null);
      setStatus("unauthenticated");
    }
  };

  useEffect(() => {
    console.log("AuthProvider useEffect mount");
    fetchMe();
    window.addEventListener("focus", fetchMe);
    return () => window.removeEventListener("focus", fetchMe);
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, setUser, refreshMe: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
