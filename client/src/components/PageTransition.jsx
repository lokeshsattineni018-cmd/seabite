import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- ANIMATION VARIANTS ---

const finVariants = {
  initial: { x: "-150%", skewX: -25, opacity: 0 },
  animate: {
    x: "150%",
    skewX: 0,
    opacity: [0, 0.6, 0],
    transition: {
      duration: 1.6,
      ease: [0.23, 1, 0.32, 1],
    },
  },
};

const contentVariants = {
  initial: { opacity: 0, scale: 0.99, filter: "blur(15px) brightness(1.5)" },
  in: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px) brightness(1)",
    transition: { duration: 1.2, delay: 0.4, ease: "easeOut" },
  },
  out: { opacity: 0, filter: "blur(5px)", transition: { duration: 0.4 } },
};

export default function SeafoodLuxuryTransition({ children }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#fcfcfc] cursor-none">
      
      {/* 1. CUSTOM WATER-DROP CURSOR */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-sky-400/30 z-[10000] pointer-events-none"
        animate={{ x: mousePos.x - 16, y: mousePos.y - 16 }}
        transition={{ type: "spring", damping: 25, stiffness: 250, mass: 0.5 }}
        style={{ background: "radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 80%)" }}
      />
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-sky-500 rounded-full z-[10001] pointer-events-none"
        animate={{ x: mousePos.x - 4, y: mousePos.y - 4 }}
        transition={{ type: "spring", damping: 35, stiffness: 400, mass: 0.2 }}
      />

      {/* 2. THE PROMINENT SILVER FIN SWEEP */}
      <motion.div
        variants={finVariants}
        initial="initial"
        animate="animate"
        className="fixed top-0 left-0 w-[80%] h-full z-[9999] pointer-events-none"
        style={{
          background: `linear-gradient(110deg, 
            transparent 0%, 
            rgba(200, 220, 255, 0.1) 20%, 
            rgba(255, 255, 255, 0.8) 50%, 
            rgba(186, 230, 253, 0.2) 80%, 
            transparent 100%)`,
          backdropFilter: "blur(4px)",
        }}
      />

      {/* 3. REFRACTIVE OVERLAY (The "Water" look) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.05, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
        className="fixed inset-0 z-[9997] pointer-events-none"
        style={{
          backgroundImage: `url("https://www.transparenttextures.com/patterns/cubes.png")`, // Subtle scale-like texture
          opacity: 0.03
        }}
      />

      {/* 4. MAIN CONTENT */}
      <motion.div
        variants={contentVariants}
        initial="initial"
        animate="in"
        exit="out"
        className="relative z-10"
      >
        {children}
      </motion.div>

      {/* CSS for custom cursor hide on other elements if needed */}
      <style jsx global>{`
        html, body {
          cursor: none !important;
        }
        a, button {
          cursor: none !important;
        }
      `}</style>
    </div>
  );
}