// src/components/Navbar.jsx
import { useState, useContext, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser, FiShoppingBag, FiSearch, FiLogOut, FiPackage,
  FiGrid, FiBell, FiMenu, FiX, FiChevronDown, FiHeart,
  FiChevronRight,
} from "react-icons/fi";
import { CartContext } from "../../context/CartContext";
import axios from "axios";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import Spin from "../../pages/Spin";

const API_URL = import.meta.env.VITE_API_URL || "";

const NAV_LINKS = [
  { label: "Shop All", path: "/products" },
  { label: "Fish", path: "/products?category=Fish" },
  { label: "Prawns", path: "/products?category=Prawn" },
  { label: "Crabs", path: "/products?category=Crab" },
];

export default function Navbar({ openCart }) {
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
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const lastScrollY = useRef(0);
  const searchRef = useRef(null);

  // ── Scroll behaviour ──────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setHidden(y > lastScrollY.current && y > 120);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Notifications ────────────────────────────────────
  useEffect(() => {
    if (!user) return setUnreadCount(0);
    axios.get(`${API_URL}/api/notifications`, { withCredentials: true })
      .then(res => setUnreadCount(res.data.filter(n => !n.read).length))
      .catch(() => { });
  }, [user]);

  // ── Spin wheel eligibility ────────────────────────────
  useEffect(() => {
    if (!user) return;
    axios.get(`${API_URL}/api/spin/can-spin`, { withCredentials: true })
      .then(res => { if (res.data.canSpin) setTimeout(() => setShowSpinWheel(true), 2000); })
      .catch(() => { });
  }, [user]);

  // ── Search suggestions ────────────────────────────────
  const handleSearchInput = (val) => {
    setSearchTerm(val);
    if (val.length < 2) return setSuggestions([]);
    const t = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_URL}/api/products/search/suggest?q=${val}`);
        setSuggestions(res.data);
      } catch { }
    }, 280);
    return () => clearTimeout(t);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm(""); setSuggestions([]); setSearchFocused(false); setSearchExpanded(false);
      if (mobileOpen) setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
      setUser(null); navigate("/");
    } catch { }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await axios.post(`${API_URL}/api/auth/google`, { token: tokenResponse.access_token }, { withCredentials: true });
        setUser(res.data.user);
        if (res.data.user.role === "admin") navigate("/admin/dashboard");
        refreshMe();
      } catch { }
    },
  });

  const isActive = (path) => location.pathname + location.search === path;

  // ── Style tokens that flip based on scroll state ──────
  // When over the video (not scrolled): transparent bg, white text
  // When scrolled: frosted glass, dark text
  const T = {
    navBg: scrolled ? "rgba(255,255,255,0.94)" : "transparent",
    navBackdrop: scrolled ? "blur(20px)" : "none",
    navBorder: scrolled ? "1px solid #E2EEEC" : "1px solid transparent",
    navShadow: scrolled ? "0 2px 24px rgba(91,191,181,0.08)" : "none",
    navPadding: scrolled ? "10px 0" : "16px 0",

    linkColor: scrolled ? "#1A2E2C" : "rgba(255,255,255,0.90)",
    linkHoverColor: scrolled ? "#5BBFB5" : "rgba(255,255,255,1)",

    iconBg: scrolled ? "#fff" : "rgba(255,255,255,0.12)",
    iconBorder: scrolled ? "1.5px solid #E2EEEC" : "1.5px solid rgba(255,255,255,0.22)",
    iconColor: scrolled ? "#6B8F8A" : "rgba(255,255,255,0.85)",
    iconHoverBg: scrolled ? "#EDF5F3" : "rgba(255,255,255,0.22)",
    iconHoverColor: scrolled ? "#5BBFB5" : "#fff",

    loginBg: scrolled ? "#1A2E2C" : "rgba(255,255,255,0.15)",
    loginBorder: scrolled ? "none" : "1.5px solid rgba(255,255,255,0.35)",
    loginColor: "#fff",

    profileBorder: scrolled ? "#E2EEEC" : "rgba(255,255,255,0.30)",
    profileNameColor: scrolled ? "#1A2E2C" : "rgba(255,255,255,0.92)",
    chevronColor: scrolled ? "#B8CFCC" : "rgba(255,255,255,0.50)",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Lora:wght@500;600&display=swap');
        .nav-root * { box-sizing: border-box; }

        /* Underline that's visible on both dark and light nav */
        .nav-link-underline::after {
          content: '';
          display: block;
          height: 1.5px;
          background: ${scrolled ? "#5BBFB5" : "rgba(255,255,255,0.8)"};
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.25s cubic-bezier(.4,0,.2,1), background 0.3s;
          border-radius: 2px;
          margin-top: 2px;
        }
        .nav-link-underline:hover::after, .nav-link-active::after { transform: scaleX(1); }

        .search-input-inner:focus { outline: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .nav-icon-btn {
          transition: background 0.2s, color 0.2s, border-color 0.2s !important;
        }
        .nav-icon-btn:hover {
          background: ${T.iconHoverBg} !important;
          color: ${T.iconHoverColor} !important;
          border-color: ${scrolled ? "#C5E6E4" : "rgba(255,255,255,0.5)"} !important;
        }

        .profile-item:hover { background: #F4F9F8 !important; }
        .shop-item:hover { background: #F4F9F8 !important; color: #5BBFB5 !important; }
        .mobile-link:active { background: #F4F9F8; }
      `}</style>

      <motion.nav
        className="nav-root"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: hidden ? -80 : 0, opacity: hidden ? 0 : 1 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: "fixed", top: 0, width: "100%", zIndex: 100,
          fontFamily: "'Manrope', sans-serif",
          background: T.navBg,
          backdropFilter: T.navBackdrop,
          WebkitBackdropFilter: T.navBackdrop,
          borderBottom: T.navBorder,
          boxShadow: T.navShadow,
          padding: T.navPadding,
          transition: "background 0.35s ease, box-shadow 0.35s ease, padding 0.3s ease, border-color 0.35s ease, backdrop-filter 0.35s ease",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center" }}>

          {/* ── Logo ──────────────────────────────────────── */}
          <Link to="/" style={{ textDecoration: "none", marginRight: "40px", flexShrink: 0 }}>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img
                src="/logo.png"
                alt="SeaBite"
                style={{
                  height: "44px", width: "auto", objectFit: "contain",
                  // Add subtle drop shadow on logo when over dark video so it pops
                  filter: scrolled ? "none" : "drop-shadow(0 2px 8px rgba(0,0,0,0.25))",
                  transition: "filter 0.35s ease",
                }}
              />
            </motion.div>
          </Link>

          {/* ── Desktop Nav Links ──────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1 }} className="hidden-mobile">

            {/* Shop dropdown */}
            <div
              style={{ position: "relative" }}
              onMouseEnter={() => setShowShop(true)}
              onMouseLeave={() => setShowShop(false)}
            >
              <button
                className="nav-link-underline"
                style={{
                  display: "flex", alignItems: "center", gap: "4px",
                  padding: "6px 12px", border: "none", background: "none",
                  fontSize: "13px", fontWeight: "600",
                  color: T.linkColor,
                  cursor: "pointer", fontFamily: "'Manrope', sans-serif",
                  borderRadius: "8px",
                  transition: "color 0.3s",
                }}
              >
                Shop
                <motion.span
                  animate={{ rotate: showShop ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <FiChevronDown size={13} />
                </motion.span>
              </button>

              <AnimatePresence>
                {showShop && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                      position: "absolute", top: "calc(100% + 10px)", left: "0",
                      background: "#fff", border: "1.5px solid #E2EEEC",
                      borderRadius: "14px", padding: "6px",
                      minWidth: "180px", zIndex: 200,
                      boxShadow: "0 12px 40px rgba(26,46,44,0.10)",
                    }}
                  >
                    {NAV_LINKS.map((link) => (
                      <button
                        key={link.path}
                        className="shop-item"
                        onClick={() => { navigate(link.path); setShowShop(false); }}
                        style={{
                          display: "block", width: "100%", textAlign: "left",
                          padding: "9px 14px", border: "none", background: "none",
                          borderRadius: "8px", fontSize: "13px", fontWeight: "600",
                          color: "#1A2E2C", cursor: "pointer",
                          fontFamily: "'Manrope', sans-serif", transition: "all 0.15s",
                        }}
                      >
                        {link.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Direct links */}
            {[{ label: "About", path: "/about" }, { label: "Orders", path: "/orders" }].map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link-underline ${isActive(link.path) ? "nav-link-active" : ""}`}
                style={{
                  padding: "6px 12px", borderRadius: "8px",
                  fontSize: "13px", fontWeight: "600",
                  color: isActive(link.path) && scrolled ? "#5BBFB5" : T.linkColor,
                  textDecoration: "none",
                  transition: "color 0.3s",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Right Controls ─────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>

            {/* Desktop search */}
            <div style={{ position: "relative" }} className="hidden-mobile">
              <AnimatePresence>
                {searchExpanded ? (
                  <motion.div
                    initial={{ width: 36, opacity: 0.5 }}
                    animate={{ width: 220, opacity: 1 }}
                    exit={{ width: 36, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                      display: "flex", alignItems: "center",
                      background: "#fff", border: "1.5px solid #5BBFB5",
                      borderRadius: "10px", padding: "7px 12px", gap: "8px",
                      boxShadow: "0 0 0 3px rgba(91,191,181,0.12)",
                    }}
                  >
                    <FiSearch size={14} style={{ color: "#5BBFB5", flexShrink: 0 }} />
                    <input
                      ref={searchRef}
                      autoFocus
                      value={searchTerm}
                      onChange={e => handleSearchInput(e.target.value)}
                      onKeyDown={handleSearchSubmit}
                      onBlur={() => { setTimeout(() => { setSearchExpanded(false); setSuggestions([]); }, 200); }}
                      placeholder="Search fresh catch…"
                      className="search-input-inner"
                      style={{ border: "none", background: "none", fontSize: "13px", color: "#1A2E2C", width: "100%", fontFamily: "'Manrope', sans-serif" }}
                    />
                    {searchTerm && (
                      <button onClick={() => { setSearchTerm(""); setSuggestions([]); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#B8CFCC", display: "flex", padding: 0 }}>
                        <FiX size={12} />
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSearchExpanded(true)}
                    className="nav-icon-btn"
                    style={{
                      width: "36px", height: "36px",
                      border: T.iconBorder,
                      borderRadius: "10px",
                      background: T.iconBg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer",
                      color: T.iconColor,
                      backdropFilter: scrolled ? "none" : "blur(8px)",
                      transition: "all 0.3s",
                    }}
                  >
                    <FiSearch size={15} />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Suggestions */}
              <AnimatePresence>
                {searchFocused && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
                      background: "#fff", border: "1.5px solid #E2EEEC", borderRadius: "14px",
                      overflow: "hidden", zIndex: 300, minWidth: "240px",
                      boxShadow: "0 12px 40px rgba(26,46,44,0.10)",
                    }}
                  >
                    {suggestions.map((item) => (
                      <div
                        key={item._id}
                        onClick={() => { navigate(`/products/${item._id}`); setSearchExpanded(false); setSuggestions([]); }}
                        style={{
                          display: "flex", alignItems: "center", gap: "12px",
                          padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #F4F9F8",
                          transition: "background 0.15s",
                        }}
                        className="profile-item"
                      >
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
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/wishlist")}
                className="nav-icon-btn"
                style={{
                  position: "relative", width: "36px", height: "36px",
                  border: T.iconBorder,
                  borderRadius: "10px",
                  background: T.iconBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  color: T.iconColor,
                  backdropFilter: scrolled ? "none" : "blur(8px)",
                  transition: "all 0.3s",
                }}
              >
                <FiHeart size={15} />
                <AnimatePresence>
                  {user?.wishlist?.length > 0 && (
                    <motion.span
                      key={user.wishlist.length}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      style={{
                        position: "absolute", top: "-6px", right: "-6px",
                        background: "#F07468", color: "#fff",
                        width: "16px", height: "16px", borderRadius: "50%",
                        fontSize: "9px", fontWeight: "800",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: "2px solid #fff",
                      }}
                    >
                      {user.wishlist.length}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )}

            {/* Cart */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={openCart}
              className="nav-icon-btn"
              data-cart-icon
              style={{
                position: "relative", width: "36px", height: "36px",
                border: T.iconBorder,
                borderRadius: "10px",
                background: T.iconBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                color: T.iconColor,
                backdropFilter: scrolled ? "none" : "blur(8px)",
                transition: "all 0.3s",
              }}
            >
              <FiShoppingBag size={15} />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                    style={{
                      position: "absolute", top: "-6px", right: "-6px",
                      background: "#5BBFB5", color: "#fff",
                      width: "16px", height: "16px", borderRadius: "50%",
                      fontSize: "9px", fontWeight: "800",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid #fff",
                    }}
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Profile / Login */}
            <div className="hidden-mobile">
              {user ? (
                <div
                  style={{ position: "relative", marginLeft: "4px" }}
                  onMouseEnter={() => setShowProfile(true)}
                  onMouseLeave={() => setShowProfile(false)}
                >
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "5px 12px 5px 5px",
                      border: `1.5px solid ${T.profileBorder}`,
                      borderRadius: "20px",
                      background: scrolled ? "#fff" : "rgba(255,255,255,0.12)",
                      backdropFilter: scrolled ? "none" : "blur(8px)",
                      cursor: "pointer",
                      transition: "all 0.3s",
                    }}
                  >
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "50%",
                      background: "linear-gradient(135deg, #5BBFB5, #7EB8D4)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: "800", fontSize: "12px",
                      flexShrink: 0, position: "relative",
                    }}>
                      {user.name?.charAt(0).toUpperCase()}
                      {unreadCount > 0 && (
                        <span style={{
                          position: "absolute", top: "-2px", right: "-2px",
                          width: "8px", height: "8px", background: "#F07468",
                          borderRadius: "50%", border: "2px solid #fff",
                        }} />
                      )}
                    </div>
                    <span style={{
                      fontSize: "13px", fontWeight: "600",
                      color: T.profileNameColor,
                      transition: "color 0.3s",
                    }}>
                      {user.name?.split(" ")[0]}
                    </span>
                    <FiChevronDown size={12} style={{ color: T.chevronColor, transition: "color 0.3s" }} />
                  </motion.button>

                  <AnimatePresence>
                    {showProfile && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.97 }}
                        transition={{ duration: 0.18 }}
                        style={{
                          position: "absolute", top: "calc(100% + 10px)", right: 0,
                          background: "#fff", border: "1.5px solid #E2EEEC",
                          borderRadius: "16px", overflow: "hidden",
                          minWidth: "240px", zIndex: 200,
                          boxShadow: "0 16px 48px rgba(26,46,44,0.10)",
                        }}
                      >
                        {/* User info header */}
                        <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #F0F5F4", background: "#F4F9F8" }}>
                          <p style={{ fontSize: "10px", fontWeight: "800", color: "#5BBFB5", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px" }}>Signed in as</p>
                          <p style={{ fontSize: "13px", fontWeight: "700", color: "#1A2E2C" }}>{user.email}</p>
                        </div>

                        <div style={{ padding: "6px" }}>
                          {[
                            { icon: <FiUser size={14} />, label: "My Profile", path: "/profile" },
                            { icon: <FiHeart size={14} />, label: "Wishlist", path: "/wishlist" },
                            { icon: <FiPackage size={14} />, label: "My Orders", path: "/orders" },
                            { icon: <FiBell size={14} />, label: "Notifications", path: "/notifications", badge: unreadCount },
                            ...(user.role === "admin" ? [{ icon: <FiGrid size={14} />, label: "Admin Dashboard", path: "/admin/dashboard" }] : []),
                          ].map(item => (
                            <button
                              key={item.path}
                              className="profile-item"
                              onClick={() => { navigate(item.path); setShowProfile(false); }}
                              style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                width: "100%", padding: "9px 12px", border: "none",
                                background: "none", borderRadius: "10px", cursor: "pointer",
                                fontFamily: "'Manrope', sans-serif", transition: "background 0.15s",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#1A2E2C" }}>
                                <span style={{ color: "#6B8F8A" }}>{item.icon}</span>
                                <span style={{ fontSize: "13px", fontWeight: "600" }}>{item.label}</span>
                              </div>
                              {item.badge > 0 && (
                                <span style={{ background: "#F07468", color: "#fff", fontSize: "10px", fontWeight: "800", padding: "1px 7px", borderRadius: "20px" }}>
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>

                        <div style={{ borderTop: "1px solid #FEE2E2", padding: "6px" }}>
                          <button
                            onClick={handleLogout}
                            style={{
                              display: "flex", alignItems: "center", gap: "10px",
                              width: "100%", padding: "9px 12px", border: "none",
                              background: "none", borderRadius: "10px", cursor: "pointer",
                              fontFamily: "'Manrope', sans-serif", color: "#DC2626",
                              fontSize: "13px", fontWeight: "600", transition: "background 0.15s",
                            }}
                            className="profile-item"
                          >
                            <FiLogOut size={14} /> Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => googleLogin()}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "8px 18px", marginLeft: "4px",
                    background: T.loginBg,
                    color: T.loginColor,
                    border: T.loginBorder,
                    borderRadius: "10px",
                    fontSize: "13px", fontWeight: "700",
                    cursor: "pointer", fontFamily: "'Manrope', sans-serif",
                    backdropFilter: scrolled ? "none" : "blur(8px)",
                    transition: "all 0.3s",
                  }}
                >
                  <FiUser size={14} /> Login
                </motion.button>
              )}
            </div>

            {/* Mobile hamburger */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setMobileOpen(!mobileOpen)}
              className="show-mobile"
              style={{
                width: "36px", height: "36px",
                border: T.iconBorder,
                borderRadius: "10px",
                background: T.iconBg,
                display: "none", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                color: T.iconColor,
                backdropFilter: scrolled ? "none" : "blur(8px)",
                transition: "all 0.3s",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div key={mobileOpen ? "x" : "menu"} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
                  {mobileOpen ? <FiX size={18} /> : <FiMenu size={18} />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile Menu ──────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(26,46,44,0.2)", backdropFilter: "blur(4px)", zIndex: 90 }}
            />
            <motion.div
              initial={{ x: "100%", borderRadius: "20px 0 0 20px" }}
              animate={{ x: 0, borderRadius: "0px 0 0 0px" }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              style={{
                position: "fixed", top: 0, right: 0, bottom: 0, width: "min(320px, 90vw)",
                background: "#fff", zIndex: 95, overflowY: "auto", padding: "80px 24px 40px",
                boxShadow: "-16px 0 48px rgba(26,46,44,0.10)",
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "1.5px solid #E2EEEC", borderRadius: "8px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B8F8A" }}
              >
                <FiX size={16} />
              </button>

              {/* Mobile search */}
              <div style={{ position: "relative", marginBottom: "28px" }}>
                <FiSearch size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#B8CFCC" }} />
                <input
                  value={searchTerm}
                  onChange={e => handleSearchInput(e.target.value)}
                  onKeyDown={handleSearchSubmit}
                  placeholder="Search fresh catch…"
                  style={{
                    width: "100%", padding: "10px 12px 10px 36px",
                    border: "1.5px solid #E2EEEC", borderRadius: "10px",
                    fontSize: "13px", color: "#1A2E2C", fontFamily: "'Manrope', sans-serif",
                    background: "#F4F9F8", outline: "none",
                  }}
                />
              </div>

              {/* Mobile nav links */}
              <div style={{ marginBottom: "28px" }}>
                <p style={{ fontSize: "10px", fontWeight: "800", color: "#B8CFCC", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Shop</p>
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.1 }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setMobileOpen(false)}
                      className="mobile-link"
                      style={{
                        display: "block", padding: "12px 14px", borderRadius: "10px",
                        fontSize: "15px", fontWeight: "600", color: "#1A2E2C",
                        textDecoration: "none", marginBottom: "4px",
                        transition: "background 0.15s",
                      }}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div style={{ height: "1px", background: "#F0F5F4", marginBottom: "24px" }} />

              {/* Mobile account */}
              {user ? (
                <div>
                  <p style={{ fontSize: "10px", fontWeight: "800", color: "#B8CFCC", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Account</p>
                  {[
                    { icon: <FiUser size={14} />, label: "My Profile", path: "/profile" },
                    { icon: <FiHeart size={14} />, label: "Wishlist", path: "/wishlist" },
                    { icon: <FiPackage size={14} />, label: "Orders", path: "/orders" },
                    { icon: <FiBell size={14} />, label: "Notifications", path: "/notifications", badge: unreadCount },
                    ...(user.role === "admin" ? [{ icon: <FiGrid size={14} />, label: "Admin", path: "/admin/dashboard" }] : []),
                  ].map((item, i) => (
                    <motion.button
                      key={item.path}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 + 0.2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { navigate(item.path); setMobileOpen(false); }}
                      className="mobile-link"
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        width: "100%", padding: "12px 14px", borderRadius: "10px",
                        border: "none", background: "none", cursor: "pointer",
                        fontFamily: "'Manrope', sans-serif", marginBottom: "4px",
                        transition: "background 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#1A2E2C", fontSize: "15px", fontWeight: "600" }}>
                        <span style={{ color: "#6B8F8A" }}>{item.icon}</span>
                        {item.label}
                      </div>
                      {item.badge > 0 && (
                        <span style={{ background: "#F07468", color: "#fff", fontSize: "10px", fontWeight: "800", padding: "1px 7px", borderRadius: "20px" }}>
                          {item.badge}
                        </span>
                      )}
                    </motion.button>
                  ))}
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%", marginTop: "12px", padding: "12px 14px", borderRadius: "10px",
                      border: "1.5px solid #FEE2E2", background: "#FFF5F4",
                      color: "#DC2626", fontSize: "14px", fontWeight: "700",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    <FiLogOut size={14} /> Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { googleLogin(); setMobileOpen(false); }}
                  style={{
                    width: "100%", padding: "12px", background: "#1A2E2C", color: "#fff",
                    border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "700",
                    cursor: "pointer", fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  Login / Sign Up
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Spin isOpen={showSpinWheel} onClose={() => setShowSpinWheel(false)} />

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
          .hidden-mobile { display: flex !important; }
        }
      `}</style>
    </>
  );
}