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
    console.log("🔍 fetchMe: Checking authentication...");
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true,
        timeout: 10000, // 10 second timeout
      });
      
      console.log("✅ fetchMe: User authenticated", res.data);
      setUser(res.data);
      setStatus("authenticated");
      return res.data; // Return user data for chaining
    } catch (err) {
      console.log("❌ fetchMe: Authentication failed");
      console.log("Status:", err?.response?.status);
      console.log("Error:", err?.response?.data?.message || err.message);
      console.log("Cookies:", document.cookie || "No cookies found");
      
      setUser(null);
      setStatus("unauthenticated");
      return null;
    }
  };

  useEffect(() => {
    console.log("🚀 AuthProvider: Mounted - checking initial auth");
    fetchMe();
    
    // Refresh auth when user returns to tab/window
    const handleFocus = () => {
      console.log("👀 AuthProvider: Window focused - refreshing auth");
      fetchMe();
    };
    
    // Refresh auth when user comes back online
    const handleOnline = () => {
      console.log("🌐 AuthProvider: Back online - refreshing auth");
      fetchMe();
    };
    
    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);
    
    return () => {
      console.log("🔌 AuthProvider: Unmounting");
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      status, 
      setUser, 
      refreshMe: fetchMe 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}