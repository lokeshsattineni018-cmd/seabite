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

  // Minimalist Palette: Alternating shades of Slate/Grey
  const prizes = [
    { label: "5% OFF", color: "#f8fafc", text: "#0f172a", value: 5 },
    { label: "10% OFF", color: "#f1f5f9", text: "#0f172a", value: 10 },
    { label: "NO LUCK", color: "#e2e8f0", text: "#0f172a", value: 0 },
    { label: "15% OFF", color: "#f8fafc", text: "#0f172a", value: 15 },
    { label: "20% OFF", color: "#f1f5f9", text: "#0f172a", value: 20 },
    { label: "50% OFF", color: "#e2e8f0", text: "#0f172a", value: 50 },
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

      ctx.beginPath();
      ctx.fillStyle = prize.color;
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.lineTo(centerX, centerY);
      ctx.fill();

      // Clean, thin borders
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + angle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = prize.text;
      ctx.font = "500 14px Inter, sans-serif";
      ctx.fillText(prize.label, radius - 30, 5);
      ctx.restore();
    });

    // Minimal center cap
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
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
      const totalRotation = 1800 + targetAngle; 

      setRotation(totalRotation);

      setTimeout(() => {
        setResult(backendResult);
        setSpinning(false);
        if (backendResult.result === "COUPON") {
          localStorage.setItem("seabiteWheelCoupon", backendResult.code);
        }
      }, 4000);
    } catch (e) {
      setSpinning(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-slate-100"
        >
          {/* Minimal Close */}
          <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>

          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-slate-800 mb-1 tracking-tight">
              Exclusive Offer
            </h2>
            <p className="text-slate-500 text-sm">
              Spin to unlock your personal discount.
            </p>
          </div>

          {/* Wheel Section */}
          <div className="relative mb-10 flex justify-center">
            {/* Minimal Needle */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
              <div className="w-1 h-8 bg-slate-800 rounded-full" />
            </div>

            <motion.div
              animate={{ rotate: rotation }}
              transition={{ duration: 4, ease: [0.2, 0, 0, 1] }}
              className="relative"
            >
              <canvas ref={canvasRef} width="350" height="350" className="w-72 h-72 rounded-full border border-slate-200 shadow-sm" />
            </motion.div>
          </div>

          {/* Result / Action */}
          {!result ? (
            <button
              onClick={handleSpin}
              disabled={spinning}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-medium text-sm transition-all hover:bg-slate-800 disabled:bg-slate-300"
            >
              {spinning ? "Spinning..." : "Reveal my discount"}
            </button>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              {result.result === "BETTER_LUCK" ? (
                <p className="text-slate-600 font-medium">Maybe next time!</p>
              ) : (
                <div className="mb-6">
                  <p className="text-sm text-slate-500 uppercase tracking-widest mb-1">You won</p>
                  <p className="text-5xl font-bold text-slate-900">{result.discountValue}% OFF</p>
                </div>
              )}
              <Link
                to="/products"
                onClick={onClose}
                className="block w-full py-4 bg-slate-900 text-white rounded-xl font-medium text-sm text-center"
              >
                Continue Shopping
              </Link>
            </motion.div>
          )}

          <p className="text-slate-400 text-[10px] text-center mt-6 uppercase tracking-widest">
            Limit: One per customer
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Spin;