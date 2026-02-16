// client/src/components/TrendingProducts.jsx (Minimal White Aesthetic)

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import EnhancedProductCard from "./EnhancedProductCard";

// Mock Data (Consistent with Product structure)
const mockProducts = [
  { _id: "1", name: "Norwegian Salmon", basePrice: 1950, image: "/fish.png", tag: "Best Seller", category: "Fish", stock: 10, trending: true },
  { _id: "2", name: "Tiger Prawns", basePrice: 1450, image: "/prawn.png", tag: "Fresh Catch", category: "Prawn", stock: 15, trending: true },
  { _id: "3", name: "Blue Crab", basePrice: 2200, image: "/crab.png", tag: "Wild Caught", category: "Crab", stock: 8, trending: true },
  { _id: "4", name: "Lobster Tail", basePrice: 3800, image: "/fish.png", tag: "Premium", category: "Fish", stock: 5, trending: true },
];

export default function TrendingProducts() {
  return (
    <section className="py-12 bg-white dark:bg-[#0f172a]">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-blue-600 font-bold tracking-widest text-xs uppercase mb-2 block">
              Customer Favorites
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
              Best Sellers
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
              Handpicked from our ocean-fresh collection. These crowd favorites fly off the shelves!
            </p>
          </motion.div>

          <Link to="/products" className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors">
            See All
            <FiArrowRight className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Product Grid - Matches Home/Products Page Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {mockProducts.map((product, i) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <EnhancedProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}