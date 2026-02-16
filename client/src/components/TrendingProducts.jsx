import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useVelocity, useSpring, useTransform, useAnimationFrame, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";
import axios from "axios";
import EnhancedProductCard from "./EnhancedProductCard";

const API_URL = import.meta.env.VITE_API_URL || "";

// Custom TextReveal for consistency (simplified version)
const TextReveal = ({ text, className = "" }) => (
  <motion.h2
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={className}
  >
    {text}
  </motion.h2>
);

export default function TrendingProducts() {
  const [products, setProducts] = useState([]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/products`);
        const all = res.data.products || [];
        const trending = all.filter((p) => p.trending).slice(0, 8);
        // Triple them for smooth infinite scroll
        setProducts([...trending, ...trending, ...trending]);
      } catch (err) {
        // Fallback or silent fail
      }
    };
    fetchTrending();
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-24 overflow-hidden border-y border-gray-200 dark:border-white/5 transition-colors duration-300 relative bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0a1625] dark:via-[#0d1a2d] dark:to-[#0a1625]">
      {/* Decorative Background */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 mb-12 flex flex-col items-center text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-yellow-400/10 backdrop-blur px-4 py-2 rounded-full text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-widest mb-6 border border-yellow-400/20"
        >
          <Flame size={14} /> Customer Favorites
        </motion.div>

        <TextReveal
          text="Best Sellers"
          className="text-4xl md:text-5xl font-serif text-slate-900 dark:text-white transition-colors duration-300 mb-4"
        />

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-slate-600 dark:text-slate-400 max-w-2xl"
        >
          Handpicked from our ocean-fresh collection. These crowd favorites fly off the shelves!
        </motion.p>
      </div>

      <div
        className="relative w-full z-10"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <motion.div
          className="flex gap-6 w-max pl-6"
          animate={{ x: isPaused ? undefined : ["0%", "-33.33%"] }}
          transition={{
            repeat: Infinity,
            duration: 40, // Slightly slower for better readability
            ease: "linear",
            ...(isPaused && { duration: 0 })
          }}
        >
          {products.map((p, i) => (
            <div key={`${p._id}-${i}`} className="w-[280px] shrink-0">
              <EnhancedProductCard product={p} />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Pause indicator */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="text-center mt-8 relative z-10"
          >
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide">
              Paused on hover
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}