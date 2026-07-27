import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowRight, FiStar } from "react-icons/fi";
import axios from "axios";
import { prefetchComponent } from "../../utils/lazyWithRetry";

const API_URL = import.meta.env.VITE_API_URL || "";

const CATEGORIES = [
  {
    key: "Fish",
    label: "Fish",
    emoji: "🐟",
    heroImg: "/mega-fish.webp",
    color: "#0D9488",
    desc: "Ocean-fresh catches delivered daily at 4 AM from coastal docks",
    queryParam: "Fish",
  },
  {
    key: "Prawn",
    label: "Prawns",
    emoji: "🦐",
    heroImg: "/mega-prawn.webp",
    color: "#E8845C",
    desc: "Wild-caught & farm-fresh prawns in all grade sizes",
    queryParam: "Prawn",
  },
  {
    key: "Crab",
    label: "Crabs",
    emoji: "🦀",
    heroImg: "/mega-crab.webp",
    color: "#D94E4E",
    desc: "Live mud crabs & desk-peeled crab meat — 100% fresh",
    queryParam: "Crab",
  },
];

const NAV_PAGES = [
  { label: "About Us", path: "/about" },
  { label: "Help & FAQs", path: "/faq" },
  { label: "Contact", path: "/contact" },
];

export default function MegaMenu() {
  const [activeCategory, setActiveCategory] = useState(null);
  const [bestsellers, setBestsellers] = useState({});
  const [loading, setLoading] = useState({});
  const closeTimerRef = useRef(null);

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
        background: "transparent",
        width: "100%",
        position: "relative",
      }}
      onMouseLeave={handleMenuLeave}
    >
      <div style={{
        maxWidth: "1440px",
        margin: "0 auto",
        padding: "0 36px",
        height: "42px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          {/* Daily Deals */}
          <Link
            to="/products"
            onMouseEnter={() => { setActiveCategory(null); prefetchComponent("Products"); }}
            className="bottom-tier-link-cat"
            style={{ textDecoration: "none", fontSize: "13.5px", fontWeight: "700", color: "#1A2E2C", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            🔥 Daily Deals
          </Link>

          {/* Category Links with Mega Dropdown */}
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.key;
            return (
              <Link
                key={cat.key}
                to={`/products?category=${cat.queryParam}`}
                onMouseEnter={() => handleCategoryEnter(cat)}
                className="bottom-tier-link-cat"
                style={{
                  textDecoration: "none",
                  fontSize: "13.5px",
                  fontWeight: "700",
                  color: isActive ? "#0D9488" : "#1A2E2C",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  position: "relative",
                  padding: "4px 8px",
                  borderRadius: "8px",
                  background: isActive ? "#E6F4F1" : "transparent",
                  transition: "all 0.2s ease",
                }}
              >
                {cat.emoji} {cat.label}
              </Link>
            );
          })}

          <span style={{ color: "#CBD5E1", fontSize: "14px" }}>|</span>

          {/* Page Links */}
          {NAV_PAGES.map(page => (
            <Link
              key={page.path}
              to={page.path}
              onMouseEnter={() => setActiveCategory(null)}
              className="bottom-tier-link-page"
              style={{ textDecoration: "none", fontSize: "13.5px", fontWeight: "600", color: "#475569", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
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
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
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
              boxShadow: "0 24px 60px rgba(26,46,44,0.12)",
              zIndex: 100,
            }}
          >
            <div style={{
              maxWidth: "1440px",
              margin: "0 auto",
              padding: "24px 36px",
              display: "flex",
              gap: "28px",
            }}>
              {/* Left: Category Hero Card */}
              <div style={{
                width: "280px",
                flexShrink: 0,
                borderRadius: "20px",
                overflow: "hidden",
                position: "relative",
                background: "linear-gradient(135deg, #1A2E2C 0%, #0F2220 100%)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 8px 24px rgba(26,46,44,0.15)",
              }}>
                <div>
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(13,148,136,0.2)",
                    border: "1px solid rgba(13,148,136,0.4)",
                    color: "#2DD4BF",
                    fontSize: "11px",
                    fontWeight: "800",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: "14px",
                  }}>
                    {activeCat.emoji} FRESH CATCH
                  </div>
                  <h3 style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", margin: "0 0 8px", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.02em" }}>
                    {activeCat.label}
                  </h3>
                  <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0, lineHeight: 1.5, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {activeCat.desc}
                  </p>
                </div>

                <Link
                  to={`/products?category=${activeCat.queryParam}`}
                  onClick={() => setActiveCategory(null)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "11px 18px",
                    borderRadius: "12px",
                    background: "#0D9488",
                    color: "#FFFFFF",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: "700",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    marginTop: "20px",
                    boxShadow: "0 4px 14px rgba(13,148,136,0.3)",
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "none"}
                >
                  Explore All {activeCat.label} <FiArrowRight size={14} />
                </Link>
              </div>

              {/* Right: Bestsellers */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "#0D9488", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Top Bestsellers in {activeCat.label}
                  </span>
                  <Link
                    to={`/products?category=${activeCat.queryParam}`}
                    onClick={() => setActiveCategory(null)}
                    style={{ fontSize: "12px", fontWeight: "700", color: "#0D9488", textDecoration: "none" }}
                  >
                    View All →
                  </Link>
                </div>

                {loading[activeCategory] ? (
                  <div style={{ display: "flex", gap: "16px" }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ flex: 1, height: "170px", borderRadius: "16px", background: "#F1F5F9", animation: "pulse 1.5s infinite" }} />
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
                          background: "#FFFFFF",
                          borderRadius: "16px",
                          overflow: "hidden",
                          border: "1px solid #E2EEEC",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                          transition: "transform 0.2s, box-shadow 0.2s",
                          cursor: "pointer",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(13,148,136,0.1)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.03)"; }}
                      >
                        <div style={{ width: "100%", height: "110px", overflow: "hidden", background: "#F8FAFB", position: "relative" }}>
                          <img
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                          {product.rating > 0 && (
                            <span style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)", padding: "2px 6px", borderRadius: "6px", fontSize: "10px", fontWeight: "800", color: "#0F172A", display: "flex", alignItems: "center", gap: "3px" }}>
                              <FiStar size={10} color="#F59E0B" fill="#F59E0B" /> {product.rating}
                            </span>
                          )}
                        </div>
                        <div style={{ padding: "12px 14px" }}>
                          <p style={{
                            fontSize: "13.5px",
                            fontWeight: "700",
                            color: "#1A2E2C",
                            margin: "0 0 6px",
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}>
                            {product.name}
                          </p>
                          <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                            <span style={{ fontSize: "15px", fontWeight: "800", color: "#0D9488", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                              ₹{product.basePrice}
                            </span>
                            <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                              / {product.unit || "kg"}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#94A3B8", fontSize: "13px" }}>No products available in this category</p>
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
