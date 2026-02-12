import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { X, Sparkles, Gift } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";
axios.defaults.withCredentials = true;

const Spin = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState(0);

  const prizes = [
    { label: "5% OFF", color: "#3b82f6", text: "#ffffff", value: 5 },
    { label: "10% OFF", color: "#8b5cf6", text: "#ffffff", value: 10 },
    { label: "NO LUCK", color: "#64748b", text: "#ffffff", value: 0 },
    { label: "15% OFF", color: "#ec4899", text: "#ffffff", value: 15 },
    { label: "20% OFF", color: "#f59e0b", text: "#ffffff", value: 20 },
    { label: "50% OFF", color: "#10b981", text: "#ffffff", value: 50 },
  ];

  useEffect(() => {
    if (isOpen && canvasRef.current) drawWheel();
  }, [isOpen]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const centerX = 175;
    const centerY = 175;
    const radius = 160;
    
    ctx.clearRect(0, 0, 350, 350);

    prizes.forEach((prize, i) => {
      const angle = (2 * Math.PI) / prizes.length;
      const startAngle = i * angle - Math.PI / 2;
      const endAngle = (i + 1) * angle - Math.PI / 2;

      // Draw segment
      ctx.beginPath();
      ctx.fillStyle = prize.color;
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.lineTo(centerX, centerY);
      ctx.fill();

      // Draw border
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + angle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = prize.text;
      ctx.font = "bold 16px Inter, sans-serif";
      ctx.fillText(prize.label, radius - 20, 6);
      ctx.restore();
    });

    // Center circle
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 25);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(1, "#e2e8f0");
    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  const handleSpin = async () => {
    if (spinning || result) return;
    setSpinning(true);

    try {
      const res = await axios.post(`${API_URL}/api/spin/spin`, {}, { withCredentials: true });
      const backendResult = res.data;

      const prizeIndex = prizes.findIndex((p) => p.value === backendResult.discountValue);
      const segmentAngle = 360 / prizes.length;
      const targetAngle = 360 - (prizeIndex * segmentAngle) - (segmentAngle / 2);
      const totalRotation = 1800 + targetAngle; // 5 full spins + target

      setRotation(totalRotation);

      setTimeout(() => {
        setResult(backendResult);
        setSpinning(false);
        
        // Save coupon to localStorage for auto-apply in checkout
        if (backendResult.result === "COUPON") {
          localStorage.setItem("seabiteWheelCoupon", backendResult.code);
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
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-900/95 via-blue-900/90 to-purple-900/95 backdrop-blur-md px-4"
      >
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              animate={{
                y: [0, -1000],
                x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
              style={{
                left: Math.random() * 100 + "%",
                top: "100%",
              }}
            />
          ))}
        </div>

        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ type: "spring", damping: 20 }}
          className="relative w-full max-w-lg bg-white/10 backdrop-blur-2xl rounded-[3rem] p-8 md:p-12 shadow-2xl border border-white/20"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-white/60 hover:text-white hover:rotate-90 transition-all duration-300 z-10"
          >
            <X size={28} strokeWidth={2.5} />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block mb-4"
            >
              <Gift size={48} className="text-yellow-400 drop-shadow-glow" />
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
              Spin & Win!
            </h2>
            <p className="text-white/70 text-sm md:text-base font-medium">
              Get instant discounts on your next order
            </p>
          </div>

          {/* Wheel Container */}
          <div className="relative mb-8 flex justify-center">
            {/* Pointer/Arrow */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20">
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-yellow-400 drop-shadow-xl filter"
              />
            </div>

            {/* Wheel */}
            <div className="relative">
              <motion.div
                animate={{ rotate: rotation }}
                transition={{ duration: 4, ease: [0.25, 0.1, 0.25, 1] }}
                className="relative"
              >
                <canvas
                  ref={canvasRef}
                  width="350"
                  height="350"
                  className="drop-shadow-2xl rounded-full"
                />
              </motion.div>
              
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-3xl -z-10" />
            </div>
          </div>

          {/* Spin Button or Result */}
          {!result ? (
            <motion.button
              onClick={handleSpin}
              disabled={spinning}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-full py-5 rounded-2xl font-black text-lg uppercase tracking-wider shadow-2xl transition-all relative overflow-hidden ${
                spinning
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 hover:shadow-yellow-500/50"
              }`}
            >
              <span className="relative z-10 text-white drop-shadow-lg flex items-center justify-center gap-3">
                {spinning ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    Spinning...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Spin the Wheel
                  </>
                )}
              </span>
              {!spinning && (
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {result.result === "BETTER_LUCK" ? (
                <div className="p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 text-center">
                  <p className="text-2xl font-bold text-white/90">Better luck next time!</p>
                  <p className="text-white/60 text-sm mt-2">Keep exploring our fresh catches</p>
                </div>
              ) : (
                <div className="p-8 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-3xl border-2 border-emerald-400/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-transparent animate-pulse" />
                  <div className="relative z-10 text-center">
                    <Sparkles className="mx-auto mb-4 text-emerald-400" size={32} />
                    <p className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-2">
                      {result.discountValue}% OFF
                    </p>
                    <p className="text-emerald-200 text-sm font-bold uppercase tracking-widest">
                      Auto-applied to checkout!
                    </p>
                    <p className="text-white/60 text-xs mt-3 font-mono">
                      Code: {result.code}
                    </p>
                  </div>
                </div>
              )}
              
              <Link
                to="/products"
                onClick={onClose}
                className="block w-full py-4 bg-white text-slate-900 rounded-2xl font-bold text-center uppercase tracking-wide shadow-xl hover:shadow-2xl transition-all"
              >
                Shop Now
              </Link>
            </motion.div>
          )}

          {/* Info text */}
          <p className="text-white/40 text-xs text-center mt-6 font-medium">
            🎁 One spin per account • Valid for 24 hours
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Spin;