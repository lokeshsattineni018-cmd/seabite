import { useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowRight, FiShoppingCart } from "react-icons/fi";
import axios from "axios";
import { prefetchComponent } from "../../utils/lazyWithRetry";

const API_URL = import.meta.env.VITE_API_URL || "";

const CATEGORIES = [
  {
    key: "Fish",
    label: "Fish",
    emoji: "🐟",
    heroImg: "/mega-fish.webp",
    color: "#3B9EC9",
    desc: "Ocean-fresh catches delivered daily from coastal docks",
    queryParam: "Fish",
  },
  {
    key: "Prawn",
    label: "Prawns",
    emoji: "🦐",
    heroImg: "/mega-prawn.webp",
    color: "#E8845C",
    desc: "Wild-caught & farm-fresh prawns in all sizes",
    queryParam: "Prawn",
  },
  {
    key: "Crab",
    label: "Crabs",
    emoji: "🦀",
    heroImg: "/mega-crab.webp",
    color: "#D94E4E",
    desc: "Live mud crabs & crab meat — peak freshness guaranteed",
    queryParam: "Crab",
  },
];

const NAV_PAGES = [
  { label: "About Us", path: "/about" },
  { label: "Help & FAQs", path: "/faq" },
  { label: "Contact", path: "/contact" },
];

