// src/components/layout/Navbar.jsx
// ═══ Orchestrator: Composes NavSearchBar, AuthModal, MobileDrawer, MegaMenu ═══
import { useState, useContext, useEffect, useRef, Suspense, lazy } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser, FiShoppingCart, FiLogOut, FiPackage,
  FiGrid, FiBell, FiHeart, FiMenu
} from "react-icons/fi";
import { CartContext } from "../../context/CartContext";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

// Sub-components
import NavSearchBar from "./NavSearchBar";
import AuthModal from "./AuthModal";
import MobileDrawer from "./MobileDrawer";
import MegaMenu from "./MegaMenu";

const Spin = lazy(() => import("../../pages/general/Spin"));

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Navbar({ announcementActive = false }) {
  const { cartCount, setIsCartOpen } = useContext(CartContext);
  const { user, setUser, refreshMe } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showProfile, setShowProfile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [systemAlert, setSystemAlert] = useState(null);
  const [isHappyHour, setIsHappyHour] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const lastScrollY = useRef(0);
  const isOrderDetails = location.pathname.startsWith("/orders/") && location.pathname.length > 8;

  // ── Scroll handling ──
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

  // ── Notifications ──
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }
    const fetchNotifications = () => {
      axios.get(`${API_URL}/api/notifications`, { withCredentials: true })
        .then(res => {
          setNotifications(res.data);
          setUnreadCount(res.data.filter(n => !n.read).length);
        })
        .catch(() => { });
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // ── Settings & Socket ──
  useEffect(() => {
    axios.get(`${API_URL}/api/settings`).then(res => {
      if (res.data.globalDiscount > 0) setIsHappyHour(true);
    }).catch(() => {});

    const isProd = import.meta.env.PROD || (typeof window !== "undefined" && (window.location.hostname.includes("seabite.co.in") || window.location.hostname.includes("vercel.app") || window.location.hostname !== "localhost"));
    const socket = isProd ? { on: () => {}, off: () => {}, emit: () => {}, disconnect: () => {} } : io(API_URL);
    socket.on("SYSTEM_PULSE", (data) => {
      if (data.alert) setSystemAlert(data.alert);
      else setSystemAlert(null);
    });
    socket.on("SETTINGS_UPDATE", (data) => {
      if (data.globalDiscount > 0) {
        setIsHappyHour(true);
        toast("⚡ HAPPY HOUR LIVE! 10% OFF EVERYTHING!", { icon: '🎁', duration: 6000 });
      } else {
        setIsHappyHour(false);
      }
    });
    return () => socket.disconnect();
  }, [user]);

  // ── Click outside handlers ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showNotifications && !e.target.closest('.notif-container')) {
        setShowNotifications(false);
      }
      if (showProfile && !e.target.closest('.profile-container')) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, showProfile]);

  // ── Auth open helper (passed to AuthModal) ──
  const authCloseHandler = () => setIsLoginOpen(false);
  authCloseHandler.__open = () => setIsLoginOpen(true);

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_URL}/api/notifications/read-all`, {}, { withCredentials: true });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) { }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout request failed", err);
    } finally {
      localStorage.removeItem("userInfo");
      setUser(null);
      setIsLoginOpen(false);
      setShowProfile(false);
      setShowNotifications(false);
      setLogoutLoading(false);
      navigate("/");
      toast.success("Logged out successfully");
    }
  };

  // ── Theme tokens ──
  const isHome = location.pathname === "/";
  const isTransparent = isHome && !scrolled;

  const T = {
    iconColor: isTransparent ? "#ffffff" : "#1A2E2C",
    iconHoverBg: isTransparent ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.03)",
    iconHoverColor: isTransparent ? "#ffffff" : "#5BBFB5",
  };

  const iconBtn = {
    width: "40px", height: "40px", borderRadius: "12px",
    background: "transparent", border: "none", color: T.iconColor,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0, transition: "all 0.3s ease",
  };

  return (
    <>
      <style>{`
        .nav-root * { box-sizing: border-box; }
        .nav-ib:hover { background: ${T.iconHoverBg} !important; color: ${T.iconHoverColor} !important; }
        .prof-item:hover { background: #f9f9f9 !important; }
        .si:focus { outline: none; }
        .si::placeholder { color: ${isTransparent ? 'rgba(255,255,255,0.5)' : '#8A8279'}; transition: color 0.4s ease; }
        .drawer-scrollbar::-webkit-scrollbar { width: 4px; }
        .drawer-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .bottom-tier-link-cat { transition: color 0.2s ease; }
        .bottom-tier-link-cat:hover { color: #5BA8A0 !important; }
        .bottom-tier-link-page { transition: color 0.2s ease; }
        .bottom-tier-link-page:hover { color: #1A2E2C !important; }
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
          .nav-root { padding: 0 !important; border: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-search-overlay { display: none !important; }
          .show-mobile { display: none !important; }
          .hidden-mobile { display: flex !important; }
        }
        @keyframes gold-pulse {
          0%, 100% { border-bottom-color: #F59E0B; box-shadow: 0 4px 20px rgba(245, 158, 11, 0.1); }
          50% { border-bottom-color: #FBBF24; box-shadow: 0 4px 40px rgba(245, 158, 11, 0.3); }
        }
        .happy-hour-glow {
          animation: gold-pulse 2s infinite ease-in-out !important;
          border-bottom: 2px solid #F59E0B !important;
        }
      `}</style>

      <motion.nav
        className={`nav-root ${isHappyHour ? 'happy-hour-glow' : ''}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        style={{
          position: "fixed",
          top: announcementActive && !scrolled ? 30 : 0,
          left: 0, right: 0, zIndex: 1100,
          padding: 0,
          transition: "top 0.3s ease",
        }}
      >
        {/* ═══ DESKTOP VIEW ═══ */}
        <div className="hidden-mobile" style={{ width: "100%", display: "flex", flexDirection: "column" }}>
          {/* Top Tier */}
          <div style={{
            background: isTransparent ? "transparent" : "#FFFFFF",
            borderBottom: isTransparent ? "none" : "1px solid #E2EEEC",
            width: "100%",
            boxShadow: isTransparent ? "none" : "0 2px 10px rgba(0,0,0,0.03)",
            transition: "background 0.4s ease, border-bottom 0.4s ease, box-shadow 0.4s ease"
          }}>
            <div style={{
              maxWidth: "1440px",
              margin: "0 auto",
              padding: "0 40px",
              height: "70px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              {/* Left: Logo */}
              <div style={{ flexShrink: 0 }}>
                <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
                  <img src="/logo.webp" alt="SeaBite" width={90} height={62} style={{ height: "60px", width: "auto", objectFit: "contain" }} />
                </Link>
              </div>

              {/* Center: Search */}
              <NavSearchBar isTransparent={isTransparent} announcementActive={announcementActive} scrolled={scrolled} onMobileClose={() => setMobileOpen(false)} />

              {/* Right: Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {/* Wishlist */}
                <motion.button
                  aria-label="View wishlist"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => user ? navigate("/wishlist") : setIsLoginOpen(true)}
                  style={{ ...iconBtn, position: "relative" }}
                  className="nav-ib"
                >
                  <FiHeart size={20} style={{ color: isTransparent ? "#FFFFFF" : "#1A2E2C" }} />
                  {user?.wishlist?.length > 0 && (
                    <span style={{ position: "absolute", top: "-5px", right: "-5px", background: "#5BA8A0", color: "#fff", width: "16px", height: "16px", borderRadius: "50%", fontSize: "9px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {user.wishlist.length}
                    </span>
                  )}
                </motion.button>

                {/* Notifications */}
                {user && (
                  <div style={{ position: "relative" }} className="notif-container">
                    <motion.button
                      aria-label="View notifications"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="nav-ib"
                      style={{ ...iconBtn, position: "relative" }}
                    >
                      <FiBell size={20} style={{ color: isTransparent ? "#FFFFFF" : "#1A2E2C" }} />
                      {unreadCount > 0 && (
                        <span style={{ position: "absolute", top: "-5px", right: "-5px", background: "#5BA8A0", color: "#fff", width: "16px", height: "16px", borderRadius: "50%", fontSize: "9px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {unreadCount}
                        </span>
                      )}
                    </motion.button>

                    <AnimatePresence>
                      {showNotifications && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          style={{
                            position: "absolute", top: "100%", right: 0, marginTop: "12px",
                            width: "320px", background: "white", borderRadius: "20px",
                            boxShadow: "0 20px 50px rgba(0,0,0,0.12)", border: "1.5px solid #E2EEEC",
                            zIndex: 1000, overflow: "hidden"
                          }}
                        >
                          <div style={{ padding: "18px", borderBottom: "1.5px solid #F4F9F8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#1A2E2C" }}>Notifications</h3>
                            {unreadCount > 0 && (
                              <button onClick={markAllAsRead} style={{ background: "none", border: "none", color: "#5BBFB5", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Mark all read</button>
                            )}
                          </div>
                          <div style={{ maxHeight: "360px", overflowY: "auto" }} className="drawer-scrollbar">
                            {notifications.length > 0 ? (
                              notifications.map(n => (
                                <div key={n._id} style={{ padding: "16px", borderBottom: "1px solid #F4F9F8", background: n.read ? "transparent" : "#F4FBF9" }}>
                                  <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: "700", color: "#1A2E2C" }}>{n.title}</p>
                                  <p style={{ margin: 0, fontSize: "12px", color: "#6B8F8A", lineHeight: 1.4 }}>{n.message}</p>
                                  <p style={{ margin: "8px 0 0", fontSize: "10px", color: "#B8CFCC", fontWeight: "600" }}>{new Date(n.createdAt).toLocaleDateString()}</p>
                                </div>
                              ))
                            ) : (
                              <div style={{ padding: "60px 20px", textAlign: "center" }}>
                                <div style={{ fontSize: "24px", marginBottom: "12px" }}>🔔</div>
                                <p style={{ fontSize: "13px", color: "#B8CFCC", margin: 0, fontWeight: "600" }}>All caught up!</p>
                              </div>
                            )}
                          </div>
                          <button onClick={() => { navigate("/notifications"); setShowNotifications(false); }} style={{ width: "100%", padding: "16px", background: "#F4F9F8", border: "none", color: "#1A2E2C", fontSize: "13px", fontWeight: "800", cursor: "pointer", borderTop: "1.5px solid #E2EEEC" }}>View All Notifications</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Profile / Avatar */}
                {user ? (
                  <div style={{ position: "relative" }} className="profile-container" onMouseEnter={() => setShowProfile(true)} onMouseLeave={() => setShowProfile(false)}>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      onClick={() => setShowProfile(!showProfile)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: "36px", height: "36px", borderRadius: "50%",
                        background: "#5BA8A0", border: "none", cursor: "pointer",
                        color: "#FFFFFF", fontWeight: "800", fontSize: "14px",
                        fontFamily: "'Plus Jakarta Sans', sans-serif"
                      }}
                    >
                      {user.name[0].toUpperCase()}
                    </motion.button>
                    <AnimatePresence>
                      {showProfile && (
                        <motion.div
                          className="dropdown-bridge"
                          initial={{ opacity: 0, y: -8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.97 }}
                          style={{ position: "absolute", top: "100%", right: 0, paddingTop: "6px", minWidth: "240px", zIndex: 200 }}
                        >
                          <div style={{ background: "#fff", border: "1.5px solid #E2EEEC", borderRadius: "16px", overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.1)" }}>
                            <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #F0F5F4", background: "#F4F9F8" }}>
                              <p style={{ fontSize: "10px", fontWeight: "800", color: "#5BBFB5", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 3px" }}>Signed in as</p>
                              <p style={{ fontSize: "13px", fontWeight: "700", color: "#1A2E2C", margin: 0 }}>{user.email}</p>
                            </div>
                            <div style={{ padding: "6px" }}>
                              {user.role === "admin" && (
                                <div style={{ padding: "8px 12px", background: systemAlert ? "#FEF2F2" : "#F0FDF4", borderRadius: "10px", marginBottom: "6px", border: `1px solid ${systemAlert ? "#FEE2E2" : "#DCFCE7"}` }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: systemAlert ? '#EF4444' : '#22C55E', boxShadow: `0 0 8px ${systemAlert ? '#EF4444' : '#22C55E'}` }}></div>
                                    <span style={{ fontSize: '11px', fontWeight: '800', color: systemAlert ? '#B91C1C' : '#15803D' }}>
                                      {systemAlert ? "HIGH PRESSURE" : "SYSTEM HEALTHY"}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div style={{ padding: "8px" }}>
                              <Link to="/profile" onClick={() => setShowProfile(false)} className="prof-item" style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "10px 14px", border: "none", background: "none", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: "#1A2E2C", textDecoration: "none" }}><FiUser size={16}/> Profile</Link>
                              <Link to="/notifications" onClick={() => setShowProfile(false)} className="prof-item" style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "10px 14px", border: "none", background: "none", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: "#1A2E2C", textDecoration: "none", position: "relative" }}>
                                <FiBell size={16}/> Notifications
                                {unreadCount > 0 && <span style={{ position: "absolute", right: "12px", background: "#F07468", color: "#fff", padding: "2px 6px", borderRadius: "10px", fontSize: "10px", fontWeight: "800" }}>{unreadCount}</span>}
                              </Link>
                              <Link to="/orders" onClick={() => setShowProfile(false)} className="prof-item" style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "10px 14px", border: "none", background: "none", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: "#1A2E2C", textDecoration: "none" }}><FiPackage size={16}/> Orders</Link>
                              {user.role === "admin" && (
                                <Link to="/admin/dashboard" onClick={() => setShowProfile(false)} className="prof-item" style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "10px 14px", border: "none", background: "none", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "800", color: "#5BBFB5", marginTop: "4px", textDecoration: "none" }}><FiGrid size={16}/> Admin Dashboard</Link>
                              )}
                            </div>
                            <div style={{ borderTop: "1px solid #FEE2E2", padding: "8px" }}>
                              <button
                                onClick={handleLogout}
                                disabled={logoutLoading}
                                className="prof-item"
                                style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "10px 14px", border: "none", background: "none", borderRadius: "10px", cursor: logoutLoading ? "not-allowed" : "pointer", color: "#DC2626", fontSize: "14px", fontWeight: "600", textAlign: "left" }}
                              >
                                {logoutLoading ? (
                                  <div className="loading-spinner" style={{ width: "16px", height: "16px", border: "2px solid #DC2626", borderTopColor: "transparent" }} />
                                ) : (
                                  <FiLogOut size={16}/>
                                )}
                                <span>{logoutLoading ? "Logging out..." : "Logout"}</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <motion.button
                    aria-label="Account log in or sign up"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setIsLoginOpen(true)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: "36px", height: "36px", borderRadius: "50%",
                      background: "transparent", border: "none", cursor: "pointer",
                      color: isTransparent ? "#FFFFFF" : "#1A2E2C",
                      transition: "color 0.4s ease"
                    }}
                  >
                    <FiUser size={18} />
                  </motion.button>
                )}

                {/* Cart Button */}
                <motion.button
                  aria-label="Open shopping cart"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsCartOpen(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    background: "none", border: "none", cursor: "pointer",
                    padding: "6px 12px", borderRadius: "20px", position: "relative"
                  }}
                >
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <FiShoppingCart size={22} color={isTransparent ? "#FFFFFF" : "#1A2E2C"} />
                    {cartCount > 0 && (
                      <span style={{ position: "absolute", top: "-5px", right: "-5px", background: "#5BA8A0", color: "#fff", width: "16px", height: "16px", borderRadius: "50%", fontSize: "9px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: isTransparent ? "#FFFFFF" : "#1A2E2C", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Cart</span>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Bottom Tier → MegaMenu */}
          <MegaMenu isTransparent={isTransparent} />
        </div>

        {/* ═══ MOBILE HEADER ═══ */}
        <div
          className="show-mobile"
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px",
            background: isTransparent ? "transparent" : "#FFFFFF",
            borderBottom: isTransparent ? "none" : "1px solid #f0f0f0",
            padding: "0",
            transition: "all 0.3s ease",
            position: "relative"
          }}
        >
          {/* Left: Hamburger */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "0 12px", height: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <div style={{ width: "20px", height: "1.5px", background: isTransparent ? "#FFFFFF" : "#1A2E2C", borderRadius: "1px" }} />
              <div style={{ width: "12px", height: "1.5px", background: isTransparent ? "#FFFFFF" : "#1A2E2C", borderRadius: "1px" }} />
              <div style={{ width: "20px", height: "1.5px", background: isTransparent ? "#FFFFFF" : "#1A2E2C", borderRadius: "1px" }} />
            </div>
          </motion.button>

          {/* Center: Logo */}
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none" }}>
            <Link to="/" style={{ textDecoration: "none", pointerEvents: "auto", display: "flex", alignItems: "center" }}>
              <img src="/logo.webp" alt="SeaBite" width={66} height={46} style={{ height: "46px", width: "auto", objectFit: "contain" }} />
            </Link>
          </div>

          {/* Right: Actions */}
          <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
            <NavSearchBar isTransparent={isTransparent} announcementActive={announcementActive} scrolled={scrolled} onMobileClose={() => setMobileOpen(false)} />
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setIsCartOpen(true)}
              style={{ background: "none", border: "none", padding: "0 12px", color: isTransparent ? "#FFFFFF" : "#1A2E2C", height: "100%", position: "relative", display: "flex", alignItems: "center", justifyContent: "flex-end" }}
            >
              <FiShoppingCart size={20} />
              {cartCount > 0 && (
                <span style={{
                  position: "absolute", top: "18px", right: "2px",
                  background: "#5BA8A0", color: "#fff",
                  width: "14px", height: "14px", borderRadius: "50%", fontSize: "8px", fontWeight: "900", display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {cartCount}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* ═══ MOBILE DRAWER ═══ */}
      <MobileDrawer
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        unreadCount={unreadCount}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
        onOpenAuth={() => setIsLoginOpen(true)}
      />

      {/* ═══ AUTH MODAL ═══ */}
      <AuthModal isOpen={isLoginOpen} onClose={authCloseHandler} />

      <Suspense fallback={null}>
        {showSpinWheel && <Spin isOpen={showSpinWheel} onClose={() => setShowSpinWheel(false)} />}
      </Suspense>
    </>
  );
}