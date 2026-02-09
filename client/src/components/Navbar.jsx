// src/components/Navbar.jsx
import { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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

const API_URL = import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app";

export default function Navbar({ openCart }) {
  const { cartCount } = useContext(CartContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { user, setUser, refreshMe } = useAuth();

  const [showProfile, setShowProfile] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();

  // Fetch notifications whenever user changes
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
      console.error("Notification fetch failed");
    }
  };

  // Handle navbar scroll style
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
          {
            token: tokenResponse.access_token,
          },
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

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 w-full z-50 transition-all duration-500 ease-in-out border-b ${
          scrolled
            ? "bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-white/5 py-3 shadow-2xl"
            : "bg-transparent border-transparent py-4 md:py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-12 flex items-center justify-between">
          <Link to="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
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
          </Link>

          <div className="hidden lg:flex flex-1 justify-center px-12">
            <motion.div
              className={`flex items-center rounded-full px-5 py-2.5 w-full max-w-md border transition-all duration-300 group ${
                scrolled
                  ? "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-white/10"
                  : "bg-white/20 dark:bg-white/10 backdrop-blur-md border-slate-300 dark:border-white/20"
              }`}
            >
              <FiSearch className="text-blue-500 dark:text-blue-200 mr-3 text-lg" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Search for fresh catch..."
                className="bg-transparent outline-none w-full text-sm text-slate-900 dark:text-blue-100 placeholder:text-slate-400 dark:placeholder:text-blue-200/50 font-medium"
              />
            </motion.div>
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            <div
              className="hidden md:block relative"
              onMouseEnter={() => setShowShop(true)}
              onMouseLeave={() => setShowShop(false)}
            >
              <button className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-blue-100 hover:text-blue-600 dark:hover:text-white transition-colors py-2">
                Shop{" "}
                <FiChevronDown
                  className={`transition-transform duration-300 ${
                    showShop ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {showShop && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden py-2"
                  >
                    <DropdownItem
                      text="Shop All"
                      onClick={() => navigate("/products")}
                    />
                    <div className="h-px bg-slate-100 dark:bg-white/5 my-1 mx-4" />
                    <DropdownItem
                      text="Premium Fish"
                      onClick={() => navigate("/products?category=Fish")}
                    />
                    <DropdownItem
                      text="Jumbo Prawns"
                      onClick={() => navigate("/products?category=Prawn")}
                    />
                    <DropdownItem
                      text="Live Crabs"
                      onClick={() => navigate("/products?category=Crab")}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 md:p-2.5 rounded-xl bg-slate-100 dark:bg:white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-blue-300 hover:scale-110 transition-all shadow-sm"
            >
              {isDarkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>

            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative cursor-pointer text-slate-700 dark:text-blue-100 hover:text-blue-600 dark:hover:text-white transition-colors p-2"
              onClick={openCart}
            >
              <FiShoppingBag size={22} strokeWidth={1.5} />
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-0 right-0 md:-top-1 md:-right-1 bg-blue-600 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-lg border-2 border-white dark:border-slate-900"
                >
                  {cartCount}
                </motion.span>
              )}
            </motion.div>

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
                      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-blue-100 group-hover:text-blue-600 dark:group-hover:text-white transition-colors">
                      {user.name?.split(" ")[0]}
                    </span>
                  </motion.div>
                  <AnimatePresence>
                    {showProfile && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
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
                          <DropdownItem
                            icon={<FiUser />}
                            text="My Profile"
                            onClick={() => navigate("/profile")}
                          />
                          <DropdownItem
                            icon={<FiPackage />}
                            text="My Orders"
                            onClick={() => navigate("/orders")}
                          />
                          <DropdownItem
                            icon={<FiBell />}
                            text="Notifications"
                            onClick={() => navigate("/notifications")}
                            badge={unreadCount || 0}
                          />
                          {user.role === "admin" && (
                            <DropdownItem
                              icon={<FiGrid />}
                              text="Admin Dashboard"
                              onClick={() => navigate("/admin/dashboard")}
                            />
                          )}
                        </div>
                        <div className="bg-red-50 dark:bg-red-500/10 py-2 border-t border-red-100 dark:border-red-500/20">
                          <DropdownItem
                            icon={<FiLogOut />}
                            text="Logout"
                            onClick={handleLogout}
                            isDanger
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button
                  onClick={() => googleLogin()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3 font-medium text-slate-700 dark:text-blue-100 hover:text-blue-600 dark:hover:text-white transition-colors px-5 py-2 rounded-full border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 ml-4"
                >
                  <FiUser size={18} /> <span className="text-sm">Login</span>
                </motion.button>
              )}
            </div>

            <button
              className="md:hidden text-slate-900 dark:text-white text-2xl p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-white dark:bg-slate-900/95 backdrop-blur-xl md:hidden flex flex-col pt-24 px-8 overflow-y-auto"
          >
            <button
              className="absolute top-6 right-6 text-slate-900 dark:text-white text-3xl"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FiX />
            </button>
            <div className="space-y-6 pb-12">
              <div className="bg-slate-100 dark:bg-white/10 rounded-xl p-4 flex items-center border border-slate-200 dark:border-white/10">
                <FiSearch className="text-blue-500 dark:text-blue-300 mr-3 text-xl" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearch}
                  className="bg-transparent text-slate-900 dark:text-white w-full outline-none placeholder:text-slate-400"
                  placeholder="Search for fresh catch..."
                />
              </div>

              <div className="space-y-4">
                <Link
                  to="/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-2xl font-serif text-slate-900 dark:text-white block py-2 border-b border-slate-100 dark:border-white/10"
                >
                  Shop All
                </Link>
                <div className="grid grid-cols-2 gap-4">
                  <Link
                    to="/products?category=Fish"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg text-slate-600 dark:text-white/70 block px-4 py-3 bg-slate-50 dark:bg-white/5 rounded-xl"
                  >
                    Fish
                  </Link>
                  <Link
                    to="/products?category=Prawn"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg text-slate-600 dark:text-white/70 block px-4 py-3 bg-slate-50 dark:bg:white/5 rounded-xl"
                  >
                    Prawns
                  </Link>
                  <Link
                    to="/products?category=Crab"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg text-slate-600 dark:text-white/70 block px-4 py-3 bg-slate-50 dark:bg:white/5 rounded-xl"
                  >
                    Crabs
                  </Link>
                </div>
              </div>

              {!user ? (
                <button
                  onClick={() => {
                    googleLogin();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold mt-8 shadow-lg shadow-blue-600/20"
                >
                  Login / Signup
                </button>
              ) : (
                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/10 space-y-2">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">
                    Account Settings
                  </p>
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-4 text-slate-700 dark:text-white/70 py-3 text-lg"
                  >
                    <FiUser /> My Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate("/orders");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-4 text-slate-700 dark:text-white/70 py-3 text-lg"
                  >
                    <FiPackage /> My Orders
                  </button>
                  <button
                    onClick={() => {
                      navigate("/notifications");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-4 text-slate-700 dark:text-white/70 py-3 text-lg justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <FiBell /> Notifications
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-4 text-red-500 py-3 text-lg font-bold mt-4"
                  >
                    <FiLogOut /> Logout
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function DropdownItem({ icon, text, onClick, isDanger, badge = 0 }) {
  return (
    <motion.div
      whileHover={{
        x: 4,
        backgroundColor: isDanger
          ? "rgba(239, 68, 68, 0.1)"
          : "rgba(37, 99, 235, 0.05)",
      }}
      onClick={onClick}
      className={`px-5 py-3 cursor-pointer flex items-center justify-between transition-colors ${
        isDanger
          ? "text-red-500"
          : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white"
      }`}
    >
      <div className="flex items-center gap-4">
        {icon && <span className="text-lg">{icon}</span>}
        <span className="text-sm font-semibold">{text}</span>
      </div>
      {badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
          {badge}
        </span>
      )}
    </motion.div>
  );
}
