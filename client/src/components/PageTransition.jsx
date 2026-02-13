import React from "react";
import { motion } from "framer-motion";

// --- ANIMATION VARIANTS ---

const finVariants = {
  initial: { 
    x: "-120%", 
    skewX: -15, 
    opacity: 0 
  },
  animate: {
    x: "150%",
    skewX: 0,
    opacity: [0, 0.7, 0], // The "Shimmer" peak
    transition: {
      duration: 1.5,
      ease: [0.22, 1, 0.36, 1], // "Glide" easing
    },
  },
};

const contentVariants = {
  initial: { 
    opacity: 0, 
    y: 10, 
    filter: "blur(12px) brightness(1.3)" 
  },
  in: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px) brightness(1)",
    transition: { 
      duration: 1, 
      delay: 0.35, 
      ease: "easeOut" 
    } 
  },
  out: { 
    opacity: 0, 
    y: -10, 
    filter: "blur(4px)",
    transition: { duration: 0.4 } 
  },
};

const backgroundRipple = {
  initial: { scale: 0.95, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { duration: 1.2, ease: "easeOut" }
  }
};

export default function SeafoodTransition({ children }) {
  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#fafafa]">
      
      {/* 1. THE SILKY FIN SWEEP */}
      {/* This mimics the silver-side flash of a fish swimming past */}
      <motion.div
        variants={finVariants}
        initial="initial"
        animate="animate"
        className="fixed top-0 left-0 w-[70%] h-full z-[9999] pointer-events-none"
        style={{
          background: `linear-gradient(110deg, 
            transparent 0%, 
            rgba(186, 230, 253, 0.1) 25%, 
            rgba(255, 255, 255, 0.9) 50%, 
            rgba(200, 220, 255, 0.2) 75%, 
            transparent 100%)`,
          backdropFilter: "blur(6px)", // Adds a refractive water-like distortion
        }}
      />

      {/* 2. SUBTLE "OYSTER" TEXTURE OVERLAY */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.04 }}
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 60c16.569 0 30-13.431 30-30S46.569 0 30 0 0 13.431 0 30s13.431 30 30 30zm0-2C14.536 58 2 45.464 2 30S14.536 2 30 2s28 12.536 28 28-12.536 28-28 28z' fill='%230ea5e9' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '80px',
        }}
      />

      {/* 3. MAIN CONTENT REVEAL */}
      <motion.div
        variants={contentVariants}
        initial="initial"
        animate="in"
        exit="out"
        className="relative z-10"
      >
        {children}
      </motion.div>

      {/* 4. SOFT VIGNETTE (Adds Depth) */}
      <div 
        className="fixed inset-0 pointer-events-none z-[5]" 
        style={{
          background: "radial-gradient(circle at center, transparent 40%, rgba(200, 230, 255, 0.05) 100%)"
        }}
      />
    </div>
  );
}