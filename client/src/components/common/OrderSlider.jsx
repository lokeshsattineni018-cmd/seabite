import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { MoveRight, Check, ChevronRight } from "lucide-react";
import triggerHaptic from "../../utils/haptics";

/**
 * OrderSlider Component
 * A premium "Slide to Place Order" interactive slider.
 * Prevents accidental orders and adds a "native app" feel.
 */
const OrderSlider = ({ onConfirm, disabled, text = "Slide to Secure Your Catch" }) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const x = useMotionValue(0);
  
  // Transform values for animation
  const opacity = useTransform(x, [0, 50], [1, 0]);
  const color = useTransform(x, [0, 200], ["#1A2B35", "#5BA8A0"]);
  const iconRotate = useTransform(x, [0, 200], [0, 45]);
  const width = useTransform(x, [0, 240], ["0%", "100%"]);

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 200) {
      x.set(240); // Lock it
      setIsSuccess(true);
      triggerHaptic("heavy");
      setTimeout(() => {
        onConfirm();
      }, 400);
    } else {
      x.set(0);
      triggerHaptic("soft");
    }
  };

  return (
    <div className={`relative w-full h-14 bg-[#F1F5F9] rounded-2xl p-1 overflow-hidden select-none ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Track Background Text */}
      <motion.div 
        style={{ opacity }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div className="flex items-center gap-2">
           <span className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-[0.1em]">
            {text}
          </span>
          <div className="flex gap-1">
             <ChevronRight size={14} className="text-[#94A3B8] animate-pulse" />
             <ChevronRight size={14} className="text-[#94A3B8] animate-pulse delay-75" />
             <ChevronRight size={14} className="text-[#94A3B8] animate-pulse delay-150" />
          </div>
        </div>
      </motion.div>

      {/* Progress Fill */}
      <motion.div 
        style={{ width, backgroundColor: "#5BA8A0" }}
        className="absolute top-1 bottom-1 left-1 rounded-xl opacity-20"
      />

      {/* Slider Handle */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 240 }}
        dragElastic={0.1}
        style={{ x }}
        onDrag={() => triggerHaptic("soft")}
        onDragEnd={handleDragEnd}
        animate={isSuccess ? { x: 240 } : {}}
        className={`relative z-10 w-12 h-12 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center justify-center cursor-grab active:cursor-grabbing border border-[#E2EEEC] ${isSuccess ? "bg-[#5BA8A0] border-[#5BA8A0]" : ""}`}
      >
        {isSuccess ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <Check size={20} className="text-white" strokeWidth={3} />
          </motion.div>
        ) : (
          <motion.div style={{ color }}>
             <MoveRight size={22} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default OrderSlider;
