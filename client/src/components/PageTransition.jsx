import { motion, AnimatePresence } from "framer-motion";

// Variants for the SeaBite Logo
const logoVariants = {
  initial: { 
    scale: 0.8, 
    opacity: 0, 
    filter: "brightness(1) blur(10px)" 
  },
  animate: { 
    scale: [0.8, 1.1, 1], // Subtle "heartbeat" or "bite" pop
    opacity: [0, 1, 1, 0], // Fade in, stay, then fade out
    filter: "blur(0px)",
    transition: { 
      duration: 1.2, 
      times: [0, 0.2, 0.8, 1],
      ease: "easeInOut" 
    }
  },
};

// Variants for the Page Content reveal
const pageVariants = {
  initial: { 
    opacity: 0, 
    clipPath: "circle(0% at 50% 50%)", // "Bite" reveal from center
  },
  in: { 
    opacity: 1, 
    clipPath: "circle(150% at 50% 50%)", 
    transition: { 
      duration: 0.8, 
      delay: 0.8, // Starts as logo begins to fade
      ease: [0.4, 0, 0.2, 1] 
    }
  },
  out: { 
    opacity: 0, 
    scale: 1.05,
    filter: "blur(10px)",
    transition: { duration: 0.4 } 
  }
};

export default function PageTransition({ children }) {
  return (
    <>
      {/* Loading Overlay Layer */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "#ffffff", // Matches your site background
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <motion.div
          variants={logoVariants}
          initial="initial"
          animate="animate"
        >
          {/* Replace this with your actual SeaBite Logo SVG or Image */}
          <img 
            src="/logo.png" 
            alt="SeaBite Logo" 
            style={{ width: "120px", height: "auto" }} 
          />
        </motion.div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="in"
        exit="out"
      >
        {children}
      </motion.div>
    </>
  );
}