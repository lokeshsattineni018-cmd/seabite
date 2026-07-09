import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiX, FiFilter, FiCheck, FiSliders, FiSun } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const BRAND = "#5BBFB5";
const BRAND_DARK = "#1A2E2C";
const API = import.meta.env.VITE_API_URL || "";

const FilterContent = ({
  filters,
  setFilters,
  clearFilters,
  localPrice,
  handlePriceChange,
  applyPrice,
  metaData
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

    {/* Sort By */}
    <div>
      <h3 style={{ fontSize: "11px", fontWeight: 800, color: "#8BA5B3", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 12px" }}>
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
            <label key={option.value} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <div style={{
                width: "18px", height: "18px", borderRadius: "50%", border: `2px solid ${active ? BRAND : "#D8ECEA"}`,
                background: active ? BRAND : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                transition: "all 0.2s",
              }}>
                {active && <FiCheck size={10} color="#fff" />}
              </div>
              <input type="radio" name="sort" value={option.value} checked={active}
                onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))} style={{ display: "none" }} />
              <span style={{ fontSize: "13.5px", fontWeight: active ? 700 : 500, color: active ? BRAND_DARK : "#6B8F8A" }}>
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
      <h3 style={{ fontSize: "11px", fontWeight: 800, color: "#8BA5B3", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 12px" }}>
        Price Range
      </h3>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#B8CFCC", fontSize: "11px", fontWeight: 700 }}>₹</span>
          <input type="number" name="min" value={localPrice.min} onChange={handlePriceChange} onBlur={applyPrice} placeholder="Min"
            style={{ width: "100%", paddingLeft: "22px", paddingRight: "8px", paddingTop: "8px", paddingBottom: "8px", borderRadius: "8px", border: "1.5px solid #D8ECEA", background: "#F4F9F8", fontSize: "12px", color: BRAND_DARK, outline: "none", boxSizing: "border-box" }} />
        </div>
        <span style={{ color: "#B8CFCC", fontWeight: 700 }}>—</span>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#B8CFCC", fontSize: "11px", fontWeight: 700 }}>₹</span>
          <input type="number" name="max" value={localPrice.max} onChange={handlePriceChange} onBlur={applyPrice} placeholder="Max"
            style={{ width: "100%", paddingLeft: "22px", paddingRight: "8px", paddingTop: "8px", paddingBottom: "8px", borderRadius: "8px", border: "1.5px solid #D8ECEA", background: "#F4F9F8", fontSize: "12px", color: BRAND_DARK, outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>
      <button onClick={applyPrice}
        style={{ width: "100%", padding: "8px", borderRadius: "8px", background: BRAND_DARK, color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
        Apply Price
      </button>
    </div>

    {/* Dynamically Loaded Preparation Styles (Cuts) */}
    {metaData?.cuts?.length > 0 && (
      <>
        <div style={{ height: "1px", background: "#EEF5F4" }} />
        <div>
          <h3 style={{ fontSize: "11px", fontWeight: 800, color: "#8BA5B3", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 12px" }}>
            Preparation Style
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "160px", overflowY: "auto" }}>
            {metaData.cuts.map((cut) => {
              const active = filters.cut === cut;
              return (
                <label key={cut} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <div style={{
                    width: "18px", height: "18px", borderRadius: "5px", border: `2px solid ${active ? BRAND : "#D8ECEA"}`,
                    background: active ? BRAND : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s",
                  }}>
                    {active && <FiCheck size={11} color="#fff" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => setFilters(prev => ({ ...prev, cut: active ? "" : cut }))}
                    style={{ display: "none" }}
                  />
                  <span style={{ fontSize: "13px", fontWeight: active ? 750 : 500, color: active ? BRAND_DARK : "#6B8F8A" }}>
                    {cut}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </>
    )}

    <div style={{ height: "1px", background: "#EEF5F4" }} />

    {/* Availability & Scarcity */}
    <div>
      <h3 style={{ fontSize: "11px", fontWeight: 800, color: "#8BA5B3", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 12px" }}>
        Freshness & Status
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        
        {/* In stock */}
        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
          <div style={{
            width: "18px", height: "18px", borderRadius: "5px", border: `2px solid ${filters.inStock ? BRAND : "#D8ECEA"}`,
            background: filters.inStock ? BRAND : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s",
          }}>
            {filters.inStock && <FiCheck size={11} color="#fff" />}
          </div>
          <input type="checkbox" checked={filters.inStock} onChange={(e) => setFilters(prev => ({ ...prev, inStock: e.target.checked }))} style={{ display: "none" }} />
          <span style={{ fontSize: "13px", fontWeight: filters.inStock ? 700 : 500, color: filters.inStock ? BRAND_DARK : "#6B8F8A" }}>
            In Stock Only
          </span>
        </label>

        {/* Catch of the Day */}
        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
          <div style={{
            width: "18px", height: "18px", borderRadius: "5px", border: `2px solid ${filters.catchOfTheDay === "true" ? BRAND : "#D8ECEA"}`,
            background: filters.catchOfTheDay === "true" ? BRAND : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s",
          }}>
            {filters.catchOfTheDay === "true" && <FiCheck size={11} color="#fff" />}
          </div>
          <input
            type="checkbox"
            checked={filters.catchOfTheDay === "true"}
            onChange={(e) => setFilters(prev => ({ ...prev, catchOfTheDay: e.target.checked ? "true" : "false" }))}
            style={{ display: "none" }}
          />
          <span style={{ fontSize: "13px", fontWeight: filters.catchOfTheDay === "true" ? 700 : 500, color: filters.catchOfTheDay === "true" ? BRAND_DARK : "#6B8F8A", display: "flex", alignItems: "center", gap: "4px" }}>
            <FiSun className="text-amber-500" /> Catch of the Day
          </span>
        </label>

      </div>
    </div>

    {/* Reset */}
    <button onClick={clearFilters}
      style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #E2EEEC", background: "transparent", color: "#9BB5B2", fontSize: "12px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#F07468"; e.currentTarget.style.color = "#F07468"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2EEEC"; e.currentTarget.style.color = "#9BB5B2"; }}
    >
      Reset All Filters
    </button>
  </div>
);

export default function FilterSidebar({ isOpen, onClose, filters, setFilters, clearFilters }) {
  const [localPrice, setLocalPrice] = useState({ min: filters.minPrice, max: filters.maxPrice });
  const [metaData, setMetaData] = useState({ minPrice: 0, maxPrice: 2000, categories: [], cuts: [] });

  // Fetch filters metadata from backend
  useEffect(() => {
    axios.get(`${API}/api/products/filter-meta`)
      .then((res) => {
        setMetaData(res.data);
      })
      .catch(() => {});
  }, []);

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

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(26,46,44,0.45)", backdropFilter: "blur(8px)", zIndex: 9998 }}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0,
              width: "min(85vw, 350px)",
              background: "#fff",
              zIndex: 9999,
              display: "flex", flexDirection: "column",
              boxShadow: "-10px 0 40px rgba(26, 46, 44, 0.08)",
            }}
          >
            {/* Header */}
            <div style={{ padding: "18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #EEF5F4", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FiFilter color={BRAND} size={15} />
                <h2 style={{ fontSize: "15px", fontWeight: 800, color: BRAND_DARK, margin: 0 }}>Filter & Sort</h2>
              </div>
              <button
                onClick={onClose}
                style={{ background: "#F4F9F8", border: "none", borderRadius: "50%", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B8F8A" }}
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              <FilterContent
                filters={filters}
                setFilters={setFilters}
                clearFilters={clearFilters}
                localPrice={localPrice}
                handlePriceChange={handlePriceChange}
                applyPrice={applyPrice}
                metaData={metaData}
              />
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 18px", borderTop: "1px solid #EEF5F4", flexShrink: 0 }}>
              <button
                onClick={onClose}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", background: BRAND_DARK, color: "#fff", border: "none", fontSize: "13px", fontWeight: 800, cursor: "pointer" }}
              >
                Done
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
