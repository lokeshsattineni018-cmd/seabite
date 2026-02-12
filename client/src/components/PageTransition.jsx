import { motion } from "framer-motion";

const curtainVariants = {
  initial: { scaleX: 1 },
  animate: {
    scaleX: 0,
    transition: { 
      duration: 0.6, 
      ease: [0.76, 0, 0.24, 1],
      delay: 0.2 // Small delay to let the content render behind it
    },
  },
  exit: {
    scaleX: 1,
    transition: { 
      duration: 0.4, 
      ease: [0.76, 0, 0.24, 1] 
    },
  },
};

const contentVariants = {
  initial: { opacity: 0, y: 20 },
  in: {
    opacity: 1,
    y: 0,
    transition: { 
      duration: 0.5, 
      delay: 0.5, // Matches the curtain reveal
      ease: [0.22, 1, 0.36, 1] 
    },
  },
  out: {
    opacity: 0,
    y: -20,
    transition: { 
      duration: 0.3, 
      ease: [0.76, 0, 0.24, 1] 
    },
  },
};

export default function PageTransition({ children }) {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Primary Curtain with Logo */}
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
          transformOrigin: "left", // Changed to left for more consistent wipe
          zIndex: 9999,
          pointerEvents: "none", // Critical: Allows clicking through to the page
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {/* SeaBite Branding on the curtain */}
        <motion.img 
          src="/seabite-logo.png" 
          alt="SeaBite"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ width: "150px", height: "auto" }}
        />
      </motion.div>

      {/* Second curtain layer for depth */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{
          scaleX: 0,
          transition: { duration: 0.6, delay: 0.3, ease: [0.76, 0, 0.24, 1] },
        }}
        exit={{ scaleX: 1 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0284c7, #075985)",
          transformOrigin: "left",
          zIndex: 9998,
          pointerEvents: "none",
        }}
      />

      {/* Content wrapper */}
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