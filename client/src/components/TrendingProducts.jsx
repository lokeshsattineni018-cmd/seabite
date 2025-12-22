// client/src/components/TrendingProducts.jsx (PREMIUM UI UPGRADE)

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowRight, FiHeart, FiShoppingBag } from "react-icons/fi";

// Mock Data (Styled for the Dark Ocean Aesthetic)
const mockProducts = [
  { id: 1, name: "Norwegian Salmon", price: "₹1,950", image: "/fish.png", tag: "Best Seller", color: "from-blue-500/20" },
  { id: 2, name: "Tiger Prawns", price: "₹1,450", image: "/prawn.png", tag: "Fresh Catch", color: "from-emerald-500/20" },
  { id: 3, name: "Blue Crab", price: "₹2,200", image: "/crab.png", tag: "Wild Caught", color: "from-cyan-500/20" },
  { id: 4, name: "Lobster Tail", price: "₹3,800", image: "/fish.png", tag: "Premium", color: "from-indigo-500/20" },
];

export default function TrendingProducts() {
  return (
    <section className="py-32 bg-[#0a1625] relative overflow-hidden">
      
      {/* Background Ambience Decor */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute right-0 top-0 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-serif font-bold text-white mb-4 tracking-tighter">
              Trending <span className="text-blue-500 italic">Now</span>
            </h2>
            <p className="text-blue-300/60 font-medium tracking-wide">Customer favorites from this week's harvest.</p>
          </motion.div>
          
          <Link to="/products" className="group flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-blue-400 hover:text-white transition-all pb-2 border-b border-blue-500/20 hover:border-white">
            Explore All 
            <FiArrowRight className="transition-transform group-hover:translate-x-2" />
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {mockProducts.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="group"
            >
              <div className="relative bg-[#0e1d30] rounded-[2.5rem] p-8 mb-6 border border-white/5 transition-all duration-500 hover:border-blue-500/30 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden">
                
                {/* Dynamic Background Glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${product.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

                {/* Badge */}
                <div className="absolute top-6 left-6 bg-blue-500/10 border border-blue-500/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 z-20 shadow-lg">
                  {product.tag}
                </div>

                {/* Like Button */}
                <motion.button 
                    whileTap={{ scale: 0.8 }}
                    className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-white/10 transition-all z-20"
                >
                  <FiHeart size={18} />
                </motion.button>

                {/* Image Area */}
                <Link to={`/products/${product.id}`}>
                  <div className="h-52 flex items-center justify-center relative z-10">
                    <motion.img
                      whileHover={{ scale: 1.15, rotate: -5, y: -10 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]"
                    />
                    {/* Floor Shadow */}
                    <div className="absolute bottom-4 w-1/2 h-4 bg-black/40 blur-xl rounded-full transform scale-x-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>

                {/* Quick Add Button (Bottom Slide-in) */}
                <div className="absolute bottom-6 left-0 w-full px-8 flex justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 z-20">
                  <button className="w-full bg-white text-slate-900 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-2">
                    <FiShoppingBag /> Add to Cart
                  </button>
                </div>
              </div>

              {/* Text Info */}
              <div className="text-center px-4">
                <h3 className="text-xl font-serif font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  {product.name}
                </h3>
                <p className="text-blue-400 font-mono font-bold text-lg tracking-tighter">
                  {product.price}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}