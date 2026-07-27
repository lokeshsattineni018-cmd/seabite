import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiX, FiChevronRight, FiArrowRight, FiTrendingUp, FiClock } from "react-icons/fi";
import axios from "axios";
import { slugify } from "../../utils/slugify";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function NavSearchBar({ onMobileClose }) {
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
      .then(res => setTrendingSearched(res.data || []))
      .catch(() => { });
  }, []);

  // Keyboard shortcut (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchExpanded) {
      const timer = setTimeout(() => searchRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [searchExpanded]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".search-container")) {
        setSearchFocused(false);
        setSearchExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchInput = (val) => {
    setSearchTerm(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await axios.get(`${API_URL}/api/products/search/suggest?q=${encodeURIComponent(val)}`);
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
      setSearchTerm("");
      setSuggestions([]);
      setSearchFocused(false);
      setSearchExpanded(false);
      if (onMobileClose) onMobileClose();
    }
  };

  const handleSuggestionClick = (item) => {
    saveRecentSearch(item.name);
    navigate(`/products/${slugify(item.name)}`);
    setSearchFocused(false);
    setSearchExpanded(false);
    setSuggestions([]);
    setSearchTerm("");
  };

  const renderPrice = (item) => {
    const hasFlash = item.flashSale?.isFlashSale && new Date(item.flashSale.saleEndDate) > new Date();
    const disc = hasFlash ? item.flashSale.discountPrice : (searchGlobalDiscount > 0 ? item.basePrice * (1 - searchGlobalDiscount / 100) : item.basePrice);
    const isDisc = hasFlash || searchGlobalDiscount > 0;
    return { price: disc.toFixed(0), isDisc, original: item.basePrice };
  };

  return (
    <>
      {/* ═══ DESKTOP SEARCH BAR ═══ */}
      <div style={{ position: "relative", width: "100%", maxWidth: searchFocused ? "420px" : "360px", transition: "max-width 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }} className="search-container hidden-mobile">
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "#F2F6F5",
          borderRadius: "50px",
          padding: "8px 16px",
          width: "100%",
          transition: "all 0.3s ease",
          border: searchFocused ? "1.5px solid #0D9488" : "1.5px solid #E2EEEC",
          boxShadow: searchFocused ? "0 4px 20px rgba(13,148,136,0.12)" : "0 2px 6px rgba(0,0,0,0.02)",
        }}>
          <FiSearch size={16} style={{ color: searchFocused ? "#0D9488" : "#6B8F8A", flexShrink: 0, transition: "color 0.2s" }} />
          <input
            ref={searchRef}
            aria-label="Search for products"
            className="si"
            value={searchTerm}
            onChange={e => handleSearchInput(e.target.value)}
            onKeyDown={handleSearchSubmit}
            onFocus={() => setSearchFocused(true)}
            placeholder="Search fresh fish, prawns, crabs..."
            style={{
              border: "none",
              background: "none",
              fontSize: "13.5px",
              color: "#1A2E2C",
              width: "100%",
              outline: "none",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: "600"
            }}
          />

          {searchTerm ? (
            <button
              onClick={() => { setSearchTerm(""); setSuggestions([]); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6B8F8A", display: "flex", padding: 2 }}
            >
              <FiX size={14} />
            </button>
          ) : (
            <span style={{ fontSize: "10px", fontWeight: "700", color: "#94A3B8", background: "#E2EEEC", padding: "2px 6px", borderRadius: "6px", letterSpacing: "0.05em", pointerEvents: "none" }}>
              ⌘K
            </span>
          )}
        </div>

        {/* Desktop Autocomplete Dropdown */}
        <AnimatePresence>
          {searchFocused && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                left: 0,
                right: 0,
                background: "#FFFFFF",
                border: "1.5px solid #E2EEEC",
                borderRadius: "20px",
                overflow: "hidden",
                zIndex: 400,
                boxShadow: "0 20px 50px rgba(26,46,44,0.15)"
              }}
            >
              {suggestions.length > 0 ? (
                <>
                  <div style={{ padding: "12px 18px 8px", borderBottom: "1px solid #F4F9F8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "10px", fontWeight: "800", color: "#0D9488", textTransform: "uppercase", letterSpacing: "0.1em" }}>Top Results</span>
                    <span style={{ fontSize: "11px", color: "#94A3B8" }}>{suggestions.length} items found</span>
                  </div>
                  <div style={{ maxHeight: "320px", overflowY: "auto" }} className="drawer-scrollbar">
                    {suggestions.map((item, idx) => {
                      const { price, isDisc, original } = renderPrice(item);
                      return (
                        <div
                          key={item._id || idx}
                          className="prof-item"
                          onClick={() => handleSuggestionClick(item)}
                          style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 18px", cursor: "pointer", borderBottom: "1px solid #F4F9F8", transition: "background 0.2s" }}
                        >
                          <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: "#F8FAFB", overflow: "hidden", flexShrink: 0, border: "1px solid #E8EEF2" }}>
                            <img src={item.image} alt={item.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: "14px", fontWeight: "700", color: "#1A2E2C", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</p>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                              <p style={{ fontSize: "13px", fontWeight: "800", color: "#0D9488", margin: 0 }}>₹{price}</p>
                              {isDisc && <span style={{ fontSize: "11px", color: "#94A3B8", textDecoration: "line-through" }}>₹{original}</span>}
                              <span style={{ color: "#94A3B8", fontSize: "11px" }}>/ {item.unit || "kg"}</span>
                            </div>
                          </div>
                          <FiArrowRight size={14} style={{ color: "#0D9488", flexShrink: 0 }} />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ padding: "12px", background: "#F4F9F8", textAlign: "center", borderTop: "1px solid #E2EEEC" }}>
                    <button
                      onClick={() => {
                        saveRecentSearch(searchTerm);
                        navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
                        setSearchFocused(false);
                      }}
                      style={{ background: "none", border: "none", fontSize: "13px", fontWeight: "700", color: "#0D9488", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      View all results <FiArrowRight size={14} />
                    </button>
                  </div>
                </>
              ) : searchTerm.trim().length > 0 ? (
                <div style={{ padding: "28px 18px", textAlign: "center", color: "#64748B", fontSize: "13.5px" }}>
                  No matching seafood found for "<span style={{ color: "#1A2E2C", fontWeight: 700 }}>{searchTerm}</span>"
                </div>
              ) : (
                /* Recent & Trending Searches */
                <div style={{ padding: "16px" }}>
                  {recentSearches.length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: "800", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                        <FiClock size={12} /> Recent Searches
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {recentSearches.map((term, i) => (
                          <button
                            key={i}
                            onClick={() => { setSearchTerm(term); handleSearchInput(term); }}
                            style={{ background: "#F1F5F9", border: "none", borderRadius: "20px", padding: "5px 12px", fontSize: "12px", color: "#334155", fontWeight: "600", cursor: "pointer" }}
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {trendingSearched.length > 0 && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: "800", color: "#0D9488", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                        <FiTrendingUp size={12} /> Popular Right Now
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {trendingSearched.map((item, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              const title = typeof item === "string" ? item : item.name;
                              setSearchTerm(title);
                              handleSearchInput(title);
                            }}
                            style={{ background: "#E6F4F1", border: "1px solid #CCECE6", borderRadius: "20px", padding: "5px 12px", fontSize: "12px", color: "#0D9488", fontWeight: "700", cursor: "pointer" }}
                          >
                            🔥 {typeof item === "string" ? item : item.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ MOBILE HEADER INLINE SEARCH TRIGGER ═══ */}
      <div className="show-mobile" style={{ flex: 1, maxWidth: "160px", margin: "0 8px" }}>
        <button
          onClick={expandMobileSearch}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "#F2F6F5",
            border: "1px solid #E2EEEC",
            borderRadius: "30px",
            padding: "6px 12px",
            color: "#6B8F8A",
            fontSize: "12px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          <FiSearch size={14} color="#0D9488" />
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Search catch...</span>
        </button>
      </div>

      {/* ═══ MOBILE FULLSCREEN SEARCH OVERLAY ═══ */}
      <AnimatePresence>
        {searchExpanded && (
          <motion.div
            className="search-container mobile-search-overlay"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              top: 0, left: 0, right: 0, bottom: 0,
              background: "#FFFFFF",
              zIndex: 13000,
              padding: "16px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Top Bar Input */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{
                flex: 1, display: "flex", alignItems: "center", gap: "10px",
                background: "#F2F6F5",
                border: "2px solid #0D9488",
                borderRadius: "50px",
                padding: "10px 16px",
                boxShadow: "0 4px 16px rgba(13,148,136,0.15)",
              }}>
                <FiSearch size={18} color="#0D9488" />
                <input
                  autoFocus
                  aria-label="Search for products"
                  placeholder="Search fresh fish, prawns, crabs..."
                  value={searchTerm}
                  onChange={e => handleSearchInput(e.target.value)}
                  onKeyDown={handleSearchSubmit}
                  style={{
                    border: "none", background: "none", flex: 1,
                    fontSize: "15px", outline: "none", color: "#1A2E2C",
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600,
                  }}
                />
                {searchTerm && (
                  <FiX size={18} color="#94A3B8" style={{ cursor: "pointer", flexShrink: 0 }}
                    onClick={() => { setSearchTerm(""); setSuggestions([]); }} />
                )}
              </div>
              <button
                onClick={() => { setSearchExpanded(false); setSuggestions([]); setSearchTerm(""); }}
                style={{
                  background: "none", border: "none", color: "#0D9488",
                  fontWeight: "800", fontSize: "14px",
                  fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: "pointer",
                  flexShrink: 0, padding: "8px 4px",
                }}
              >
                Cancel
              </button>
            </div>

            {/* Live Search Suggestions */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {suggestions.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {suggestions.map((item, idx) => {
                    const { price, isDisc, original } = renderPrice(item);
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSuggestionClick(item)}
                        style={{
                          display: "flex", alignItems: "center", gap: "14px",
                          padding: "14px 4px", cursor: "pointer",
                          borderBottom: "1px solid #F1F5F9",
                        }}
                      >
                        <img src={item.image} alt={item.name} loading="lazy"
                          style={{ width: "50px", height: "50px", borderRadius: "12px", objectFit: "cover", flexShrink: 0, border: "1px solid #EEF5F4" }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: "0 0 2px", fontSize: "14.5px", fontWeight: "700", color: "#1A2E2C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {item.name}
                          </p>
                          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                            <p style={{ margin: 0, fontSize: "14px", color: "#0D9488", fontWeight: "800" }}>
                              ₹{price}
                            </p>
                            {isDisc && <span style={{ fontSize: "11px", color: "#94A3B8", textDecoration: "line-through" }}>₹{original}</span>}
                            <span style={{ fontSize: "11px", color: "#94A3B8" }}>/ {item.unit || "kg"}</span>
                          </div>
                        </div>
                        <FiChevronRight size={16} color="#0D9488" />
                      </div>
                    );
                  })}
                </div>
              ) : searchTerm.length > 1 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#64748B", fontSize: "14px" }}>
                  No catch found for "<span style={{ color: "#1A2E2C", fontWeight: 700 }}>{searchTerm}</span>"
                </div>
              ) : (
                /* Recent & Trending on Mobile Overlay */
                <div style={{ paddingTop: "12px" }}>
                  {recentSearches.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                      <p style={{ fontSize: "11px", fontWeight: "800", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Recent Searches</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {recentSearches.map((term, i) => (
                          <button
                            key={i}
                            onClick={() => { setSearchTerm(term); handleSearchInput(term); }}
                            style={{ background: "#F1F5F9", border: "none", borderRadius: "20px", padding: "7px 14px", fontSize: "13px", color: "#334155", fontWeight: "600" }}
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {trendingSearched.length > 0 && (
                    <div>
                      <p style={{ fontSize: "11px", fontWeight: "800", color: "#0D9488", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>🔥 Trending Seafood</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {trendingSearched.map((item, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              const title = typeof item === "string" ? item : item.name;
                              setSearchTerm(title);
                              handleSearchInput(title);
                            }}
                            style={{ background: "#E6F4F1", border: "1px solid #CCECE6", borderRadius: "20px", padding: "7px 14px", fontSize: "13px", color: "#0D9488", fontWeight: "700" }}
                          >
                            {typeof item === "string" ? item : item.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
