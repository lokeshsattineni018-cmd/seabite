// src/components/Navbar.jsx
import { useState, useContext, useEffect, useRef, Suspense } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser, FiShoppingBag, FiSearch, FiLogOut, FiPackage,
  FiGrid, FiBell, FiMenu, FiX, FiChevronDown, FiHeart, FiMail, FiCheckCircle, FiZap, FiEye, FiEyeOff, FiArrowRight
} from "react-icons/fi";
import { CartContext } from "../../context/CartContext";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import Spin from "../../pages/general/Spin";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { io } from "socket.io-client"; // [Real-time Pulse]

const API_URL = import.meta.env.VITE_API_URL || "";

const NAV_LINKS = [
  { label: "Fish", path: "/products?category=Fish" },
  { label: "Prawns", path: "/products?category=Prawn" },
  { label: "Crabs", path: "/products?category=Crab" }
];

const AuthInput = ({ label, type = "text", value, onChange, placeholder, required = true }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid #D1D5DB", borderRadius: "8px", overflow: "hidden", background: "#fff", transition: "border-color 0.2s" }}>
        <input
          type={inputType} required={required} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || label}
          style={{ width: "100%", padding: "14px 16px", border: "none", color: "#111827", fontSize: "16px", fontWeight: "500", outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          onFocus={e => {
            e.currentTarget.parentElement.style.borderColor = "#5BA8A0";
            e.currentTarget.parentElement.style.boxShadow = "0 0 0 3px rgba(91, 168, 160, 0.1)";
          }}
          onBlur={e => {
            e.currentTarget.parentElement.style.borderColor = "#D1D5DB";
            e.currentTarget.parentElement.style.boxShadow = "none";
          }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)} style={{ background: "none", border: "none", padding: "0 12px", cursor: "pointer", color: "#9CA3AF", display: "flex", alignItems: "center" }}>
            {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default function Navbar({ announcementActive = false }) {
  const { cartCount, setIsCartOpen } = useContext(CartContext);
  const { user, setUser, refreshMe } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

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
  const [trendingSearched, setTrendingSearched] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [systemAlert, setSystemAlert] = useState(null); // [Pulse State]

  const lastScrollY = useRef(0);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Auth State
  const [authMode, setAuthMode] = useState("LOGIN"); // LOGIN, SIGNUP, FORGOT, RESET_PASSWORD, OTP_VERIFY_SIGNUP
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authOtp, setAuthOtp] = useState("");
  const [authReferral, setAuthReferral] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [authImgIdx, setAuthImgIdx] = useState(0);
  const authImages = ["/auth-prawn.png", "/auth-fish.png", "/auth-crab.png"];

  useEffect(() => {
    if (!isLoginOpen) {
      // Complete state reset on close
      setAuthMode("LOGIN");
      setAuthOtp("");
      setAuthEmail("");
      setAuthPassword("");
      setAuthName("");
      setAuthPhone("");
      setAuthReferral("");
      setResendCooldown(0);
      setAuthImgIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setAuthImgIdx(prev => (prev + 1) % authImages.length);
    }, 3500); // Slightly slower for more premium feel
    return () => clearInterval(interval);
  }, [isLoginOpen]);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const isHome = location.pathname === "/";
  const isTransparent = isHome && !scrolled;

  useEffect(() => {
    const authType = searchParams.get("auth");
    if (authType === "login") {
      setAuthMode("LOGIN");
      setIsLoginOpen(true);
      searchParams.delete("auth");
      setSearchParams(searchParams);
    } else if (authType === "signup") {
      setAuthMode("SIGNUP");
      setIsLoginOpen(true);
      searchParams.delete("auth");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

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
    if (user?.role !== "admin") return;
    const socket = io(API_URL);
    socket.on("SYSTEM_PULSE", (data) => {
      if (data.alert) setSystemAlert(data.alert);
      else setSystemAlert(null);
    });
    return () => socket.disconnect();
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
      if (mobileOpen) setMobileOpen(false);
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

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email: authEmail, password: authPassword }, { withCredentials: true });
      if (res.data.sessionId) localStorage.setItem("seabite_session_id", res.data.sessionId);
      setUser(res.data.user);
      toast.success("Welcome back!");
      setIsLoginOpen(false);
      await refreshMe?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally { setAuthLoading(false); }
  };

  const handleSignupOtpRequest = async (e) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/send-otp`, { email: authEmail, name: authName });
      toast.success("OTP sent to your email!");
      setAuthMode("OTP_VERIFY_SIGNUP");
      setResendCooldown(30);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally { setAuthLoading(false); }
  };

  const handleSignupVerify = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/verify-otp-signup`, {
        name: authName, email: authEmail, phone: authPhone, password: authPassword, otp: authOtp, referralCode: authReferral
      });
      if (res.data.sessionId) localStorage.setItem("seabite_session_id", res.data.sessionId);
      setUser(res.data.user);
      toast.success("Account created successfully!");
      setIsLoginOpen(false);
      await refreshMe?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally { setAuthLoading(false); }
  };

  const handleForgotOtpRequest = async (e) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password-otp`, { email: authEmail });
      toast.success("Reset OTP sent to your email!");
      setAuthMode("RESET_PASSWORD");
      setResendCooldown(30);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error sending reset OTP");
    } finally { setAuthLoading(false); }
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0) return;
    setAuthOtp(""); // Clear previous OTP
    if (authMode === "OTP_VERIFY_SIGNUP") {
      handleSignupOtpRequest();
    } else if (authMode === "RESET_PASSWORD") {
      handleForgotOtpRequest();
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, { email: authEmail, otp: authOtp, newPassword: authPassword });
      toast.success("Password reset successful!");
      setAuthMode("LOGIN");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally { setAuthLoading(false); }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await axios.post(`${API_URL}/api/auth/google`, { token: tokenResponse.access_token }, { withCredentials: true });
        if (res.data.sessionId) localStorage.setItem("seabite_session_id", res.data.sessionId);
        setUser(res.data.user);
        toast.success("Success!");
        setIsLoginOpen(false);
        await refreshMe?.();
      } catch { toast.error("Google login failed"); }
    }
  });

  const isActive = (p) => location.pathname + location.search === p;

  const T = {
    navBg: isTransparent ? "transparent" : "rgba(255,255,255,0.97)",
    navBlur: isTransparent ? "none" : "blur(24px) saturate(1.6)",
    navBorder: isTransparent ? "transparent" : "rgba(226,238,236,0.85)",
    navShadow: isTransparent ? "none" : "0 2px 24px rgba(26,46,44,0.07)",
    navPy: isTransparent ? "14px 0" : "10px 0",
    link: isTransparent ? "rgba(255,255,255,0.88)" : "#2C4A46",
    linkActive: isTransparent ? "#fff" : "#5BBFB5",
    underline: isTransparent ? "rgba(255,255,255,0.9)" : "#5BBFB5",
    iconBg: isTransparent ? "transparent" : "#F4F9F8",
    iconBorder: isTransparent ? "none" : "1px solid #E2EEEC",
    iconColor: isTransparent ? "rgba(255,255,255,0.90)" : "#4A7570",
    iconHoverBg: isTransparent ? "rgba(255,255,255,0.15)" : "#E8F4F2",
    iconHoverColor: isTransparent ? "#fff" : "#5BBFB5",
    loginBg: isTransparent ? "#5BBFB5" : "#1A2E2C",
    loginShadow: isTransparent ? "0 2px 14px rgba(0,0,0,0.20)" : "none",
    pillBg: isTransparent ? "transparent" : "#fff",
    pillBorder: isTransparent ? "transparent" : "#DDE9E7",
    pillName: isTransparent ? "#ffffff" : "#1A2E2C",
    pillChevron: isTransparent ? "#ffffff" : "#A8C5C0",
  };

  const iconBtn = {
    width: "36px", height: "36px", borderRadius: "10px",
    background: T.iconBg, border: T.iconBorder, color: T.iconColor,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0, transition: "background 0.25s, color 0.25s, border-color 0.25s",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        .nav-root * { box-sizing: border-box; }
        .nav-ul::after { content: ''; display: block; height: 1.5px; border-radius: 2px; margin-top: 3px; background: ${T.underline}; transform: scaleX(0); transform-origin: left; transition: transform 0.22s ease, background 0.35s; }
        .nav-ul:hover::after, .nav-ul-active::after { transform: scaleX(1); }
        .nav-ib:hover { background: ${T.iconHoverBg} !important; color: ${T.iconHoverColor} !important; }
        .dd-item:hover { background: #F0F8F7 !important; color: #5BBFB5 !important; }
        .prof-item:hover { background: #F4F9F8 !important; }
        .dropdown-bridge::before {
          content: "";
          position: absolute;
          top: -20px;
          left: 0;
          right: 0;
          height: 20px;
          background: transparent;
        }
        .si:focus { outline: none; }
        .drawer-scrollbar::-webkit-scrollbar { width: 4px; }
        .drawer-scrollbar::-webkit-scrollbar-thumb { background: #E2EEEC; border-radius: 10px; }
        .auth-input-veirdo { width: 100%; padding: 14px 16px; border-radius: 0; border: 1.5px solid #E8EEF2; background: #F8FAFB; outline: none; font-size: 14px; font-weight: 600; transition: all 0.2s ease; color: #1A2B35; font-family: 'Manrope', sans-serif; }
        .auth-input-veirdo::placeholder { color: #A8C5C0; font-weight: 500; }
        .auth-input-veirdo:focus { border-color: #1A2B35; background: #fff; }
        .loading-spinner { width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: auth-spin 0.8s linear infinite; }
        @keyframes auth-spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .hidden-mobile { display: none !important; } .show-mobile { display: flex !important; } }
        @media (min-width: 769px) { .show-mobile { display: none !important; } .hidden-mobile { display: flex !important; } }
      `}</style>

      <motion.nav
        className="nav-root"
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: hidden ? -72 : 0, opacity: hidden ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "fixed", top: announcementActive ? 40 : 0, left: 0, right: 0, zIndex: 100,
          fontFamily: "'Plus Jakarta Sans', sans-serif", background: T.navBg, backdropFilter: T.navBlur,
          borderBottom: `1px solid ${T.navBorder}`, boxShadow: T.navShadow, padding: T.navPy, transition: "all 0.35s ease",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "center" }}>

          {/* --- DESKTOP VIEW --- */}
          <div className="hidden-mobile" style={{ width: "100%", display: "flex", alignItems: "center" }}>
            <div style={{ marginRight: "36px", flexShrink: 0 }}>
              <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
                <img src="/logo.png" alt="SeaBite" style={{ height: "64px", width: "auto" }} />
              </Link>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ position: "relative" }} onMouseEnter={() => setShowShop(true)} onMouseLeave={() => setShowShop(false)}>
                <button className="nav-ul" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", border: "none", background: "none", fontSize: "14px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em", color: T.link, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Shop <FiChevronDown size={12} style={{ transform: showShop ? "rotate(180deg)" : "none", transition: "all 0.22s" }} />
                </button>
                <AnimatePresence>
                  {showShop && (
                    <motion.div 
                      className="dropdown-bridge"
                      initial={{ opacity: 0, y: -8, scale: 0.97 }} 
                      animate={{ opacity: 1, y: 0, scale: 1 }} 
                      exit={{ opacity: 0, y: -8, scale: 0.97 }} 
                      style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, background: "#fff", border: "1.5px solid #E2EEEC", borderRadius: "14px", padding: "5px", minWidth: "170px", zIndex: 200, boxShadow: "0 12px 40px rgba(0,0,0,0.1)" }}
                    >
                      {NAV_LINKS.map(link => (
                        <button key={link.path} className="dd-item" onClick={() => { navigate(link.path); setShowShop(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 13px", border: "none", background: "none", borderRadius: "9px", fontSize: "13.5px", fontWeight: "600", color: "#1A2E2C", cursor: "pointer" }}>{link.label}</button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Link to="/about" className="nav-ul" style={{ padding: "6px 12px", textDecoration: "none", fontSize: "13.5px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em", color: T.link }}>About</Link>
              <Link to="/orders" className="nav-ul" style={{ padding: "6px 12px", textDecoration: "none", fontSize: "13.5px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em", color: T.link }}>Orders</Link>

            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
              <div style={{ position: "relative" }}>
                <AnimatePresence>
                  {searchExpanded ? (
                    <motion.div key="open" initial={{ width: 36, opacity: 0.4 }} animate={{ width: 230, opacity: 1 }} exit={{ width: 36, opacity: 0 }} transition={{ duration: 0.28 }} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fff", border: "1.5px solid #5BBFB5", borderRadius: "10px", padding: "7px 12px", boxShadow: "0 0 0 3px rgba(91,191,181,0.10)" }}>
                      <FiSearch size={13} style={{ color: "#5BBFB5", flexShrink: 0 }} />
                      <input ref={searchRef} autoFocus className="si" value={searchTerm} onChange={e => handleSearchInput(e.target.value)} onKeyDown={handleSearchSubmit} onBlur={() => setTimeout(() => { setSearchExpanded(false); setSuggestions([]); }, 180)} placeholder="Search fresh catch…" style={{ border: "none", background: "none", fontSize: "13px", color: "#1A2E2C", width: "100%" }} />
                      {searchTerm && <button onClick={() => { setSearchTerm(""); setSuggestions([]); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#B8CFCC", display: "flex", padding: 0 }}><FiX size={12} /></button>}
                    </motion.div>
                  ) : (
                    <motion.button key="icon" whileTap={{ scale: 0.88 }} onClick={() => setSearchExpanded(true)} className="nav-ib" style={iconBtn}><FiSearch size={15} /></motion.button>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {suggestions.length > 0 && searchExpanded && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, x: 0 }} style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #E2EEEC", borderRadius: "14px", overflow: "hidden", zIndex: 300, minWidth: "240px", boxShadow: "0 12px 40px rgba(0,0,0,0.1)" }}>
                      {suggestions.map(item => (
                        <div key={item._id} className="prof-item" onClick={() => handleSuggestionClick(item)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #F4F9F8" }}>
                          <img src={item.image} alt={item.name} style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover" }} />
                          <div style={{ flex: 1 }}><p style={{ fontSize: "13px", fontWeight: "700", color: "#1A2E2C", margin: 0 }}>{item.name}</p></div>
                          <span style={{ fontSize: "13px", fontWeight: "800", color: "#5BBFB5" }}>₹{item.basePrice}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Notifications */}
              {user && (
                <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate("/notifications")} className="nav-ib" style={{ ...iconBtn, position: "relative" }}>
                  <FiBell size={15} />
                  {unreadCount > 0 && <span style={{ position: "absolute", top: "-5px", right: "-5px", background: "#F07468", color: "#fff", width: "16px", height: "16px", borderRadius: "50%", fontSize: "9px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadCount}</span>}
                </motion.button>
              )}

              <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate(user ? "/wishlist" : "#")} style={{ ...iconBtn, position: "relative" }} className="nav-ib">
                <FiHeart size={15} />
                {user?.wishlist?.length > 0 && <span style={{ position: "absolute", top: "-5px", right: "-5px", background: "#F07468", color: "#fff", width: "16px", height: "16px", borderRadius: "50%", fontSize: "9px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>{user.wishlist.length}</span>}
              </motion.button>

              <motion.button whileTap={{ scale: 0.88 }} onClick={() => setIsCartOpen(true)} className="nav-ib" style={{ ...iconBtn, position: "relative" }}>
                <FiShoppingBag size={15} />
                {cartCount > 0 && <span style={{ position: "absolute", top: "-5px", right: "-5px", background: "#5BBFB5", color: "#fff", width: "16px", height: "16px", borderRadius: "50%", fontSize: "9px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>{cartCount}</span>}
              </motion.button>

              {user ? (
                <div style={{ position: "relative", marginLeft: "4px" }} onMouseEnter={() => setShowProfile(true)} onMouseLeave={() => setShowProfile(false)}>
                  <motion.button 
                    whileHover={{ scale: 1.03 }} 
                    onClick={() => setShowProfile(!showProfile)}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 11px 5px 5px", border: `1.5px solid ${T.pillBorder}`, borderRadius: "20px", background: T.pillBg, backdropFilter: T.pillBlur, cursor: "pointer" }}
                  >
                    <div style={{ width: "27px", height: "27px", borderRadius: "50%", background: "linear-gradient(135deg,#5BBFB5,#7EB8D4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "800", fontSize: "11px" }}>{user.name[0].toUpperCase()}</div>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: T.pillName }}>{user.name.split(" ")[0]}</span>
                    <FiChevronDown size={11} style={{ color: T.pillChevron, transform: showProfile ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                  </motion.button>
                  <AnimatePresence>
                    {showProfile && (
                      <motion.div 
                        className="dropdown-bridge"
                        initial={{ opacity: 0, y: -8, scale: 0.97 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
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
                          <button onClick={() => { navigate("/profile"); setShowProfile(false); }} className="prof-item" style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "10px 14px", border: "none", background: "none", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: "#1A2E2C", textAlign: "left" }}><FiUser size={16}/> Profile</button>
                          <button onClick={() => { navigate("/orders"); setShowProfile(false); }} className="prof-item" style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "10px 14px", border: "none", background: "none", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: "#1A2E2C", textAlign: "left" }}><FiPackage size={16}/> Orders</button>
                          <button onClick={() => { navigate("/notifications"); setShowProfile(false); }} className="prof-item" style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "10px 14px", border: "none", background: "none", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: "#1A2E2C", textAlign: "left" }}><FiBell size={16}/> Notifications</button>
                          {user.role === "admin" && (
                            <button onClick={() => { navigate("/admin/dashboard"); setShowProfile(false); }} className="prof-item" style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "10px 14px", border: "none", background: "none", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "800", color: "#5BBFB5", marginTop: "4px", textAlign: "left" }}><FiGrid size={16}/> Admin Dashboard</button>
                          )}
                        </div>
                        <div style={{ borderTop: "1px solid #FEE2E2", padding: "8px" }}>
                          <button onClick={handleLogout} className="prof-item" style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "10px 14px", border: "none", background: "none", borderRadius: "10px", cursor: "pointer", color: "#DC2626", fontSize: "14px", fontWeight: "600", textAlign: "left" }}><FiLogOut size={16}/> Logout</button>
                        </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsLoginOpen(true)} className="nav-ib" style={{ ...iconBtn, position: "relative", marginLeft: "14px", background: "none", border: "none", padding: 0 }}>
                  <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                       <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                       <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#F97316" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", right: "0px", top: "0px" }}>
                       <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                  </div>
                </motion.button>
              )}
            </div>
          </div>

          {/* --- MOBILE VIEW (VEIRDO STYLE) --- */}
          <div className="show-mobile" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Hamburger Menu Removed as requested */}
            </div>

            <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
              <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
                <img src="/logo.png" alt="SeaBite" style={{ height: "48px", width: "auto" }} />
              </Link>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => setIsCartOpen(true)} className="nav-ib" style={{ ...iconBtn, position: "relative", background: "none", border: "none" }}>
                <FiShoppingBag size={22} color={T.iconColor} />
                {cartCount > 0 && <span style={{ position: "absolute", top: "0px", right: "0px", background: "#1A2B35", color: "#fff", width: "16px", height: "16px", borderRadius: "50%", fontSize: "9px", fontWeight: "900", display: "flex", alignItems: "center", justifyContent: "center" }}>{cartCount}</span>}
              </motion.button>
            </div>
          </div>

        </div>
      </motion.nav>

      <AnimatePresence>
        {isLoginOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(0,0,0,0.4)" }}>
            <div onClick={() => setIsLoginOpen(false)} style={{ position: "absolute", inset: 0 }} />
            
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} style={{ position: "relative", background: "#fff", width: "100%", maxWidth: "760px", borderRadius: "16px", boxShadow: "0 24px 60px rgba(0,0,0,0.2)", display: "flex", fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>
                         {/* LEFT SIDE (FEATURES) */}
              <div className="hidden-mobile" style={{ flex: "0.8", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "32px" }}>
                  <AnimatePresence initial={false}>
                    <motion.div
                       key={authImgIdx}
                       initial={{ x: "100%", opacity: 0.8 }}
                       animate={{ x: 0, opacity: 1, zIndex: 1 }}
                       exit={{ x: "-100%", opacity: 0.8, zIndex: 0 }}
                       transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }} // More fluid, premium timing
                       style={{
                          position: "absolute", inset: 0,
                          background: `url(${authImages[authImgIdx]}) center/cover no-repeat`
                       }}
                    />
                  </AnimatePresence>

                 {/* Premium Gradient Overlay */}
                 <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 1 }} />
                 
                 <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "center", alignItems: "center", width: "100%", paddingTop: "32px" }}>
                    <img src="/logo.png" style={{ height: "64px", width: "auto", filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.2))", objectFit: "contain" }} />
                 </div>
                 
                 <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "32px", paddingBottom: "60px", textAlign: "left" }}>
                    <AnimatePresence mode="popLayout">
                       <motion.div
                          key={authImgIdx}
                          initial={{ opacity: 0, x: 40 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -40 }}
                          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                       >
                          <div style={{ display: "inline-block", padding: "6px 14px", borderRadius: "8px", background: "rgba(234, 179, 8, 0.9)", color: "#000", fontSize: "11px", fontWeight: "900", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "20px", backdropFilter: "blur(4px)" }}>
                             {authImgIdx === 0 ? "FLASH DEAL" : authImgIdx === 1 ? "FREE SHIPPING" : "WELCOME OFFER"}
                          </div>
                          
                          <h2 style={{ color: "#fff", fontSize: "52px", fontWeight: "900", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: "0 0 12px", lineHeight: 0.85, letterSpacing: "-0.04em", textShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                             {authImgIdx === 0 ? <>10%<br/><span style={{fontSize: "26px", fontWeight: "700", letterSpacing: "0.01em"}}>DISCOUNT</span></> : authImgIdx === 1 ? <>FREE<br/><span style={{fontSize: "26px", fontWeight: "700", letterSpacing: "0.01em"}}>DELIVERY</span></> : <>FLAT ₹200<br/><span style={{fontSize: "26px", fontWeight: "700", letterSpacing: "0.01em"}}>DISCOUNT</span></>}
                          </h2>
                          
                          <p style={{ color: "rgba(255,255,255,0.95)", fontSize: "16px", fontWeight: "500", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0, maxWidth: "260px", lineHeight: 1.4, letterSpacing: "-0.01em" }}>
                             {authImgIdx === 0 ? "On all orders above ₹1699" : authImgIdx === 1 ? "On all orders above ₹999" : "On your very first order"}
                          </p>
                       </motion.div>
                    </AnimatePresence>
                 </div>
              </div>

              {/* RIGHT SIDE (WHITE BOX) */}
              <div className="auth-modal-right" style={{ flex: 1, padding: "8px 8px 8px 0", minHeight: "auto", position: "relative", zIndex: 1 }}>
                <div className="auth-modal-inner" style={{ background: "#fff", borderRadius: "12px", height: "100%", padding: "32px 32px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", boxShadow: "0 0 40px rgba(0,0,0,0.05)" }}>
                <button onClick={() => setIsLoginOpen(false)} style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(0,0,0,0.05)", border: "none", borderRadius: "50%", width: "32px", height: "32px", color: "#111", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10, transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background="rgba(0,0,0,0.1)"} onMouseOut={e => e.currentTarget.style.background="rgba(0,0,0,0.05)"}><FiX size={18}/></button>
                <AnimatePresence mode="wait">
                  <motion.div key={authMode} variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } }, exit: { opacity: 0 } }} initial="hidden" animate="show" exit="exit" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    
                    <div style={{ textAlign: "center", marginBottom: "24px" }}>
                       <div className="mobile-only" style={{ marginBottom: "20px" }}>
                          <img src="/logo.png" style={{ height: "40px", width: "auto", margin: "0 auto" }} />
                       </div>
                       <h2 style={{ fontSize: "24px", fontWeight: "800", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#111827", margin: "0 0 8px", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
                          {authMode === "LOGIN" ? "Unlock Ocean's Finest" 
                           : authMode === "SIGNUP" ? "Join Us For Exclusive Catch" 
                           : authMode === "OTP_VERIFY_SIGNUP" ? "Verify Your Email"
                           : authMode === "RESET_PASSWORD" ? "Create New Password"
                           : "Reset Your Password"}
                       </h2>
                       <p style={{ fontSize: "14px", color: "#6B7280", margin: 0, fontWeight: "500", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.01em" }}>
                          {authMode === "LOGIN" ? "Enter Email to Continue" 
                           : authMode === "SIGNUP" ? "Enter your details below" 
                           : authMode === "OTP_VERIFY_SIGNUP" ? "Enter the 6-digit code sent to your email"
                           : authMode === "RESET_PASSWORD" ? "Enter the reset code and your new password"
                           : "Enter email to receive reset code"}
                       </p>
                    </div>

                    {authMode === "LOGIN" && (
                      <form onSubmit={handleLoginSubmit}>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
                          <AuthInput label="Email Address" type="email" value={authEmail} onChange={setAuthEmail} placeholder="Enter Email Address" />
                        </motion.div>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
                          <AuthInput label="Password" type="password" value={authPassword} onChange={setAuthPassword} placeholder="Enter Password" />
                        </motion.div>

                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                          <input type="checkbox" defaultChecked style={{ width: "16px", height: "16px", accentColor: "#5CA8DA", cursor: "pointer" }} />
                          <span style={{ fontSize: "13px", color: "#4B5563", fontWeight: "500" }}>Notify me for fresh catch updates</span>
                        </motion.div>
                        
                        <motion.button variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} type="submit" disabled={authLoading} style={{ width: "100%", padding: "14px", background: "#111827", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "15px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>
                          {authLoading ? <div className="loading-spinner" style={{ borderColor: "rgba(255,255,255,0.2)", borderTopColor: "#fff" }}/> : "Continue"}
                        </motion.button>

                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ position: "relative", margin: "24px 0", textAlign: "center" }}>
                          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "#E5E7EB" }} />
                          <span style={{ position: "relative", background: "#fff", padding: "0 12px", fontSize: "11px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase" }}>OR</span>
                        </motion.div>

                        <motion.button variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} type="button" onClick={() => googleLogin()} style={{ width: "100%", padding: "14px", background: "#fff", border: "1px solid #D1D5DB", borderRadius: "8px", fontWeight: "700", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", color: "#111827", transition: "background 0.2s" }} whileHover={{ background: "#F9FAFB" }}>
                          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" style={{ width: "18px" }} /> Continue with Google
                        </motion.button>
                        
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
                          <button type="button" onClick={() => setAuthMode("FORGOT")} style={{ background: "none", border: "none", fontSize: "12px", color: "#6B7280", fontWeight: "600", cursor: "pointer" }}>Forgot Password?</button>
                          <button type="button" onClick={() => setAuthMode("SIGNUP")} style={{ background: "none", border: "none", fontSize: "12px", color: "#3B82F6", fontWeight: "600", cursor: "pointer" }}>New here? Create Account</button>
                        </motion.div>
                        
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ marginTop: "32px", textAlign: "center" }}>
                           <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0, lineHeight: 1.4 }}>
                             I accept that I have read & understood SeaBite's<br/>
                             <Link to="/privacy" onClick={() => setIsLoginOpen(false)} style={{ color: "#9CA3AF", textDecoration: "underline" }}>Privacy Policy</Link> and <Link to="/terms" onClick={() => setIsLoginOpen(false)} style={{ color: "#9CA3AF", textDecoration: "underline" }}>T&Cs</Link>.
                           </p>
                        </motion.div>
                      </form>
                    )}

                    {authMode === "SIGNUP" && (
                      <form onSubmit={handleSignupOtpRequest}>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <AuthInput label="Full Name" value={authName} onChange={setAuthName} placeholder="Full Name" />
                          <AuthInput label="Phone" value={authPhone} onChange={setAuthPhone} placeholder="Phone" />
                        </motion.div>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
                          <AuthInput label="Email Address" type="email" value={authEmail} onChange={setAuthEmail} placeholder="Email Address" />
                        </motion.div>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
                          <AuthInput label="Password" type="password" value={authPassword} onChange={setAuthPassword} placeholder="Password" />
                        </motion.div>
                        
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                          <input type="checkbox" defaultChecked style={{ width: "16px", height: "16px", accentColor: "#5CA8DA", cursor: "pointer" }} />
                          <span style={{ fontSize: "13px", color: "#4B5563", fontWeight: "500" }}>Notify me for fresh catch updates</span>
                        </motion.div>

                        <motion.button variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} type="submit" disabled={authLoading} style={{ width: "100%", padding: "14px", background: "#111827", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "15px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>
                          {authLoading ? <div className="loading-spinner" style={{ borderColor: "rgba(255,255,255,0.2)", borderTopColor: "#fff" }}/> : "Create Account"}
                        </motion.button>

                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ position: "relative", margin: "24px 0", textAlign: "center" }}>
                          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "#E5E7EB" }} />
                          <span style={{ position: "relative", background: "#fff", padding: "0 12px", fontSize: "11px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase" }}>OR</span>
                        </motion.div>

                        <motion.button variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} type="button" onClick={() => googleLogin()} style={{ width: "100%", padding: "14px", background: "#fff", border: "1px solid #D1D5DB", borderRadius: "8px", fontWeight: "700", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", color: "#111827", transition: "background 0.2s" }} whileHover={{ background: "#F9FAFB" }}>
                          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" style={{ width: "18px" }} /> Sign up with Google
                        </motion.button>
                        
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ marginTop: "16px", textAlign: "center" }}>
                          <button type="button" onClick={() => setAuthMode("LOGIN")} style={{ background: "none", border: "none", fontSize: "12px", color: "#3B82F6", fontWeight: "600", cursor: "pointer" }}>Already have an account? Sign In</button>
                        </motion.div>
                        
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ marginTop: "24px", textAlign: "center" }}>
                           <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0, lineHeight: 1.4 }}>
                             I accept that I have read & understood SeaBite's<br/>
                             <Link to="/privacy" onClick={() => setIsLoginOpen(false)} style={{ color: "#9CA3AF", textDecoration: "underline" }}>Privacy Policy</Link> and <Link to="/terms" onClick={() => setIsLoginOpen(false)} style={{ color: "#9CA3AF", textDecoration: "underline" }}>T&Cs</Link>.
                           </p>
                        </motion.div>
                      </form>
                    )}

                    {authMode === "OTP_VERIFY_SIGNUP" && (
                      <form onSubmit={handleSignupVerify}>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
                          <AuthInput label="Enter 6-Digit Code" value={authOtp} onChange={setAuthOtp} placeholder="000000" />
                        </motion.div>
                        <motion.button variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} type="submit" disabled={authLoading} style={{ width: "100%", padding: "14px", background: "#111827", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "15px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", marginTop: "12px" }}>
                          {authLoading ? <div className="loading-spinner" style={{ borderColor: "rgba(255,255,255,0.2)", borderTopColor: "#fff" }}/> : "Verify & Join"}
                        </motion.button>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ marginTop: "16px", textAlign: "center" }}>
                          <button type="button" onClick={handleResendOtp} disabled={resendCooldown > 0} style={{ background: "none", border: "none", fontSize: "12px", color: resendCooldown > 0 ? "#9CA3AF" : "#3B82F6", fontWeight: "600", cursor: resendCooldown > 0 ? "not-allowed" : "pointer" }}>
                            {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Didn't receive code? Resend"}
                          </button>
                        </motion.div>
                      </form>
                    )}

                    {authMode === "FORGOT" && (
                      <form onSubmit={handleForgotOtpRequest}>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
                          <AuthInput label="Email Address" type="email" value={authEmail} onChange={setAuthEmail} placeholder="name@example.com" />
                        </motion.div>
                        <motion.button variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} type="submit" disabled={authLoading} style={{ width: "100%", padding: "14px", background: "#111827", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "15px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", marginTop: "12px" }}>
                          {authLoading ? <div className="loading-spinner" style={{ borderColor: "rgba(255,255,255,0.2)", borderTopColor: "#fff" }}/> : "Send Reset Code"}
                        </motion.button>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ marginTop: "16px", textAlign: "center" }}>
                          <button type="button" onClick={() => setAuthMode("LOGIN")} style={{ background: "none", border: "none", fontSize: "12px", color: "#3B82F6", fontWeight: "600", cursor: "pointer" }}>Back to Sign In</button>
                        </motion.div>
                      </form>
                    )}

                    {authMode === "RESET_PASSWORD" && (
                      <form onSubmit={handleResetPassword}>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
                          <AuthInput label="6-Digit Code" value={authOtp} onChange={setAuthOtp} placeholder="000000" />
                        </motion.div>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
                          <AuthInput label="New Password" type="password" value={authPassword} onChange={setAuthPassword} placeholder="New Password" />
                        </motion.div>
                        <motion.button variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} type="submit" disabled={authLoading} style={{ width: "100%", padding: "14px", background: "#111827", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "15px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", marginTop: "12px" }}>
                          {authLoading ? <div className="loading-spinner" style={{ borderColor: "rgba(255,255,255,0.2)", borderTopColor: "#fff" }}/> : "Confirm New Password"}
                        </motion.button>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ marginTop: "16px", textAlign: "center" }}>
                          <button type="button" onClick={handleResendOtp} disabled={resendCooldown > 0} style={{ background: "none", border: "none", fontSize: "12px", color: resendCooldown > 0 ? "#9CA3AF" : "#3B82F6", fontWeight: "600", cursor: resendCooldown > 0 ? "not-allowed" : "pointer" }}>
                            {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Didn't receive code? Resend"}
                          </button>
                        </motion.div>
                      </form>
                    )}

                  </motion.div>
                </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000 }} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 28, stiffness: 220 }} style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: "85vw", maxWidth: "360px", background: "#fff", zIndex: 1001, display: "flex", flexDirection: "column", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <div style={{ padding: "24px", background: "#1A2B35", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <img src="/logo.png" alt="SeaBite" style={{ height: "36px", filter: "brightness(0) invert(1)" }} />
                <button onClick={() => setMobileOpen(false)} style={{ background: "none", border: "none", color: "#fff" }}><FiX size={24} /></button>
              </div>
              <div style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                   {NAV_LINKS.map(link => (
                     <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)} style={{ fontSize: "20px", fontWeight: "900", color: "#1A2B35", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #E8EEF2", paddingBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        {link.label} <FiChevronDown style={{ transform: "rotate(-90deg)", color: "#5BBFB5" }} size={20} />
                     </Link>
                   ))}
                </div>

                <div style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <p style={{ fontSize: "11px", fontWeight: "800", color: "#8BA5B3", textTransform: "uppercase", letterSpacing: "0.1em" }}>My Account</p>
                  {user ? (
                    <>
                      <Link to="/profile" onClick={() => setMobileOpen(false)} style={{ fontSize: "15px", fontWeight: "700", color: "#1A2B35", textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}><FiUser /> Profile</Link>
                      <Link to="/orders" onClick={() => setMobileOpen(false)} style={{ fontSize: "15px", fontWeight: "700", color: "#1A2B35", textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}><FiPackage /> Orders</Link>
                      <Link to="/wishlist" onClick={() => setMobileOpen(false)} style={{ fontSize: "15px", fontWeight: "700", color: "#1A2B35", textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}><FiHeart /> Wishlist</Link>
                      <button onClick={handleLogout} style={{ fontSize: "15px", fontWeight: "700", color: "#E8816A", textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", padding: 0, cursor: "pointer", marginTop: "16px" }}><FiLogOut /> Logout</button>
                    </>
                  ) : (
                    <button onClick={() => { setMobileOpen(false); setIsLoginOpen(true); }} style={{ width: "100%", padding: "14px", background: "#1A2B35", color: "#fff", border: "none", fontSize: "14px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer" }}>Login / Sign Up</button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <Suspense fallback={null}>
        {showSpinWheel && <Spin isOpen={showSpinWheel} onClose={() => setShowSpinWheel(false)} />}
      </Suspense>
    </>
  );
}