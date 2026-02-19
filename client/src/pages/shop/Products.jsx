import { useState, useContext, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch, FiPackage, FiFilter, FiX,
  FiSliders, FiChevronDown, FiChevronRight
} from "react-icons/fi";
import { CartContext } from "../../context/CartContext";
import EnhancedProductCard from "../../components/products/EnhancedProductCard";
import FilterSidebar from "../../components/layout/FilterSidebar";

const API_URL = import.meta.env.VITE_API_URL || "";

// ─── Palette ─────────────────────────────────────────────
// #5BBFB5  Seafoam primary
// #7EB8D4  Sky secondary
// #F07468  Coral accent (CTA)
// #F4F9F8  Off-white bg
// #FFFFFF  Card surface
// #E2EEEC  Mist border
// #1A2E2C  Deep tide text
// #6B8F8A  Drift secondary text
// #B8CFCC  Foam muted text
// ─────────────────────────────────────────────────────────

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

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
      `}</style>

      <div
        className="products-root"
        style={{ minHeight: "100vh", background: "#F4F9F8", paddingTop: "88px", paddingBottom: "64px" }}
      >
        {/* Subtle ocean header swell */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, height: "320px",
          background: "linear-gradient(180deg, rgba(91,191,181,0.07) 0%, transparent 100%)",
          pointerEvents: "none", zIndex: 0,
        }} />

        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 1 }}>

          {/* ── Page Header ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            style={{ marginBottom: "36px" }}
          >
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "#B8CFCC", textTransform: "uppercase", letterSpacing: "0.1em" }}>SeaBite</span>
              <FiChevronRight size={10} style={{ color: "#B8CFCC" }} />
              <span style={{ fontSize: "11px", fontWeight: "600", color: "#5BBFB5", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {filters.category === "All" ? "All Products" : filters.category}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
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

              {/* Search + Filter Controls */}
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {/* Mobile filter toggle */}
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="filter-btn"
                  style={{
                    display: "none", /* shown via media query override below */
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

                {/* Search */}
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

                {/* Sort Dropdown */}
                <div style={{ position: "relative" }}>
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
            {/* ── Sidebar ─────────────────────────────────── */}
            <FilterSidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              filters={filters}
              setFilters={setFilters}
              clearFilters={clearFilters}
            />

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Category Pills */}
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

                {/* Active filters chips */}
                {filters.inStock && (
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "20px", background: "#F0FBF9", border: "1.5px solid #5BBFB5", color: "#5BBFB5", fontSize: "12px", fontWeight: "700", whiteSpace: "nowrap" }}
                  >
                    In Stock Only
                    <button onClick={() => setFilters((p) => ({ ...p, inStock: false }))} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", display: "flex", padding: 0 }}>
                      <FiX size={11} />
                    </button>
                  </motion.div>
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "20px", background: "#F0FBF9", border: "1.5px solid #5BBFB5", color: "#5BBFB5", fontSize: "12px", fontWeight: "700", whiteSpace: "nowrap" }}
                  >
                    ₹{filters.minPrice || "0"} – ₹{filters.maxPrice || "∞"}
                    <button onClick={() => setFilters((p) => ({ ...p, minPrice: "", maxPrice: "" }))} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", display: "flex", padding: 0 }}>
                      <FiX size={11} />
                    </button>
                  </motion.div>
                )}
              </motion.div>

              {/* Result count */}
              {!loading && products.length > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ fontSize: "12px", color: "#B8CFCC", fontWeight: "600", marginBottom: "20px", letterSpacing: "0.03em" }}
                >
                  {products.length} result{products.length !== 1 ? "s" : ""} found
                </motion.p>
              )}

              {/* ── Product Grid ────────────────────────────── */}
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "20px" }}
                  >
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        style={{
                          height: "320px", borderRadius: "16px",
                          background: "linear-gradient(90deg, #E2EEEC 25%, #EDF5F3 50%, #E2EEEC 75%)",
                          backgroundSize: "200% 100%",
                          animation: `shimmer 1.6s infinite ${i * 0.1}s`,
                        }}
                      />
                    ))}
                    <style>{`
                      @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
                    `}</style>
                  </motion.div>
                ) : products.length > 0 ? (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "20px" }}
                  >
                    {products.map((p, i) => (
                      <motion.div
                        key={p._id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.3) }}
                        style={{ height: "100%" }}
                      >
                        <EnhancedProductCard product={p} globalDiscount={globalDiscount} />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      textAlign: "center",
                      padding: "80px 24px",
                      background: "#fff",
                      borderRadius: "20px",
                      border: "1.5px solid #E2EEEC",
                    }}
                  >
                    {/* Simple ocean illustration */}
                    <div style={{ marginBottom: "20px" }}>
                      <svg width="80" height="60" viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <ellipse cx="40" cy="48" rx="32" ry="6" fill="#E2EEEC" />
                        <path d="M10 32 Q20 18 30 28 Q40 38 50 22 Q60 8 70 24" stroke="#B8CFCC" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                        <circle cx="40" cy="22" r="10" fill="#E2EEEC" />
                        <text x="40" y="27" textAnchor="middle" fontSize="14">🎣</text>
                      </svg>
                    </div>
                    <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#1A2E2C", marginBottom: "8px", fontFamily: "'Lora', serif" }}>
                      No catches found
                    </h3>
                    <p style={{ fontSize: "13px", color: "#6B8F8A", marginBottom: "24px", lineHeight: 1.6 }}>
                      The ocean's quiet right now. Try adjusting your filters or search.
                    </p>
                    <button
                      onClick={clearFilters}
                      style={{
                        padding: "10px 24px", borderRadius: "10px",
                        background: "#1A2E2C", color: "#fff",
                        border: "none", fontSize: "13px", fontWeight: "700",
                        cursor: "pointer", fontFamily: "'Manrope', sans-serif",
                        transition: "opacity 0.2s",
                      }}
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
    </>
  );
}