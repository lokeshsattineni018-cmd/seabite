// src/components/Navbar.jsx
import { useState, useContext, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import {
  FiUser,
  FiShoppingBag,
  FiSearch,
  FiLogOut,
  FiPackage,
  FiGrid,
  FiBell,
  FiMenu,
  FiX,
  FiSun,
  FiMoon,
  FiChevronDown,
} from "react-icons/fi";
import { CartContext } from "../context/CartContext";
import { ThemeContext } from "../context/ThemeContext";
import axios from "axios";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import Spin from "../pages/Spin";

const API_URL = import.meta.env.VITE_API_URL || "";

// --- Magnetic wrapper for icon buttons ---
function MagneticButton({ children, className = "", ...props }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  const handleMouse = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// --- Animated underline link ---
function NavLink({ children, ...props }) {
  return (
    <motion.span className="relative cursor-pointer group" {...props}>
      {children}
      <motion.span
        className="absolute -bottom-1 left-0 h-[2px] bg-blue-500 origin-left"
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: "100%" }}
      />
    </motion.span>
  );
}

export default function Navbar({ openCart }) {
  const { cartCount } = useContext(CartContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { user, setUser, refreshMe } = useAuth();

  const [showProfile, setShowProfile] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const lastScrollY = useRef(0);

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setUnreadCount(0);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/notifications`, {
        withCredentials: true,
      });
      setUnreadCount(res.data.filter((n) => !n.read).length);
    } catch (err) {
     // console.error("Notification fetch failed");
    }
  };

  // Scroll: blur in + auto-hide on scroll down, show on scroll up
  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 20);
      if (currentY > lastScrollY.current && currentY > 100) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ✅ CHECK IF USER CAN SPIN - Only show popup if eligible
 // ✅ CHECK IF USER CAN SPIN - Only show popup if eligible
useEffect(() => {
  const checkCanSpin = async () => {
    if (!user) return;

    try {
      const res = await axios.get(`${API_URL}/api/spin/can-spin`, {
        withCredentials: true,
      });

      if (res.data.canSpin) {
        const timer = setTimeout(() => setShowSpinWheel(true), 2000);
        return () => clearTimeout(timer);
      }
    } catch (err) {
      // Silent fail
    }
  };

  checkCanSpin();
}, [user]);


  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_URL}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
      setUser(null);
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm("");
      if (mobileMenuOpen) setMobileMenuOpen(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await axios.post(
          `${API_URL}/api/auth/google`,
          { token: tokenResponse.access_token },
          { withCredentials: true }
        );
        setUser(res.data.user);
        if (res.data.user.role === "admin") navigate("/admin/dashboard");
        refreshMe();
        fetchNotifications();
      } catch (err) {
        console.error("Google Login Failed", err);
      }
    },
  });

  const handleSpinClose = () => {
    setShowSpinWheel(false);
  };

  // Staggered children for mobile menu
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.15 },
    },
    exit: { opacity: 0, transition: { staggerChildren: 0.03, staggerDirection: -1 } },
  };

  const staggerItem = {
    hidden: { opacity: 0, x: 40 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
    exit: { opacity: 0, x: 40 },
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: hidden ? -100 : 0, opacity: hidden ? 0 : 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 w-full z-50 transition-all duration-500 ease-in-out border-b ${
          scrolled
            ? "bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl border-slate-200/50 dark:border-white/5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
            : "bg-transparent border-transparent py-4 md:py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-12 flex items-center justify-between">
          {/* Logo with magnetic effect */}
          <Link to="/">
            <MagneticButton>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95, rotate: -2 }}
                className="flex items-center gap-3"
              >
                <img
                  src="/logo.png"
                  alt="SeaBite Logo"
                  className={`h-12 md:h-16 w-auto object-contain transition-all duration-300 drop-shadow-lg ${
                    isDarkMode ? "filter brightness-0 invert" : ""
                  }`}
                />
              </motion.div>
            </MagneticButton>
          </Link>

          {/* Desktop Search Bar with animated expand on focus */}
          <div className="hidden lg:flex flex-1 justify-center px-12">
            <motion.div
              animate={{
                width: searchFocused ? "100%" : "85%",
                boxShadow: searchFocused
                  ? "0 8px 30px rgba(59,130,246,0.15)"
                  : "0 0 0 rgba(0,0,0,0)",
              }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={`flex items-center rounded-full px-5 py-2.5 max-w-md border transition-all duration-300 group ${
                scrolled
                  ? "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-white/10"
                  : "bg-white/20 dark:bg-white/10 backdrop-blur-md border-slate-300 dark:border-white/20"
              }`}
            >
              <motion.div animate={{ rotate: searchFocused ? 90 : 0 }} transition={{ duration: 0.3 }}>
                <FiSearch className="text-blue-500 dark:text-blue-200 mr-3 text-lg" />
              </motion.div>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearch}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search for fresh catch..."
                className="bg-transparent outline-none w-full text-sm text-slate-900 dark:text-blue-100 placeholder:text-slate-400 dark:placeholder:text-blue-200/50 font-medium"
              />
            </motion.div>
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            {/* Shop dropdown with stagger reveal */}
            <div
              className="hidden md:block relative"
              onMouseEnter={() => setShowShop(true)}
              onMouseLeave={() => setShowShop(false)}
            >
              <NavLink>
                <button className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-blue-100 hover:text-blue-600 dark:hover:text-white transition-colors py-2">
                  Shop{" "}
                  <motion.span
                    animate={{ rotate: showShop ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <FiChevronDown />
                  </motion.span>
                </button>
              </NavLink>
              <AnimatePresence>
                {showShop && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(8px)" }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden py-2"
                  >
                    <DropdownItem text="Shop All" onClick={() => navigate("/products")} />
                    <div className="h-px bg-slate-100 dark:bg-white/5 my-1 mx-4" />
                    <DropdownItem text="Premium Fish" onClick={() => navigate("/products?category=Fish")} />
                    <DropdownItem text="Jumbo Prawns" onClick={() => navigate("/products?category=Prawn")} />
                    <DropdownItem text="Live Crabs" onClick={() => navigate("/products?category=Crab")} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme toggle with rotation */}
            <MagneticButton>
              <motion.button
                onClick={toggleTheme}
                whileTap={{ scale: 0.85, rotate: 180 }}
                className="p-2 md:p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-blue-300 hover:scale-110 transition-all shadow-sm"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isDarkMode ? "sun" : "moon"}
                    initial={{ rotate: -90, opacity: 0, scale: 0 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isDarkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            </MagneticButton>

            {/* Cart button with bounce on count change */}
            <MagneticButton>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.85 }}
                className="relative cursor-pointer text-slate-700 dark:text-blue-100 hover:text-blue-600 dark:hover:text-white transition-colors p-2"
                onClick={openCart}
              >
                <FiShoppingBag size={22} strokeWidth={1.5} />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      className="absolute top-0 right-0 md:-top-1 md:-right-1 bg-blue-600 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-lg border-2 border-white dark:border-slate-900"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </MagneticButton>

            {/* Profile / Login */}
            <div className="hidden md:flex items-center">
              {user ? (
                <div
                  className="relative"
                  onMouseEnter={() => setShowProfile(true)}
                  onMouseLeave={() => setShowProfile(false)}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-3 cursor-pointer group ml-4"
                  >
                    <div className="relative">
                      <motion.div
                        whileHover={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.5 }}
                        className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-transparent hover:ring-blue-400/50 transition-all"
                      >
                        {user.name?.charAt(0).toUpperCase()}
                      </motion.div>
                      {unreadCount > 0 && (
                        <motion.span
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-blue-100 group-hover:text-blue-600 dark:group-hover:text-white transition-colors">
                      {user.name?.split(" ")[0]}
                    </span>
                  </motion.div>
                  <AnimatePresence>
                    {showProfile && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(8px)" }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(8px)" }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
                      >
                        <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
                          <p className="text-[10px] font-black text-blue-600 dark:text-blue-300 uppercase tracking-widest mb-1">
                            Authenticated
                          </p>
                          <p className="font-bold text-slate-900 dark:text-white truncate text-sm">
                            {user.email}
                          </p>
                        </div>
                        <div className="py-2">
                          <DropdownItem icon={<FiUser />} text="My Profile" onClick={() => navigate("/profile")} />
                          <DropdownItem icon={<FiPackage />} text="My Orders" onClick={() => navigate("/orders")} />
                          <DropdownItem
                            icon={<FiBell />}
                            text="Notifications"
                            onClick={() => navigate("/notifications")}
                            badge={unreadCount || 0}
                          />
                          {user.role === "admin" && (
                            <DropdownItem icon={<FiGrid />} text="Admin Dashboard" onClick={() => navigate("/admin/dashboard")} />
                          )}
                        </div>
                        <div className="bg-red-50 dark:bg-red-500/10 py-2 border-t border-red-100 dark:border-red-500/20">
                          <DropdownItem icon={<FiLogOut />} text="Logout" onClick={handleLogout} isDanger />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <MagneticButton>
                  <motion.button
                    onClick={() => googleLogin()}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(59,130,246,0.3)" }}
                    whileTap={{ scale: 0.92 }}
                    className="flex items-center gap-3 font-medium text-slate-700 dark:text-blue-100 hover:text-blue-600 dark:hover:text-white transition-colors px-5 py-2 rounded-full border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 ml-4"
                  >
                    <FiUser size={18} /> <span className="text-sm">Login</span>
                  </motion.button>
                </MagneticButton>
              )}
            </div>

            {/* Mobile Hamburger with morph */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              className="md:hidden text-slate-900 dark:text-white text-2xl p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={mobileMenuOpen ? "close" : "open"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {mobileMenuOpen ? <FiX /> : <FiMenu />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu -- full screen with staggered items */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "100%", borderRadius: "50% 0 0 50%" }}
              animate={{ x: 0, borderRadius: "0% 0 0 0%" }}
              exit={{ x: "100%", borderRadius: "50% 0 0 50%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed inset-0 z-[60] bg-white dark:bg-slate-900/98 backdrop-blur-xl md:hidden flex flex-col pt-24 px-8 overflow-y-auto"
            >
              <motion.button
                whileTap={{ scale: 0.8, rotate: 90 }}
                className="absolute top-6 right-6 text-slate-900 dark:text-white text-3xl"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FiX />
              </motion.button>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                exit="exit"
                className="space-y-6 pb-12"
              >
                <motion.div variants={staggerItem} className="bg-slate-100 dark:bg-white/10 rounded-xl p-4 flex items-center border border-slate-200 dark:border-white/10">
                  <FiSearch className="text-blue-500 dark:text-blue-300 mr-3 text-xl" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearch}
                    className="bg-transparent text-slate-900 dark:text-white w-full outline-none placeholder:text-slate-400"
                    placeholder="Search for fresh catch..."
                  />
                </motion.div>

                <div className="space-y-4">
                  <motion.div variants={staggerItem}>
                    <Link
                      to="/products"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-2xl font-serif text-slate-900 dark:text-white block py-2 border-b border-slate-100 dark:border-white/10"
                    >
                      Shop All
                    </Link>
                  </motion.div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { to: "/products?category=Fish", label: "Fish" },
                      { to: "/products?category=Prawn", label: "Prawns" },
                      { to: "/products?category=Crab", label: "Crabs" },
                    ].map((item) => (
                      <motion.div key={item.label} variants={staggerItem}>
                        <Link
                          to={item.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className="text-lg text-slate-600 dark:text-white/70 block px-4 py-3 bg-slate-50 dark:bg-white/5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          {item.label}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {!user ? (
                  <motion.div variants={staggerItem}>
                    <button
                      onClick={() => {
                        googleLogin();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold mt-8 shadow-lg shadow-blue-600/20 active:scale-95 transition-transform"
                    >
                      Login / Signup
                    </button>
                  </motion.div>
                ) : (
                  <motion.div variants={staggerItem} className="mt-8 pt-8 border-t border-slate-100 dark:border-white/10 space-y-2">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">
                      Account Settings
                    </p>
                    {[
                      { icon: <FiUser />, text: "My Profile", path: "/profile" },
                      { icon: <FiPackage />, text: "My Orders", path: "/orders" },
                      { icon: <FiBell />, text: "Notifications", path: "/notifications", badge: unreadCount },
                      ...(user.role === "admin"
                        ? [{ icon: <FiGrid />, text: "Admin Dashboard", path: "/admin/dashboard" }]
                        : []),
                    ].map((item) => (
                      <motion.button
                        key={item.text}
                        whileTap={{ scale: 0.97, x: 4 }}
                        onClick={() => {
                          navigate(item.path);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-4 text-slate-700 dark:text-white/70 py-3 text-lg justify-between"
                      >
                        <div className="flex items-center gap-4">
                          {item.icon} {item.text}
                        </div>
                        {item.badge > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </motion.button>
                    ))}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-4 text-red-500 py-3 text-lg font-bold mt-4"
                    >
                      <FiLogOut /> Logout
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Spin isOpen={showSpinWheel} onClose={handleSpinClose} />
    </>
  );
}

function DropdownItem({ icon, text, onClick, isDanger, badge = 0 }) {
  return (
    <motion.div
      whileHover={{
        x: 6,
        backgroundColor: isDanger
          ? "rgba(239, 68, 68, 0.1)"
          : "rgba(37, 99, 235, 0.05)",
      }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`px-5 py-3 cursor-pointer flex items-center justify-between transition-colors ${
        isDanger
          ? "text-red-500"
          : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white"
      }`}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <motion.span
            className="text-lg"
            whileHover={{ rotate: 15 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {icon}
          </motion.span>
        )}
        <span className="text-sm font-semibold">{text}</span>
      </div>
      {badge > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold"
        >
          {badge}
        </motion.span>
      )}
    </motion.div>
  );
}