
import { useState, useContext, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiChevronDown, FiPackage, FiFilter, FiX } from "react-icons/fi";
import { CartContext } from "../context/CartContext";
import EnhancedProductCard from "../components/EnhancedProductCard";
import FilterSidebar from "../components/FilterSidebar";

const API_URL = import.meta.env.VITE_API_URL || "";

const CATEGORY_DATA = {
  All: {
    title: "Fresh Catch",
    desc: "Sustainable seafood.",
    gradient: "from-blue-500/10 via-cyan-400/5 to-transparent",
    accent: "text-blue-600",
  },
  Fish: {
    title: "Premium Fish",
    desc: "Freshwater cuts.",
    gradient: "from-cyan-500/10 via-blue-400/5 to-transparent",
    accent: "text-cyan-600",
  },
  Prawn: {
    title: "Jumbo Prawns",
    desc: "Perfect for grilling.",
    gradient: "from-orange-500/10 via-amber-400/5 to-transparent",
    accent: "text-orange-600",
  },
  Crab: {
    title: "Live Crabs",
    desc: "Soft-shell delicacies.",
    gradient: "from-red-500/10 via-rose-400/5 to-transparent",
    accent: "text-red-600",
  },
};

export default function Products() {
  const { refreshCartCount } = useContext(CartContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Consolidated Filter State
  const [filters, setFilters] = useState({
    category: "All",
    search: "",
    minPrice: "",
    maxPrice: "",
    inStock: false,
    sort: "newest",
  });

  const categories = ["All", "Fish", "Crab", "Prawn"];
  const currentTheme = CATEGORY_DATA[filters.category] || CATEGORY_DATA["All"];

  // Sync URL params with state on load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get("category");
    const search = params.get("search");

    setFilters(prev => ({
      ...prev,
      category: cat ? (cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase().replace(/s$/, "")) : "All",
      search: search || "",
    }));
  }, [location.search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        category: filters.category === "All" ? undefined : filters.category,
        search: filters.search || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        inStock: filters.inStock || undefined,
        sort: filters.sort,
      };

      const res = await axios.get(`${API_URL}/api/products`, { params });
      setProducts(res.data.products || res.data || []);
    } catch (err) {
      console.error("Products fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchProducts();
    }, 300); // Debounce for search/slider inputs
    return () => clearTimeout(debounceTimer);
  }, [fetchProducts]);

  const clearFilters = () => {
    setFilters({
      category: "All",
      search: "",
      minPrice: "",
      maxPrice: "",
      inStock: false,
      sort: "newest"
    });
    navigate("/products");
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0b1221] pt-28 pb-12 px-4 transition-colors duration-500 overflow-x-hidden font-sans">
      {/* Ambient gradient */}
      <motion.div
        key={`gradient-${filters.category}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 0.8 }}
        className={`fixed top-0 left-0 w-full h-[50vh] bg-gradient-to-b ${currentTheme.gradient} pointer-events-none -z-10`}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-end mb-8 gap-6">
          <div className="max-w-xl w-full">
            <AnimatePresence mode="wait">
              <motion.span
                key={`label-${filters.category}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={`text-[10px] md:text-xs font-bold uppercase tracking-widest ${currentTheme.accent} mb-2 block`}
              >
                Explore / {filters.category}
              </motion.span>
            </AnimatePresence>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-medium tracking-tight text-slate-900 dark:text-white"
            >
              {currentTheme.title}
            </motion.h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-3 w-full lg:w-auto"
          >
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden px-4 py-2.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white flex items-center gap-2 font-bold text-sm shadow-sm"
            >
              <FiFilter /> Filters
            </button>

            <div className="relative flex-grow lg:w-64">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 text-sm focus:ring-1 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-white shadow-sm"
              />
            </div>
          </motion.div>
        </div>

        <div className="flex gap-8 items-start">
          {/* Sidebar Component */}
          <FilterSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            filters={filters}
            setFilters={setFilters}
            clearFilters={clearFilters}
          />

          <div className="flex-1 w-full">
            {/* Category Filter Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar"
            >
              {categories.map((cat) => (
                <motion.button
                  key={cat}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    setFilters(prev => ({ ...prev, category: cat }));
                    navigate(cat === "All" ? "/products" : `/products?category=${cat}`);
                  }}
                  className={`px-5 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap relative ${filters.category === cat
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
                    : "bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                >
                  {cat}
                </motion.button>
              ))}
            </motion.div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <motion.div
                      key={`skeleton-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                      className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800"
                    />
                  ))
                ) : products.length > 0 ? (
                  products.map((p) => (
                    <motion.div
                      key={p._id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <EnhancedProductCard product={p} />
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full py-20 text-center"
                  >
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiPackage size={28} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <h2 className="text-lg font-medium dark:text-white mb-1">
                      No catches found
                    </h2>
                    <p className="text-xs text-slate-500 mb-4">
                      Try adjusting your filters or search.
                    </p>
                    <button
                      onClick={clearFilters}
                      className="text-blue-600 font-bold text-sm hover:underline"
                    >
                      Clear all filters
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
