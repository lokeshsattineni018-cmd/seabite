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
    <section className="py-14 overflow-hidden border-y border-[#E2EEEC] relative" style={{ background: "linear-gradient(180deg, #F4F9F8 0%, #ffffff 50%, #F4F9F8 100%)" }}>
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
          className="inline-flex items-center gap-2 bg-yellow-400/10 px-4 py-2 rounded-full text-xs font-bold text-yellow-700 uppercase tracking-widest mb-6 border border-yellow-400/25"
        >
          <Flame size={14} /> Customer Favorites
        </motion.div>

        <TextReveal
          text="Best Sellers"
          className="text-4xl md:text-5xl font-serif text-slate-900 mb-4"
        />

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-slate-500 max-w-2xl"
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