// src/components/Navbar.jsx
import { useState, useContext, useEffect, useRef, Suspense } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser, FiShoppingBag, FiSearch, FiLogOut, FiPackage,
  FiGrid, FiBell, FiMenu, FiX, FiChevronDown, FiHeart,
} from "react-icons/fi";
import { CartContext } from "../../context/CartContext";
import axios from "axios";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import Spin from "../../pages/general/Spin";
import { useTranslation } from "react-i18next";
import { FiGlobe } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "";

const NAV_LINKS = [
  { label: "Shop All", path: "/products" },
  { label: "Fish", path: "/products?category=Fish" },
  { label: "Prawns", path: "/products?category=Prawn" },
  { label: "Crabs", path: "/products?category=Crab" },
];

export default function Navbar({ announcementActive = false }) {
  const { t, i18n } = useTranslation();
  const { cartCount, setIsCartOpen } = useContext(CartContext);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showProfile, setShowProfile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [trendingSearched, setTrendingSearched] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const lastScrollY = useRef(0);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const isHome = location.pathname === "/";
  const isTransparent = isHome && !scrolled;

  useEffect(() => {
    setScrolled(window.scrollY > 24);
    lastScrollY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setHidden(y > lastScrollY.current && y > 120);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return setUnreadCount(0);
    axios.get(`${API_URL}/api/notifications`, { withCredentials: true })
      .then(res => setUnreadCount(res.data.filter(n => !n.read).length))
      .catch(() => { });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    axios.get(`${API_URL}/api/spin/can-spin`, { withCredentials: true })
      .then(res => { if (res.data.canSpin) setTimeout(() => setShowSpinWheel(true), 2000); })
      .catch(() => { });
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem("seabite_recent_searches");
    if (saved) setRecentSearches(JSON.parse(saved));
    axios.get(`${API_URL}/api/products/search/trending`)
      .then(res => setTrendingSearched(res.data))
      .catch(() => { });
  }, []);

  const handleSearchInput = (val) => {
    setSearchTerm(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length === 0) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await axios.get(`${API_URL}/api/products/search/suggest?q=${val}`);
        setSuggestions(r.data);
      } catch { }
    }, 300);
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
      setSidebarOpen(false);
    }
  };

  const handleSuggestionClick = (item) => {
    saveRecentSearch(item.name);
    navigate(`/products/${item._id}`);
    setSearchExpanded(false); setSuggestions([]); setSearchTerm("");
  };

  const handleRecentTrendingClick = (term) => {
    setSearchTerm(term); saveRecentSearch(term);
    navigate(`/products?search=${encodeURIComponent(term)}`);
    setSearchExpanded(false); setSuggestions([]);
  };

  const handleLogout = async () => {
    try { await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true }); setUser(null); navigate("/"); } catch { }
  };

  const isActive = (p) => location.pathname + location.search === p;

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "te" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
  };

  const T = {
    navBg: isTransparent ? "transparent" : "rgba(255,255,255,0.98)",
    navBorder: isTransparent ? "transparent" : "rgba(226,238,236,0.8)",
    navShadow: isTransparent ? "none" : "0 4px 20px rgba(26,46,44,0.06)",
    link: isTransparent ? "#fff" : "#1A2E2C",
    iconColor: isTransparent ? "#fff" : "#1A2E2C",
    searchBg: isTransparent ? "rgba(255,255,255,0.15)" : "#F4F9F8",
    searchBorder: isTransparent ? "rgba(255,255,255,0.2)" : "#E2EEEC",
  };

  return (
    <>
      <style>{`
        .si:focus { outline: none; }
        .nav-root { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .sidebar-item:hover { background: #F4F9F8; color: #5BBFB5; }
        .prof-item:hover { background: #F4F9F8; }
      `}</style>

      <motion.nav
        className="nav-root"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: hidden ? -80 : 0, opacity: hidden ? 0 : 1 }}
        style={{
          position: "fixed", top: announcementActive ? 40 : 0, left: 0, right: 0, zIndex: 100,
          background: T.navBg, backdropFilter: isTransparent ? "none" : "blur(20px)",
          borderBottom: `1px solid ${T.navBorder}`, boxShadow: T.navShadow,
          padding: isTransparent ? "16px 0" : "10px 0",
        }}
      >
        <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", gap: "20px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSidebarOpen(true)}
              style={{ background: "none", border: "none", color: T.iconColor, cursor: "pointer", display: "flex", alignItems: "center", padding: "8px", borderRadius: "8px", transition: "background 0.2s" }}
              onMouseOver={e => e.currentTarget.style.background = isTransparent ? "rgba(255,255,255,0.1)" : "#F4F9F8"}
              onMouseOut={e => e.currentTarget.style.background = "none"}
            >
              <FiMenu size={22} />
            </motion.button>
            <Link to="/" style={{ textDecoration: "none" }}>
              <img src="/logo.png" alt="SeaBite" style={{ height: "38px", width: "auto", filter: isTransparent ? "brightness(0) invert(1)" : "none" }} />
            </Link>
          </div>

          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
              <div style={{ 
                display: "flex", alignItems: "center", gap: "10px", 
                background: T.searchBg, border: `1.5px solid ${searchExpanded ? "#5BBFB5" : T.searchBorder}`, 
                borderRadius: "12px", padding: "8px 16px", transition: "all 0.2s" 
              }}>
                <FiSearch size={16} style={{ color: searchExpanded ? "#5BBFB5" : (isTransparent ? "rgba(255,255,255,0.7)" : "#6B8F8A") }} />
                <input
                  ref={searchRef}
                  className="si"
                  value={searchTerm}
                  onChange={e => handleSearchInput(e.target.value)}
                  onKeyDown={handleSearchSubmit}
                  onFocus={() => setSearchExpanded(true)}
                  onBlur={() => setTimeout(() => { setSearchExpanded(false); setSuggestions([]); }, 200)}
                  placeholder="Search SeaBite..."
                  style={{ border: "none", background: "none", fontSize: "14px", color: isTransparent ? "#fff" : "#1A2E2C", width: "100%", outline: "none" }}
                />
              </div>
              <AnimatePresence>
                {searchExpanded && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "10px", background: "#fff", borderRadius: "16px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", overflow: "hidden", zIndex: 101, border: "1px solid #E2EEEC" }}>
                    {searchTerm.length === 0 ? (
                      <div style={{ padding: "16px" }}>
                         {recentSearches.length > 0 && (
                           <div style={{ marginBottom: "16px" }}>
                             <p style={{ fontSize: "11px", fontWeight: "700", color: "#B8CFCC", textTransform: "uppercase", marginBottom: "8px" }}>Recent</p>
                             <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                               {recentSearches.map((s, i) => <button key={i} onClick={() => handleRecentTrendingClick(s)} style={{ padding: "4px 10px", borderRadius: "20px", background: "#F4F9F8", border: "1px solid #E2EEEC", fontSize: "12px", color: "#4A7570", cursor: "pointer" }}>{s}</button>)}
                             </div>
                           </div>
                         )}
                         {trendingSearched.length > 0 && (
                           <div>
                             <p style={{ fontSize: "11px", fontWeight: "700", color: "#B8CFCC", textTransform: "uppercase", marginBottom: "8px" }}>Trending</p>
                             <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                               {trendingSearched.map((s, i) => <button key={i} onClick={() => handleRecentTrendingClick(s)} style={{ padding: "4px 10px", borderRadius: "20px", background: "#EAF6F5", border: "1px solid #D1E9E6", fontSize: "12px", color: "#3D8C85", cursor: "pointer" }}>🔥 {s}</button>)}
                             </div>
                           </div>
                         )}
                      </div>
                    ) : (
                      <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                        {suggestions.map(item => (
                          <div key={item._id} className="prof-item" onClick={() => handleSuggestionClick(item)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #F4F9F8" }}>
                            <img src={item.image} alt={item.name} style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }} />
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: "14px", fontWeight: "600", color: "#1A2E2C", margin: 0 }}>{item.name}</p>
                              <p style={{ fontSize: "12px", color: "#6B8F8A", margin: 0 }}>{item.category}</p>
                            </div>
                            <span style={{ fontWeight: "700", color: "#5BBFB5" }}>₹{item.basePrice}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={toggleLanguage} style={{ background: "none", border: `1.5px solid ${T.searchBorder}`, borderRadius: "8px", color: T.link, fontSize: "11px", fontWeight: "700", padding: "6px 10px", cursor: "pointer" }}>
              {i18n.language === "en" ? "EN" : "TE"}
            </motion.button>
            
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsCartOpen(true)} style={{ position: "relative", background: "none", border: "none", color: T.iconColor, cursor: "pointer", padding: "8px" }}>
              <FiShoppingBag size={20} />
              {cartCount > 0 && <span style={{ position: "absolute", top: "0", right: "0", background: "#5BBFB5", color: "#fff", fontSize: "10px", fontWeight: "700", width: "16px", height: "16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{cartCount}</span>}
            </motion.button>

            {user ? (
              <div style={{ position: "relative" }} onMouseEnter={() => setShowProfile(true)} onMouseLeave={() => setShowProfile(false)}>
                <motion.button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 8px", borderRadius: "20px", background: isTransparent ? "rgba(255,255,255,0.1)" : "#F4F9F8", border: `1px solid ${T.searchBorder}`, cursor: "pointer" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#5BBFB5", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "800" }}>{user.name[0]}</div>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: T.link }} className="hidden-mobile">{user.name.split(" ")[0]}</span>
                </motion.button>
                <AnimatePresence>
                  {showProfile && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      style={{ position: "absolute", top: "100%", right: 0, marginTop: "10px", width: "200px", background: "#fff", borderRadius: "12px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", padding: "8px", border: "1px solid #E2EEEC" }}>
                      <button onClick={() => navigate("/profile")} className="prof-item" style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px", border: "none", background: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}><FiUser size={14}/> Profile</button>
                      <button onClick={() => navigate("/orders")} className="prof-item" style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px", border: "none", background: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}><FiPackage size={14}/> Orders</button>
                      <hr style={{ margin: "4px 0", border: "none", borderTop: "1px solid #F0F5F4" }} />
                      <button onClick={handleLogout} className="prof-item" style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px", border: "none", background: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "#F07468" }}><FiLogOut size={14}/> Logout</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/login")} style={{ background: "#1A2E2C", color: "#fff", border: "none", borderRadius: "10px", padding: "8px 18px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                Login
              </motion.button>
            )}
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(26,46,44,0.3)", backdropFilter: "blur(4px)", zIndex: 200 }} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: "300px", background: "#fff", zIndex: 201, padding: "40px 24px", boxShadow: "10px 0 40px rgba(0,0,0,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "40px" }}>
                <img src="/logo.png" alt="SeaBite" style={{ height: "32px" }} />
                <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", color: "#6B8F8A", cursor: "pointer" }}><FiX size={24} /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <p style={{ fontSize: "11px", fontWeight: "800", color: "#B8CFCC", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Navigation</p>
                {[{ label: "Home", path: "/" }, { label: "Shop All", path: "/products" }, { label: "About Us", path: "/about" }, { label: "My Account", path: "/profile" }, { label: "Track Orders", path: "/orders" }].map(link => (
                  <Link key={link.path} to={link.path} onClick={() => setSidebarOpen(false)} className="sidebar-item"
                    style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "12px", textDecoration: "none", color: "#1A2E2C", fontSize: "15px", fontWeight: "600", transition: "all 0.2s" }}>
                    {link.label}
                  </Link>
                ))}
                <div style={{ marginTop: "24px" }}>
                   <p style={{ fontSize: "11px", fontWeight: "800", color: "#B8CFCC", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Categories</p>
                   {NAV_LINKS.map(link => (
                     <Link key={link.path} to={link.path} onClick={() => setSidebarOpen(false)} className="sidebar-item"
                       style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", borderRadius: "12px", textDecoration: "none", color: "#4A7570", fontSize: "14px", fontWeight: "500" }}>
                       {link.label}
                     </Link>
                   ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        {showSpinWheel && <Spin isOpen={showSpinWheel} onClose={() => setShowSpinWheel(false)} />}
      </Suspense>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile   { display: none !important; }
          .hidden-mobile { display: flex !important; }
        }
      `}</style>
    </>
  );
}