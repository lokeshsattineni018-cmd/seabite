import React, { useState, useEffect } from "react";
import { FiGift, FiCopy, FiCheck, FiX, FiAward } from "react-icons/fi";
import confetti from "canvas-confetti";

export const PromoModal = ({ offer, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes default in seconds

  useEffect(() => {
    // Fire elegant multi-color confetti
    const end = Date.now() + (1 * 1000);
    const colors = ['#10b981', '#06b6d4', '#f59e0b', '#3b82f6'];

    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(offer.promoCode);
    setCopied(true);
    confetti({
      particleCount: 45,
      spread: 65,
      origin: { y: 0.7 }
    });

    const guestId = localStorage.getItem("seabite_guest_id");
    if (guestId) {
      const API_URL = import.meta.env.VITE_API_URL || "";
      import("axios").then((axiosModule) => {
        axiosModule.default.post(`${API_URL}/api/telemetry/promo-copied`, {
          visitorId: guestId,
          promoCode: offer.promoCode
        }).catch(() => {});
      });
    }

    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-900/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200/50 dark:border-stone-800 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] p-8 overflow-hidden text-center transform transition-all duration-300 scale-100">
        
        {/* Glow Effects */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-805"
        >
          <FiX size={18} />
        </button>

        {/* Floating Gift Box Badge */}
        <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 mb-6">
          <FiGift size={38} className="stroke-[1.5]" />
        </div>

        {/* Ribbon Header */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 rounded-full mb-4">
          <FiAward className="text-emerald-600 dark:text-emerald-400" size={14} />
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">LUCKY VISITOR SURPRISE</span>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-black text-stone-900 dark:text-white leading-tight mb-2 tracking-tight">
          Special Deal Unlocked!
        </h3>
        
        {/* Subtitle */}
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-6 px-4 font-medium leading-relaxed">
          {offer.message || "We noticed you looking at our fresh seafood collection! Here is a special treat just for you."}
        </p>

        {/* Discount Box */}
        <div className="bg-gradient-to-br from-stone-50 to-stone-100/50 dark:from-stone-950/60 dark:to-stone-900/60 border border-stone-200/40 dark:border-stone-850/50 rounded-2xl py-5 px-6 mb-6">
          <span className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest block mb-1">
            EXCLUSIVE SAVINGS
          </span>
          <span className="text-4xl font-extrabold text-stone-900 dark:text-white">
            {offer.discountPercent}% OFF
          </span>
        </div>

        {/* Code copied input field */}
        <div className="relative flex items-center bg-stone-50 dark:bg-stone-950/80 border border-stone-200/60 dark:border-stone-850/80 p-2 rounded-2xl mb-5">
          <span className="flex-1 font-mono font-extrabold text-lg tracking-wider text-stone-850 dark:text-stone-200 select-all pl-4 text-left">
            {offer.promoCode}
          </span>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              copied
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-stone-900 hover:bg-stone-850 dark:bg-stone-800 dark:hover:bg-stone-700 text-white"
            }`}
          >
            {copied ? (
              <>
                <FiCheck size={14} /> Copied
              </>
            ) : (
              <>
                <FiCopy size={14} /> Copy Code
              </>
            )}
          </button>
        </div>

        {/* Expire tag */}
        <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mb-6 flex items-center justify-center gap-1.5 bg-amber-500/10 border border-amber-500/20 py-1.5 px-4 rounded-full w-fit mx-auto animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Hurry! Expires in: <span className="font-mono font-bold text-xs">{formatTime(timeLeft)}</span>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-xl transition-all duration-200 cursor-pointer active:scale-95 text-xs uppercase tracking-wider"
        >
          Claim Offer & Start Shopping
        </button>
      </div>
    </div>
  );
};
