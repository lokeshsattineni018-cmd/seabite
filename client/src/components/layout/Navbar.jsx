// src/components/Navbar.jsx
import { useState, useContext, useEffect, useRef, Suspense } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser, FiShoppingBag, FiSearch, FiLogOut, FiPackage,
  FiGrid, FiBell, FiMenu, FiX, FiChevronDown, FiHeart, FiMail, FiCheckCircle
} from "react-icons/fi";
import { CartContext } from "../../context/CartContext";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import Spin from "../../pages/general/Spin";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";

const API_URL = import.meta.env.VITE_API_URL || "";

const NAV_LINKS = [
  { label: "Fish", path: "/products?category=Fish" },
  { label: "Prawns", path: "/products?category=Prawn" },
  { label: "Crabs", path: "/products?category=Crab" },
  { label: "Mussels", path: "/products?category=Mussel" },
];

const AuthInput = ({ label, type = "text", value, onChange, placeholder, icon: Icon, required = true }) => (
  <div style={{ marginBottom: "20px" }}>
    <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "#8BA5B3", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>{label}</label>
    <div style={{ position: "relative" }}>
      {Icon && <Icon style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#6B8F8A" }} />}
      <input
        type={type} required={required} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: `14px 16px ${Icon ? '14px 42px' : '14px 16px'}`, paddingLeft: Icon ? "42px" : "16px", borderRadius: "14px", border: "1.5px solid #E2EEEC", background: "#F4F9F8", outline: "none", fontSize: "14px", transition: "all 0.2s" }}
        className="auth-input"
      />
    </div>
  </div>
);

