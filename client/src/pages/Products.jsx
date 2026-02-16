import { useState, useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiChevronDown, FiPackage } from "react-icons/fi";
import { CartContext } from "../context/CartContext";
import EnhancedProductCard from "../components/EnhancedProductCard";

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
  const [displayed, setDisplayed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Newest");

  const categories = ["All", "Fish", "Crab", "Prawn"];
  const currentTheme = CATEGORY_DATA[activeCat] || CATEGORY_DATA["All"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("/api/products");
        setProducts(res.data.products || res.data || []);
      } catch (err) {
        // console.error("Products fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let cat = params.get("category") || "All";
    cat =
      cat.charAt(0).toUpperCase() +
      cat.slice(1).toLowerCase().replace(/s$/, "");
    setActiveCat(categories.includes(cat) ? cat : "All");
    setSearchTerm(params.get("search") || "");
  }, [location.search]);

  useEffect(() => {
    let result = products.filter((p) => {
      const matchesCat =
        activeCat === "All" ||
        p.category?.toLowerCase() === activeCat.toLowerCase();
      const matchesSearch = p.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesCat && matchesSearch;
    });

    if (sortBy === "Price: Low to High") {
      result.sort((a, b) => a.basePrice - b.basePrice);
    } else if (sortBy === "Price: High to Low") {
      result.sort((a, b) => b.basePrice - a.basePrice);
    } else if (sortBy === "Popularity") {
      result.sort((a, b) =>
        b.trending === a.trending ? 0 : b.trending ? -1 : 1
      );
    } else if (sortBy === "Newest") {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setDisplayed(result);
  }, [activeCat, searchTerm, products, sortBy]);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0b1221] pt-28 pb-12 px-4 transition-colors duration-500 overflow-x-hidden font-sans">
      {/* Ambient gradient */}
      <motion.div
        key={`gradient-${activeCat}`}
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
                key={`label-${activeCat}`}
                initial={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 10, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={`text-[10px] md:text-xs font-bold uppercase tracking-widest ${currentTheme.accent} mb-2 block`}
              >
                Explore / {activeCat}
              </motion.span>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.h1
                key={`title-${activeCat}`}
                initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="text-3xl md:text-5xl font-medium tracking-tight text-slate-900 dark:text-white"
              >
                {currentTheme.title}
              </motion.h1>
            </AnimatePresence>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex gap-2 w-full lg:w-auto"
          >
            <div className="relative flex-grow lg:w-64">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 text-sm focus:ring-1 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-white"
              />
            </div>
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-4 pr-8 py-2.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300 cursor-pointer focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="Newest">Newest</option>
                <option value="Price: Low to High">Price: Low</option>
                <option value="Price: High to Low">Price: High</option>
                <option value="Popularity">Popularity</option>
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>
          </motion.div>
        </div>

        {/* Category Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar"
        >
          {categories.map((cat) => (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() =>
                navigate(
                  cat === "All" ? "/products" : `/products?category=${cat}`
                )
              }
              className={`px-5 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap relative ${activeCat === cat
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
                  : "bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
            >
              {cat}
            </motion.button>
          ))}
        </motion.div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {loading
              ? [...Array(8)].map((_, i) => (
                <motion.div
                  key={`skeleton-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                  className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800"
                />
              ))
              : displayed.map((p) => (
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
              ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {!loading && displayed.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiPackage size={28} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h2 className="text-lg font-medium dark:text-white mb-1">
              No catches found
            </h2>
            <p className="text-xs text-slate-500">Try a different search.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
