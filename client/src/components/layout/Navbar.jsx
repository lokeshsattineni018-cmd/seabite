import { useState, useContext, useEffect, useRef, Suspense } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser, FiShoppingBag, FiSearch, FiLogOut, FiPackage,
  FiMenu, FiX, FiChevronDown, FiMail, FiCheckCircle
} from "react-icons/fi";
import { CartContext } from "../../context/CartContext";
import axios from "axios";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import Spin from "../../pages/general/Spin";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

const NAV_LINKS = [
  { label: "Fish", path: "/products?category=Fish" },
  { label: "Prawns", path: "/products?category=Prawn" },
  { label: "Crabs", path: "/products?category=Crab" },
  { label: "Mussels", path: "/products?category=Mussel" },
];

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
      setMobileOpen(false);
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
    navBg: isTransparent ? "transparent" : "rgba(255,255,255,0.98)",
    navBorder: isTransparent ? "transparent" : "rgba(226,238,236,0.3)",
    navShadow: isTransparent ? "none" : "0 4px 30px rgba(26,46,44,0.04)",
    link: isTransparent ? "#fff" : "#1A2E2C",
    linkActive: "#5BBFB5",
    iconColor: isTransparent ? "#fff" : "#1A2E2C",
    searchBg: isTransparent ? "rgba(255,255,255,0.12)" : "#F0F5F4",
    searchBorder: "transparent",
  };

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

  return (
    <>
      <style>{`
        .si::placeholder { color: ${isTransparent ? "rgba(255,255,255,0.6)" : "#A8C5C0"}; }
        .nav-link:hover { color: #5BBFB5 !important; }
        .prof-item:hover { background: #F4F9F8; }
        .drawer-scrollbar::-webkit-scrollbar { width: 4px; }
        .drawer-scrollbar::-webkit-scrollbar-thumb { background: #E2EEEC; border-radius: 10px; }
        .auth-input:focus { border-color: #5BBFB5 !important; background: #fff !important; box-shadow: 0 0 0 4px rgba(91,191,181,0.1); }
        .loading-spinner { width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: auth-spin 0.8s linear infinite; }
        @keyframes auth-spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile   { display: none !important; }
          .hidden-mobile { display: flex !important; }
        }
      `}</style>

      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: hidden ? -80 : 0, opacity: hidden ? 0 : 1 }}
        style={{
          position: "fixed", top: announcementActive ? 40 : 0, left: 0, right: 0, zIndex: 100,
          background: T.navBg, backdropFilter: isTransparent ? "none" : "blur(25px)",
          borderBottom: `1px solid ${T.navBorder}`, boxShadow: T.navShadow,
          padding: isTransparent ? "20px 0" : "12px 0",
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "0 40px", display: "flex", alignItems: "center" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
            <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
              <img src="/logo.png" alt="SeaBite" style={{ height: "30px", width: "auto", filter: isTransparent ? "brightness(0) invert(1)" : "none" }} />
              <span style={{ fontSize: "24px", fontWeight: "900", color: T.link, letterSpacing: "-1px", fontFamily: "'Bricolage Grotesque', sans-serif" }}>SeaBite</span>
            </Link>

            <div className="hidden-mobile" style={{ display: "flex", alignItems: "center", gap: "32px" }}>
               <div style={{ position: "relative" }} onMouseEnter={() => setShowShop(true)} onMouseLeave={() => setShowShop(false)}>
                 <button style={{ background: "none", border: "none", color: T.link, fontSize: "15px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                   Shop <FiChevronDown size={14} />
                 </button>
                 <AnimatePresence>
                   {showShop && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        style={{ position: "absolute", top: "100%", left: 0, paddingTop: "15px", width: "200px", zIndex: 101 }}>
                        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #E2EEEC", boxShadow: "0 20px 50px rgba(0,0,0,0.12)", overflow: "hidden", padding: "8px" }}>
                          {NAV_LINKS.map(l => (
                            <Link key={l.path} to={l.path} onClick={() => setShowShop(false)} style={{ display: "block", padding: "12px 16px", textDecoration: "none", color: "#1A2E2C", fontSize: "14px", fontWeight: "600", borderRadius: "10px" }} className="prof-item">{l.label}</Link>
                          ))}
                        </div>
                      </motion.div>
                   )}
                 </AnimatePresence>
               </div>
               <Link to="/about" className="nav-link" style={{ textDecoration: "none", color: T.link, fontSize: "15px", fontWeight: "600" }}>About</Link>
               <Link to="/orders" className="nav-link" style={{ textDecoration: "none", color: T.link, fontSize: "15px", fontWeight: "600" }}>Account</Link>
            </div>
          </div>

          {/* Search Bar - Precisely Centered */}
          <div className="hidden-mobile" style={{ flex: 1, display: "flex", justifyContent: "center", padding: "0 60px" }}>
            <div style={{ position: "relative", width: "100%", maxWidth: "580px" }}>
               <div style={{ 
                 display: "flex", alignItems: "center", gap: "12px", 
                 background: T.searchBg, border: `1px solid ${T.searchBorder}`, 
                 borderRadius: "100px", padding: "10px 20px", transition: "all 0.3s ease" 
               }}>
                 <FiSearch size={18} style={{ color: isTransparent ? "rgba(255,255,255,0.7)" : "#6B8F8A" }} />
                 <input
                   ref={searchRef} className="si" value={searchTerm}
                   onChange={e => handleSearchInput(e.target.value)} onKeyDown={handleSearchSubmit}
                   onFocus={() => setSearchExpanded(true)}
                   onBlur={() => setTimeout(() => { setSearchExpanded(false); setSuggestions([]); }, 200)}
                   placeholder="Search for fresh seafood..."
                   style={{ border: "none", background: "none", fontSize: "15px", color: isTransparent ? "#fff" : "#1A2E2C", width: "100%", outline: "none", fontWeight: "500" }}
                 />
               </div>
               <AnimatePresence>
                 {searchExpanded && suggestions.length > 0 && (
                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                     style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "12px", background: "#fff", borderRadius: "20px", boxShadow: "0 25px 60px rgba(0,0,0,0.15)", overflow: "hidden", zIndex: 101, border: "1px solid #E2EEEC" }}>
                      <div style={{ maxHeight: "400px", overflowY: "auto", padding: "8px" }}>
                        {suggestions.map(item => (
                          <div key={item._id} className="prof-item" onClick={() => handleSuggestionClick(item)} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", cursor: "pointer", borderRadius: "12px" }}>
                            <img src={item.image} alt={item.name} style={{ width: "44px", height: "44px", borderRadius: "10px", objectFit: "cover" }} />
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: "14px", fontWeight: "700", color: "#1A2E2C", margin: 0 }}>{item.name}</p>
                              <p style={{ fontSize: "12px", color: "#6B8F8A", margin: 0 }}>{item.category}</p>
                            </div>
                            <span style={{ fontWeight: "800", color: "#5BBFB5", fontSize: "14px" }}>₹{item.basePrice}</span>
                          </div>
                        ))}
                      </div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsCartOpen(true)} style={{ background: "none", border: "none", color: T.iconColor, cursor: "pointer", padding: "8px", position: "relative" }}>
              <FiShoppingBag size={24} />
              {cartCount > 0 && <span style={{ position: "absolute", top: "0", right: "0", background: "#5BBFB5", color: "#fff", fontSize: "10px", fontWeight: "900", width: "20px", height: "20px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2.5px solid #fff" }}>{cartCount}</span>}
            </motion.button>

            {user ? (
              <div style={{ position: "relative" }} onMouseEnter={() => setShowProfile(true)} onMouseLeave={() => setShowProfile(false)}>
                <motion.button style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 16px", borderRadius: "100px", background: isTransparent ? "rgba(255,255,255,0.12)" : "#F0F5F4", border: "none", cursor: "pointer" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#5BBFB5", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "900" }}>{user.name[0]}</div>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: T.link }} className="hidden-mobile">{user.name.split(" ")[0]}</span>
                </motion.button>
                <AnimatePresence>
                  {showProfile && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      style={{ position: "absolute", top: "100%", right: 0, marginTop: "12px", width: "240px", background: "#fff", borderRadius: "20px", boxShadow: "0 25px 60px rgba(0,0,0,0.15)", padding: "8px", border: "1px solid #E2EEEC" }}>
                      <button onClick={() => navigate("/profile")} className="prof-item" style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "14px", border: "none", background: "none", borderRadius: "12px", cursor: "pointer", fontSize: "14px", fontWeight: "700", color: "#1A2E2C" }}><FiUser size={18}/> Profile</button>
                      <button onClick={() => navigate("/orders")} className="prof-item" style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "14px", border: "none", background: "none", borderRadius: "12px", cursor: "pointer", fontSize: "14px", fontWeight: "700", color: "#1A2E2C" }}><FiPackage size={18}/> Orders</button>
                      <hr style={{ margin: "8px 0", border: "none", borderTop: "1px solid #F0F5F4" }} />
                      <button onClick={handleLogout} className="prof-item" style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "14px", border: "none", background: "none", borderRadius: "12px", cursor: "pointer", fontSize: "14px", fontWeight: "700", color: "#F07468" }}><FiLogOut size={18}/> Logout</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setIsLoginOpen(true)}
                style={{ background: "#1A2E2C", color: "#fff", border: "none", borderRadius: "100px", padding: "12px 32px", fontSize: "15px", fontWeight: "700", cursor: "pointer", boxShadow: "0 10px 25px rgba(26,46,44,0.15)" }}>
                Login
              </motion.button>
            )}

            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMobileOpen(true)} className="show-mobile" style={{ background: "none", border: "none", color: T.iconColor, cursor: "pointer", padding: "8px" }}>
              <FiMenu size={28} />
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* High-Fidelity Auth Drawer */}
      <AnimatePresence>
        {isLoginOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLoginOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(26,46,44,0.4)", backdropFilter: "blur(12px)", zIndex: 1000 }} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 220 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(420px, 100vw)", background: "#fff", zIndex: 1001, boxShadow: "-10px 0 60px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              
              {/* Header Gradient */}
              <div style={{ height: "180px", background: "linear-gradient(135deg, #1A2E2C 0%, #2D4F4B 100%)", padding: "40px 32px", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "140px", height: "140px", borderRadius: "50%", background: "rgba(91,191,181,0.15)", filter: "blur(40px)" }} />
                <div style={{ position: "absolute", bottom: "-30px", left: "-10px", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(232,129,106,0.1)", filter: "blur(30px)" }} />
                
                <div style={{ position: "absolute", top: "24px", right: "24px", zIndex: 2 }}>
                  <button onClick={() => setIsLoginOpen(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", backdropFilter: "blur(4px)" }}><FiX size={20}/></button>
                </div>

                <motion.div key={authMode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#fff", margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                    {authMode === "LOGIN" && "Welcome Back"}
                    {authMode === "SIGNUP" && "Join SeaBite"}
                    {authMode === "FORGOT" && "Reset Password"}
                    {authMode === "OTP_VERIFY_SIGNUP" && "Verify Email"}
                    {authMode === "RESET_PASSWORD" && "Set New Password"}
                  </h2>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginTop: "4px", fontWeight: "500" }}>
                    {authMode === "LOGIN" && "Sign in to explore ocean-fresh seafood."}
                    {authMode === "SIGNUP" && "Create an account for fresh coastal delivery."}
                    {authMode === "FORGOT" && "Enter your email to receive a secure OTP."}
                    {authMode === "OTP_VERIFY_SIGNUP" && "We've sent an OTP to your email."}
                    {authMode === "RESET_PASSWORD" && "Enter the OTP sent to your email."}
                  </p>
                </motion.div>
              </div>

              <div className="drawer-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
                <AnimatePresence mode="wait">
                  <motion.div key={authMode} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                    
                    {authMode === "LOGIN" && (
                      <form onSubmit={handleLoginSubmit}>
                        <AuthInput label="Email Address" type="email" value={authEmail} onChange={setAuthEmail} placeholder="name@example.com" icon={FiMail} />
                        <div style={{ marginBottom: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                            <label style={{ fontSize: "11px", fontWeight: "800", color: "#8BA5B3", textTransform: "uppercase", letterSpacing: "1px" }}>Password</label>
                            <button type="button" onClick={() => setAuthMode("FORGOT")} style={{ background: "none", border: "none", fontSize: "11px", fontWeight: "800", color: "#5BBFB5", cursor: "pointer", padding: 0 }}>Forgot Password?</button>
                          </div>
                          <input type="password" required value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="••••••••" className="auth-input"
                            style={{ width: "100%", padding: "14px 16px", borderRadius: "14px", border: "1.5px solid #E2EEEC", background: "#F4F9F8", outline: "none", fontSize: "14px" }} />
                        </div>
                        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} disabled={authLoading} type="submit"
                          style={{ width: "100%", padding: "16px", background: "#1A2E2C", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "700", fontSize: "15px", cursor: "pointer", marginTop: "24px", boxShadow: "0 10px 25px rgba(26,46,44,0.15)" }}>
                          {authLoading ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}><div className="loading-spinner" /> Signing in...</div> : "Sign In to SeaBite"}
                        </motion.button>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "32px 0" }}>
                          <div style={{ flex: 1, height: "1px", background: "#F0F5F4" }} />
                          <span style={{ fontSize: "11px", color: "#B8CFCC", fontWeight: "800" }}>SECURE CONNECT</span>
                          <div style={{ flex: 1, height: "1px", background: "#F0F5F4" }} />
                        </div>

                        <motion.button type="button" onClick={() => googleLogin()} whileHover={{ y: -2, background: "#F4F9F8" }} whileTap={{ scale: 0.98 }}
                          style={{ width: "100%", padding: "14px", border: "1.5px solid #E2EEEC", borderRadius: "14px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>
                          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" style={{ width: "18px" }} alt="Google" />
                          Continue with Google
                        </motion.button>

                        <div style={{ marginTop: "40px", textAlign: "center" }}>
                          <p style={{ fontSize: "14px", color: "#6B8F8A" }}>New to SeaBite? <button type="button" onClick={() => setAuthMode("SIGNUP")} style={{ background: "none", border: "none", fontWeight: "800", color: "#5BBFB5", cursor: "pointer", padding: 0 }}>Create Account</button></p>
                        </div>
                      </form>
                    )}

                    {authMode === "SIGNUP" && (
                      <form onSubmit={handleSignupOtpRequest}>
                        <AuthInput label="Full Name" value={authName} onChange={setAuthName} placeholder="John Doe" icon={FiUser} />
                        <AuthInput label="Email Address" type="email" value={authEmail} onChange={setAuthEmail} placeholder="name@example.com" icon={FiMail} />
                        <AuthInput label="Phone Number" value={authPhone} onChange={setAuthPhone} placeholder="+91 00000 00000" />
                        <AuthInput label="Set Password" type="password" value={authPassword} onChange={setAuthPassword} placeholder="••••••••" />
                        <AuthInput label="Referral Code (Optional)" value={authReferral} onChange={setAuthReferral} placeholder="SB-XXXX" required={false} />
                        
                        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} disabled={authLoading} type="submit"
                          style={{ width: "100%", padding: "16px", background: "#1A2E2C", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "700", fontSize: "15px", cursor: "pointer", marginTop: "12px" }}>
                          {authLoading ? "Sending OTP..." : "Get Started"}
                        </motion.button>

                        <div style={{ marginTop: "32px", textAlign: "center" }}>
                          <p style={{ fontSize: "14px", color: "#6B8F8A" }}>Already have an account? <button type="button" onClick={() => setAuthMode("LOGIN")} style={{ background: "none", border: "none", fontWeight: "800", color: "#5BBFB5", cursor: "pointer", padding: 0 }}>Log In</button></p>
                        </div>
                      </form>
                    )}

                    {authMode === "FORGOT" && (
                      <form onSubmit={handleForgotOtpRequest}>
                        <AuthInput label="Email Address" type="email" value={authEmail} onChange={setAuthEmail} placeholder="name@example.com" icon={FiMail} />
                        <p style={{ fontSize: "12px", color: "#6B8F8A", marginBottom: "24px", lineHeight: "1.6" }}>If you're registered, we'll send a 6-digit secure code to reset your password.</p>
                        
                        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} disabled={authLoading} type="submit"
                          style={{ width: "100%", padding: "16px", background: "#1A2E2C", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "700", fontSize: "15px", cursor: "pointer" }}>
                          {authLoading ? "Checking email..." : "Send Verification OTP"}
                        </motion.button>

                        <div style={{ marginTop: "32px", textAlign: "center" }}>
                          <button type="button" onClick={() => setAuthMode("LOGIN")} style={{ background: "none", border: "none", fontWeight: "800", color: "#5BBFB5", cursor: "pointer", padding: 0 }}>Back to Login</button>
                        </div>
                      </form>
                    )}

                    {authMode === "OTP_VERIFY_SIGNUP" && (
                      <form onSubmit={handleSignupVerify}>
                        <div style={{ textAlign: "center", marginBottom: "32px" }}>
                           <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "#EAF6F5", color: "#5BBFB5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                             <FiCheckCircle size={32} />
                           </div>
                           <p style={{ fontSize: "14px", color: "#6B8F8A" }}>A 6-digit code has been sent to<br/><strong style={{ color: "#1A2E2C" }}>{authEmail}</strong></p>
                        </div>
                        <AuthInput label="Enter 6-Digit OTP" value={authOtp} onChange={setAuthOtp} placeholder="000000" />
                        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} disabled={authLoading} type="submit"
                          style={{ width: "100%", padding: "16px", background: "#1A2E2C", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "700", fontSize: "15px", cursor: "pointer" }}>
                          {authLoading ? "Verifying..." : "Verify & Complete Signup"}
                        </motion.button>
                        <div style={{ marginTop: "24px", textAlign: "center" }}>
                          <button type="button" onClick={() => setAuthMode("SIGNUP")} style={{ background: "none", border: "none", fontWeight: "600", color: "#8BA5B3", fontSize: "13px", cursor: "pointer" }}>Change Email</button>
                        </div>
                      </form>
                    )}

                    {authMode === "RESET_PASSWORD" && (
                      <form onSubmit={handleResetPassword}>
                        <AuthInput label="Enter 6-Digit OTP" value={authOtp} onChange={setAuthOtp} placeholder="000000" />
                        <AuthInput label="New Password" type="password" value={authPassword} onChange={setAuthPassword} placeholder="••••••••" />
                        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} disabled={authLoading} type="submit"
                          style={{ width: "100%", padding: "16px", background: "#1A2E2C", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "700", fontSize: "15px", cursor: "pointer" }}>
                          {authLoading ? "Resetting..." : "Reset Password"}
                        </motion.button>
                      </form>
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>

              <div style={{ padding: "24px 32px", borderTop: "1px solid #F0F5F4", background: "#F8FAFB", textAlign: "center" }}>
                <p style={{ fontSize: "12px", color: "#8BA5B3", margin: 0, fontWeight: "500" }}>Protected by SeaBite Secure Vault.</p>
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