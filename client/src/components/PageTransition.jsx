import { motion } from "framer-motion";

// --- UNIQUE: "Horizon Sweep" transition ---
// A thin branded progress line sweeps across the top, while content
// fades in with a subtle upward drift + blur clear. Minimal, fast, elegant.

const lineVariants = {
  initial: { scaleX: 0, opacity: 1 },
  animate: {
    scaleX: 1,
    opacity: 0,
    transition: {
      scaleX: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
      opacity: { duration: 0.3, delay: 0.5, ease: "easeOut" },
    },
  },
  exit: {
    scaleX: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: [0.76, 0, 0.24, 1] },
  },
};

const overlayVariants = {
  initial: { opacity: 1 },
  animate: {
    opacity: 0,
    transition: { duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 1,
    transition: { duration: 0.25, ease: [0.76, 0, 0.24, 1] },
  },
};

const contentVariants = {
  initial: {
    opacity: 0,
    y: 40,
    scale: 0.98,
    filter: "blur(10px)",
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.7,
      delay: 0.25,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  out: {
    opacity: 0,
    y: -30,
    scale: 1.02,
    filter: "blur(6px)",
    transition: {
      duration: 0.3,
      ease: [0.76, 0, 0.24, 1],
    },
  },
};

export default function PageTransition({ children }) {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Soft full-screen overlay flash */}
      <motion.div
        variants={overlayVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, transparent 70%)",
          zIndex: 9998,
          pointerEvents: "none",
        }}
      />

      {/* Horizon sweep line -- thin blue bar across top */}
      <motion.div
        variants={lineVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "3px",
          background:
            "linear-gradient(90deg, transparent 0%, #3b82f6 30%, #06b6d4 70%, transparent 100%)",
          transformOrigin: "left",
          zIndex: 9999,
          pointerEvents: "none",
        }}
      />

      {/* Subtle corner accent dots */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0.5, 1, 0.5],
        }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
          transform: "translate(-50%, -50%)",
          zIndex: 9997,
          pointerEvents: "none",
        }}
      />

      {/* Content wrapper with drift + blur-clear */}
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={contentVariants}
        className="w-full min-h-screen"
      >
        {children}
      </motion.div>
    </div>
  );
}