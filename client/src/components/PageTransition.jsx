import { motion } from "framer-motion";

const glitchVariants = {
  initial: { opacity: 1 },
  animate: {
    opacity: [1, 0.8, 1, 0.6, 1, 0],
    x: [0, -10, 5, -5, 10, 0],
    transition: {
      duration: 0.6,
      times: [0, 0.2, 0.4, 0.6, 0.8, 1],
    }
  }
};

const scanlineVariants = {
  initial: { y: "-100%" },
  animate: {
    y: "100%",
    transition: {
      duration: 0.8,
      ease: "linear",
      repeat: 1
    }
  }
};

const contentVariants = {
  initial: {
    opacity: 0,
    filter: "blur(20px) contrast(1.3)",
    x: -50,
  },
  in: {
    opacity: 1,
    filter: "blur(0px) contrast(1)",
    x: 0,
    transition: {
      duration: 0.7,
      delay: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  out: {
    opacity: 0,
    filter: "blur(20px) contrast(0.8)",
    x: 50,
    transition: {
      duration: 0.4,
    },
  },
};

export default function PageTransition({ children }) {
  return (
    <div className="relative w-full overflow-hidden">
      {/* RGB Split glitch overlay */}
      <motion.div
        variants={glitchVariants}
        initial="initial"
        animate="animate"
        className="fixed inset-0 z-[9999] pointer-events-none"
        style={{
          background: "black",
          mixBlendMode: "multiply",
        }}
      />

      {/* Red channel shift */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0.3, 0.3, 0],
          x: [-5, 5, -5, 0],
          transition: { duration: 0.5 }
        }}
        className="fixed inset-0 z-[9998] pointer-events-none bg-red-500"
        style={{ mixBlendMode: "screen" }}
      />

      {/* Scanline effect */}
      <motion.div
        variants={scanlineVariants}
        initial="initial"
        animate="animate"
        className="fixed left-0 w-full h-1 z-[9998] pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, rgba(0,255,255,0.4), transparent)",
          boxShadow: "0 0 20px rgba(0,255,255,0.8)",
        }}
      />

      {/* Digital noise */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0.15, 0.15, 0],
          transition: { duration: 0.5 }
        }}
        className="fixed inset-0 z-[9997] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          opacity: 0.15
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