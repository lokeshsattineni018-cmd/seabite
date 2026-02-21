import { useState, useContext, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch, FiPackage, FiFilter, FiX,
  FiSliders, FiChevronDown, FiChevronRight, FiAlertCircle
} from "react-icons/fi";
import { CartContext } from "../../context/CartContext";
import EnhancedProductCard from "../../components/products/EnhancedProductCard";
import FilterSidebar from "../../components/layout/FilterSidebar";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";

const API_URL = import.meta.env.VITE_API_URL || "";

const CATEGORY_META = {
  All: { emoji: "🌊", label: "All Products", tagline: "Fresh from the ocean, daily." },
  Fish: { emoji: "🐟", label: "Premium Fish", tagline: "Wild-caught, restaurant quality." },
  Prawn: { emoji: "🦐", label: "Jumbo Prawns", tagline: "Perfect for grilling & curries." },
  Crab: { emoji: "🦀", label: "Live Crabs", tagline: "Soft-shell & market-fresh." },
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "popular", label: "Most Popular" },
];

export default function Products() {
  const { refreshCartCount } = useContext(CartContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

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
  const activeSort = SORT_OPTIONS.find((o) => o.value === filters.sort);

  // Outside click for sort dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  return (
    <>
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
        style={{ minHeight: "100vh", background: "#F4F9F8", paddingTop: "88px", paddingBottom: "64px" }}
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
            style={{ marginBottom: "36px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "#B8CFCC", textTransform: "uppercase", letterSpacing: "0.1em" }}>SeaBite</span>
              <FiChevronRight size={10} style={{ color: "#B8CFCC" }} />
              <span style={{ fontSize: "11px", fontWeight: "600", color: "#5BBFB5", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {filters.category === "All" ? "All Products" : filters.category}
              </span>
            </div>

            <div className="products-header" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
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

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="filter-btn mobile-filter-btn"
                  style={{
                    display: "none",
                    alignItems: "center", gap: "6px",
                    padding: "9px 16px", borderRadius: "10px",
                    border: "1.5px solid #E2EEEC", background: "#fff",
                    color: "#6B8F8A", fontSize: "13px", fontWeight: "600",
                    cursor: "pointer", transition: "all 0.2s ease",
                  }}
                >
                  <FiSliders size={14} />
                  Filters
                  {activeFilterCount > 0 && (
                    <span style={{ background: "#5BBFB5", color: "#fff", width: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "800" }}>
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <div style={{ position: "relative" }}>
                  <FiSearch size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#B8CFCC", pointerEvents: "none" }} />
                  <input
                    type="text"
                    placeholder="Search fish, crab, prawn…"
                    value={filters.search}
                    onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                    className="search-input"
                    style={{
                      paddingLeft: "38px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px",
                      border: "1.5px solid #E2EEEC", borderRadius: "10px", background: "#fff",
                      fontSize: "13px", color: "#1A2E2C", outline: "none",
                      width: "220px", transition: "all 0.2s ease",
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  />
                  {filters.search && (
                    <button
                      onClick={() => setFilters((p) => ({ ...p, search: "" }))}
                      style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#B8CFCC", display: "flex", alignItems: "center" }}
                    >
                      <FiX size={13} />
                    </button>
                  )}
                </div>

                <div style={{ position: "relative" }} ref={sortRef}>
                  <button
                    onClick={() => setSortOpen((o) => !o)}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: "9px 14px", borderRadius: "10px",
                      border: "1.5px solid #E2EEEC", background: "#fff",
                      color: "#6B8F8A", fontSize: "13px", fontWeight: "600",
                      cursor: "pointer", fontFamily: "'Manrope', sans-serif",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <FiFilter size={13} />
                    {activeSort?.label}
                    <FiChevronDown size={12} style={{ transition: "transform 0.2s", transform: sortOpen ? "rotate(180deg)" : "none" }} />
                  </button>

                  <AnimatePresence>
                    {sortOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          position: "absolute", top: "calc(100% + 6px)", right: 0,
                          background: "#fff", border: "1.5px solid #E2EEEC", borderRadius: "12px",
                          padding: "6px", zIndex: 50, minWidth: "180px",
                          boxShadow: "0 8px 24px rgba(26,46,44,0.08)",
                        }}
                      >
                        {SORT_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => { setFilters((p) => ({ ...p, sort: opt.value })); setSortOpen(false); }}
                            style={{
                              display: "block", width: "100%", textAlign: "left",
                              padding: "8px 12px", borderRadius: "8px", border: "none",
                              background: filters.sort === opt.value ? "#F4F9F8" : "transparent",
                              color: filters.sort === opt.value ? "#5BBFB5" : "#1A2E2C",
                              fontSize: "13px", fontWeight: filters.sort === opt.value ? "700" : "500",
                              cursor: "pointer", fontFamily: "'Manrope', sans-serif",
                              transition: "background 0.15s",
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>

          <div style={{ display: "flex", gap: "28px", alignItems: "flex-start" }}>
            <FilterSidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              filters={filters}
              setFilters={setFilters}
              clearFilters={clearFilters}
            />

            <div style={{ flex: 1, minWidth: 0 }}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                style={{ display: "flex", gap: "8px", marginBottom: "28px", overflowX: "auto" }}
                className="no-scrollbar"
              >
                {categories.map((cat) => (
                  <motion.button
                    key={cat}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setFilters((p) => ({ ...p, category: cat }));
                      navigate(cat === "All" ? "/products" : `/products?category=${cat}`);
                    }}
                    className={`category-pill ${filters.category === cat ? "category-pill-active" : ""}`}
                    style={{
                      padding: "7px 18px",
                      borderRadius: "20px",
                      fontSize: "13px",
                      fontWeight: "600",
                      whiteSpace: "nowrap",
                      display: "flex", alignItems: "center", gap: "6px",
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    <span>{CATEGORY_META[cat]?.emoji}</span>
                    {cat}
                  </motion.button>
                ))}
              </motion.div>

              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <SeaBiteLoader />
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
                    style={{ display: "grid", gap: "20px" }}
                    className="product-grid"
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
  );
}