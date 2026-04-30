import React, { useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, ShoppingBag, ShoppingCart, User, Heart, Search, Bell, CreditCard, Settings } from "lucide-react";
import { FiLogOut } from "react-icons/fi";
import { CartContext } from "../../context/CartContext";
import { AuthContext, useAuth } from "../../context/AuthContext";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

/**
 * MobileNav Component
 * A premium, sticky bottom navigation bar for mobile devices.
 * Features glassmorphism and real-time cart count.
 */
const MobileNav = () => {
  const location = useLocation();
  const { cartCount, setIsCartOpen } = useContext(CartContext);
  const { user } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navItems = [
    { label: "Home", path: "/", icon: Home },
    { label: "Shop", path: "/products", icon: ShoppingBag },
    { label: "Search", path: "/search", icon: Search },
    { label: "Cart", onClick: () => setIsCartOpen(true), icon: ShoppingCart, isCart: true },
    { 
      label: user ? "Menu" : "Login", 
      onClick: () => {
        if (!user) {
          window.location.href = "/?auth=login";
        } else {
          setShowProfileMenu(true);
        }
      },
      icon: user ? User : User, // Use User icon for both if Search is already used
      isProfile: true
    }
  ];

  const profileMenuItems = [
    { label: "My Profile", path: "/profile", icon: User },
    { label: "My Orders", path: "/orders", icon: ShoppingBag },
    { label: "Notifications", path: "/notifications", icon: Bell },
    { label: "SeaBite Wallet", path: "/wallet", icon: CreditCard },
  ];

  if (user?.role === "admin") {
    profileMenuItems.push({ label: "Admin Dashboard", path: "/admin", icon: Settings });
  }

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
      localStorage.removeItem("userInfo");
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed", err);
      // Fallback: clear local storage and redirect anyway
      localStorage.removeItem("userInfo");
      window.location.href = "/";
    }
  };

  const handleTabClick = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  if (location.pathname.startsWith("/admin")) return null;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-white/80 backdrop-blur-lg border-t border-[#E2EEEC] pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item, idx) => {
            const isActive = item.path ? location.pathname === item.path : false;
            const Icon = item.icon;

            const content = (
              <motion.div
                whileTap={{ scale: 0.85 }}
                className={`relative p-1.5 rounded-xl transition-colors ${
                  isActive ? "text-[#5BA8A0]" : "text-[#94A3B8]"
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                
                {item.isCart && cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 bg-[#E8816A] text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 border-2 border-white"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </motion.div>
            );

            if (item.onClick) {
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    handleTabClick();
                    item.onClick();
                  }}
                  className="relative flex flex-col items-center justify-center w-full h-full gap-0.5 group"
                >
                  {content}
                  <span className="text-[10px] font-bold tracking-tight text-[#94A3B8]">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.path || idx}
                to={item.path}
                onClick={handleTabClick}
                className="relative flex flex-col items-center justify-center w-full h-full gap-0.5 group"
              >
                {content}
                
                <span
                  className={`text-[10px] font-bold tracking-tight ${
                    isActive ? "text-[#5BA8A0]" : "text-[#94A3B8]"
                  }`}
                >
                  {item.label}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="activeTabMobile"
                    className="absolute -top-[1px] w-8 h-[2px] bg-[#5BA8A0] rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Profile Menu Popup */}
      <AnimatePresence>
        {showProfileMenu && (
          <div className="fixed inset-0 z-[110] md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfileMenu(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-6 pb-12 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-full bg-[#5BA8A0] flex items-center justify-center text-white text-xl font-bold">
                  {user?.name?.charAt(0).toUpperCase() || "S"}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1A2B35]">{user?.name}</h3>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {profileMenuItems.map((option) => (
                  <Link
                    key={option.path}
                    to={option.path}
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <div className="p-2 rounded-xl bg-white text-[#5BA8A0] shadow-sm">
                      <option.icon size={20} />
                    </div>
                    <span className="font-bold text-[#1A2B35]">{option.label}</span>
                  </Link>
                ))}
                
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-red-50 text-red-600 font-bold mt-2"
                >
                  <div className="p-2 rounded-xl bg-white shadow-sm">
                    <FiLogOut size={20} />
                  </div>
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNav;
