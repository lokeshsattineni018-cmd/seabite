import { motion } from "framer-motion";

const irisVariants = {
  initial: { 
    clipPath: "circle(0% at 50% 50%)",
  },
  animate: {
    clipPath: "circle(150% at 50% 50%)",
    transition: {
      duration: 0.8,
      ease: [0.76, 0, 0.24, 1],
    }
  },
  exit: {
    clipPath: "circle(0% at 50% 50%)",
    transition: {
      duration: 0.6,
      ease: [0.76, 0, 0.24, 1],
    }
  }
};

const glowVariants = {
  initial: { opacity: 0, scale: 0 },
  animate: {
    opacity: [0, 0.6, 0],
    scale: [0.8, 1.2, 1],
    transition: {
      duration: 1,
      ease: "easeOut"
    }
  }
};

const contentVariants = {
  initial: {
    opacity: 0,
    filter: "blur(30px) brightness(1.3)",
  },
  in: {
    opacity: 1,
    filter: "blur(0px) brightness(1)",
    transition: {
      duration: 0.6,
      delay: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  out: {
    opacity: 0,
    filter: "blur(30px) brightness(0.7)",
    transition: {
      duration: 0.4,
    },
  },
};

export default function PageTransition({ children }) {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Iris reveal overlay */}
      <motion.div
        variants={irisVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="fixed inset-0 z-[9999] pointer-events-none"
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #581c87 100%)",
        }}
      />

      {/* Center glow pulse */}
      <motion.div
        variants={glowVariants}
        initial="initial"
        animate="animate"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full z-[9998] pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Spinning ring */}
      <motion.div
        initial={{ opacity: 0, rotate: 0, scale: 0 }}
        animate={{
          opacity: [0, 1, 0],
          rotate: 360,
          scale: [0.5, 1, 1.2],
          transition: {
            duration: 1,
            ease: "easeOut"
          }
        }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full z-[9998] pointer-events-none border-4 border-blue-400"
        style={{
          boxShadow: "0 0 40px rgba(59,130,246,0.6)",
        }}
      />

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