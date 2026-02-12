import { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiHome, FiArrowLeft } from "react-icons/fi";
import { motion, useInView } from "framer-motion";
import UserInfo from "./UserInfo";
import { ThemeContext } from "../context/ThemeContext";

const API_URL = import.meta.env.VITE_API_URL || "";

const FadeUp = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
      animate={
        isInView
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y: 30, filter: "blur(8px)" }
      }
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true,
      });
      setUser(res.data);
    } catch (err) {
      console.error("User fetch failed:", err);
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
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mb-4"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-slate-400 text-sm font-semibold tracking-wide"
        >
          Loading Profile...
        </motion.p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] font-sans relative pb-12 md:pb-20 transition-colors duration-500 overflow-x-hidden">
      {/* 1. HEADER BANNER */}
      <div className="relative h-56 md:h-80 w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-slate-50 dark:to-[#0f172a] z-10"
        />

        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          src="https://images.unsplash.com/photo-1468581264429-2548ef9eb732?q=80&w=2000&auto=format&fit=crop"
          alt="Ocean Background"
          className="w-full h-full object-cover opacity-90 dark:opacity-40"
        />

        <div className="absolute top-0 left-0 w-full pt-24 md:pt-28 px-6 md:px-10 z-20">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
          </motion.button>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="max-w-3xl mx-auto px-4 relative z-20">
        <FadeUp delay={0.1}>
          <UserInfo user={user} />
        </FadeUp>

        {/* 3. ACTION BUTTONS */}
        <FadeUp delay={0.3}>
          <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 mt-6 md:mt-8">
            <motion.button
              whileHover={{ y: -2, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/")}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-white font-bold text-sm rounded-full shadow-sm transition-all duration-300 border border-slate-200 dark:border-slate-700"
            >
              <FiHome size={18} />
              <span>Back To Home</span>
            </motion.button>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLogout}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-bold text-sm rounded-full border border-red-100 dark:border-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-300"
            >
              <FiLogOut size={18} />
              <span>Sign Out</span>
            </motion.button>
          </div>
        </FadeUp>

        <div className="text-center mt-12 md:mt-16 pb-8" />
      </div>
    </div>
  );
}