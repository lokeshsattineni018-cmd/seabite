import { useState, useEffect, useRef, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Anchor, X } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app";

// ✅ GLOBAL CONFIG: Ensures every request in this file carries the MongoDB session cookie
axios.defaults.withCredentials = true;

const Spin = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // ✅ Prevent white flash
  const canvasRef = useRef(null);

  const prizes = [
    { label: "5% OFF", color: "#0f172a", text: "#ffffff", value: 5 },
    { label: "10% OFF", color: "#ffffff", text: "#0f172a", value: 10 },
    { label: "NO LUCK", color: "#0f172a", text: "#ffffff", value: 0 },
    { label: "15% OFF", color: "#ffffff", text: "#0f172a", value: 15 },
    { label: "20% OFF", color: "#0f172a", text: "#ffffff", value: 20 },
    { label: "50% OFF", color: "#ffffff", text: "#0f172a", value: 50 },
  ];

  // ✅ Step 1: Prevent white flash by waiting for mount
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isInitialLoading && isOpen && canvasRef.current) drawWheel();
  }, [isOpen, isInitialLoading]);

  const drawWheel = () => {
    const ctx = canvasRef.current.getContext("2d");
    const radius = 145;
    ctx.clearRect(0, 0, 300, 300);

    prizes.forEach((prize, i) => {
      const angle = (2 * Math.PI) / prizes.length;
      ctx.beginPath();
      ctx.fillStyle = prize.color;
      ctx.moveTo(150, 150);
      ctx.arc(150, 150, radius, i * angle, (i + 1) * angle);
      ctx.fill();
      ctx.save();
      ctx.translate(150, 150);
      ctx.rotate(i * angle + angle / 2);
      ctx.fillStyle = prize.text;
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(prize.label, 130, 5);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(150, 150, 15, 0, 2 * Math.PI);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
  };

  const handleSpin = async () => {
    if (spinning || result) return;
    setSpinning(true);

    try {
      // ✅ Step 2: Fix 403 Forbidden by explicitly passing credentials
      const res = await axios.post(
        `${API_URL}/api/spin/spin`,
        {},
        { withCredentials: true }
      );
      
      const backendResult = res.data;

      // Find where to stop the wheel based on backend response
      const prizeIndex = prizes.findIndex(
        (p) => p.value === backendResult.discountValue
      );
      
      // Calculate rotation logic to land on the correct segment
      const targetDeg = 360 - (prizeIndex * 60) - 30;
      const totalRotation = 1800 + targetDeg;

      if (canvasRef.current) {
        canvasRef.current.style.transition = "transform 4s cubic-bezier(0.15, 0, 0.15, 1)";
        canvasRef.current.style.transform = `rotate(${totalRotation}deg)`;
      }

      setTimeout(() => {
        setResult(backendResult);
        setSpinning(false);
      }, 4000);
    } catch (e) {
      setSpinning(false);
      // ✅ Step 3: Handle session expiration gracefully
      console.error("Spin error caught:", e.response?.status);
      alert("Session expired. Please login again to spin!");
      navigate("/login");
    }
  };

  if (isInitialLoading) return null; // Keep background blurred while loading

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm px-4 font-sans">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="relative w-full max-w-md bg-white rounded-[3.5rem] p-10 text-center shadow-2xl overflow-hidden"
          >
            {/* Design detail: Subtly branded corner blur */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-8 right-8 text-slate-400 hover:text-rose-500 z-10"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-3xl font-serif text-slate-900 mb-2">Ocean Luck</h2>
            <p className="text-slate-500 text-sm mb-10">Premium rewards for your SeaBite account</p>
            
            <div className="relative mb-12 flex justify-center">
              <div className="absolute -top-6 z-20 text-rose-500 drop-shadow-md">
                <Anchor size={42} fill="currentColor" />
              </div>
              <canvas
                ref={canvasRef}
                width="300"
                height="300"
                className="rounded-full border-[10px] border-slate-900 shadow-2xl transition-transform"
              />
            </div>

            {!result ? (
              <button
                onClick={handleSpin}
                disabled={spinning}
                className="w-full py-5 bg-slate-900 text-white font-bold rounded-[1.5rem] shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-60 uppercase tracking-widest text-xs"
              >
                {spinning ? "The Wheel is Turning..." : "Spin for Luck"}
              </button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-6">
                {result.result === "BETTER_LUCK" ? (
                  <div className="p-6 bg-slate-50 rounded-3xl">
                    <p className="text-slate-900 font-bold italic">Better luck next time!</p>
                  </div>
                ) : (
                  <div className="p-8 bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-[2rem] relative overflow-hidden">
                    <p className="text-4xl font-black text-slate-900 tracking-tighter">
                      {result.discountValue}% OFF
                    </p>
                    <p className="text-[10px] text-emerald-600 mt-3 font-bold uppercase tracking-widest">
                      Applied to your account
                    </p>
                  </div>
                )}
                <Link
                  to="/products"
                  className="block w-full py-5 bg-blue-600 text-white font-bold rounded-[1.5rem] shadow-xl text-center uppercase tracking-widest text-xs"
                >
                  Continue Shopping
                </Link>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Spin;