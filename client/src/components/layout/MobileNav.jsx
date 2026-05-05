import React, { useContext, useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, ShoppingBag, ShoppingCart, User, Search, X, Zap, Heart, Bell, CreditCard, Settings, ChevronRight, LayoutDashboard } from "lucide-react";
import { FiLogOut, FiArrowRight } from "react-icons/fi";
import { CartContext } from "../../context/CartContext";
import { AuthContext, useAuth } from "../../context/AuthContext";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount, setIsCartOpen } = useContext(CartContext);
  const { user } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);

    { id: "home", label: "Home", path: "/", icon: Home },
    { id: "shop", label: "Shop", path: "/products", icon: ShoppingBag },
    { id: "search", label: "Find", onClick: () => setShowSearch(true), icon: Search },
    { id: "cart", label: "Cart", onClick: () => setIsCartOpen(true), icon: ShoppingCart, isCart: true },
    ...(user?.role === "admin" ? [{ id: "admin", label: "Admin", path: "/admin", icon: LayoutDashboard }] : []),
    { id: "menu", label: "Me", onClick: () => setShowProfileMenu(true), icon: User }
  ];

  const handleSearch = async (val) => {
    setSearchTerm(val);
    if (val.length > 1) {
      try {
        const { data } = await axios.get(`${API_URL}/api/products?search=${val}`);
        setSuggestions(data.products.slice(0, 10));
      } catch (e) {}
    } else {
      setSuggestions([]);
    }
  };

  if (location.pathname.startsWith("/admin") || location.pathname === "/checkout") return null;

  return (
    <>
      <style>{`
        /* Hide intrusive side support/chat widgets on mobile */
        [class*="support"], [id*="support"], [class*="chat"], [id*="chat"], .social-widget {
          display: none !important;
        }
        .mesh-clean {
          background: radial-gradient(circle at top right, #f0fdfa, #ffffff 70%);
        }
        .search-glass {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.4);
        }
      `}</style>

      {/* 🌊 Ultra-Minimalist Floating Navbar */}
      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] md:hidden w-auto">
        <motion.div 
          initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-1 p-1.5 bg-white/40 backdrop-blur-3xl rounded-[40px] border border-white/50 shadow-[0_25px_60px_rgba(0,0,0,0.1)]"
        >
          {navItems.map((item) => {
            const isActive = item.path ? location.pathname === item.path : false;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => item.onClick ? item.onClick() : navigate(item.path)}
                className={`relative p-4 rounded-full transition-all duration-500 ${isActive ? "bg-white text-[#1A2E2C] shadow-sm" : "text-[#1A2E2C]/40 hover:text-[#1A2E2C]"}`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {item.isCart && cartCount > 0 && (
                  <span className="absolute top-3 right-3 w-4 h-4 bg-[#F07468] text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">{cartCount}</span>
                )}
              </button>
            );
          })}
        </motion.div>
      </nav>

      {/* 🔮 Minimalist Aesthetic Search */}
      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="fixed inset-0 z-[300] bg-white/95 backdrop-blur-3xl overflow-y-auto mesh-clean">
            <div className="max-w-md mx-auto p-8 pt-20">
              <div className="flex items-center justify-between mb-16">
                 <button onClick={() => setShowSearch(false)} className="text-[#1A2E2C] opacity-30 hover:opacity-100 transition-opacity"><X size={28} /></button>
              </div>

              <div className="relative flex flex-col items-center">
                <input 
                  autoFocus 
                  type="text" 
                  placeholder="Search..." 
                  value={searchTerm} 
                  onChange={(e) => handleSearch(e.target.value)} 
                  className="w-[200px] bg-[#F8FAFB] border-none rounded-full py-3 px-6 text-center text-sm font-bold text-[#1A2E2C] focus:ring-2 focus:ring-[#5BA8A0]/20 transition-all placeholder:text-[#1A2E2C]/20" 
                />
              </div>

              <div className="space-y-4 mt-10">
                {suggestions.length > 0 ? suggestions.map((p, i) => (
                  <motion.div 
                    key={p._id} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.03 }} 
                    onClick={() => { navigate(`/products/${p._id}`); setShowSearch(false); }} 
                    className="flex gap-4 p-3 bg-white rounded-xl shadow-sm border border-gray-100 active:bg-gray-50 transition-all"
                  >
                    {/* Image Column */}
                    <div className="w-[110px] h-[110px] flex-shrink-0 bg-[#F8FAFB] rounded-lg overflow-hidden">
                      <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                    </div>
                    
                    {/* Info Column */}
                    <div className="flex flex-col justify-between py-1 flex-1">
                      <div>
                        <p className="text-[14px] font-medium text-gray-900 leading-snug line-clamp-2 mb-1">{p.name}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-[12px] font-bold text-gray-900">₹</span>
                          <span className="text-[20px] font-bold text-gray-900">{p.basePrice}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <p className="text-[11px] font-medium text-green-700">In Stock</p>
                        </div>
                        <p className="text-[11px] text-gray-500">FREE delivery by <span className="font-bold text-gray-700">Tomorrow Morning</span></p>
                      </div>
                    </div>
                  </motion.div>
                )) : searchTerm.length > 1 ? (
                   <p className="text-center text-[#1A2E2C]/30 font-bold mt-20">No results found...</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 opacity-60">
                    {["Premium Salmon", "Fresh Prawns", "Blue Crab", "Lobster"].map(t => (
                      <button key={t} onClick={() => { setSearchTerm(t); handleSearch(t); }} className="p-4 bg-[#F8FAFB] rounded-2xl text-[11px] font-black uppercase tracking-widest text-[#1A2E2C]">{t}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🫧 Clean Minimal Sidebar */}
      <AnimatePresence>
        {showProfileMenu && (
          <div className="fixed inset-0 z-[400] md:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProfileMenu(false)} className="absolute inset-0 bg-[#1A2E2C]/20 backdrop-blur-sm" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30 }} className="absolute top-0 right-0 h-full w-[80%] bg-white p-10 pt-20 shadow-2xl overflow-y-auto">
               <div className="mb-16">
                  <h3 className="text-4xl font-black text-[#1A2E2C] mb-1">{user?.name?.split(" ")[0]}</h3>
                  <p className="text-sm font-bold text-[#5BA8A0] opacity-60">{user?.email}</p>
               </div>

               <div className="space-y-8">
                 {[
                   { label: "My Profile", path: "/profile" },
                   { label: "My Orders", path: "/orders" },
                   { label: "Saved Items", path: "/wishlist" },
                   { label: "Notifications", path: "/notifications" },
                   ...(user?.role === "admin" ? [{ label: "Admin Dashboard", path: "/admin" }] : [])
                 ].map(item => (
                   <Link key={item.path} to={item.path} onClick={() => setShowProfileMenu(false)} className="block group">
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-black text-[#1A2E2C]/40 group-hover:text-[#1A2E2C] transition-colors">{item.label}</span>
                        <ChevronRight className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-[#5BA8A0]" size={20} />
                      </div>
                   </Link>
                 ))}
                 
                 <button onClick={() => { setShowProfileMenu(false); axios.post(`${API_URL}/api/auth/logout`).then(() => window.location.reload()); }} className="pt-12 block text-red-500 font-black text-lg">Sign Out</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNav;
