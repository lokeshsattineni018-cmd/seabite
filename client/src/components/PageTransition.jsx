import { motion } from "framer-motion";

// --- ANIMATION VARIANTS ---

const fishPathVariants = {
  initial: { pathLength: 0, pathOffset: 1, opacity: 0 },
  animate: {
    pathLength: [0, 1, 0],
    pathOffset: [1, 0.5, 0],
    opacity: [0, 1, 0],
    transition: {
      duration: 1.2,
      ease: "easeInOut",
      times: [0, 0.5, 1],
    },
  },
};

const rippleVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: 1.2,
    opacity: [0, 0.15, 0],
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

const contentVariants = {
  initial: { opacity: 0, y: 15, filter: "blur(8px)" },
  in: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: { duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] } 
  },
  out: { 
    opacity: 0, 
    y: -10, 
    transition: { duration: 0.4 } 
  },
};

export default function FishTransition({ children }) {
  return (
    <div className="relative w-full overflow-hidden bg-white">
      {/* Floating "Fish" Stroke */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999]">
        <svg width="200" height="100" viewBox="0 0 200 100" fill="none">
          <motion.path
            d="M20 50C40 30 80 30 100 50C120 70 160 70 180 50"
            stroke="url(#fish-gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            variants={fishPathVariants}
            initial="initial"
            animate="animate"
          />
          <defs>
            <linearGradient id="fish-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0" />
              <stop offset="50%" stopColor="#334155" />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Soft Scale/Ripple Background */}
      <motion.div
        variants={rippleVariants}
        initial="initial"
        animate="animate"
        className="fixed inset-0 z-[9998] pointer-events-none flex items-center justify-center"
      >
        <div className="w-[400px] h-[400px] rounded-full border border-slate-200 opacity-20" />
      </motion.div>

      {/* Main Content */}
      <motion.div
        variants={contentVariants}
        initial="initial"
        animate="in"
        exit="out"
      >
        {children}
      </motion.div>
    </div>
  );
}