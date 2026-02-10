// src/pages/Spin.jsx
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Anchor, X } from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app";

// Ensure axios sends MongoDB session cookie
axios.defaults.withCredentials = true;

const Spin = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const canvasRef = useRef(null);

  const prizes = [
    { label: "5% OFF", color: "#0f172a", text: "#ffffff", value: 5 },
    { label: "10% OFF", color: "#ffffff", text: "#0f172a", value: 10 },
    { label: "NO LUCK", color: "#0f172a", text: "#ffffff", value: 0 },
    { label: "15% OFF", color: "#ffffff", text: "#0f172a", value: 15 },
    { label: "20% OFF", color: "#0f172a", text: "#ffffff", value: 20 },
    { label: "50% OFF", color: "#ffffff", text: "#0f172a", value: 50 },
  ];

  useEffect(() => {
    if (isOpen && canvasRef.current) drawWheel();
  }, [isOpen]);

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

    // Center pin
    ctx.beginPath();
    ctx.arc(150, 150, 15, 0, 2 * Math.PI);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
  };

  const handleSpin = async () => {
    if (spinning || result) return;
    setSpinning(true);

    try {
      // Backend identifies user via Mongo Session Cookie
      const res = await axios.post(
        `${API_URL}/api/spin/spin`,
        {},
        { withCredentials: true }
      );
      const backendResult = res.data;

      const prizeIndex = prizes.findIndex(
        (p) => p.value === backendResult.discountValue
      );
      const targetDeg = 360 - prizeIndex * 60 - 30;
      const totalRotation = 1800 + targetDeg;

      if (canvasRef.current) {
        canvasRef.current.style.transition =
          "transform 4s cubic-bezier(0.15, 0, 0.15, 1)";
        canvasRef.current.style.transform = `rotate(${totalRotation}deg)`;
      }

      setTimeout(() => {
        setResult(backendResult);
        setSpinning(false);
      }, 4000);
    } catch (e) {
      setSpinning(false);
      alert("Please login first to claim your SeaBite rewards!");
      window.location.href = "/login";
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm px-4">
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
            className="relative w-full max-w-md bg-white rounded-[3.5rem] p-10 text-center shadow-2xl"
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-8 right-8 text-slate-400 hover:text-rose-500"
            >
              <X size={24} />
            </button>
            <h2 className="text-3xl font-serif text-slate-900 mb-2">
              Ocean Luck
            </h2>
            <p className="text-slate-500 text-sm mb-10">
              Premium rewards for your Mongo account
            </p>
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
                className="w-full py-5 bg-slate-900 text-white font-bold rounded-[1.5rem] shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-60"
              >
                {spinning ? "THE WHEEL IS TURNING..." : "SPIN FOR LUCK"}
              </button>
            ) : (
              <div className="w-full space-y-6">
                {result.result === "BETTER_LUCK" ? (
                  <p className="text-rose-500 font-bold">
                    Better luck next time!
                  </p>
                ) : (
                  <div className="p-8 bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-[2rem]">
                    <p className="text-4xl font-black text-slate-900">
                      {result.discountValue}% OFF
                    </p>
                    <p className="text-[10px] text-blue-600 mt-3 font-bold uppercase">
                      Saved to your Mongo Account
                    </p>
                  </div>
                )}
                <Link
                  to="/products"
                  className="block w-full py-5 bg-blue-600 text-white font-bold rounded-[1.5rem] shadow-xl text-center"
                >
                  Shop Now
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Spin;
