import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import {
  FiCheck,
  FiShoppingBag,
  FiArrowRight,
  FiPackage,
  FiTag,
} from "react-icons/fi";
import { ThemeContext } from "../context/ThemeContext";

const API_URL = import.meta.env.VITE_API_URL || "";

// --- ANIMATION VARIANTS ---
const cardVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.92, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      damping: 22,
      stiffness: 90,
      delay: 0.15,
    },
  },
};

const staggerChild = (delay = 0) => ({
  initial: { opacity: 0, y: 20, filter: "blur(6px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
  },
});

const fishVariants = {
  animate: (i) => ({
    x: ["-10vw", "110vw"],
    y: [0, Math.random() * 20 - 10],
    transition: {
      x: {
        duration: 15 + Math.random() * 10,
        repeat: Infinity,
        ease: "linear",
        delay: i * 2,
      },
      y: {
        duration: 2,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      },
    },
  }),
};

const bubbleVariants = {
  animate: {
    y: ["110vh", "-10vh"],
    x: [0, 20, -20, 0],
    opacity: [0, 0.5, 0],
    transition: {
      y: { duration: 8, repeat: Infinity, ease: "linear" },
      x: { duration: 3, repeat: Infinity, ease: "easeInOut" },
      opacity: { duration: 8, repeat: Infinity, times: [0, 0.1, 1] },
    },
  },
};

const Fish = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M21.5,12c0,0-2.5-1.5-4.5-1.5c-1.5,0-3,0.5-4,1c-1-1-2.5-2-4.5-2c-3,0-5.5,2.5-5.5,2.5S5.5,14.5,8.5,14.5c2,0,3.5-1,4.5-2 c1,0.5,2.5,1,4,1C19,13.5,21.5,12,21.5,12z M19.5,12c-0.5,0.2-1.2,0.5-2,0.5c-0.5,0-1-0.1-1.4-0.2l0.3-0.3H19.5z" />
  </svg>
);

export default function OrderSuccess() {
  const location = useLocation();
  const { isDarkMode } = useContext(ThemeContext);
  const queryParams = new URLSearchParams(location.search);

  const dbId = queryParams.get("dbId");
  const discount = queryParams.get("discount") || 0;

  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!dbId) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await axios.get(`${API_URL}/api/orders/${dbId}`, {
          withCredentials: true,
        });
        setOrderDetails(data);
      } catch (err) {
        console.error("Error fetching order info:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [dbId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-[#050b14] dark:to-[#0f172a] flex items-center justify-center p-4 md:p-6 relative overflow-hidden font-sans transition-colors duration-500">
      {/* Animated ocean background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-200/20 to-transparent dark:from-blue-500/10" />
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`fish-${i}`}
            custom={i}
            variants={fishVariants}
            animate="animate"
            className="absolute text-blue-200 dark:text-blue-900/30 opacity-60"
            style={{ top: `${20 + i * 30}%`, width: `${40 + i * 20}px` }}
          >
            <Fish className="w-full h-full" />
          </motion.div>
        ))}
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={`bubble-${i}`}
            variants={bubbleVariants}
            animate="animate"
            className="absolute bg-blue-300/30 dark:bg-white/10 rounded-full blur-[1px]"
            style={{
              width: Math.random() * 20 + 5,
              height: Math.random() * 20 + 5,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Main Card */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative bg-white/80 dark:bg-[#0e1d30]/90 backdrop-blur-xl w-full max-w-lg rounded-[2.5rem] md:rounded-[3rem] shadow-2xl shadow-blue-200/50 dark:shadow-none p-8 md:p-14 text-center border border-white dark:border-white/5 mx-auto"
      >
        {/* Success Icon */}
        <motion.div
          {...staggerChild(0.25)}
          className="mx-auto w-20 h-20 md:w-28 md:h-28 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6 md:mb-8 relative"
        >
          <motion.div
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 bg-green-400/20 rounded-full"
          />
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 12,
              delay: 0.4,
            }}
            className="relative z-10 w-14 h-14 md:w-20 md:h-20 bg-gradient-to-tr from-green-600 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30"
          >
            <FiCheck
              className="text-white text-2xl md:text-4xl"
              strokeWidth={3}
            />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.div {...staggerChild(0.35)} className="mb-6 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white mb-2 md:mb-3 tracking-tight">
            Order Confirmed
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-xs md:text-sm px-2 leading-relaxed">
            Thank you for choosing SeaBite.
            <br />
            Your fresh catch is being prepared.
          </p>
        </motion.div>

        {/* Discount Badge */}
        <AnimatePresence>
          {discount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.55, type: "spring", stiffness: 200 }}
              className="mb-6 inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 md:px-6 py-2 md:py-2.5 rounded-full border border-emerald-100 dark:border-emerald-500/20 shadow-sm"
            >
              <FiTag size={14} />
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">
                Saved {"\u20B9"}{Number(discount).toLocaleString()}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order Number Card */}
        <motion.div
          {...staggerChild(0.5)}
          className="mb-8 md:mb-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 md:p-6 border border-slate-100 dark:border-white/5 relative overflow-hidden group"
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 opacity-30 origin-left"
          />
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
            Order Number
          </p>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.p
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-xl md:text-2xl font-mono font-bold text-slate-400 tracking-wide"
              >
                FETCHING...
              </motion.p>
            ) : (
              <motion.p
                key="orderId"
                initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="text-xl md:text-2xl font-mono font-bold text-slate-800 dark:text-white tracking-wide truncate px-2"
              >
                {orderDetails ? `#${orderDetails.orderId}` : "#N/A"}
              </motion.p>
            )}
          </AnimatePresence>
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs md:text-sm">
            <span className="text-slate-500">Est. Delivery</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              2-3 Days
            </span>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          {...staggerChild(0.65)}
          className="flex flex-col gap-3 md:gap-4"
        >
          <Link to={`/orders/${dbId}`} className="w-full">
            <motion.button
              whileHover={{
                scale: 1.02,
                boxShadow: "0 15px 40px rgba(0,0,0,0.12)",
              }}
              whileTap={{ scale: 0.97 }}
              className="w-full bg-slate-900 dark:bg-blue-600 text-white py-3.5 md:py-4 rounded-full font-bold text-xs md:text-sm shadow-lg flex items-center justify-center gap-2 md:gap-3 group transition-all"
            >
              <span>Track Delivery</span>
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "easeInOut",
                }}
              >
                <FiArrowRight size={18} />
              </motion.span>
            </motion.button>
          </Link>
          <Link to="/" className="w-full">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-2 md:py-3 text-slate-500 dark:text-slate-400 font-bold text-xs md:text-sm hover:text-blue-600 dark:hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <FiPackage size={16} /> Continue Shopping
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}