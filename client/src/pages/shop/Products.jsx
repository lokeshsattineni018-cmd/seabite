import { useState, useContext, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch, FiPackage, FiFilter, FiX,
  FiSliders, FiChevronDown, FiChevronRight, FiAlertCircle
} from "react-icons/fi";
import { Helmet } from "react-helmet-async";
import { CartContext } from "../../context/CartContext";
import EnhancedProductCard from "../../components/products/EnhancedProductCard";
import FilterSidebar from "../../components/layout/FilterSidebar";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import ProductSkeleton from "../../components/common/ProductSkeleton";
import PullToRefresh from "../../components/common/PullToRefresh"; // 🎣 Pull to Refresh

const API_URL = import.meta.env.VITE_API_URL || "";

const CATEGORY_META = {
  All: { emoji: "🌊", label: "All Products", tagline: "Fresh from the ocean, daily." },
  Fish: { emoji: "🐟", label: "Premium Fish", tagline: "Wild-caught, restaurant quality." },
  Prawn: { emoji: "🦐", label: "Jumbo Prawns", tagline: "Perfect for grilling & curries." },
  Crab: { emoji: "🦀", label: "Live Crabs", tagline: "Soft-shell & market-fresh." },
};

export default function Products() {
  const { refreshCartCount, addToCart } = useContext(CartContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [filters, setFilters] = useState({
    category: "All",
    search: "",
    minPrice: "",
    maxPrice: "",
    inStock: false,
    sort: "newest",
  });

  const categories = ["All", "Fish", "Crab", "Prawn"];
  const meta = CATEGORY_META[filters.category] || CATEGORY_META.All;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get("category");
    const search = params.get("search");
    setFilters((prev) => ({
      ...prev,
      category: cat
        ? cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase().replace(/s$/, "")
        : "All",
      search: search || "",
    }));
  }, [location.search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
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
      setGlobalDiscount(res.data.globalDiscount || 0);
    } catch (err) {
      console.error("Products fetch error:", err);
      setError("Failed to fetch fresh catch. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  const clearFilters = () => {
    setFilters({ category: "All", search: "", minPrice: "", maxPrice: "", inStock: false, sort: "newest" });
    navigate("/products");
  };

  const activeFilterCount = [
    filters.minPrice, filters.maxPrice, filters.inStock,
  ].filter(Boolean).length;

  const handleRefresh = async () => {
    return fetchProducts();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <>
      <Helmet>
        <title>{meta.label} | SeaBite - Fresh Coastal Seafood Delivery</title>
        <meta name="description" content={`Buy fresh ${meta.label.toLowerCase()} online. ${meta.tagline} Chemical-free, traceable seafood delivered from Mogalthur every day.`} />
        <link rel="canonical" href={`https://seabite.co.in/products${filters.category !== "All" ? `?category=${filters.category}` : ""}`} />
        <meta property="og:title" content={`${meta.label} | SeaBite`} />
        <meta property="og:description" content={meta.tagline} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${meta.label} | SeaBite`} />
        <meta name="twitter:description" content={meta.tagline} />
        <meta name="twitter:image" content="https://seabite.co.in/fisherman.jpg" />
      </Helmet>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Lora:wght@500;600&display=swap');
        * { box-sizing: border-box; }
        .products-root { font-family: 'Manrope', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .sort-dropdown { animation: fadeDown 0.18s cubic-bezier(.4,0,.2,1); }
        @keyframes fadeDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        .category-pill-active { background: #1A2E2C !important; color: #fff !important; border-color: #1A2E2C !important; }
        .category-pill { border: 1.5px solid #E2EEEC; color: #6B8F8A; background: #fff; transition: all 0.18s ease; cursor: pointer; }
        .category-pill:hover { border-color: #5BBFB5; color: #5BBFB5; }
        .search-input:focus { border-color: #5BBFB5 !important; box-shadow: 0 0 0 3px rgba(91,191,181,0.12) !important; }
        .filter-btn:hover { border-color: #5BBFB5; color: #5BBFB5; }
        
        @media (max-width: 900px) {
          .mobile-filter-btn { display: flex !important; }
        }
      `}</style>

      <div
        className="products-root products-wrapper"
        style={{ minHeight: "100vh", background: "#F4F9F8", paddingTop: "32px", paddingBottom: "64px" }}
      >
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, height: "320px",
          background: "linear-gradient(180deg, rgba(91,191,181,0.07) 0%, transparent 100%)",
          pointerEvents: "none", zIndex: 0,
        }} />

        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 1 }}>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            style={{ marginBottom: "20px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "#B8CFCC", textTransform: "uppercase", letterSpacing: "0.1em" }}>SeaBite</span>
              <FiChevronRight size={10} style={{ color: "#B8CFCC" }} />
              <span style={{ fontSize: "11px", fontWeight: "600", color: "#5BBFB5", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {filters.category === "All" ? "All Products" : filters.category}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={filters.category}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      fontFamily: "'Lora', serif",
                      fontSize: "clamp(28px, 4vw, 40px)",
                      fontWeight: "600",
                      color: "#1A2E2C",
                      letterSpacing: "-0.02em",
                      marginBottom: "6px",
                      lineHeight: 1.2,
                    }}
                  >
                    {meta.emoji} {meta.label}
                  </motion.h1>
                </AnimatePresence>
                <p style={{ fontSize: "14px", color: "#6B8F8A", fontWeight: "500" }}>{meta.tagline}</p>
              </div>
            </div>
          </motion.div>

          {/* ── STICKY FILTER BAR ── */}
          <div style={{
            position: "sticky",
            top: "108px",
            zIndex: 100,
            background: "rgba(244,249,248,0.97)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            marginBottom: "20px",
            padding: "10px 0",
            marginLeft: "-24px",
            marginRight: "-24px",
            paddingLeft: "16px",
            paddingRight: "16px",
            borderBottom: "1px solid rgba(91,191,181,0.15)",
          }}>
            {/* Single row: Filters + Search + Pills */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center", overflowX: "auto" }} className="no-scrollbar">
              <button
                onClick={() => setIsSidebarOpen(true)}
                style={{
                  display: "flex", alignItems: "center", gap: "5px", flexShrink: 0,
                  padding: "8px 14px", borderRadius: "10px",
                  border: "1.5px solid #E2EEEC", background: "#fff",
                  color: "#6B8F8A", fontSize: "12px", fontWeight: "700",
                  cursor: "pointer", fontFamily: "'Manrope', sans-serif",
                }}
              >
                <FiSliders size={13} />
                Filters
                {activeFilterCount > 0 && (
                  <span style={{ background: "#5BBFB5", color: "#fff", width: "16px", height: "16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "800" }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div style={{ position: "relative", width: "140px", flexShrink: 0 }}>
                <FiSearch size={12} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#B8CFCC", pointerEvents: "none" }} />
                <input
                  type="text"
                  placeholder="Search…"
                  value={filters.search}
                  onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                  style={{
                    width: "100%", paddingLeft: "28px", paddingRight: filters.search ? "28px" : "10px",
                    paddingTop: "8px", paddingBottom: "8px",
                    border: "1.5px solid #E2EEEC", borderRadius: "10px", background: "#fff",
                    fontSize: "12px", color: "#1A2E2C", outline: "none",
                    fontFamily: "'Manrope', sans-serif", boxSizing: "border-box",
                  }}
                />
                {filters.search && (
                  <button onClick={() => setFilters((p) => ({ ...p, search: "" }))}
                    style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#B8CFCC", display: "flex" }}>
                    <FiX size={11} />
                  </button>
                )}
              </div>

              <div style={{ width: "1px", height: "20px", background: "#E2EEEC", flexShrink: 0 }} />

              {categories.map((cat) => (
                <motion.button
                  key={cat}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setFilters((p) => ({ ...p, category: cat }));
                    navigate(cat === "All" ? "/products" : `/products?category=${cat}`);
                  }}
                  className={`category-pill ${filters.category === cat ? "category-pill-active" : ""}`}
                  style={{
                    padding: "7px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                    whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "5px",
                    fontFamily: "'Manrope', sans-serif", flexShrink: 0,
                  }}
                >
                  <span>{CATEGORY_META[cat]?.emoji}</span>{cat}
                </motion.button>
              ))}
            </div>
          </div>


          <div style={{ display: "flex", gap: "28px", alignItems: "flex-start" }}>
            <FilterSidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              filters={filters}
              setFilters={setFilters}
              clearFilters={clearFilters}
            />

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Category pills now in sticky bar above — remove duplicate */}

              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    key="loader" 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}
                  >
                    {[...Array(8)].map((_, i) => (
                      <ProductSkeleton key={i} />
                    ))}
                  </motion.div>
                ) : error ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ textAlign: "center", padding: "60px 24px", background: "#fff", borderRadius: "20px", border: "1.5px solid #F0746822" }}
                  >
                    <FiAlertCircle size={40} style={{ color: "#F07468", marginBottom: "16px" }} />
                    <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#1A2E2C", marginBottom: "8px" }}>Something went wrong</h3>
                    <p style={{ fontSize: "13px", color: "#6B8F8A", marginBottom: "24px" }}>{error}</p>
                    <button onClick={fetchProducts} style={{ padding: "10px 24px", borderRadius: "10px", background: "#5BBFB5", color: "#fff", border: "none", fontWeight: "700", cursor: "pointer" }}>Try Again</button>
                  </motion.div>
                ) : products.length > 0 ? (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ 
                      paddingBottom: window.innerWidth < 768 ? "112px" : "64px"
                    }}
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 product-grid"
                  >
                    {products.map((p, i) => (
                      <motion.div key={p._id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.3) }}>
                        <EnhancedProductCard product={p} globalDiscount={globalDiscount} />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ textAlign: "center", padding: "80px 24px", background: "#fff", borderRadius: "20px", border: "1.5px solid #E2EEEC" }}
                  >
                    <div style={{ marginBottom: "20px" }}>
                      <svg width="80" height="60" viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <ellipse cx="40" cy="48" rx="32" ry="6" fill="#E2EEEC" />
                        <circle cx="40" cy="22" r="10" fill="#E2EEEC" />
                        <text x="40" y="27" textAnchor="middle" fontSize="14">🎣</text>
                      </svg>
                    </div>
                    <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#1A2E2C", marginBottom: "8px", fontFamily: "'Lora', serif" }}>No catches found</h3>
                    <p style={{ fontSize: "13px", color: "#6B8F8A", marginBottom: "24px" }}>Adjust your filters and try again.</p>
                    <button onClick={clearFilters} style={{ padding: "10px 24px", borderRadius: "10px", background: "#1A2E2C", color: "#fff", border: "none", fontWeight: "700", cursor: "pointer" }}>Clear all filters</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      </>
    </PullToRefresh>
  );
}