import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { X, Sparkles } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";
axios.defaults.withCredentials = true;

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
    const centerX = 150;
    const centerY = 150;
    const radius = 140;
    
    ctx.clearRect(0, 0, 300, 300);

    prizes.forEach((prize, i) => {
      const angle = (2 * Math.PI) / prizes.length;
      const startAngle = i * angle - Math.PI / 2;
      const endAngle = (i + 1) * angle - Math.PI / 2;

      ctx.beginPath();
      ctx.fillStyle = prize.color;
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.lineTo(centerX, centerY);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + angle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = prize.text;
      ctx.font = "bold 14px Inter, sans-serif";
      ctx.fillText(prize.label, radius - 15, 5);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  const handleSpin = async () => {
    if (spinning || result) return;
    setSpinning(true);

    try {
      const res = await axios.post(`${API_URL}/api/spin/spin`, {}, { withCredentials: true });
      const backendResult = res.data;

      console.log("Backend result:", backendResult);

      let prizeIndex;
      if (backendResult.result === "BETTER_LUCK") {
        prizeIndex = prizes.findIndex((p) => p.value === 0);
      } else {
        prizeIndex = prizes.findIndex((p) => p.value === backendResult.discountValue);
      }

      const segmentAngle = 360 / prizes.length;
      const targetAngle = 360 - (prizeIndex * segmentAngle) - (segmentAngle / 2);
      const totalRotation = 1800 + targetAngle;

      setRotation(totalRotation);

      setTimeout(() => {
        setResult(backendResult);
        setSpinning(false);
        
        if (backendResult.result === "COUPON") {
          const discountData = {
            percentage: backendResult.discountValue,
            expiresAt: backendResult.expiresAt,
            spunAt: new Date().toISOString()
          };
          localStorage.setItem("seabiteSpinDiscount", JSON.stringify(discountData));
          console.log("Saved spin discount:", discountData);
        }
      }, 4000);
    } catch (e) {
      setSpinning(false);
      console.error("Spin error:", e);
      if (e.response?.status === 403) {
        alert(e.response?.data?.error || "You've already used your spin!");
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
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={24} />
          </button>

          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Spin & Win
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Get instant discounts on your order
            </p>
          </div>

          <div className="relative mb-6 flex justify-center">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
              <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-slate-800 dark:border-t-white" />
            </div>

            <motion.div
              animate={{ rotate: rotation }}
              transition={{ duration: 4, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative"
            >
              <canvas
                ref={canvasRef}
                width="300"
                height="300"
                className="drop-shadow-lg"
              />
            </motion.div>
          </div>

          {!result ? (
            <motion.button
              onClick={handleSpin}
              disabled={spinning}
              whileHover={{ scale: spinning ? 1 : 1.02 }}
              whileTap={{ scale: spinning ? 1 : 0.98 }}
              className={`w-full py-4 rounded-xl font-bold text-base uppercase tracking-wide shadow-lg transition-all ${
                spinning
                  ? "bg-slate-400 cursor-not-allowed text-white"
                  : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
              }`}
            >
              {spinning ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white dark:border-slate-900 border-t-transparent rounded-full animate-spin" />
                  Spinning...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles size={18} />
                  Spin Now
                </span>
              )}
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {result.result === "BETTER_LUCK" ? (
                <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-2xl text-center">
                  <p className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                    Better luck next time!
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Complete an order to spin again
                  </p>
                </div>
              ) : (
                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border-2 border-green-500/20 text-center">
                  <Sparkles className="mx-auto mb-3 text-green-600 dark:text-green-400" size={28} />
                  <p className="text-4xl font-black text-slate-900 dark:text-white mb-1">
                    {result.discountValue}% OFF
                  </p>
                  <p className="text-green-700 dark:text-green-300 text-sm font-semibold">
                    Applied to your next order!
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-xs mt-2">
                    Valid for 24 hours
                  </p>
                </div>
              )}
              
              <Link
                to="/products"
                onClick={onClose}
                className="block w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold text-center hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
              >
                Shop Now
              </Link>
            </motion.div>
          )}

          <p className="text-slate-500 dark:text-slate-400 text-xs text-center mt-4">
            Spin resets 24hrs after order completion
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Spin;