export default function Navbar({ announcementActive = false }) {
  const { cartCount, setIsCartOpen } = useContext(CartContext);
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
  const [trendingSearched, setTrendingSearched] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

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
    e.preventDefault();
    setAuthLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/send-otp`, { email: authEmail, name: authName });
      toast.success("OTP sent to your email!");
      setAuthMode("OTP_VERIFY_SIGNUP");
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
    e.preventDefault();
    setAuthLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password-otp`, { email: authEmail });
      toast.success("Reset OTP sent to your email!");
      setAuthMode("RESET_PASSWORD");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error sending reset OTP");
    } finally { setAuthLoading(false); }
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
        .si:focus { outline: none; }
        .drawer-scrollbar::-webkit-scrollbar { width: 4px; }
        .drawer-scrollbar::-webkit-scrollbar-thumb { background: #E2EEEC; border-radius: 10px; }
        .auth-input:focus { border-color: #5BBFB5 !important; background: #fff !important; box-shadow: 0 0 0 4px rgba(91,191,181,0.1); }
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
          fontFamily: "'Manrope', sans-serif", background: T.navBg, backdropFilter: T.navBlur,
          borderBottom: `1px solid ${T.navBorder}`, boxShadow: T.navShadow, padding: T.navPy, transition: "all 0.35s ease",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "center" }}>

          <div style={{ marginRight: "36px", flexShrink: 0 }}>
            <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
              <img src="/logo.png" alt="SeaBite" style={{ height: "44px", width: "auto" }} />
            </Link>
          </div>

          <div className="hidden-mobile" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ position: "relative" }} onMouseEnter={() => setShowShop(true)} onMouseLeave={() => setShowShop(false)}>
              <button className="nav-ul" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", border: "none", background: "none", fontSize: "14px", fontWeight: "600", color: T.link, cursor: "pointer", fontFamily: "'Manrope', sans-serif" }}>
                Shop <FiChevronDown size={12} style={{ transform: showShop ? "rotate(180deg)" : "none", transition: "all 0.22s" }} />
              </button>
              <AnimatePresence>
                {showShop && (
                  <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }} style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, background: "#fff", border: "1.5px solid #E2EEEC", borderRadius: "14px", padding: "5px", minWidth: "170px", zIndex: 200, boxShadow: "0 12px 40px rgba(0,0,0,0.1)" }}>
                    {NAV_LINKS.map(link => (
                      <button key={link.path} className="dd-item" onClick={() => { navigate(link.path); setShowShop(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 13px", border: "none", background: "none", borderRadius: "9px", fontSize: "13.5px", fontWeight: "600", color: "#1A2E2C", cursor: "pointer" }}>{link.label}</button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link to="/about" className="nav-ul" style={{ padding: "6px 12px", textDecoration: "none", fontSize: "13.5px", fontWeight: "600", color: T.link }}>About</Link>
            <Link to="/orders" className="nav-ul" style={{ padding: "6px 12px", textDecoration: "none", fontSize: "13.5px", fontWeight: "600", color: T.link }}>Orders</Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
            
            <div style={{ position: "relative" }} className="hidden-mobile">
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
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #E2EEEC", borderRadius: "14px", overflow: "hidden", zIndex: 300, minWidth: "240px", boxShadow: "0 12px 40px rgba(0,0,0,0.1)" }}>
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

            <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate(user ? "/wishlist" : "#")} style={{ ...iconBtn, position: "relative" }} className="nav-ib">
              <FiHeart size={15} />
              {user?.wishlist?.length > 0 && <span style={{ position: "absolute", top: "-5px", right: "-5px", background: "#F07468", color: "#fff", width: "16px", height: "16px", borderRadius: "50%", fontSize: "9px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>{user.wishlist.length}</span>}
            </motion.button>

            <motion.button whileTap={{ scale: 0.88 }} onClick={() => setIsCartOpen(true)} className="nav-ib" style={{ ...iconBtn, position: "relative" }}>
              <FiShoppingBag size={15} />
              {cartCount > 0 && <span style={{ position: "absolute", top: "-5px", right: "-5px", background: "#5BBFB5", color: "#fff", width: "16px", height: "16px", borderRadius: "50%", fontSize: "9px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>{cartCount}</span>}
            </motion.button>

            <div className="hidden-mobile">
              {user ? (
                <div style={{ position: "relative", marginLeft: "4px" }} onMouseEnter={() => setShowProfile(true)} onMouseLeave={() => setShowProfile(false)}>
                  <motion.button whileHover={{ scale: 1.03 }} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 11px 5px 5px", border: `1.5px solid ${T.pillBorder}`, borderRadius: "20px", background: T.pillBg, backdropFilter: T.pillBlur, cursor: "pointer" }}>
                    <div style={{ width: "27px", height: "27px", borderRadius: "50%", background: "linear-gradient(135deg,#5BBFB5,#7EB8D4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "800", fontSize: "11px" }}>{user.name[0].toUpperCase()}</div>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: T.pillName }}>{user.name.split(" ")[0]}</span>
                    <FiChevronDown size={11} style={{ color: T.pillChevron }} />
                  </motion.button>
                  <AnimatePresence>
                    {showProfile && (
                      <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, background: "#fff", border: "1.5px solid #E2EEEC", borderRadius: "16px", overflow: "hidden", minWidth: "240px", zIndex: 200, boxShadow: "0 16px 48px rgba(0,0,0,0.1)" }}>
                        <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #F0F5F4", background: "#F4F9F8" }}>
                          <p style={{ fontSize: "10px", fontWeight: "800", color: "#5BBFB5", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 3px" }}>Signed in as</p>
                          <p style={{ fontSize: "13px", fontWeight: "700", color: "#1A2E2C", margin: 0 }}>{user.email}</p>
                        </div>
                        <div style={{ padding: "6px" }}>
                          {[{ icon: <FiUser />, label: "My Profile", path: "/profile" }, { icon: <FiHeart />, label: "Wishlist", path: "/wishlist" }, { icon: <FiPackage />, label: "My Orders", path: "/orders" }].map(item => (
                            <button key={item.path} onClick={() => { navigate(item.path); setShowProfile(false); }} className="prof-item" style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "9px 12px", border: "none", background: "none", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "#1A2E2C" }}>{item.icon} {item.label}</button>
                          ))}
                        </div>
                        <div style={{ borderTop: "1px solid #FEE2E2", padding: "6px" }}>
                          <button onClick={handleLogout} className="prof-item" style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "9px 12px", border: "none", background: "none", borderRadius: "10px", cursor: "pointer", color: "#DC2626", fontSize: "13px", fontWeight: "600" }}><FiLogOut /> Logout</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setIsLoginOpen(true)} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 18px", marginLeft: "4px", background: T.loginBg, color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", boxShadow: T.loginShadow }}>
                  <FiUser size={13} /> Login
                </motion.button>
              )}
            </div>

            <motion.button whileTap={{ scale: 0.88 }} onClick={() => setMobileOpen(true)} className="show-mobile nav-ib" style={iconBtn}><FiMenu size={22} /></motion.button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isLoginOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLoginOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(26,46,44,0.4)", backdropFilter: "blur(12px)", zIndex: 1000 }} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 220 }} style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(420px, 100vw)", background: "#fff", zIndex: 1001, boxShadow: "-10px 0 60px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ height: "180px", background: "linear-gradient(135deg, #1A2E2C 0%, #2D4F4B 100%)", padding: "40px 32px", position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                <button onClick={() => setIsLoginOpen(false)} style={{ position: "absolute", top: "24px", right: "24px", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: "36px", height: "36px", color: "#fff", cursor: "pointer" }}><FiX size={20}/></button>
                <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#fff", margin: 0 }}>{authMode === "LOGIN" ? "Welcome Back" : authMode === "SIGNUP" ? "Join SeaBite" : "Reset Password"}</h2>
              </div>
              <div className="drawer-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
                <AnimatePresence mode="wait">
                  <motion.div key={authMode} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    {authMode === "LOGIN" && (
                      <form onSubmit={handleLoginSubmit}>
                        <AuthInput label="Email Address" type="email" value={authEmail} onChange={setAuthEmail} placeholder="name@example.com" icon={FiMail} />
                        <AuthInput label="Password" type="password" value={authPassword} onChange={setAuthPassword} placeholder="••••••••" />
                        <button type="button" onClick={() => setAuthMode("FORGOT")} style={{ background: "none", border: "none", fontSize: "12px", color: "#5BBFB5", fontWeight: "700", marginBottom: "20px", cursor: "pointer" }}>Forgot Password?</button>
                        <button type="submit" disabled={authLoading} style={{ width: "100%", padding: "16px", background: "#1A2E2C", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "700", cursor: "pointer" }}>{authLoading ? "Signing in..." : "Sign In"}</button>
                        <div style={{ marginTop: "16px" }}>
                          <button type="button" onClick={() => googleLogin()} style={{ width: "100%", padding: "14px", background: "#fff", border: "1.5px solid #E2EEEC", borderRadius: "14px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "#1A2E2C" }}>
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" style={{ width: "18px" }} /> Sign in with Google
                          </button>
                        </div>
                        <div style={{ margin: "24px 0", textAlign: "center" }}><p style={{ fontSize: "14px", color: "#6B8F8A" }}>New? <button type="button" onClick={() => setAuthMode("SIGNUP")} style={{ background: "none", border: "none", fontWeight: "800", color: "#5BBFB5", cursor: "pointer" }}>Create Account</button></p></div>
                      </form>
                    )}
                    {authMode === "SIGNUP" && (
                      <form onSubmit={handleSignupOtpRequest}>
                        <AuthInput label="Full Name" value={authName} onChange={setAuthName} placeholder="John Doe" icon={FiUser} />
                        <AuthInput label="Email Address" type="email" value={authEmail} onChange={setAuthEmail} placeholder="name@example.com" icon={FiMail} />
                        <AuthInput label="Phone" value={authPhone} onChange={setAuthPhone} placeholder="+91..." />
                        <AuthInput label="Password" type="password" value={authPassword} onChange={setAuthPassword} placeholder="••••••••" />
                        <button type="submit" disabled={authLoading} style={{ width: "100%", padding: "16px", background: "#1A2E2C", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "700", cursor: "pointer" }}>{authLoading ? "Sending OTP..." : "Get Started"}</button>
                        <div style={{ marginTop: "16px" }}>
                          <button type="button" onClick={() => googleLogin()} style={{ width: "100%", padding: "14px", background: "#fff", border: "1.5px solid #E2EEEC", borderRadius: "14px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "#1A2E2C" }}>
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" style={{ width: "18px" }} /> Sign up with Google
                          </button>
                        </div>
                        <div style={{ margin: "24px 0", textAlign: "center" }}><p style={{ fontSize: "14px", color: "#6B8F8A" }}>Joined before? <button type="button" onClick={() => setAuthMode("LOGIN")} style={{ background: "none", border: "none", fontWeight: "800", color: "#5BBFB5", cursor: "pointer" }}>Log In</button></p></div>
                      </form>
                    )}
                    {authMode === "OTP_VERIFY_SIGNUP" && (
                      <form onSubmit={handleSignupVerify}>
                        <AuthInput label="Enter OTP" value={authOtp} onChange={setAuthOtp} placeholder="000000" />
                        <button type="submit" disabled={authLoading} style={{ width: "100%", padding: "16px", background: "#1A2E2C", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "700", cursor: "pointer" }}>{authLoading ? "Verifying..." : "Complete Signup"}</button>
                      </form>
                    )}
                    {authMode === "FORGOT" && (
                      <form onSubmit={handleForgotOtpRequest}>
                        <AuthInput label="Email Address" type="email" value={authEmail} onChange={setAuthEmail} placeholder="name@example.com" icon={FiMail} />
                        <button type="submit" disabled={authLoading} style={{ width: "100%", padding: "16px", background: "#1A2E2C", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "700", cursor: "pointer" }}>{authLoading ? "Sending OTP..." : "Send Reset OTP"}</button>
                        <button type="button" onClick={() => setAuthMode("LOGIN")} style={{ width: "100%", marginTop: "12px", background: "none", border: "none", color: "#5BBFB5", fontWeight: "700", cursor: "pointer" }}>Back to Login</button>
                      </form>
                    )}
                    {authMode === "RESET_PASSWORD" && (
                      <form onSubmit={handleResetPassword}>
                        <AuthInput label="OTP" value={authOtp} onChange={setAuthOtp} placeholder="000000" />
                        <AuthInput label="New Password" type="password" value={authPassword} onChange={setAuthPassword} placeholder="••••••••" />
                        <button type="submit" disabled={authLoading} style={{ width: "100%", padding: "16px", background: "#1A2E2C", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "700", cursor: "pointer" }}>{authLoading ? "Resetting..." : "Reset Password"}</button>
                      </form>
                    )}
                  </motion.div>
                </AnimatePresence>
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