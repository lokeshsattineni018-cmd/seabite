import React, { useState, useEffect } from "react";
import { FiGift, FiCopy, FiCheck, FiX, FiAward } from "react-icons/fi";
import confetti from "canvas-confetti";

export const PromoModal = ({ offer, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes default in seconds

  useEffect(() => {
    // Fire elegant SeaBite brand-colored confetti (Teal and Coral)
    const end = Date.now() + (1 * 1000);
    const colors = ['#5BA8A0', '#E8816A', '#1A2B35', '#89C2D9'];

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
      particleCount: 40,
      spread: 60,
      colors: ['#5BA8A0', '#E8816A'],
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1A2B35]/60 backdrop-blur-sm p-4 font-sans animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-white border border-[#E2EEEC] rounded-[28px] shadow-[0_20px_50px_rgba(26,43,53,0.15)] p-8 text-center transform transition-all duration-300 scale-100"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#8BA5B3] hover:text-[#1A2B35] transition-colors p-2 rounded-full hover:bg-[#F4F9F8]"
        >
          <FiX size={18} />
        </button>

        {/* Brand Gift Container */}
        <div 
          className="mx-auto w-20 h-20 rounded-[22px] flex items-center justify-center text-white shadow-md mb-6 animate-bounce"
          style={{ background: "#5BA8A0" }}
        >
          <FiGift size={36} className="stroke-[1.5]" />
        </div>

        {/* Brand Pill */}
        <div 
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border rounded-full mb-4"
          style={{ background: "rgba(91,168,160,0.08)", borderColor: "rgba(91,168,160,0.2)" }}
        >
          <FiAward style={{ color: "#5BA8A0" }} size={14} />
          <span 
            className="text-[10px] font-extrabold uppercase tracking-wider"
            style={{ color: "#5BA8A0" }}
          >
            Exclusive Storefront Reward
          </span>
        </div>

        {/* Title */}
        <h3 
          className="text-2xl font-extrabold leading-tight mb-2 tracking-tight"
          style={{ color: "#1A2B35" }}
        >
          Special Deal Unlocked!
        </h3>
        
        {/* Subtitle */}
        <p 
          className="text-xs mb-6 px-4 font-medium leading-relaxed"
          style={{ color: "#4A6572" }}
        >
          {offer.message || "We noticed you looking at our fresh seafood collection! Here is a special treat just for you."}
        </p>

        {/* Discount Box */}
        <div 
          className="border rounded-[20px] py-5 px-6 mb-6"
          style={{ background: "#F4F9F8", borderColor: "#E2EEEC" }}
        >
          <span 
            className="text-[10px] font-extrabold uppercase tracking-widest block mb-1"
            style={{ color: "#8BA5B3" }}
          >
            EXCLUSIVE SAVINGS
          </span>
          <span 
            className="text-4xl font-black"
            style={{ color: "#1A2B35" }}
          >
            {offer.discountPercent}% OFF
          </span>
        </div>

        {/* Code copied input field */}
        <div 
          className="relative flex items-center border p-2 rounded-[18px] mb-5"
          style={{ background: "#F4F9F8", borderColor: "#E2EEEC" }}
        >
          <span 
            className="flex-1 font-mono font-black text-lg tracking-wider select-all pl-4 text-left"
            style={{ color: "#1A2B35" }}
          >
            {offer.promoCode}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-[12px] text-xs font-bold transition-all duration-200 cursor-pointer text-white"
            style={{ 
              background: copied ? "#5BA8A0" : "#1A2B35",
              boxShadow: copied ? "0 4px 12px rgba(91,168,160,0.2)" : "none"
            }}
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
        <div 
          className="text-[11px] font-bold mb-6 flex items-center justify-center gap-1.5 border py-1.5 px-4 rounded-full w-fit mx-auto animate-pulse"
          style={{ 
            background: "rgba(232,129,106,0.08)", 
            borderColor: "rgba(232,129,106,0.2)",
            color: "#E8816A"
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#E8816A" }} />
          Hurry! Expires in: <span className="font-mono font-black text-xs">{formatTime(timeLeft)}</span>
        </div>

        <button
          onClick={onClose}
          className="w-full text-white font-extrabold py-4 px-6 rounded-[18px] transition-all duration-200 cursor-pointer active:scale-95 text-xs uppercase tracking-wider"
          style={{ 
            background: "#5BA8A0",
            boxShadow: "0 6px 20px rgba(91,168,160,0.25)"
          }}
        >
          Apply Promo & Start Shopping
        </button>
      </div>
    </div>
  );
};
