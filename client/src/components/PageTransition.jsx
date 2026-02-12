import { motion } from "framer-motion";

const curtainVariants = {
  initial: { scaleX: 1 },
  animate: {
    scaleX: 0,
    transition: { duration: 0.5, ease: [0.76, 0, 0.24, 1] },
  },
  exit: {
    scaleX: 1,
    transition: { duration: 0.4, ease: [0.76, 0, 0.24, 1] },
  },
};

const contentVariants = {
  initial: { opacity: 0, y: 40, scale: 0.98, filter: "blur(8px)" },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
  out: {
    opacity: 0,
    y: -30,
    scale: 0.97,
    filter: "blur(4px)",
    transition: { duration: 0.3, ease: [0.76, 0, 0.24, 1] },
  },
};

export default function PageTransition({ children }) {
  return (
    <>
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
          transformOrigin: "right",
          zIndex: 9999,
          pointerEvents: "none",
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
          style={{ width: "150px", height: "auto" }}
        />
      </motion.div>

      {/* Second curtain layer for depth */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{
          scaleX: 0,
          transition: { duration: 0.5, delay: 0.1, ease: [0.76, 0, 0.24, 1] },
        }}
        exit={{
          scaleX: 1,
          transition: { duration: 0.4, delay: 0.05, ease: [0.76, 0, 0.24, 1] },
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