import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiShoppingBag, FiFilter } from "react-icons/fi"; // Feather Icons
import ProductQuickView from "../../components/ProductQuickView";

const API_URL = import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } },
};

export default function Prawn() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/products`, {
        withCredentials: true, // ✅ send session cookie
      })
      .then((res) => {
        // Filter for Prawn category (Ensure your DB uses "Prawn" or "Prawns")
        const prawns = res.data.products.filter(
          (p) => p.category === "Prawn" || p.category === "Prawns"
        );
        setItems(prawns);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Prawn error:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans">
      {/* Background Blobs (Orange/Coral for Prawns) */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-orange-100/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[300px] h-[300px] bg-rose-50/50 rounded-full blur-[80px] pointer-events-none" />

      {/* ================= HEADER SECTION ================= */}
      <div className="relative pt-28 pb-12 px-6 max-w-7xl mx-auto">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors mb-6 text-sm font-medium tracking-wide"
        >
          <FiArrowLeft /> Back to Home
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl md:text-6xl font-serif text-slate-900 mb-2"
            >
              Fresh Prawns
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-slate-500 max-w-md"
            >
              Juicy Tiger prawns, King prawns, and freshwater scampi. Perfect
              for curries and grills.
            </motion.p>
          </div>

          {/* Filter Button */}
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full shadow-sm border border-slate-200 text-slate-600 hover:border-orange-300 transition-colors text-sm font-medium">
            <FiFilter /> Filter Catch
          </button>
        </div>
      </div>

      {/* ================= PRODUCTS GRID ================= */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        {loading ? (
          // Skeleton Loader
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-96 bg-white rounded-[2.5rem] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {items.map((item) => (
              <motion.div
                key={item._id}
                variants={cardVariants}
                onClick={() => setSelected(item)}
                className="group cursor-pointer"
              >
                <div className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-transparent hover:border-orange-200 hover:shadow-xl hover:shadow-orange-900/5 transition-all duration-500 relative overflow-hidden">
                  {/* Badge */}
                  {item.trending && (
                    <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-orange-600 shadow-sm">
                      Trending
                    </div>
                  )}

                  {/* Image Container (Orange Tint Background) */}
                  <div className="h-64 overflow-hidden rounded-[2rem] bg-orange-50/40 relative">
                    <motion.img
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover mix-blend-multiply"
                    />

                    {/* Hover 'Quick View' Button */}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-white text-slate-900 px-6 py-2 rounded-full font-medium shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        Quick View
                      </div>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="pt-6 pb-2 px-2 text-center">
                    <h3 className="text-xl font-serif text-slate-900 mb-1 group-hover:text-orange-600 transition-colors">
                      {item.name}
                    </h3>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className="text-lg font-bold text-slate-800">
                        ₹{item.price}
                      </span>
                      <span className="text-xs text-slate-400 line-through">
                        ₹{Math.round(item.price * 1.1)}
                      </span>
                    </div>

                    {/* Circle Icon Button */}
                    <button className="w-10 h-10 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center mx-auto hover:bg-slate-900 hover:text-white transition-colors duration-300">
                      <FiShoppingBag size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && items.length === 0 && (
          <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-slate-300">
            <p className="text-slate-400 text-lg">
              No prawns available today.
            </p>
          </div>
        )}
      </div>

      {/* ================= MODAL ================= */}
      <ProductQuickView
        product={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
