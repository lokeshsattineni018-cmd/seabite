import { motion } from "framer-motion";

const curtainVariants = {
  initial: { scaleY: 0, transformOrigin: "top" },
  animate: {
    scaleY: [0, 1, 1, 0],
    transformOrigin: ["top", "top", "bottom", "bottom"],
    transition: {
      duration: 1,
      times: [0, 0.3, 0.7, 1],
      ease: [0.76, 0, 0.24, 1]
    }
  }
};

const dotVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: (i) => ({
    scale: [0, 1, 0],
    opacity: [0, 1, 0],
    transition: {
      duration: 0.8,
      delay: i * 0.08,
      ease: "easeOut"
    }
  })
};

const contentVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  out: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};

export default function PageTransition({ children }) {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Minimal curtain wipe */}
      <motion.div
        variants={curtainVariants}
        initial="initial"
        animate="animate"
        className="fixed left-0 top-0 w-full h-full z-[9999] pointer-events-none bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900"
      />

      {/* Elegant dot grid */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 grid grid-cols-5 gap-4 z-[9998] pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={dotVariants}
            initial="initial"
            animate="animate"
            className="w-3 h-3 rounded-full bg-blue-400"
            style={{
              boxShadow: "0 0 20px rgba(59,130,246,0.8)"
            }}
          />
        ))}
      </div>

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