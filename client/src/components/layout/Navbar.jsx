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

const API_URL = import.meta.env.VITE_API_URL || "";

const NAV_LINKS = [
  { label: "Shop All", path: "/products" },
  { label: "Fish", path: "/products?category=Fish" },
  { label: "Prawns", path: "/products?category=Prawn" },
  { label: "Crabs", path: "/products?category=Crab" },
];

export default function Navbar({ openCart, announcementActive = false }) {
  const { cartCount } = useContext(CartContext);
  const { user, setUser, refreshMe } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showProfile, setShowProfile] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const lastScrollY = useRef(0);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Only the home page has the dark video hero
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

  const handleSearchInput = (val) => {
    setSearchTerm(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const r = await axios.get(`${API_URL}/api/products/search/suggest?q=${val}`);
        setSuggestions(r.data);
      } catch { }
    }, 300);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm(""); setSuggestions([]); setSearchExpanded(false);
      if (mobileOpen) setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    try { await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true }); setUser(null); navigate("/"); } catch { }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tok) => {
      try {
        const r = await axios.post(`${API_URL}/api/auth/google`, { token: tok.access_token }, { withCredentials: true });
        setUser(r.data.user);
        if (r.data.user.role === "admin") navigate("/admin/dashboard");
        refreshMe();
      } catch { }
    },
  });

  const isActive = (p) => location.pathname + location.search === p;

  // ── TOKEN TABLE ────────────────────────────────────────────────────────────
  // isTransparent → home page, above fold (dark video behind navbar)
  // !isTransparent → all other pages OR after scrolling
  // ─────────────────────────────────────────────────────────────────────────
  const T = {
    // Navbar shell
    navBg: isTransparent ? "transparent" : "rgba(255,255,255,0.97)",
    navBlur: isTransparent ? "none" : "blur(24px) saturate(1.6)",
    navBorder: isTransparent ? "transparent" : "rgba(226,238,236,0.85)",
    navShadow: isTransparent ? "none" : "0 2px 24px rgba(26,46,44,0.07)",
    navPy: isTransparent ? "14px 0" : "9px 0",

    // Nav links
    link: isTransparent ? "rgba(255,255,255,0.88)" : "#2C4A46",
    linkActive: isTransparent ? "#fff" : "#5BBFB5",
    underline: isTransparent ? "rgba(255,255,255,0.9)" : "#5BBFB5",

    // ── ICON BUTTONS ─────────────────────────────────────────────────────
    // Hero: TRANSPARENT bg/border — icons float as bare glyphs over the video
    // Page: light seafoam tint with subtle border
    iconBg: isTransparent ? "transparent" : "#F4F9F8",
    iconBorder: isTransparent ? "none" : "1px solid #E2EEEC",
    iconColor: isTransparent ? "rgba(255,255,255,0.90)" : "#4A7570",

    // Hover overlay for icon buttons
    iconHoverBg: isTransparent ? "rgba(255,255,255,0.15)" : "#E8F4F2",
    iconHoverColor: isTransparent ? "#fff" : "#5BBFB5",

    // Login CTA
    loginBg: isTransparent ? "#5BBFB5" : "#1A2E2C",
    loginShadow: isTransparent ? "0 2px 14px rgba(0,0,0,0.20)" : "none",

    // Profile pill
    pillBg: isTransparent ? "transparent" : "#fff",
    pillBorder: isTransparent ? "transparent" : "#DDE9E7",
    pillShadow: "none",
    pillBlur: "none",
    pillName: isTransparent ? "#ffffff" : "#1A2E2C",
    pillChevron: isTransparent ? "#ffffff" : "#A8C5C0",
  };

  const iconBtn = {
    width: "36px", height: "36px",
    borderRadius: "10px",
    background: T.iconBg,
    border: T.iconBorder,
    color: T.iconColor,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0,
    transition: "background 0.25s, color 0.25s, border-color 0.25s",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Lora:wght@600;700&display=swap');
        .nav-root * { box-sizing: border-box; }

        /* Animated underline on nav links */
        .nav-ul::after {
          content: ''; display: block; height: 1.5px; border-radius: 2px; margin-top: 3px;
          background: ${T.underline};
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.22s ease, background 0.35s;
        }
        .nav-ul:hover::after, .nav-ul-active::after { transform: scaleX(1); }

        /* Icon button hover — fully transparent on hero, tinted on page */
        .nav-ib:hover {
          background: ${T.iconHoverBg} !important;
          color: ${T.iconHoverColor} !important;
        }

        /* Dropdown / profile menu items */
        .dd-item:hover   { background: #F0F8F7 !important; color: #5BBFB5 !important; }
        .prof-item:hover { background: #F4F9F8 !important; }
        .mob-link:hover  { background: #F4F9F8 !important; }
        .si:focus { outline: none; }
      `}</style>

      <motion.nav
        className="nav-root"
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: hidden ? -72 : 0, opacity: hidden ? 0 : 1 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: "fixed", top: announcementActive ? 40 : 0, left: 0, right: 0, zIndex: 100,
          fontFamily: "'Manrope', sans-serif",
          background: T.navBg,
          backdropFilter: T.navBlur,
          WebkitBackdropFilter: T.navBlur,
          borderBottom: `1px solid ${T.navBorder}`,
          boxShadow: T.navShadow,
          padding: T.navPy,
          transition: "background 0.35s, box-shadow 0.35s, padding 0.3s, border-color 0.35s, top 0.3s",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "center" }}>

          <div style={{ marginRight: "36px", flexShrink: 0 }}>
            <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
              <img src="/logo.png" alt="SeaBite" style={{ height: "44px", width: "auto", objectFit: "contain" }} />
            </Link>
          </div>

          {/* ── Desktop nav links ── */}
          <div className="hidden-mobile" style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>

            {/* Shop dropdown */}
            <div style={{ position: "relative" }}
              onMouseEnter={() => setShowShop(true)}
              onMouseLeave={() => setShowShop(false)}
            >
              <button className="nav-ul" style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "6px 12px", border: "none", background: "none",
                fontSize: "15px", fontWeight: "600", color: T.link,
                cursor: "pointer", fontFamily: "'Manrope', sans-serif",
                borderRadius: "8px", transition: "color 0.3s",
              }}>
                Shop
                <motion.span animate={{ rotate: showShop ? 180 : 0 }} transition={{ duration: 0.22 }} style={{ display: "flex" }}>
                  <FiChevronDown size={12} />
                </motion.span>
              </button>

              <AnimatePresence>
                {showShop && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.16 }}
                    style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, background: "#fff", border: "1.5px solid #E2EEEC", borderRadius: "14px", padding: "5px", minWidth: "170px", zIndex: 200, boxShadow: "0 12px 40px rgba(26,46,44,0.10)" }}
                  >
                    {NAV_LINKS.map(link => (
                      <button key={link.path} className="dd-item"
                        onClick={() => { navigate(link.path); setShowShop(false); }}
                        style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 13px", border: "none", background: "none", borderRadius: "9px", fontSize: "15px", fontWeight: "600", color: "#1A2E2C", cursor: "pointer", fontFamily: "'Manrope', sans-serif", transition: "all 0.15s" }}>
                        {link.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {[{ label: "About", path: "/about" }, { label: "Orders", path: "/orders" }].map(link => (
              <Link key={link.path} to={link.path}
                className={`nav-ul ${isActive(link.path) ? "nav-ul-active" : ""}`}
                style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "15px", fontWeight: "600", color: isActive(link.path) ? T.linkActive : T.link, textDecoration: "none", transition: "color 0.3s" }}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Right controls ── */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "auto" }}>

            {/* Search */}
            <div style={{ position: "relative" }} className="hidden-mobile">
              <AnimatePresence>
                {searchExpanded ? (
                  <motion.div key="open"
                    initial={{ width: 36, opacity: 0.4 }} animate={{ width: 230, opacity: 1 }} exit={{ width: 36, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                    style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fff", border: "1.5px solid #5BBFB5", borderRadius: "10px", padding: "7px 12px", boxShadow: "0 0 0 3px rgba(91,191,181,0.10)" }}>
                    <FiSearch size={13} style={{ color: "#5BBFB5", flexShrink: 0 }} />
                    <input ref={searchRef} autoFocus className="si"
                      value={searchTerm} onChange={e => handleSearchInput(e.target.value)}
                      onKeyDown={handleSearchSubmit}
                      onBlur={() => setTimeout(() => { setSearchExpanded(false); setSuggestions([]); }, 180)}
                      placeholder="Search fresh catch…"
                      style={{ border: "none", background: "none", fontSize: "13px", color: "#1A2E2C", width: "100%", fontFamily: "'Manrope', sans-serif" }}
                    />
                    {searchTerm && (
                      <button onClick={() => { setSearchTerm(""); setSuggestions([]); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#B8CFCC", display: "flex", padding: 0 }}>
                        <FiX size={12} />
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <motion.button key="icon" whileTap={{ scale: 0.88 }} onClick={() => setSearchExpanded(true)} className="nav-ib" style={iconBtn}>
                    <FiSearch size={15} />
                  </motion.button>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {suggestions.length > 0 && searchExpanded && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}
                    style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #E2EEEC", borderRadius: "14px", overflow: "hidden", zIndex: 300, minWidth: "240px", boxShadow: "0 12px 40px rgba(26,46,44,0.10)" }}>
                    {suggestions.map(item => (
                      <div key={item._id} className="prof-item"
                        onClick={() => { navigate(`/products/${item._id}`); setSearchExpanded(false); setSuggestions([]); }}
                        style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #F4F9F8", transition: "background 0.15s" }}>
                        <img src={`${API_URL}${item.image}`} alt={item.name} style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover", background: "#F4F9F8" }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: "13px", fontWeight: "700", color: "#1A2E2C", margin: 0 }}>{item.name}</p>
                          <p style={{ fontSize: "11px", color: "#6B8F8A", margin: "1px 0 0", textTransform: "capitalize" }}>{item.category}</p>
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: "800", color: "#5BBFB5" }}>₹{item.basePrice}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Wishlist */}
            {user && (
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate("/wishlist")} className="nav-ib" style={{ ...iconBtn, position: "relative" }}>
                <FiHeart size={15} />
                <AnimatePresence>
                  {user?.wishlist?.length > 0 && (
                    <motion.span key={user.wishlist.length} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      style={{ position: "absolute", top: "-5px", right: "-5px", background: "#F07468", color: "#fff", width: "16px", height: "16px", borderRadius: "50%", fontSize: "9px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {user.wishlist.length}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )}

            {/* Cart */}
            <motion.button whileTap={{ scale: 0.88 }} onClick={openCart} data-cart-icon className="nav-ib" style={{ ...iconBtn, position: "relative" }}>
              <motion.div key={`cart-icon-${cartCount}`} animate={{ scale: [1, 1.25, 1], rotate: [0, -10, 10, 0] }} transition={{ duration: 0.4 }}>
                <FiShoppingBag size={15} />
              </motion.div>
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span key={cartCount} initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                    style={{ position: "absolute", top: "-5px", right: "-5px", background: "#5BBFB5", color: "#fff", width: "16px", height: "16px", borderRadius: "50%", fontSize: "9px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Profile / Login */}
            <div className="hidden-mobile">
              {user ? (
                <div style={{ position: "relative", marginLeft: "4px" }}
                  onMouseEnter={() => setShowProfile(true)}
                  onMouseLeave={() => setShowProfile(false)}
                >
                  <motion.button whileHover={{ scale: 1.03 }} style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "5px 11px 5px 5px",
                    border: `1.5px solid ${T.pillBorder}`,
                    borderRadius: "20px",
                    background: T.pillBg,
                    backdropFilter: T.pillBlur,
                    WebkitBackdropFilter: T.pillBlur,
                    boxShadow: T.pillShadow,
                    cursor: "pointer", transition: "all 0.3s",
                  }}>
                    <div style={{ width: "27px", height: "27px", borderRadius: "50%", background: "linear-gradient(135deg,#5BBFB5,#7EB8D4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "800", fontSize: "11px", flexShrink: 0, position: "relative" }}>
                      {user.name?.charAt(0).toUpperCase()}
                      {unreadCount > 0 && (
                        <span style={{ position: "absolute", top: "-1px", right: "-1px", width: "7px", height: "7px", background: "#F07468", borderRadius: "50%", border: "1.5px solid #fff" }} />
                      )}
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: T.pillName, transition: "color 0.3s" }}>
                      {user.name?.split(" ")[0]}
                    </span>
                    <FiChevronDown size={11} style={{ color: T.pillChevron, transition: "color 0.3s" }} />
                  </motion.button>

                  <AnimatePresence>
                    {showProfile && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.16 }}
                        style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, background: "#fff", border: "1.5px solid #E2EEEC", borderRadius: "16px", overflow: "hidden", minWidth: "240px", zIndex: 200, boxShadow: "0 16px 48px rgba(26,46,44,0.10)" }}
                      >
                        <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #F0F5F4", background: "#F4F9F8" }}>
                          <p style={{ fontSize: "10px", fontWeight: "800", color: "#5BBFB5", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 3px" }}>Signed in as</p>
                          <p style={{ fontSize: "13px", fontWeight: "700", color: "#1A2E2C", margin: 0 }}>{user.email}</p>
                        </div>
                        <div style={{ padding: "6px" }}>
                          {[
                            { icon: <FiUser size={14} />, label: "My Profile", path: "/profile" },
                            { icon: <FiHeart size={14} />, label: "Wishlist", path: "/wishlist" },
                            { icon: <FiPackage size={14} />, label: "My Orders", path: "/orders" },
                            { icon: <FiBell size={14} />, label: "Notifications", path: "/notifications", badge: unreadCount },
                            ...(user.role === "admin" ? [{ icon: <FiGrid size={14} />, label: "Admin Dashboard", path: "/admin/dashboard" }] : []),
                          ].map(item => (
                            <button key={item.path} className="prof-item"
                              onClick={() => { navigate(item.path); setShowProfile(false); }}
                              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "9px 12px", border: "none", background: "none", borderRadius: "10px", cursor: "pointer", fontFamily: "'Manrope', sans-serif", transition: "background 0.15s" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#1A2E2C" }}>
                                <span style={{ color: "#6B8F8A" }}>{item.icon}</span>
                                <span style={{ fontSize: "13px", fontWeight: "600" }}>{item.label}</span>
                              </div>
                              {item.badge > 0 && (
                                <span style={{ background: "#F07468", color: "#fff", fontSize: "10px", fontWeight: "800", padding: "2px 8px", borderRadius: "20px" }}>{item.badge}</span>
                              )}
                            </button>
                          ))}
                        </div>
                        <div style={{ borderTop: "1px solid #FEE2E2", padding: "6px" }}>
                          <button onClick={handleLogout} className="prof-item"
                            style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "9px 12px", border: "none", background: "none", borderRadius: "10px", cursor: "pointer", fontFamily: "'Manrope', sans-serif", color: "#DC2626", fontSize: "13px", fontWeight: "600", transition: "background 0.15s" }}>
                            <FiLogOut size={14} /> Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/login")}
                  style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 18px", marginLeft: "4px", background: T.loginBg, color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "'Manrope', sans-serif", boxShadow: T.loginShadow, transition: "all 0.3s" }}>
                  <FiUser size={13} /> Login
                </motion.button>
              )}
            </div>

            {/* Mobile hamburger */}
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => setMobileOpen(!mobileOpen)}
              className="show-mobile nav-ib" style={{ ...iconBtn, display: "none" }}>
              <AnimatePresence mode="wait">
                <motion.div key={mobileOpen ? "x" : "m"}
                  initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.16 }}>
                  {mobileOpen ? <FiX size={17} /> : <FiMenu size={17} />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(26,46,44,0.22)", backdropFilter: "blur(4px)", zIndex: 190 }} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(320px,90vw)", background: "#fff", zIndex: 195, overflowY: "auto", padding: "80px 24px 40px", boxShadow: "-16px 0 48px rgba(26,46,44,0.10)", fontFamily: "'Manrope', sans-serif" }}>

              <button onClick={() => setMobileOpen(false)}
                style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "1.5px solid #E2EEEC", borderRadius: "8px", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B8F8A" }}>
                <FiX size={15} />
              </button>

              <div style={{ position: "relative", marginBottom: "28px" }}>
                <FiSearch size={13} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#B8CFCC" }} />
                <input value={searchTerm} onChange={e => handleSearchInput(e.target.value)} onKeyDown={handleSearchSubmit}
                  placeholder="Search fresh catch…"
                  style={{ width: "100%", padding: "10px 12px 10px 36px", border: "1.5px solid #E2EEEC", borderRadius: "10px", fontSize: "13px", color: "#1A2E2C", fontFamily: "'Manrope', sans-serif", background: "#F4F9F8", outline: "none" }}
                />
              </div>

              <p style={{ fontSize: "10px", fontWeight: "800", color: "#B8CFCC", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Shop</p>
              <div style={{ marginBottom: "28px" }}>
                {NAV_LINKS.map((link, i) => (
                  <motion.div key={link.path} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 + 0.08 }}>
                    <Link to={link.path} onClick={() => setMobileOpen(false)} className="mob-link"
                      style={{ display: "block", padding: "11px 13px", borderRadius: "10px", fontSize: "15px", fontWeight: "600", color: "#1A2E2C", textDecoration: "none", marginBottom: "3px", transition: "background 0.15s" }}>
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div style={{ height: "1px", background: "#F0F5F4", marginBottom: "24px" }} />

              {user ? (
                <div>
                  <p style={{ fontSize: "10px", fontWeight: "800", color: "#B8CFCC", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Account</p>
                  {[
                    { icon: <FiUser size={14} />, label: "My Profile", path: "/profile" },
                    { icon: <FiHeart size={14} />, label: "Wishlist", path: "/wishlist" },
                    { icon: <FiPackage size={14} />, label: "Orders", path: "/orders" },
                    { icon: <FiBell size={14} />, label: "Notifications", path: "/notifications", badge: unreadCount },
                    ...(user.role === "admin" ? [{ icon: <FiGrid size={14} />, label: "Admin", path: "/admin/dashboard" }] : []),
                  ].map((item, i) => (
                    <motion.button key={item.path} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 + 0.18 }}
                      whileTap={{ scale: 0.98 }} onClick={() => { navigate(item.path); setMobileOpen(false); }} className="mob-link"
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "11px 13px", borderRadius: "10px", border: "none", background: "none", cursor: "pointer", fontFamily: "'Manrope', sans-serif", marginBottom: "3px", transition: "background 0.15s" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#1A2E2C", fontSize: "15px", fontWeight: "600" }}>
                        <span style={{ color: "#6B8F8A" }}>{item.icon}</span>
                        {item.label}
                      </div>
                      {item.badge > 0 && <span style={{ background: "#F07468", color: "#fff", fontSize: "10px", fontWeight: "800", padding: "1px 7px", borderRadius: "20px" }}>{item.badge}</span>}
                    </motion.button>
                  ))}
                  <button onClick={handleLogout}
                    style={{ width: "100%", marginTop: "14px", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid #FEE2E2", background: "#FFF5F4", color: "#DC2626", fontSize: "14px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontFamily: "'Manrope', sans-serif" }}>
                    <FiLogOut size={14} /> Logout
                  </button>
                </div>
              ) : (
                <button onClick={() => { navigate("/login"); setMobileOpen(false); }}
                  style={{ width: "100%", padding: "13px", background: "#1A2E2C", color: "#fff", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "'Manrope', sans-serif" }}>
                  Login / Sign Up
                </button>
              )}
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