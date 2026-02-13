import { useState, useContext, useEffect, useRef, forwardRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useInView,
} from "framer-motion";
import {
  FiSearch,
  FiCheck,
  FiShoppingBag,
  FiPackage,
  FiChevronDown,
} from "react-icons/fi";
import { CartContext } from "../context/CartContext";
import { addToCart } from "../utils/cartStorage";

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

// --- 1. 3D TILT CARD with blur-clear entrance ---
const TiltCard = forwardRef(({ children, onClick, index = 0 }, ref) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const internalRef = useRef(null);
  const isInView = useInView(internalRef, { once: true, margin: "-5% 0px" });
  const rotateX = useTransform(y, [-100, 100], [3, -3]);
  const rotateY = useTransform(x, [-100, 100], [-3, 3]);

  const handleMouseMove = (e) => {
    if (!internalRef.current) return;
    const rect = internalRef.current.getBoundingClientRect();
    x.set(((e.clientX - rect.left) / rect.width) * 200 - 100);
    y.set(((e.clientY - rect.top) / rect.height) * 200 - 100);
  };

  return (
    <motion.div
      ref={(node) => {
        internalRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      onClick={onClick}
      initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
      animate={
        isInView
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y: 30, filter: "blur(8px)" }
      }
      transition={{
        delay: index * 0.06,
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -6 }}
      className="relative group cursor-pointer"
    >
      <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-[1.5rem] md:rounded-[2rem] shadow-sm hover:shadow-xl border border-slate-100 dark:border-white/5 overflow-hidden transition-all duration-500">
        {children}
      </div>
    </motion.div>
  );
});

// --- 2. ADD BUTTON ---
const AddButton = ({ product, onAdd }) => {
  const [status, setStatus] = useState("idle");

  const handleClick = async (e) => {
    e.stopPropagation();
    setStatus("loading");
    setTimeout(() => {
      onAdd(e, product);
      setStatus("success");
      setTimeout(() => setStatus("idle"), 1500);
    }, 600);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      disabled={status !== "idle"}
      className={`relative h-8 md:h-10 flex items-center justify-center rounded-full transition-all duration-300 font-bold uppercase tracking-wider text-[9px] md:text-[10px]
        ${
          status === "success"
            ? "w-8 md:w-10 bg-emerald-500 text-white shadow-emerald-500/20 shadow-lg"
            : "px-3 md:px-5 bg-slate-900 dark:bg-blue-600 text-white hover:opacity-90"
        }`}
    >
      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1"
          >
            <span className="hidden md:inline">Add</span> <FiShoppingBag />
          </motion.div>
        )}
        {status === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
          />
        )}
        {status === "success" && (
          <motion.div
            key="success"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="flex items-center justify-center"
          >
            <FiCheck size={14} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
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

  const getProductImage = (imagePath) => {
    if (!imagePath) return "https://placehold.co/400?text=No+Image";
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("/uploads")) return `${API_URL}${imagePath}`;
    return `${API_URL}/uploads/${imagePath}`;
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0b1221] pt-24 md:pt-32 pb-12 md:pb-20 px-3 md:px-12 transition-colors duration-500 overflow-x-hidden font-sans">
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
        <div className="flex flex-col lg:flex-row justify-between items-end mb-8 md:mb-12 gap-6">
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
              className={`px-5 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap relative ${
                activeCat === cat
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
                  : "bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </motion.div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
          <AnimatePresence mode="popLayout">
            {loading
              ? [...Array(6)].map((_, i) => (
                  <motion.div
                    key={`skeleton-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                    className="h-56 md:h-80 rounded-[1.5rem] bg-slate-200 dark:bg-slate-800"
                  />
                ))
              : displayed.map((p, idx) => (
                  <TiltCard
                    key={p._id}
                    index={idx}
                    onClick={() => navigate(`/products/${p._id}`)}
                  >
                    <div className="h-full flex flex-col">
                      <div className="relative h-36 md:h-56 w-full bg-slate-50 dark:bg-slate-900/40 flex items-center justify-center p-3 md:p-6 overflow-hidden">
                        {p.trending && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.06 + 0.3 }}
                            className="absolute top-3 left-3 bg-white dark:bg-slate-800 px-2 py-1 rounded-full text-[8px] md:text-[9px] font-bold uppercase tracking-wider shadow-sm z-10"
                          >
                            Hot
                          </motion.span>
                        )}

                        <motion.img
                          whileHover={{ scale: 1.08 }}
                          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                          src={getProductImage(p.image)}
                          alt={p.name}
                          className="w-full h-full object-contain drop-shadow-md"
                        />
                      </div>

                      <div className="p-3 md:p-5 flex-grow flex flex-col justify-between bg-white dark:bg-slate-800/50">
                        <div>
                          <span className="text-[9px] md:text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                            {p.category}
                          </span>
                          <h3 className="text-sm md:text-lg font-semibold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">
                            {p.name}
                          </h3>
                        </div>

                        <div className="mt-3 md:mt-4 flex items-center justify-between gap-1">
                          <div className="flex flex-col">
                            <span className="text-sm md:text-xl font-bold text-slate-900 dark:text-white">
                              {"\u20B9"}{Number(p.basePrice)}
                            </span>
                            <span className="text-[9px] font-medium text-slate-400">
                              /{p.unit || "kg"}
                            </span>
                          </div>
                          <AddButton
                            product={p}
                            onAdd={() => {
                              addToCart({
                                ...p,
                                qty: 1,
                                price: Number(p.basePrice),
                              });
                              refreshCartCount();
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {!loading && displayed.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
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