import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, ShoppingBag, ShoppingCart, User, Heart } from "lucide-react";
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
  const { user } = useContext(AuthContext);

  const navItems = [
    { label: "Home", path: "/", icon: Home },
    { label: "Categories", path: "/categories", icon: ShoppingBag },
    { label: "Cart", path: "/checkout", icon: ShoppingCart, isCart: true },
    { label: "Wishlist", path: "/wishlist", icon: Heart },
    { label: "Profile", path: "/profile", icon: User },
  ];

  // Haptic feedback for iOS feel
  const handleTabClick = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10); // Subtle haptic tap
    }
  };

  // Hide on admin routes
  if (location.pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-white/80 backdrop-blur-lg border-t border-[#E2EEEC] pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleTabClick}
              className="relative flex flex-col items-center justify-center w-full h-full gap-1 group"
            >
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
  );
};

export default MobileNav;
