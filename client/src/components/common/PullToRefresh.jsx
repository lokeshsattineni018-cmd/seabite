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

  const PULL_THRESHOLD = 90; // px

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
      const progress = Math.min(diff / PULL_THRESHOLD, 1.4);
      setPullProgress(progress);
      
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
      <div 
        className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-[100] overflow-hidden"
        style={{ height: 120 }}
      >
        <AnimatePresence>
          {(pullProgress > 0 || isRefreshing) && (
            <motion.div
              initial={{ y: -60, opacity: 0 }}
              animate={{ 
                y: isRefreshing ? 20 : (pullProgress * 50 - 30),
                opacity: 1
              }}
              exit={{ y: -60, opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="relative">
                {/* Bubbles */}
                <AnimatePresence>
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: 20, x: 0, opacity: 0, scale: 0.5 }}
                      animate={{ 
                        y: -40 - (i * 10), 
                        x: (i % 2 === 0 ? 15 : -15) * pullProgress,
                        opacity: [0, 0.8, 0],
                        scale: [0.5, 1, 0.5]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                      style={{ position: "absolute", left: "50%", width: 8, height: 8, borderRadius: "50%", border: "1.5px solid #5BA8A0", opacity: 0.3 }}
                    />
                  ))}
                </AnimatePresence>

                {/* The Dolphin */}
                <motion.div
                  animate={{ 
                    rotate: isRefreshing ? [0, -15, 15, 0] : (pullProgress * 10 - 5),
                    scale: isRefreshing ? [1, 1.1, 1] : (0.8 + pullProgress * 0.2),
                    y: isRefreshing ? [0, -10, 0] : 0
                  }}
                  transition={isRefreshing ? { repeat: Infinity, duration: 0.6 } : {}}
                  className="w-16 h-16 flex items-center justify-center"
                >
                  <svg viewBox="0 0 24 24" className="w-12 h-12 fill-[#5BA8A0] drop-shadow-lg">
                    <path d="M21,12c0-4.97-4.03-9-9-9s-9,4.03-9,9s4.03,9,9,9S21,16.97,21,12z M12,19c-3.87,0-7-3.13-7-7s3.13-7,7-7s7,3.13,7,7S15.87,19,12,19z" opacity="0.2"/>
                    <text x="2" y="18" fontSize="16">🐬</text>
                  </svg>
                </motion.div>
              </div>
              
              <motion.span 
                animate={{ opacity: pullProgress >= 1 ? 1 : 0.6, scale: pullProgress >= 1 ? 1.05 : 1 }}
                className="text-[10px] font-black text-[#5BA8A0] uppercase tracking-[0.25em] mt-3"
              >
                {isRefreshing ? "CATCHING FRESHNESS..." : pullProgress >= 1 ? "RELEASE THE DOLPHIN!" : "PULL FOR FRESH CATCH"}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        style={{ 
          y: isRefreshing ? 80 : (pullProgress * 70)
        }}
        transition={isRefreshing ? { type: "spring", damping: 25, stiffness: 200 } : { type: "tween", ease: "linear" }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
