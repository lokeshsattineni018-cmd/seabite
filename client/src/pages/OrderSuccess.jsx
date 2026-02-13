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
  FiCopy,
  FiTruck,
  FiClock,
} from "react-icons/fi";
import { ThemeContext } from "../context/ThemeContext";

const API_URL = import.meta.env.VITE_API_URL || "";

// --- CONFETTI PARTICLES ---
const Particle = ({ index }) => {
  const colors = [
    "bg-blue-400",
    "bg-emerald-400",
    "bg-amber-400",
    "bg-blue-500",
    "bg-emerald-500",
    "bg-sky-400",
  ];
  const size = Math.random() * 8 + 4;
  const xStart = Math.random() * 100;
  const delay = Math.random() * 2;
  const duration = 3 + Math.random() * 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: `${xStart}vw`, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: ["0vh", "100vh"],
        x: [`${xStart}vw`, `${xStart + (Math.random() * 20 - 10)}vw`],
        rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
        scale: [0, 1, 1, 0.5],
      }}
      transition={{
        duration,
        delay,
        ease: "easeOut",
      }}
      className={`absolute ${colors[index % colors.length]} rounded-sm pointer-events-none`}
      style={{ width: size, height: size }}
    />
  );
};

// --- ANIMATED RINGS ---
const PulseRing = ({ delay, size }) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0.5 }}
    animate={{ scale: 2, opacity: 0 }}
    transition={{
      duration: 2.5,
      repeat: Infinity,
      ease: "easeOut",
      delay,
    }}
    className="absolute bg-emerald-400/10 rounded-full"
    style={{ width: size, height: size }}
  />
);

export default function OrderSuccess() {
  const location = useLocation();
  const { isDarkMode } = useContext(ThemeContext);
  const queryParams = new URLSearchParams(location.search);

  const dbId = queryParams.get("dbId");
  const discount = queryParams.get("discount") || 0;

  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [showContent, setShowContent] = useState(false);

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
        // Silent error
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();

    // Delayed content reveal for dramatic effect
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, [dbId]);

  const copyOrderId = () => {
    if (orderDetails?.orderId) {
      navigator.clipboard.writeText(orderDetails.orderId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060e1a] flex items-center justify-center p-4 md:p-6 relative overflow-hidden font-sans transition-colors duration-500">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-emerald-50/50 via-blue-50/30 to-transparent dark:from-emerald-950/10 dark:via-blue-950/10 dark:to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-100/30 dark:bg-emerald-900/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-100/30 dark:bg-blue-900/5 rounded-full blur-[120px]" />
      </div>

      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {showContent &&
          [...Array(20)].map((_, i) => <Particle key={i} index={i} />)}
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.95, filter: "blur(12px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{
          type: "spring",
          damping: 25,
          stiffness: 80,
          delay: 0.1,
        }}
        className="relative bg-white/80 dark:bg-slate-800/70 backdrop-blur-2xl w-full max-w-lg rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-none p-8 md:p-12 text-center border border-slate-200/60 dark:border-white/5 mx-auto"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
          className="mx-auto w-24 h-24 md:w-28 md:h-28 relative flex items-center justify-center mb-8"
        >
          <PulseRing delay={0} size={112} />
          <PulseRing delay={0.8} size={112} />
          <PulseRing delay={1.6} size={112} />

          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 12,
              delay: 0.5,
            }}
            className="relative z-10 w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/30"
          >
            <FiCheck className="text-white" size={32} strokeWidth={3} />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight leading-tight">
            Order Confirmed
          </h1>
          <p className="text-slate-500 font-medium text-sm px-4 leading-relaxed">
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
              transition={{ delay: 0.65, type: "spring", stiffness: 200 }}
              className="mb-6 inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-5 py-2.5 rounded-xl border border-emerald-500/20"
            >
              <FiTag size={14} />
              <span className="text-xs font-black uppercase tracking-wider">
                You saved {"\u20B9"}
                {Number(discount).toLocaleString()}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order Number Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/30 relative overflow-hidden"
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.9, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500 opacity-40 origin-left"
          />

          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">
            Order Number
          </p>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 py-1"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full"
                />
                <span className="text-sm font-medium text-slate-400">
                  Fetching...
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="orderId"
                initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center justify-center gap-2"
              >
                <p className="text-xl md:text-2xl font-mono font-bold text-slate-900 dark:text-white tracking-wide">
                  {orderDetails ? `#${orderDetails.orderId}` : "#N/A"}
                </p>
                {orderDetails?.orderId && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={copyOrderId}
                    className="w-7 h-7 rounded-lg bg-slate-200/60 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    {copiedId ? (
                      <FiCheck size={12} />
                    ) : (
                      <FiCopy size={12} />
                    )}
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Info */}
          <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <FiTruck size={12} />
              <span>Est. Delivery</span>
            </div>
            <span className="font-bold text-sm text-blue-600 dark:text-blue-400">
              2-3 Days
            </span>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.5 }}
          className="flex flex-col gap-3"
        >
          <Link to={`/orders/${dbId}`} className="w-full">
            <motion.button
              whileHover={{
                scale: 1.02,
                y: -2,
              }}
              whileTap={{ scale: 0.97 }}
              className="w-full bg-slate-900 dark:bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-slate-900/20 dark:shadow-blue-600/20 flex items-center justify-center gap-3 group transition-all hover:bg-slate-800 dark:hover:bg-blue-500"
            >
              <FiPackage size={16} />
              <span>Track Your Delivery</span>
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "easeInOut",
                }}
              >
                <FiArrowRight size={16} />
              </motion.span>
            </motion.button>
          </Link>
          <Link to="/" className="w-full">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3 text-slate-500 dark:text-slate-400 font-bold text-sm hover:text-blue-600 dark:hover:text-white transition-colors flex items-center justify-center gap-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/50"
            >
              <FiShoppingBag size={16} /> Continue Shopping
            </motion.button>
          </Link>
        </motion.div>

        {/* Estimated timeline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/30"
        >
          <div className="flex justify-between items-center">
            {[
              { icon: <FiCheck size={12} />, label: "Confirmed", active: true },
              { icon: <FiPackage size={12} />, label: "Packing", active: false },
              { icon: <FiTruck size={12} />, label: "Shipping", active: false },
              { icon: <FiClock size={12} />, label: "Delivery", active: false },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    step.active
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  {step.icon}
                </div>
                <span
                  className={`text-[8px] font-bold uppercase tracking-wider ${
                    step.active
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
