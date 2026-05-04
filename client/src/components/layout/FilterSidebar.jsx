import { useState, useEffect } from "react";
import { FiX, FiFilter, FiCheck, FiSliders } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const BRAND = "#5BBFB5";
const BRAND_DARK = "#1A2E2C";

const FilterContent = ({ filters, setFilters, clearFilters, localPrice, handlePriceChange, applyPrice }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

    {/* Sort By */}
    <div>
      <h3 style={{ fontSize: "11px", fontWeight: 800, color: "#8BA5B3", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "14px", margin: "0 0 14px" }}>
        Sort By
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {[
          { label: "Newest Arrivals", value: "newest" },
          { label: "Price: Low to High", value: "price-asc" },
          { label: "Price: High to Low", value: "price-desc" },
          { label: "Top Rated", value: "rating" },
        ].map((option) => {
          const active = filters.sort === option.value;
          return (
            <label key={option.value} style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
              <div style={{
                width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${active ? BRAND : "#D8ECEA"}`,
                background: active ? BRAND : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                transition: "all 0.2s",
              }}>
                {active && <FiCheck size={11} color="#fff" />}
              </div>
              <input type="radio" name="sort" value={option.value} checked={active}
                onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))} style={{ display: "none" }} />
              <span style={{ fontSize: "14px", fontWeight: active ? 700 : 500, color: active ? BRAND_DARK : "#6B8F8A", fontFamily: "'Manrope', sans-serif" }}>
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
    </div>

    <div style={{ height: "1px", background: "#EEF5F4" }} />

    {/* Price Range */}
    <div>
      <h3 style={{ fontSize: "11px", fontWeight: 800, color: "#8BA5B3", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 14px" }}>
        Price Range
      </h3>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#B8CFCC", fontSize: "12px", fontWeight: 700 }}>₹</span>
          <input type="number" name="min" value={localPrice.min} onChange={handlePriceChange} onBlur={applyPrice} placeholder="Min"
            style={{ width: "100%", paddingLeft: "26px", paddingRight: "10px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "10px", border: "1.5px solid #D8ECEA", background: "#F4F9F8", fontSize: "13px", color: BRAND_DARK, outline: "none", fontFamily: "'Manrope', sans-serif", boxSizing: "border-box" }} />
        </div>
        <span style={{ color: "#B8CFCC", fontWeight: 700 }}>—</span>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#B8CFCC", fontSize: "12px", fontWeight: 700 }}>₹</span>
          <input type="number" name="max" value={localPrice.max} onChange={handlePriceChange} onBlur={applyPrice} placeholder="Max"
            style={{ width: "100%", paddingLeft: "26px", paddingRight: "10px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "10px", border: "1.5px solid #D8ECEA", background: "#F4F9F8", fontSize: "13px", color: BRAND_DARK, outline: "none", fontFamily: "'Manrope', sans-serif", boxSizing: "border-box" }} />
        </div>
      </div>
      <button onClick={applyPrice}
        style={{ width: "100%", padding: "10px", borderRadius: "10px", background: BRAND_DARK, color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Manrope', sans-serif" }}>
        Apply Price
      </button>
    </div>

    <div style={{ height: "1px", background: "#EEF5F4" }} />

    {/* Availability */}
    <div>
      <h3 style={{ fontSize: "11px", fontWeight: 800, color: "#8BA5B3", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 14px" }}>
        Availability
      </h3>
      <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
        <div style={{
          width: "20px", height: "20px", borderRadius: "6px", border: `2px solid ${filters.inStock ? BRAND : "#D8ECEA"}`,
          background: filters.inStock ? BRAND : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s",
        }}>
          {filters.inStock && <FiCheck size={12} color="#fff" />}
        </div>
        <input type="checkbox" checked={filters.inStock} onChange={(e) => setFilters(prev => ({ ...prev, inStock: e.target.checked }))} style={{ display: "none" }} />
        <span style={{ fontSize: "14px", fontWeight: filters.inStock ? 700 : 500, color: filters.inStock ? BRAND_DARK : "#6B8F8A", fontFamily: "'Manrope', sans-serif" }}>
          In Stock Only
        </span>
      </label>
    </div>

    {/* Reset */}
    <button onClick={clearFilters}
      style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1.5px solid #E2EEEC", background: "transparent", color: "#9BB5B2", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Manrope', sans-serif", transition: "all 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#F07468"; e.currentTarget.style.color = "#F07468"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2EEEC"; e.currentTarget.style.color = "#9BB5B2"; }}
    >
      Reset All Filters
    </button>
  </div>
);

export default function FilterSidebar({ isOpen, onClose, filters, setFilters, clearFilters }) {
  const [localPrice, setLocalPrice] = useState({ min: filters.minPrice, max: filters.maxPrice });

  useEffect(() => {
    setLocalPrice({ min: filters.minPrice, max: filters.maxPrice });
  }, [filters.minPrice, filters.maxPrice]);

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setLocalPrice(prev => ({ ...prev, [name]: value }));
  };

  const applyPrice = () => {
    setFilters(prev => ({ ...prev, minPrice: localPrice.min, maxPrice: localPrice.max }));
  };

  return (
    <>
      {/* Desktop Sidebar (Sticky) */}
      <div style={{ display: "none" }} className="lg-filter-sidebar">
        <div style={{ width: "240px", flexShrink: 0, position: "sticky", top: "120px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
            <FiSliders color={BRAND} size={16} />
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: BRAND_DARK, margin: 0, fontFamily: "'Manrope', sans-serif" }}>Filters</h2>
          </div>
          <FilterContent filters={filters} setFilters={setFilters} clearFilters={clearFilters}
            localPrice={localPrice} handlePriceChange={handlePriceChange} applyPrice={applyPrice} />
        </div>
      </div>

      {/* Mobile Drawer — z-index 9997 so it's above everything including sticky bar (z:100) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 9997 }}
            />

            {/* Panel — slides from right */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "fixed", top: 0, right: 0, bottom: 0,
                width: "min(85vw, 320px)",
                background: "#fff",
                zIndex: 9998,
                display: "flex", flexDirection: "column",
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              {/* Header */}
              <div style={{ padding: "20px 20px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #EEF5F4", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FiFilter color={BRAND} size={16} />
                  <h2 style={{ fontSize: "16px", fontWeight: 800, color: BRAND_DARK, margin: 0 }}>Filter & Sort</h2>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  style={{ background: "#F4F9F8", border: "none", borderRadius: "50%", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B8F8A" }}
                >
                  <FiX size={18} />
                </motion.button>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>
                <FilterContent filters={filters} setFilters={setFilters} clearFilters={clearFilters}
                  localPrice={localPrice} handlePriceChange={handlePriceChange} applyPrice={applyPrice} />
              </div>

              {/* Footer — Done button, no "View Results" */}
              <div style={{ padding: "16px 20px", borderTop: "1px solid #EEF5F4", flexShrink: 0 }}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  style={{ width: "100%", padding: "14px", borderRadius: "12px", background: BRAND_DARK, color: "#fff", border: "none", fontSize: "14px", fontWeight: 800, cursor: "pointer" }}
                >
                  Done
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
