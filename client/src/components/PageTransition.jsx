import { motion } from "framer-motion";

const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  in: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25, // Optimized for speed
      ease: "easeOut",
      when: "beforeChildren", // Animates container before content for smoothness
    },
  },
  out: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

export default function PageTransition({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      className="w-full min-h-screen origin-top" // origin-top makes the slide-down feel more natural
      layout // Prevents layout shifts during theme/content changes
    >
      {children}
    </motion.div>
  );
}