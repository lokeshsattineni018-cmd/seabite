import { motion } from "framer-motion";

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -12,
  },
};

const pageTransition = {
  type: "tween",
  ease: [0.25, 1, 0.5, 1], // Custom cubic-bezier for smooth deceleration
  duration: 0.35,
};

export default function PageTransition({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      style={{ display: "flex", flexDirection: "column", minHeight: "100%", width: "100%" }}
    >
      {children}
    </motion.div>
  );
}
