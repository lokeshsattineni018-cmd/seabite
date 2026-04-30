import React, { useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, ShoppingBag, ShoppingCart, User, Heart } from "lucide-react";
import { FiLogOut } from "react-icons/fi";
import { CartContext } from "../../context/CartContext";
import { AuthContext } from "../../context/AuthContext";

/**
 * MobileNav Component
 * A premium, sticky bottom navigation bar for mobile devices.
 * Features glassmorphism and real-time cart count.
 */
const MobileNav = () => {
  const location = useLocation();
  const { cartCount } = useContext(CartContext);
  const { user, logout } = useContext(AuthContext);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navItems = [
    { label: "Home", path: "/", icon: Home },
    { label: "Cart", path: "/checkout", icon: ShoppingCart, isCart: true },
    { label: "Wishlist", path: "/wishlist", icon: Heart },
    { 
      label: "Profile", 
      icon: User, 
      isProfile: true,
      onClick: () => {
        setShowProfileMenu(true);
      }
    },
  ];

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
            const isActive = location.pathname === item.path;
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

            if (item.isProfile) {
              return (
                <button
                  key="profile-tab"
                  onClick={() => {
                    handleTabClick();
                    item.onClick();
                  }}
                  className="relative flex flex-col items-center justify-center w-full h-full gap-1 group"
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
                className="relative flex flex-col items-center justify-center w-full h-full gap-1 group"
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
                {[
                  { label: "My Profile", path: "/profile", icon: User },
                  { label: "Notifications", path: "/notifications", icon: Heart },
                  { label: "Order History", path: "/orders", icon: ShoppingBag },
                  ...(user?.role === "admin" ? [{ label: "Admin Dashboard", path: "/admin", icon: Home }] : []),
                ].map((option) => (
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
                    // Handle logout via context or window
                    window.location.href = "/profile?action=logout"; 
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
