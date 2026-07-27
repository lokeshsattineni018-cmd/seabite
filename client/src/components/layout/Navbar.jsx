// src/components/layout/Navbar.jsx
// ═══ Orchestrator: Composes NavSearchBar, AuthModal, MobileDrawer, MegaMenu ═══
import { useState, useContext, useEffect, useRef, Suspense, lazy } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser, FiShoppingCart, FiLogOut, FiPackage,
  FiGrid, FiBell, FiHeart
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

  // ── Scroll handling ──
  useEffect(() => {
    setScrolled(window.scrollY > 20);
    lastScrollY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
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

  const iconBtn = {
    width: "38px", height: "38px", borderRadius: "12px",
    background: "#F2F6F5", border: "1px solid #E2EEEC", color: "#1A2E2C",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0, transition: "all 0.2s ease",
  };

  return (
    <>
      <style>{`
        .nav-root * { box-sizing: border-box; }
        .nav-ib:hover { background: #E6F4F1 !important; color: #0D9488 !important; border-color: #CCECE6 !important; }
        .prof-item:hover { background: #F4F9F8 !important; }
        .si:focus { outline: none; }
        .si::placeholder { color: #8A9E9B; transition: color 0.3s ease; }
        .drawer-scrollbar::-webkit-scrollbar { width: 4px; }
        .drawer-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .bottom-tier-link-cat { transition: color 0.2s ease; }
        .bottom-tier-link-cat:hover { color: #0D9488 !important; }
        .bottom-tier-link-page { transition: color 0.2s ease; }
        .bottom-tier-link-page:hover { color: #0D9488 !important; }
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
          .nav-root { padding: 0 !important; }
        }
        @media (min-width: 769px) {
          .mobile-search-overlay { display: none !important; }
          .show-mobile { display: none !important; }
          .hidden-mobile { display: flex !important; }
        }
      `}</style>

      <motion.nav
        className="nav-root"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        style={{
          position: "fixed",
          top: announcementActive && !scrolled ? 30 : 0,
          left: 0, right: 0, zIndex: 1100,
          padding: 0,
          background: "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid #E2EEEC",
          boxShadow: scrolled ? "0 4px 24px rgba(26,46,44,0.08)" : "0 2px 12px rgba(26,46,44,0.04)",
          transition: "top 0.3s ease, boxShadow 0.3s ease",
        }}
      >
        {/* ═══ DESKTOP VIEW ═══ */}
        <div className="hidden-mobile" style={{ width: "100%", display: "flex", flexDirection: "column" }}>
          {/* Top Tier */}
          <div style={{
            width: "100%",
            borderBottom: "1px solid #EEF5F4"
          }}>
            <div style={{
              maxWidth: "1440px",
              margin: "0 auto",
              padding: "0 36px",
              height: "66px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              {/* Left: Logo */}
              <div style={{ flexShrink: 0 }}>
                <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
                  <img src="/logo.webp" alt="SeaBite" width={84} height={56} style={{ height: "54px", width: "auto", objectFit: "contain" }} />
                </Link>
              </div>

              {/* Center: Redesigned Search Bar */}
              <NavSearchBar onMobileClose={() => setMobileOpen(false)} />

              {/* Right: Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {/* Wishlist */}
                <motion.button
                  aria-label="View wishlist"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => user ? navigate("/wishlist") : setIsLoginOpen(true)}
                  style={{ ...iconBtn, position: "relative" }}
                  className="nav-ib"
                >
                  <FiHeart size={18} />
                  {user?.wishlist?.length > 0 && (
                    <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#0D9488", color: "#fff", width: "16px", height: "16px", borderRadius: "50%", fontSize: "9px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {user.wishlist.length}
                    </span>
                  )}
                </motion.button>

                {/* Notifications */}
                {user && (
                  <div style={{ position: "relative" }} className="notif-container">
                    <motion.button
                      aria-label="View notifications"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="nav-ib"
                      style={{ ...iconBtn, position: "relative" }}
                    >
                      <FiBell size={18} />
                      {unreadCount > 0 && (
                        <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#0D9488", color: "#fff", width: "16px", height: "16px", borderRadius: "50%", fontSize: "9px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {unreadCount}
                        </span>
                      )}
                    </motion.button>

                    <AnimatePresence>
                      {showNotifications && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          style={{
                            position: "absolute", top: "100%", right: 0, marginTop: "10px",
                            width: "320px", background: "#FFFFFF", borderRadius: "20px",
                            boxShadow: "0 20px 50px rgba(0,0,0,0.12)", border: "1.5px solid #E2EEEC",
                            zIndex: 1000, overflow: "hidden"
                          }}
                        >
                          <div style={{ padding: "16px 18px", borderBottom: "1.5px solid #F4F9F8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#1A2E2C" }}>Notifications</h3>
                            {unreadCount > 0 && (
                              <button onClick={markAllAsRead} style={{ background: "none", border: "none", color: "#0D9488", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Mark all read</button>
                            )}
                          </div>
                          <div style={{ maxHeight: "320px", overflowY: "auto" }} className="drawer-scrollbar">
                            {notifications.length > 0 ? (
                              notifications.map(n => (
                                <div key={n._id} style={{ padding: "14px 18px", borderBottom: "1px solid #F4F9F8", background: n.read ? "transparent" : "#F4FBF9" }}>
                                  <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: "700", color: "#1A2E2C" }}>{n.title}</p>
                                  <p style={{ margin: 0, fontSize: "12px", color: "#64748B", lineHeight: 1.4 }}>{n.message}</p>
                                  <p style={{ margin: "6px 0 0", fontSize: "10px", color: "#94A3B8", fontWeight: "600" }}>{new Date(n.createdAt).toLocaleDateString()}</p>
                                </div>
                              ))
                            ) : (
                              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                                <div style={{ fontSize: "24px", marginBottom: "8px" }}>🔔</div>
                                <p style={{ fontSize: "13px", color: "#94A3B8", margin: 0, fontWeight: "600" }}>All caught up!</p>
                              </div>
                            )}
                          </div>
                          <button onClick={() => { navigate("/notifications"); setShowNotifications(false); }} style={{ width: "100%", padding: "14px", background: "#F4F9F8", border: "none", color: "#0D9488", fontSize: "13px", fontWeight: "800", cursor: "pointer", borderTop: "1.5px solid #E2EEEC" }}>View All Notifications</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Profile / Avatar */}
                {user ? (
                  <div style={{ position: "relative" }} className="profile-container" onMouseEnter={() => setShowProfile(true)} onMouseLeave={() => setShowProfile(false)}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setShowProfile(!showProfile)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: "38px", height: "38px", borderRadius: "50%",
                        background: "linear-gradient(135deg, #0D9488, #059669)", border: "none", cursor: "pointer",
                        color: "#FFFFFF", fontWeight: "800", fontSize: "14px",
                        boxShadow: "0 2px 8px rgba(13,148,136,0.25)"
                      }}
                    >
                      {user.name[0].toUpperCase()}
                    </motion.button>
                    <AnimatePresence>
                      {showProfile && (
                        <motion.div
                          className="dropdown-bridge"
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          style={{ position: "absolute", top: "100%", right: 0, paddingTop: "6px", minWidth: "240px", zIndex: 200 }}
                        >
                          <div style={{ background: "#fff", border: "1.5px solid #E2EEEC", borderRadius: "18px", overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.1)" }}>
                            <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #F0F5F4", background: "#F4F9F8" }}>
                              <p style={{ fontSize: "10px", fontWeight: "800", color: "#0D9488", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 3px" }}>Signed in as</p>
                              <p style={{ fontSize: "13px", fontWeight: "700", color: "#1A2E2C", margin: 0 }}>{user.email}</p>
                            </div>
                            <div style={{ padding: "6px" }}>
                              <Link to="/profile" onClick={() => setShowProfile(false)} className="prof-item" style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "10px 14px", border: "none", background: "none", borderRadius: "10px", cursor: "pointer", fontSize: "13.5px", fontWeight: "600", color: "#1A2E2C", textDecoration: "none" }}><FiUser size={16}/> Profile</Link>
                              <Link to="/notifications" onClick={() => setShowProfile(false)} className="prof-item" style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "10px 14px", border: "none", background: "none", borderRadius: "10px", cursor: "pointer", fontSize: "13.5px", fontWeight: "600", color: "#1A2E2C", textDecoration: "none", position: "relative" }}>
                                <FiBell size={16}/> Notifications
                                {unreadCount > 0 && <span style={{ position: "absolute", right: "12px", background: "#F07468", color: "#fff", padding: "2px 6px", borderRadius: "10px", fontSize: "10px", fontWeight: "800" }}>{unreadCount}</span>}
                              </Link>
                              <Link to="/orders" onClick={() => setShowProfile(false)} className="prof-item" style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "10px 14px", border: "none", background: "none", borderRadius: "10px", cursor: "pointer", fontSize: "13.5px", fontWeight: "600", color: "#1A2E2C", textDecoration: "none" }}><FiPackage size={16}/> Orders</Link>
                              {user.role === "admin" && (
                                <Link to="/admin/dashboard" onClick={() => setShowProfile(false)} className="prof-item" style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "10px 14px", border: "none", background: "none", borderRadius: "10px", cursor: "pointer", fontSize: "13.5px", fontWeight: "800", color: "#0D9488", marginTop: "4px", textDecoration: "none" }}><FiGrid size={16}/> Admin Dashboard</Link>
                              )}
                            </div>
                            <div style={{ borderTop: "1px solid #FEE2E2", padding: "6px" }}>
                              <button
                                onClick={handleLogout}
                                disabled={logoutLoading}
                                className="prof-item"
                                style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "10px 14px", border: "none", background: "none", borderRadius: "10px", cursor: logoutLoading ? "not-allowed" : "pointer", color: "#DC2626", fontSize: "13.5px", fontWeight: "600", textAlign: "left" }}
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
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setIsLoginOpen(true)}
                    className="nav-ib"
                    style={{ ...iconBtn }}
                  >
                    <FiUser size={18} />
                  </motion.button>
                )}

                {/* Cart Button */}
                <motion.button
                  aria-label="Open shopping cart"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setIsCartOpen(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    background: "linear-gradient(135deg, #1A2E2C, #0F2220)",
                    color: "#FFFFFF",
                    border: "none", cursor: "pointer",
                    padding: "8px 16px", borderRadius: "30px",
                    boxShadow: "0 4px 14px rgba(26,46,44,0.18)"
                  }}
                >
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <FiShoppingCart size={18} color="#FFFFFF" />
                    {cartCount > 0 && (
                      <span style={{ position: "absolute", top: "-6px", right: "-8px", background: "#0D9488", color: "#fff", width: "16px", height: "16px", borderRadius: "50%", fontSize: "9px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "13.5px", fontWeight: "700", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Cart</span>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Bottom Tier → MegaMenu */}
          <MegaMenu />
        </div>

        {/* ═══ MOBILE HEADER ═══ */}
        <div
          className="show-mobile"
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", height: "58px",
            background: "#FFFFFF",
            borderBottom: "1px solid #E2EEEC",
            padding: "0 12px",
            position: "relative"
          }}
        >
          {/* Left: Hamburger */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "8px 4px", display: "flex", alignItems: "center" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ width: "18px", height: "2px", background: "#1A2E2C", borderRadius: "2px" }} />
              <div style={{ width: "12px", height: "2px", background: "#1A2E2C", borderRadius: "2px" }} />
              <div style={{ width: "18px", height: "2px", background: "#1A2E2C", borderRadius: "2px" }} />
            </div>
          </motion.button>

          {/* Center: Logo */}
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
            <img src="/logo.webp" alt="SeaBite" width={64} height={42} style={{ height: "42px", width: "auto", objectFit: "contain" }} />
          </Link>

          {/* Center-Right: Inline Search Trigger */}
          <NavSearchBar onMobileClose={() => setMobileOpen(false)} />

          {/* Right: Cart Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsCartOpen(true)}
            style={{ background: "#F2F6F5", border: "1px solid #E2EEEC", width: "36px", height: "36px", borderRadius: "50%", color: "#1A2E2C", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <FiShoppingCart size={17} />
            {cartCount > 0 && (
              <span style={{
                position: "absolute", top: "-2px", right: "-2px",
                background: "#0D9488", color: "#fff",
                width: "14px", height: "14px", borderRadius: "50%", fontSize: "8px", fontWeight: "900", display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {cartCount}
              </span>
            )}
          </motion.button>
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