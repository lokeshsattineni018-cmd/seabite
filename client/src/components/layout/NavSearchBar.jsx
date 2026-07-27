import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiX, FiChevronRight, FiArrowRight } from "react-icons/fi";
import axios from "axios";
import { slugify } from "../../utils/slugify";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function NavSearchBar({ isTransparent, announcementActive, scrolled, onMobileClose }) {
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchGlobalDiscount, setSearchGlobalDiscount] = useState(0);
  const [trendingSearched, setTrendingSearched] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("seabite_recent_searches");
    if (saved) setRecentSearches(JSON.parse(saved));
    axios.get(`${API_URL}/api/products/search/trending`)
      .then(res => setTrendingSearched(res.data))
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (searchExpanded) {
      const timer = setTimeout(() => searchRef.current?.focus(), 250);
      return () => clearTimeout(timer);
    }
  }, [searchExpanded]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchExpanded && searchRef.current && !searchRef.current.contains(e.target) && !e.target.closest('.search-container')) {
        setSearchExpanded(false);
        setSuggestions([]);
      }
      if (!e.target.closest('.search-container')) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchExpanded]);

  const handleSearchInput = (val) => {
    setSearchTerm(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length === 0) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await axios.get(`${API_URL}/api/products/search/suggest?q=${val}`);
        setSuggestions(r.data.suggestions || []);
        setSearchGlobalDiscount(r.data.globalDiscount || 0);
      } catch { }
    }, 75);
  };

  const saveRecentSearch = (term) => {
    if (!term.trim()) return;
    const newRecents = [term.trim(), ...recentSearches.filter(s => s !== term.trim())].slice(0, 5);
    setRecentSearches(newRecents);
    localStorage.setItem("seabite_recent_searches", JSON.stringify(newRecents));
  };

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      saveRecentSearch(searchTerm);
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm(""); setSuggestions([]); setSearchExpanded(false);
      if (onMobileClose) onMobileClose();
    }
  };

  const handleSuggestionClick = (item) => {
    saveRecentSearch(item.name);
    navigate(`/products/${slugify(item.name)}`);
    setSearchExpanded(false); setSuggestions([]); setSearchTerm("");
  };

  const renderPrice = (item) => {
    const hasFlash = item.flashSale?.isFlashSale && new Date(item.flashSale.saleEndDate) > new Date();
    const disc = hasFlash ? item.flashSale.discountPrice : (searchGlobalDiscount > 0 ? item.basePrice * (1 - searchGlobalDiscount / 100) : item.basePrice);
    const isDisc = hasFlash || searchGlobalDiscount > 0;
    return { price: disc.toFixed(0), isDisc, original: item.basePrice };
  };

  // Expand mobile search from parent
  const expandMobileSearch = () => setSearchExpanded(true);

  return (
    <>
      {/* ═══ DESKTOP SEARCH PILL ═══ */}
      <div style={{ position: "relative", width: "100%", maxWidth: "320px" }} className="search-container hidden-mobile">
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: isTransparent ? "rgba(255,255,255,0.15)" : "#F0F2F4",
          borderRadius: "30px",
          padding: "8px 16px",
          width: "100%",
          transition: "all 0.4s ease",
          border: searchFocused ? "1.5px solid #5BA8A0" : "1.5px solid transparent",
          boxShadow: searchFocused ? "0 0 0 3px rgba(91,168,160,0.15)" : "none",
          backdropFilter: isTransparent ? "blur(12px)" : "none"
        }}>
          <FiSearch size={16} style={{ color: isTransparent ? "rgba(255,255,255,0.7)" : "#8A8279", flexShrink: 0 }} />
          <input
            ref={searchRef}
            aria-label="Search for products"
            className="si"
            value={searchTerm}
            onChange={e => handleSearchInput(e.target.value)}
            onKeyDown={handleSearchSubmit}
            onFocus={() => setSearchFocused(true)}
            placeholder="Search for anything..."
            style={{
              border: "none",
              background: "none",
              fontSize: "14px",
              color: isTransparent ? "#FFFFFF" : "#1A2E2C",
              width: "100%",
              outline: "none",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: "500"
            }}
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(""); setSuggestions([]); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8279", display: "flex", padding: 0 }}
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {searchFocused && (suggestions.length > 0 || (searchTerm.length > 1 && suggestions.length === 0)) && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                right: 0,
                background: "#fff",
                border: "1.5px solid #E2EEEC",
                borderRadius: "18px",
                overflow: "hidden",
                zIndex: 300,
                boxShadow: "0 20px 50px rgba(26,46,44,0.12)"
              }}
            >
              {suggestions.length > 0 ? (
                <>
                  <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid #F4F9F8" }}>
                    <span style={{ fontSize: "10px", fontWeight: "800", color: "#A8C5C0", textTransform: "uppercase", letterSpacing: "0.1em" }}>Top Results</span>
                  </div>
                  <div style={{ maxHeight: "300px", overflowY: "auto" }} className="drawer-scrollbar">
                    {suggestions.map(item => {
                      const { price, isDisc, original } = renderPrice(item);
                      return (
                        <div
                          key={item._id}
                          className="prof-item"
                          onClick={() => handleSuggestionClick(item)}
                          style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #F4F9F8", transition: "background 0.2s" }}
                        >
                          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#F8FAFB", overflow: "hidden", flexShrink: 0, border: "1px solid #E8EEF2" }}>
                            <img src={item.image} alt={item.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: "14px", fontWeight: "700", color: "#1A2E2C", margin: "0 0 2px" }}>{item.name}</p>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                              <p style={{ fontSize: "12px", fontWeight: "500", color: "#5BBFB5" }}>₹{price}</p>
                              {isDisc && <span style={{ fontSize: "10px", color: "#A8C5C0", textDecoration: "line-through" }}>₹{original}</span>}
                              <span style={{ color: "#A8C5C0", fontSize: "11px" }}>/ kg</span>
                            </div>
                          </div>
                          <FiArrowRight size={14} style={{ color: "#E2EEEC" }} />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ padding: "10px", background: "#F4F9F8", textAlign: "center" }}>
                    <button onClick={() => { saveRecentSearch(searchTerm); navigate(`/products?search=${encodeURIComponent(searchTerm)}`); setSearchFocused(false); }} style={{ background: "none", border: "none", fontSize: "12px", fontWeight: "700", color: "#5BBFB5", cursor: "pointer" }}>View all results</button>
                  </div>
                </>
              ) : (
                <div style={{ padding: "20px 16px", textAlign: "center", color: "#B8CFCC", fontSize: "13px" }}>
                  No results for "<span style={{ color: "#6B8F8A", fontWeight: 700 }}>{searchTerm}</span>"
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ MOBILE SEARCH BUTTON (trigger only) ═══ */}
      <motion.button
        className="show-mobile"
        whileTap={{ scale: 0.88 }}
        onClick={expandMobileSearch}
        style={{ background: "none", border: "none", padding: "0 10px", color: isTransparent ? "#FFFFFF" : "#1A2E2C", height: "100%", display: "none" }}
      >
        <FiSearch size={20} />
      </motion.button>

      {/* ═══ MOBILE SEARCH OVERLAY ═══ */}
      <AnimatePresence>
        {searchExpanded && (
          <motion.div
            className="search-container mobile-search-overlay"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              top: announcementActive && !scrolled ? "94px" : "64px",
              left: 0, right: 0,
              background: "rgba(255,255,255,0.98)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              zIndex: 1300,
              boxShadow: "0 12px 40px rgba(26,46,44,0.13)",
              borderBottom: "1px solid rgba(91,191,181,0.12)",
              padding: "14px 16px 8px",
            }}
          >
            {/* Pill input row */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <div style={{
                flex: 1, display: "flex", alignItems: "center", gap: "10px",
                background: "#fff",
                border: "2px solid #5BBFB5",
                borderRadius: "50px",
                padding: "10px 16px",
                boxShadow: "0 0 0 4px rgba(91,191,181,0.1)",
              }}>
                <FiSearch size={17} color="#5BBFB5" />
                <input
                  autoFocus
                  aria-label="Search for products"
                  placeholder="Search fresh catch..."
                  value={searchTerm}
                  onChange={e => handleSearchInput(e.target.value)}
                  onKeyDown={handleSearchSubmit}
                  style={{
                    border: "none", background: "none", flex: 1,
                    fontSize: "15px", outline: "none", color: "#1A2E2C",
                    fontFamily: "'Manrope', sans-serif", fontWeight: 500,
                  }}
                />
                {searchTerm && (
                  <FiX size={16} color="#B8CFCC" style={{ cursor: "pointer", flexShrink: 0 }}
                    onClick={() => { setSearchTerm(""); setSuggestions([]); }} />
                )}
              </div>
              <button
                onClick={() => { setSearchExpanded(false); setSuggestions([]); setSearchTerm(""); }}
                style={{
                  background: "none", border: "none", color: "#6B8F8A",
                  fontWeight: "700", fontSize: "13px",
                  fontFamily: "'Manrope', sans-serif", cursor: "pointer",
                  flexShrink: 0, padding: "8px 4px",
                }}
              >
                Cancel
              </button>
            </div>

            {/* Live results */}
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ borderTop: "1px solid #EEF5F4", maxHeight: "50vh", overflowY: "auto", marginTop: "8px" }}
              >
                {suggestions.map((item, idx) => {
                  const { price, isDisc, original } = renderPrice(item);
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        navigate(`/products/${slugify(item.name)}`);
                        setSearchExpanded(false);
                        setSuggestions([]);
                        setSearchTerm("");
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: "12px",
                        padding: "11px 4px", cursor: "pointer",
                        borderBottom: idx < suggestions.length - 1 ? "1px solid #f5f5f5" : "none",
                      }}
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.name} loading="lazy"
                          style={{ width: "46px", height: "46px", borderRadius: "10px", objectFit: "cover", flexShrink: 0, border: "1px solid #EEF5F4" }} />
                      ) : (
                        <div style={{ width: "46px", height: "46px", borderRadius: "10px", background: "#EEF5F4", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🐟</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#1A2E2C", fontFamily: "'Manrope', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.name}
                        </p>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "2px" }}>
                          <p style={{ margin: 0, fontSize: "13px", color: "#5BBFB5", fontWeight: "800", fontFamily: "'Manrope', sans-serif" }}>
                            ₹{price}
                          </p>
                          {isDisc && <span style={{ fontSize: "11px", color: "#A8C5C0", textDecoration: "line-through" }}>₹{original}</span>}
                        </div>
                      </div>
                      <FiChevronRight size={14} color="#D8ECEA" />
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* No results */}
            {searchTerm.length > 1 && suggestions.length === 0 && (
              <div style={{ padding: "20px 4px 12px", textAlign: "center", color: "#B8CFCC", fontSize: "13px", fontFamily: "'Manrope', sans-serif" }}>
                No results for "<span style={{ color: "#6B8F8A", fontWeight: 700 }}>{searchTerm}</span>"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
