import { useState, useContext, useEffect, useRef, Suspense } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser, FiShoppingBag, FiSearch, FiLogOut, FiPackage,
  FiGrid, FiBell, FiMenu, FiX, FiChevronDown, FiHeart,
  FiGlobe, FiMail, FiShoppingCart, FiChevronRight, FiCheckCircle
} from "react-icons/fi";
import { CartContext } from "../../context/CartContext";
import axios from "axios";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import Spin from "../../pages/general/Spin";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

const NAV_LINKS = [
  { label: "Shop All", path: "/products" },
  { label: "Fish", path: "/products?category=Fish" },
  { label: "Prawns", path: "/products?category=Prawn" },
  { label: "Crabs", path: "/products?category=Crab" },
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [trendingSearched, setTrendingSearched] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  
  const lastScrollY = useRef(0);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

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
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email: loginEmail, password: loginPassword }, { withCredentials: true });
      if (res.data.sessionId) localStorage.setItem("seabite_session_id", res.data.sessionId);
      setUser(res.data.user);
      toast.success("Welcome back!");
      setIsLoginOpen(false);
      await refreshMe?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoginLoading(false);
    }
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
      } catch {
        toast.error("Google login failed");
      }
    }
  });

  const isActive = (p) => location.pathname + location.search === p;

  const T = {
    navBg: isTransparent ? "transparent" : "rgba(255,255,255,0.98)",
    navBorder: isTransparent ? "transparent" : "rgba(226,238,236,0.8)",
    navShadow: isTransparent ? "none" : "0 4px 20px rgba(26,46,44,0.06)",
    link: isTransparent ? "#fff" : "#1A2E2C",
    linkActive: "#5BBFB5",
    iconColor: isTransparent ? "#fff" : "#1A2E2C",
    searchBg: isTransparent ? "rgba(255,255,255,0.15)" : "#F4F9F8",
    searchBorder: isTransparent ? "rgba(255,255,255,0.2)" : "#E2EEEC",
  };

  return (
    <>
      <style>{`
        .si:focus { outline: none; }
        .nav-link:hover { color: #5BBFB5 !important; }
        .nav-link::after { content: ''; display: block; width: 0; height: 2px; background: #5BBFB5; transition: width .3s; }
        .nav-link-active::after { width: 100%; }
        .prof-item:hover { background: #F4F9F8; }
        .drawer-scrollbar::-webkit-scrollbar { width: 4px; }
        .drawer-scrollbar::-webkit-scrollbar-thumb { background: #E2EEEC; border-radius: 10px; }
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
          transition: "all 0.3s ease"
        }}
      >
        <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center" }}>
          
          <Link to="/" style={{ textDecoration: "none", marginRight: "40px" }}>
            <img src="/logo.png" alt="SeaBite" style={{ height: "40px", width: "auto", filter: isTransparent ? "brightness(0) invert(1)" : "none" }} />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden-mobile" style={{ display: "flex", alignItems: "center", gap: "24px" }}>
             <div style={{ position: "relative" }} onMouseEnter={() => setShowShop(true)} onMouseLeave={() => setShowShop(false)}>
               <button style={{ background: "none", border: "none", color: T.link, fontSize: "14px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                 Shop <FiChevronDown size={14} />
               </button>
               <AnimatePresence>
                 {showShop && (
                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                     style={{ position: "absolute", top: "100%", left: 0, paddingTop: "10px", width: "180px", zIndex: 101 }}>
                     <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #E2EEEC", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", overflow: "hidden" }}>
                       {NAV_LINKS.map(l => (
                         <Link key={l.path} to={l.path} onClick={() => setShowShop(false)} style={{ display: "block", padding: "12px 16px", textDecoration: "none", color: "#1A2E2C", fontSize: "13px", fontWeight: "600" }} className="prof-item">{l.label}</Link>
                       ))}
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
             <Link to="/about" className={`nav-link ${isActive("/about") ? "nav-link-active" : ""}`} style={{ textDecoration: "none", color: isActive("/about") ? T.linkActive : T.link, fontSize: "14px", fontWeight: "700" }}>About</Link>
             <Link to="/orders" className={`nav-link ${isActive("/orders") ? "nav-link-active" : ""}`} style={{ textDecoration: "none", color: isActive("/orders") ? T.linkActive : T.link, fontSize: "14px", fontWeight: "700" }}>Account</Link>
          </div>

          {/* Search Bar */}
          <div className="hidden-mobile" style={{ flex: 1, display: "flex", justifyContent: "center", padding: "0 40px" }}>
            <div style={{ position: "relative", width: "100%", maxWidth: "420px" }}>
               <div style={{ 
                 display: "flex", alignItems: "center", gap: "10px", 
                 background: T.searchBg, border: `1.5px solid ${searchExpanded ? "#5BBFB5" : T.searchBorder}`, 
                 borderRadius: "12px", padding: "8px 16px", transition: "all 0.2s" 
               }}>
                 <FiSearch size={16} style={{ color: searchExpanded ? "#5BBFB5" : (isTransparent ? "rgba(255,255,255,0.7)" : "#6B8F8A") }} />
                 <input
                   ref={searchRef} className="si" value={searchTerm}
                   onChange={e => handleSearchInput(e.target.value)} onKeyDown={handleSearchSubmit}
                   onFocus={() => setSearchExpanded(true)}
                   onBlur={() => setTimeout(() => { setSearchExpanded(false); setSuggestions([]); }, 200)}
                   placeholder="Search for fresh seafood..."
                   style={{ border: "none", background: "none", fontSize: "14px", color: isTransparent ? "#fff" : "#1A2E2C", width: "100%", outline: "none", fontWeight: "500" }}
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

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "auto" }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsCartOpen(true)} style={{ background: "none", border: "none", color: T.iconColor, cursor: "pointer", padding: "8px", position: "relative" }}>
              <FiShoppingBag size={22} />
              {cartCount > 0 && <span style={{ position: "absolute", top: "0", right: "0", background: "#5BBFB5", color: "#fff", fontSize: "10px", fontWeight: "800", width: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>{cartCount}</span>}
            </motion.button>

            {user ? (
              <div style={{ position: "relative" }} onMouseEnter={() => setShowProfile(true)} onMouseLeave={() => setShowProfile(false)}>
                <motion.button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", borderRadius: "20px", background: isTransparent ? "rgba(255,255,255,0.1)" : "#F4F9F8", border: `1px solid ${T.searchBorder}`, cursor: "pointer" }}>
                  <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#5BBFB5", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "800" }}>{user.name[0]}</div>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: T.link }} className="hidden-mobile">{user.name.split(" ")[0]}</span>
                </motion.button>
                <AnimatePresence>
                  {showProfile && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      style={{ position: "absolute", top: "100%", right: 0, marginTop: "10px", width: "220px", background: "#fff", borderRadius: "16px", boxShadow: "0 10px 40px rgba(0,0,0,0.15)", padding: "8px", border: "1px solid #E2EEEC" }}>
                      <button onClick={() => navigate("/profile")} className="prof-item" style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "12px", border: "none", background: "none", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: "#1A2E2C" }}><FiUser size={16}/> Profile</button>
                      <button onClick={() => navigate("/orders")} className="prof-item" style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "12px", border: "none", background: "none", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: "#1A2E2C" }}><FiPackage size={16}/> Orders</button>
                      <hr style={{ margin: "6px 0", border: "none", borderTop: "1px solid #F0F5F4" }} />
                      <button onClick={handleLogout} className="prof-item" style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "12px", border: "none", background: "none", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "600", color: "#F07468" }}><FiLogOut size={16}/> Logout</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsLoginOpen(true)}
                style={{ background: "#1A2E2C", color: "#fff", border: "none", borderRadius: "12px", padding: "10px 24px", fontSize: "14px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 12px rgba(26,46,44,0.15)" }}>
                Login
              </motion.button>
            )}

            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMobileOpen(true)} className="show-mobile" style={{ background: "none", border: "none", color: T.iconColor, cursor: "pointer", padding: "8px" }}>
              <FiMenu size={24} />
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Login Drawer */}
      <AnimatePresence>
        {isLoginOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLoginOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(26,46,44,0.4)", backdropFilter: "blur(8px)", zIndex: 1000 }} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(400px, 100vw)", background: "#fff", zIndex: 1001, boxShadow: "-10px 0 50px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F0F5F4" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#1A2E2C" }}>Welcome Back</h2>
                <button onClick={() => setIsLoginOpen(false)} style={{ background: "#F4F9F8", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B8F8A" }}><FiX size={20}/></button>
              </div>
              
              <div className="drawer-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "32px 24px" }}>
                <img src="/logo.png" alt="SeaBite" style={{ height: "48px", marginBottom: "32px", objectFit: "contain" }} />
                <p style={{ color: "#6B8F8A", fontSize: "14px", marginBottom: "32px", lineHeight: "1.6" }}>Sign in to access your orders, wishlist, and fresh coastal catch delivered to your doorstep.</p>

                <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "#A8C5C0", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Email Address</label>
                    <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="name@example.com"
                      style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1.5px solid #E2EEEC", background: "#F4F9F8", outline: "none", fontSize: "14px" }} />
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <label style={{ fontSize: "11px", fontWeight: "800", color: "#A8C5C0", textTransform: "uppercase", letterSpacing: "1px" }}>Password</label>
                      <Link to="/forgot-password" onClick={() => setIsLoginOpen(false)} style={{ fontSize: "11px", fontWeight: "800", color: "#5BBFB5", textDecoration: "none" }}>Forgot Password?</Link>
                    </div>
                    <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••"
                      style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1.5px solid #E2EEEC", background: "#F4F9F8", outline: "none", fontSize: "14px" }} />
                  </div>
                  <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} disabled={loginLoading} type="submit"
                    style={{ width: "100%", padding: "16px", background: "#1A2E2C", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "700", fontSize: "15px", cursor: "pointer", marginTop: "8px" }}>
                    {loginLoading ? "Authenticating..." : "Sign In to SeaBite"}
                  </motion.button>
                </form>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0" }}>
                  <div style={{ flex: 1, height: "1px", background: "#F0F5F4" }} />
                  <span style={{ fontSize: "11px", color: "#B8CFCC", fontWeight: "800" }}>OR CONTINUE WITH</span>
                  <div style={{ flex: 1, height: "1px", background: "#F0F5F4" }} />
                </div>

                <motion.button onClick={() => googleLogin()} whileHover={{ y: -2, background: "#F4F9F8" }} whileTap={{ scale: 0.98 }}
                  style={{ width: "100%", padding: "14px", border: "1.5px solid #E2EEEC", borderRadius: "14px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>
                  <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" style={{ width: "18px" }} alt="Google" />
                  Google Account
                </motion.button>

                <div style={{ marginTop: "40px", padding: "24px", background: "#F4F9F8", borderRadius: "16px", textAlign: "center" }}>
                  <p style={{ fontSize: "14px", color: "#6B8F8A", marginBottom: "12px" }}>Don't have an account yet?</p>
                  <Link to="/signup" onClick={() => setIsLoginOpen(false)}
                    style={{ display: "block", width: "100%", padding: "12px", background: "#fff", color: "#5BBFB5", border: "1.5px solid #5BBFB5", borderRadius: "12px", fontWeight: "700", textDecoration: "none" }}>
                    Create Account
                  </Link>
                </div>
              </div>

              <div style={{ padding: "20px 24px", borderTop: "1px solid #F0F5F4", background: "#F4F9F8", textAlign: "center" }}>
                <p style={{ fontSize: "11px", color: "#A8C5C0", lineHeight: "1.6" }}>Secure login powered by SeaBite. Your data is encrypted and protected.</p>
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