export default function MegaMenu({ isTransparent }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [bestsellers, setBestsellers] = useState({});
  const [loading, setLoading] = useState({});
  const closeTimerRef = useRef(null);
  const navigate = useNavigate();

  const fetchBestsellers = useCallback(async (categoryKey) => {
    if (bestsellers[categoryKey] || loading[categoryKey]) return;
    setLoading(prev => ({ ...prev, [categoryKey]: true }));
    try {
      const res = await axios.get(`${API_URL}/api/products`, {
        params: { category: categoryKey, sort: "rating", limit: 3 }
      });
      const products = (res.data?.products || res.data || []).slice(0, 3);
      setBestsellers(prev => ({ ...prev, [categoryKey]: products }));
    } catch {
      setBestsellers(prev => ({ ...prev, [categoryKey]: [] }));
    } finally {
      setLoading(prev => ({ ...prev, [categoryKey]: false }));
    }
  }, [bestsellers, loading]);

  const handleCategoryEnter = (cat) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setActiveCategory(cat.key);
    fetchBestsellers(cat.key);
    prefetchComponent("Products");
  };

  const handleMenuLeave = () => {
    closeTimerRef.current = setTimeout(() => setActiveCategory(null), 200);
  };

  const handleMenuEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  };

  const activeCat = CATEGORIES.find(c => c.key === activeCategory);
  const catProducts = bestsellers[activeCategory] || [];

  return (
    <div
      style={{
        background: isTransparent ? "transparent" : "#FFFFFF",
        borderBottom: isTransparent ? "none" : "1.5px solid #E2EEEC",
        borderTop: isTransparent ? "1px solid rgba(255,255,255,0.12)" : "none",
        width: "100%",
        transition: "all 0.4s ease",
        position: "relative",
      }}
      onMouseLeave={handleMenuLeave}
    >
      <div style={{
        maxWidth: "1440px",
        margin: "0 auto",
        padding: "0 40px",
        height: "44px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          {/* Daily Deals */}
          <Link
            to="/products"
            onMouseEnter={() => { setActiveCategory(null); prefetchComponent("Products"); }}
            className="bottom-tier-link-cat"
            style={{ textDecoration: "none", fontSize: "14.5px", fontWeight: "600", color: isTransparent ? "#FFFFFF" : "#1A2E2C", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Daily Deals
          </Link>

          {/* Category Links with Mega Dropdown */}
          {CATEGORIES.map(cat => (
            <Link
              key={cat.key}
              to={`/products?category=${cat.queryParam}`}
              onMouseEnter={() => handleCategoryEnter(cat)}
              className="bottom-tier-link-cat"
              style={{
                textDecoration: "none",
                fontSize: "14.5px",
                fontWeight: "600",
                color: isTransparent ? "#FFFFFF" : "#1A2E2C",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                position: "relative",
                paddingBottom: activeCategory === cat.key ? "2px" : "0",
                borderBottom: activeCategory === cat.key ? `2px solid ${cat.color}` : "2px solid transparent",
                transition: "border-color 0.2s ease",
              }}
            >
              {cat.label}
            </Link>
          ))}

          <span style={{ color: isTransparent ? "rgba(255,255,255,0.35)" : "#E2EEEC", fontSize: "14px" }}>|</span>

          {/* Page Links */}
          {NAV_PAGES.map(page => (
            <Link
              key={page.path}
              to={page.path}
              onMouseEnter={() => setActiveCategory(null)}
              className="bottom-tier-link-page"
              style={{ textDecoration: "none", fontSize: "14.5px", fontWeight: "600", color: isTransparent ? "rgba(255,255,255,0.85)" : "#4A6572", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {page.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ═══ MEGA DROPDOWN ═══ */}
      <AnimatePresence>
        {activeCat && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onMouseEnter={handleMenuEnter}
            onMouseLeave={handleMenuLeave}
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#FFFFFF",
              borderBottom: "1.5px solid #E2EEEC",
              boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
              zIndex: 100,
            }}
          >
            <div style={{
              maxWidth: "1440px",
              margin: "0 auto",
              padding: "28px 40px",
              display: "flex",
              gap: "32px",
            }}>
              {/* Left: Category Hero */}
              <div style={{
                width: "280px",
                flexShrink: 0,
                borderRadius: "16px",
                overflow: "hidden",
                position: "relative",
                background: `linear-gradient(135deg, ${activeCat.color}22, ${activeCat.color}08)`,
                border: `1px solid ${activeCat.color}20`,
              }}>
                <div style={{ padding: "24px" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>{activeCat.emoji}</div>
                  <h3 style={{ fontSize: "22px", fontWeight: "800", color: "#1A2E2C", margin: "0 0 8px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {activeCat.label}
                  </h3>
                  <p style={{ fontSize: "13px", color: "#6B8F8A", margin: "0 0 20px", lineHeight: 1.5, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {activeCat.desc}
                  </p>
                  <Link
                    to={`/products?category=${activeCat.queryParam}`}
                    onClick={() => setActiveCategory(null)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "10px 18px",
                      borderRadius: "10px",
                      background: activeCat.color,
                      color: "#fff",
                      textDecoration: "none",
                      fontSize: "13px",
                      fontWeight: "700",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 4px 16px ${activeCat.color}40`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    View All {activeCat.label} <FiArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Right: Bestsellers */}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "10px", fontWeight: "800", color: "#A8C5C0", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 16px" }}>
                  Top Sellers
                </p>

                {loading[activeCategory] ? (
                  <div style={{ display: "flex", gap: "16px" }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ flex: 1, height: "180px", borderRadius: "14px", background: "#F4F9F8", animation: "pulse 1.5s infinite" }} />
                    ))}
                  </div>
                ) : catProducts.length > 0 ? (
                  <div style={{ display: "flex", gap: "16px" }}>
                    {catProducts.map(product => (
                      <Link
                        key={product._id}
                        to={`/products/${product._id}`}
                        onClick={() => setActiveCategory(null)}
                        style={{
                          flex: 1,
                          textDecoration: "none",
                          background: "#F8FAFB",
                          borderRadius: "14px",
                          overflow: "hidden",
                          border: "1px solid #E8EEF2",
                          transition: "transform 0.2s, box-shadow 0.2s",
                          cursor: "pointer",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                      >
                        <div style={{ width: "100%", height: "120px", overflow: "hidden" }}>
                          <img
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
                            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                          />
                        </div>
                        <div style={{ padding: "12px 14px" }}>
                          <p style={{
                            fontSize: "13px",
                            fontWeight: "700",
                            color: "#1A2E2C",
                            margin: "0 0 4px",
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}>
                            {product.name}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: "14px", fontWeight: "800", color: activeCat.color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                              ₹{product.basePrice}
                            </span>
                            <span style={{ fontSize: "11px", color: "#A8C5C0" }}>
                              / {product.unit || "kg"}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#B8CFCC", fontSize: "13px" }}>No products available</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
