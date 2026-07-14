import React, { useState, useEffect } from "react";
import { FiGift, FiCopy, FiCheck, FiX } from "react-icons/fi";
import confetti from "canvas-confetti";

export const PromoModal = ({ offer, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes default in seconds

  useEffect(() => {
    // Fire confetti on mount
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

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
      particleCount: 30,
      spread: 50,
      origin: { y: 0.6 }
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800/40 rounded-3xl shadow-2xl p-8 overflow-hidden text-center transform transition-all duration-300 scale-100">
        
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800/50"
        >
          <FiX size={20} />
        </button>

        {/* Dynamic Gift Icon container */}
        <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-blue-50 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-6 animate-bounce">
          <FiGift size={40} className="stroke-[1.5]" />
        </div>

        {/* Promo Title */}
        <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-tight mb-2 tracking-tight">
          Admin Special Treat!
        </h3>
        
        {/* Promo Message */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 px-2">
          {offer.message || "We noticed you looking at our fresh seafood collection! Here is a special treat just for you."}
        </p>

        {/* Discount Tag */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100/50 dark:border-blue-900/20 rounded-2xl py-4 px-6 mb-6">
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-1">
            Exclusive Discount
          </span>
          <span className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {offer.discountPercent}% OFF
          </span>
        </div>

        {/* Expiry Alert */}
        <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold mb-6 flex items-center justify-center gap-1.5 bg-amber-50 dark:bg-amber-950/20 py-1.5 px-3 rounded-full w-fit mx-auto">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Offer expires in: <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
        </div>

        {/* Promo Code Box */}
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-800/40 p-2.5 rounded-2xl mb-4">
          <span className="flex-1 font-mono font-extrabold text-lg tracking-wider text-gray-800 dark:text-gray-200 select-all pl-3 text-left">
            {offer.promoCode}
          </span>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              copied
                ? "bg-emerald-500 text-white"
                : "bg-gray-900 hover:bg-gray-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white"
            }`}
          >
            {copied ? (
              <>
                <FiCheck size={14} /> Copied!
              </>
            ) : (
              <>
                <FiCopy size={14} /> Copy
              </>
            )}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all duration-200"
        >
          Claim Offer & Start Shopping
        </button>
      </div>
    </div>
  );
};
