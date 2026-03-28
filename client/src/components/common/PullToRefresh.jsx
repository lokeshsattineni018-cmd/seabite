import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from "framer-motion";
import triggerHaptic from "../../utils/haptics";

/**
 * PullToRefresh Component
 * A custom "Seacoast" themed pull-to-refresh for mobile.
 * Features a descending fishing hook animation.
 */
const PullToRefresh = ({ onRefresh, children }) => {
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const PULL_THRESHOLD = 100; // px

  const handleTouchStart = (e) => {
    if (window.scrollY > 0 || isRefreshing) return;
    startY.current = e.touches[0].pageY;
    isPulling.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isPulling.current) return;
    const currentY = e.touches[0].pageY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Resistance logic
      const progress = Math.min(diff / PULL_THRESHOLD, 1.5);
      setPullProgress(progress);
      
      // Haptic feedback at threshold
      if (progress >= 1 && pullProgress < 1) {
        triggerHaptic("medium");
      }
    } else {
      setPullProgress(0);
      isPulling.current = false;
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullProgress >= 1) {
      setIsRefreshing(true);
      triggerHaptic("heavy");
      onRefresh().finally(() => {
        setIsRefreshing(false);
        setPullProgress(0);
      });
    } else {
      setPullProgress(0);
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full min-h-screen"
    >
      {/* Pull Indicator Area */}
      <div 
        className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-50 overflow-hidden"
        style={{ height: pullProgress * PULL_THRESHOLD }}
      >
        <AnimatePresence>
          {(pullProgress > 0 || isRefreshing) && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ 
                y: isRefreshing ? 20 : (pullProgress * 40 - 20),
                opacity: 1,
                rotate: isRefreshing ? [0, 10, -10, 0] : 0
              }}
              exit={{ y: -50, opacity: 0 }}
              transition={isRefreshing ? { rotate: { repeat: Infinity, duration: 0.5 } } : { type: "spring", damping: 20 }}
              className="flex flex-col items-center"
            >
              {/* The Fishing Hook */}
              <div className="relative flex flex-col items-center">
                {/* Fishing Line */}
                <div className="w-[1px] h-20 bg-[#94A3B8] opacity-40" />
                {/* Hook Icon */}
                <div className="text-3xl filter drop-shadow-md">
                   {isRefreshing ? "🎣" : "🪝"}
                </div>
              </div>
              
              <motion.span 
                animate={{ opacity: pullProgress >= 1 ? 1 : 0.5 }}
                className="text-[10px] font-bold text-[#5BA8A0] uppercase tracking-[0.2em] mt-2"
              >
                {isRefreshing ? "Securing Catch..." : pullProgress >= 1 ? "Release to Refresh" : "Pull to Catch Freshness"}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content with subtle push down */}
      <motion.div
        style={{ 
          y: isRefreshing ? 60 : (pullProgress * 50)
        }}
        transition={isRefreshing ? { type: "spring", damping: 25 } : { type: "tween", ease: "linear" }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
