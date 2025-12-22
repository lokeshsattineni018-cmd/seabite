import { motion } from "framer-motion";

const pageVariants = {
  initial: { 
    opacity: 0, 
    y: 10, // Reduced distance for faster feel
    scale: 0.99 
  },
  in: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.4, // Faster entrance
      ease: "easeOut" 
    } 
  },
  out: { 
    opacity: 0, 
    y: -10, // Slight movement up
    scale: 0.99,
    transition: { 
      duration: 0.2, // Very fast exit to prevent lag
      ease: "easeIn" 
    } 
  }
};

export default function PageTransition({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      className="w-full min-h-screen"
    >
      {children}
    </motion.div>
  );
}