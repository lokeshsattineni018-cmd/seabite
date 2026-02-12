import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiHome, FiArrowLeft } from "react-icons/fi";
import { motion } from "framer-motion";
import UserInfo from "./UserInfo";
import { ThemeContext } from "../context/ThemeContext";

const API_URL =
  import.meta.env.VITE_API_URL || "";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  const fetchUser = async () => {
    try {
      // ✅ Session-based: backend reads connect.sid cookie
      const res = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true,
      });
      setUser(res.data);
    } catch (err) {
      console.error("User fetch failed:", err);
      // Only redirect if truly not authenticated
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_URL}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      navigate("/login");
      window.location.reload();
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center transition-colors duration-500">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-semibold tracking-wide">
          Loading Profile...
        </p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] font-sans relative pb-12 md:pb-20 transition-colors duration-500 overflow-x-hidden">
      {/* 1. HEADER BANNER */}
      <div className="relative h-56 md:h-80 w-full overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-slate-50 dark:to-[#0f172a] z-10" />

        {/* Banner Image */}
        <img
          src="https://images.unsplash.com/photo-1468581264429-2548ef9eb732?q=80&w=2000&auto=format&fit=crop"
          alt="Ocean Background"
          className="w-full h-full object-cover opacity-90 dark:opacity-40"
        />

        {/* Back to Home Button */}
        <div className="absolute top-0 left-0 w-full pt-24 md:pt-28 px-6 md:px-10 z-20">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 dark:bg-black/30 backdrop-blur-xl border border-white/20 rounded-full text-white hover:bg-white hover:text-blue-900 transition-all duration-300 shadow-xl group"
          >
            <FiArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span className="text-sm font-bold tracking-wide">
              Back to Home
            </span>
          </button>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="max-w-3xl mx-auto px-4 relative z-20">
        {/* User Info Module */}
        <UserInfo user={user} />

        {/* 3. ACTION BUTTONS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 mt-6 md:mt-8"
        >
          <button
            onClick={() => navigate("/")}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-white font-bold text-sm rounded-full shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border border-slate-200 dark:border-slate-700"
          >
            <FiHome size={18} />
            <span>Back To Home</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-bold text-sm rounded-full border border-red-100 dark:border-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-300"
          >
            <FiLogOut size={18} />
            <span>Sign Out</span>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12 md:mt-16 pb-8"
        />
      </div>
    </div>
  );
}
