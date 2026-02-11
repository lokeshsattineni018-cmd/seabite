import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  
  // Start with 'loading' so we don't redirect before we check
  const [status, setStatus] = useState("loading"); 

  const fetchMe = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true,
      });
      
      setUser(res.data);
      setStatus("authenticated");
    } catch (err) {
      // Only log legitimate auth errors, don't spam console
      if (err.response && err.response.status !== 401) {
         console.log("Auth Check Error:", err.message);
      }
      setUser(null);
      setStatus("unauthenticated");
    }
  };

  useEffect(() => {
    // Only fetch ONCE when the app loads. 
    // We removed the 'focus' listener to prevent double-firing on redirects.
    fetchMe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, setUser, refreshMe: fetchMe }}>
      {/* Optional: You can block rendering here if you want to ensure 
        no redirects happen until loading is done. 
        For now, passing 'status' lets your Routes decide.
      */}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}