import { motion } from "framer-motion";

const blobVariants = {
  initial: { 
    scale: 0, 
    rotate: 0,
    borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%"
  },
  animate: {
    scale: [0, 15, 0],
    rotate: [0, 90, 180],
    borderRadius: [
      "30% 70% 70% 30% / 30% 30% 70% 70%",
      "70% 30% 30% 70% / 70% 70% 30% 30%",
      "50% 50% 50% 50% / 50% 50% 50% 50%"
    ],
    transition: {
      duration: 1.2,
      ease: [0.76, 0, 0.24, 1],
      times: [0, 0.5, 1]
    }
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: { duration: 0.4 }
  }
};

const contentVariants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    filter: "blur(20px)",
    rotateX: 10,
  },
  in: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    rotateX: 0,
    transition: {
      duration: 0.8,
      delay: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  out: {
    opacity: 0,
    scale: 1.1,
    filter: "blur(20px)",
    transition: {
      duration: 0.4,
      ease: [0.76, 0, 0.24, 1],
    },
  },
};

export default function PageTransition({ children }) {
  return (
    <div className="relative w-full overflow-hidden" style={{ perspective: "1200px" }}>
      {/* Liquid blob morph */}
      <motion.div
        variants={blobVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="fixed top-1/2 left-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2 z-[9999] pointer-events-none"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
          filter: "blur(40px)",
        }}
      />

      {/* Particle burst */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 0, 
            x: 0, 
            y: 0,
            scale: 0 
          }}
          animate={{
            opacity: [0, 1, 0],
            x: [0, Math.cos(i * 45 * Math.PI / 180) * 200],
            y: [0, Math.sin(i * 45 * Math.PI / 180) * 200],
            scale: [0, 1, 0],
            transition: {
              duration: 0.8,
              delay: 0.2 + i * 0.05,
              ease: "easeOut"
            }
          }}
          className="fixed top-1/2 left-1/2 w-2 h-2 rounded-full z-[9998] pointer-events-none"
          style={{
            background: `hsl(${i * 45}, 70%, 60%)`,
            boxShadow: `0 0 20px hsl(${i * 45}, 70%, 60%)`
          }}
        />
      ))}

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