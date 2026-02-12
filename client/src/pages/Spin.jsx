// src/components/Spin.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { X, Sparkles } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";
axios.defaults.withCredentials = true;

const ease = [0.22, 1, 0.36, 1];

const Spin = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState(0);

  const prizes = [
    { label: "Better Luck!", color: "#94a3b8", text: "#ffffff", value: 0 },
    { label: "5% OFF", color: "#06b6d4", text: "#ffffff", value: 5 },
    { label: "Better Luck!", color: "#94a3b8", text: "#ffffff", value: 0 },
    { label: "10% OFF", color: "#8b5cf6", text: "#ffffff", value: 10 },
    { label: "20% OFF", color: "#ec4899", text: "#ffffff", value: 20 },
    { label: "50% OFF", color: "#10b981", text: "#ffffff", value: 50 },
  ];

  useEffect(() => {
    if (isOpen && canvasRef.current) drawWheel();
  }, [isOpen]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    ctx.clearRect(0, 0, size, size);

    // Outer ring shadow
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 4, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fill();

    prizes.forEach((prize, i) => {
      const angle = (2 * Math.PI) / prizes.length;
      const startAngle = i * angle - Math.PI / 2;
      const endAngle = (i + 1) * angle - Math.PI / 2;

      // Segment
      ctx.beginPath();
      ctx.fillStyle = prize.color;
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.lineTo(centerX, centerY);
      ctx.fill();

      // Segment border
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner highlight
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle * 0.5);
      ctx.lineTo(centerX, centerY);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fill();

      // Text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + angle / 2);
      ctx.textAlign = "center";
      ctx.fillStyle = prize.text;
      ctx.font = "bold 13px Inter, system-ui, sans-serif";
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 4;
      ctx.fillText(prize.label, radius * 0.6, 4);
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    // Outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center hub - outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, 28, 0, 2 * Math.PI);
    ctx.fillStyle = "#f8fafc";
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center hub - inner dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
  };

  const handleSpin = async () => {
    if (spinning || result) return;
    setSpinning(true);

    try {
      const res = await axios.post(
        `${API_URL}/api/spin/spin`,
        {},
        { withCredentials: true }
      );
      const backendResult = res.data;

      let prizeIndex;
      if (backendResult.result === "BETTER_LUCK") {
        prizeIndex = prizes.findIndex((p) => p.value === 0);
      } else {
        prizeIndex = prizes.findIndex(
          (p) => p.value === backendResult.discountValue
        );
      }

      const segmentAngle = 360 / prizes.length;
      const targetAngle = 360 - prizeIndex * segmentAngle - segmentAngle / 2;
      const totalRotation = 1800 + targetAngle;

      setRotation(totalRotation);

      setTimeout(() => {
        setResult(backendResult);
        setSpinning(false);

        if (backendResult.result === "COUPON") {
          const discountData = {
            percentage: backendResult.discountValue,
            expiresAt: backendResult.expiresAt,
            userEmail: null,
          };
          localStorage.setItem(
            "seabiteSpinDiscount",
            JSON.stringify(discountData)
          );
        }
      }, 4000);
    } catch (e) {
      setSpinning(false);
      if (e.response?.status === 403) {
        alert("You've already used your spin!");
        onClose();
      } else if (e.response?.status === 401) {
        alert("Please login to spin the wheel!");
        navigate("/login");
      } else {
        alert("Something went wrong. Try again!");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-md px-4"
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.92, y: 30, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.92, y: 30, filter: "blur(8px)" }}
          transition={{ type: "spring", damping: 28, stiffness: 260 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Decorative gradient */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px]" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px]" />
          </div>

          <div className="relative p-6 md:p-8">
            {/* Close button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-10"
            >
              <X size={18} />
            </motion.button>

            {/* Header */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, ease }}
              >
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full mb-3">
                  <Sparkles size={12} />
                  Lucky Draw
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Spin & <span className="text-blue-600">Win</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5">
                  Get instant discounts on your next order
                </p>
              </motion.div>
            </div>

            {/* Wheel Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, ease }}
              className="relative mb-6 flex justify-center"
            >
              {/* Pointer */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                <div className="relative">
                  <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[24px] border-t-slate-900 dark:border-t-white drop-shadow-lg" />
                </div>
              </div>

              {/* Glow ring behind wheel */}
              <div
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${spinning ? "opacity-100" : "opacity-0"}`}
              >
                <div className="w-[280px] h-[280px] md:w-[310px] md:h-[310px] rounded-full bg-blue-500/15 blur-xl animate-pulse" />
              </div>

              {/* Wheel */}
              <motion.div
                animate={{ rotate: rotation }}
                transition={{ duration: 4, ease: [0.25, 0.1, 0.25, 1] }}
                className="relative drop-shadow-xl"
              >
                <canvas
                  ref={canvasRef}
                  width="280"
                  height="280"
                  className="rounded-full"
                />
              </motion.div>
            </motion.div>

            {/* Spin Button or Result */}
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.button
                  key="spin-btn"
                  onClick={handleSpin}
                  disabled={spinning}
                  whileHover={{ scale: spinning ? 1 : 1.02 }}
                  whileTap={{ scale: spinning ? 1 : 0.97 }}
                  className={`w-full py-3.5 md:py-4 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg transition-all ${
                    spinning
                      ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500 dark:text-slate-400"
                      : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-slate-900/20"
                  }`}
                >
                  {spinning ? (
                    <span className="flex items-center justify-center gap-2.5">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Spinning...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles size={16} />
                      Spin Now
                    </span>
                  )}
                </motion.button>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 15, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.5, ease }}
                  className="space-y-3"
                >
                  {result.result === "BETTER_LUCK" ? (
                    <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center border border-slate-100 dark:border-slate-700">
                      <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl">:(</span>
                      </div>
                      <p className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                        Better luck next time!
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">
                        Try again later for amazing deals
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl border-2 border-emerald-200/50 dark:border-emerald-500/20 text-center relative overflow-hidden">
                      {/* Decorative confetti dots */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(8)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 60, scale: 0 }}
                            animate={{ opacity: 0.4, y: 0, scale: 1 }}
                            transition={{
                              delay: i * 0.08,
                              duration: 0.6,
                              ease,
                            }}
                            className="absolute w-2 h-2 rounded-full"
                            style={{
                              left: `${15 + i * 10}%`,
                              top: `${10 + (i % 3) * 25}%`,
                              backgroundColor: [
                                "#10b981",
                                "#06b6d4",
                                "#8b5cf6",
                                "#ec4899",
                              ][i % 4],
                            }}
                          />
                        ))}
                      </div>

                      <div className="relative">
                        <Sparkles
                          className="mx-auto mb-3 text-emerald-600 dark:text-emerald-400"
                          size={24}
                        />
                        <p className="text-4xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">
                          {result.discountValue}% OFF
                        </p>
                        <p className="text-emerald-700 dark:text-emerald-300 text-sm font-semibold">
                          Applied to your next order!
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-2 font-medium">
                          Valid for 24 hours from now
                        </p>
                      </div>
                    </div>
                  )}

                  <Link
                    to="/products"
                    onClick={onClose}
                    className="block w-full"
                  >
                    <motion.div
                      whileTap={{ scale: 0.97 }}
                      className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm text-center hover:bg-blue-600 dark:hover:bg-slate-100 transition-colors uppercase tracking-wider shadow-lg"
                    >
                      Shop Now
                    </motion.div>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <p className="text-slate-400 dark:text-slate-500 text-[10px] text-center mt-4 font-medium">
              One spin per account &middot; Discount expires in 24 hours
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Spin;
