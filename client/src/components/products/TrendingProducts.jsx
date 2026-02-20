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
  const [globalDiscount, setGlobalDiscount] = useState(0); // 🟢 NEW

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/products`);
        const all = res.data.products || [];
        const trending = all.filter((p) => p.trending).slice(0, 8);
        setProducts([...trending, ...trending, ...trending]);
        setGlobalDiscount(res.data.globalDiscount || 0); // 🟢 Capture Discount
      } catch (err) {
        // Fallback or silent fail
      }
    };
    fetchTrending();
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-12 overflow-hidden border-y border-[#E8EEF2] transition-colors duration-300 relative bg-[#FDF9F4]/50">
      {/* Decorative Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute top-10 left-10 w-72 h-72 bg-[#5BA8A0] rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#E8816A] rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 mb-12 flex flex-col items-center text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-[#FAF4EC] backdrop-blur px-4 py-2 rounded-full text-xs font-bold text-[#8B6D45] uppercase tracking-widest mb-6 border border-[#EAD9C0]"
        >
          <Flame size={14} /> Customer Favorites
        </motion.div>

        <TextReveal
          text="Best Sellers"
          className="text-4xl md:text-5xl font-bold text-[#1A2B35] transition-colors duration-300 mb-4"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
        />

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-[#4A6572] max-w-2xl"
        >
          Handpicked from our ocean-fresh collection. These crowd favorites fly off the shelves!
        </motion.p>
      </div>

      <div className="relative w-full z-10">
        <motion.div
          className="flex gap-6 w-max pl-6"
          animate={{ x: ["0%", "-33.33%"] }}
          transition={{
            repeat: Infinity,
            duration: 40,
            ease: "linear",
          }}
        >
          {products.map((p, i) => (
            <div key={`${p._id}-${i}`} className="w-[280px] shrink-0">
              <EnhancedProductCard product={p} globalDiscount={globalDiscount} /> {/* 🟢 Pass Prop */}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}