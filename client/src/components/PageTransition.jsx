// src/components/PageTransition.jsx
import { motion } from "framer-motion";

// Curtain overlay that wipes across the screen during route changes
const curtainVariants = {
  initial: {
    scaleX: 1,
  },
  animate: {
    scaleX: 0,
    transition: {
      duration: 0.5,
      ease: [0.76, 0, 0.24, 1], // custom cubic-bezier for snappy feel
    },
  },
  exit: {
    scaleX: 1,
    transition: {
      duration: 0.4,
      ease: [0.76, 0, 0.24, 1],
    },
  },
};

// Main content animation with a staggered clip-path reveal
const contentVariants = {
  initial: {
    opacity: 0,
    y: 40,
    scale: 0.98,
    filter: "blur(8px)",
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      delay: 0.3,
      ease: [0.22, 1, 0.36, 1], // smooth overshoot
    },
  },
  out: {
    opacity: 0,
    y: -30,
    scale: 0.97,
    filter: "blur(4px)",
    transition: {
      duration: 0.3,
      ease: [0.76, 0, 0.24, 1],
    },
  },
};

export default function PageTransition({ children }) {
  return (
    <>
      {/* Wipe curtain overlay */}
      <motion.div
        variants={curtainVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0ea5e9, #0369a1)",
          transformOrigin: "right",
          zIndex: 9999,
          pointerEvents: "none",
        }}
      />

      {/* Second curtain layer for depth (slightly delayed) */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{
          scaleX: 0,
          transition: {
            duration: 0.5,
            delay: 0.1,
            ease: [0.76, 0, 0.24, 1],
          },
        }}
        exit={{
          scaleX: 1,
          transition: {
            duration: 0.4,
            delay: 0.05,
            ease: [0.76, 0, 0.24, 1],
          },
        }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0284c7, #075985)",
          transformOrigin: "right",
          zIndex: 9998,
          pointerEvents: "none",
        }}
      />

      {/* Page content with blur + scale + slide reveal */}
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={contentVariants}
        className="w-full min-h-screen"
      >
        {children}
      </motion.div>
    </>
  );
}
