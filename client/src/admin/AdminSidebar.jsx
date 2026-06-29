// AdminSidebar.jsx
import React, { useState } from "react";
import { NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiGrid, FiPlusSquare, FiShoppingBag, FiClipboard,
  FiUsers, FiLogOut, FiGlobe, FiMail, FiTag,
  FiChevronRight, FiChevronDown, FiZap, FiSend, FiShoppingCart, FiCreditCard, FiStar, FiActivity, FiSettings, FiShield,
  FiArchive, FiTarget, FiMessageSquare, FiTruck, FiThermometer, FiTrendingUp, FiDollarSign
} from "react-icons/fi";
import axios from "axios";

const CATEGORIES = [
  {
    title: "Core Commerce",
    links: [
      { name: "Overview", path: "/admin/dashboard", icon: <FiGrid size={16} /> },
      { name: "Products", path: "/admin/products", icon: <FiShoppingBag size={16} /> },
      { name: "Add Product", path: "/admin/add-product", icon: <FiPlusSquare size={16} /> },
      { name: "Orders", path: "/admin/orders", icon: <FiClipboard size={16} /> },
      { name: "Returns & Refunds", path: "/admin/returns", icon: <FiArchive size={16} /> },
      { name: "Finance Ledger", path: "/admin/finance", icon: <FiDollarSign size={16} /> },
      { name: "POS Terminal", path: "/admin/pos", icon: <FiCreditCard size={16} /> },
    ]
  },
  {
    title: "Operations & Logistics",
    links: [
      { name: "Logistics", path: "/admin/delivery", icon: <FiTruck size={16} /> },
      { name: "Live Radar", path: "/admin/radar", icon: <FiActivity size={16} /> },
      { name: "Complaints", path: "/admin/complaints", icon: <FiMessageSquare size={16} /> },
      { name: "Automated Workflows", path: "/admin/workflows", icon: <FiZap size={16} /> },
      { name: "Compliance Audits", path: "/admin/compliance", icon: <FiThermometer size={16} /> }, // 📋 Added
    ]
  },
  {
    title: "Marketing & Growth",
    links: [
      { name: "Coupons", path: "/admin/coupons", icon: <FiTag size={16} /> },
      { name: "Flash Sales", path: "/admin/flash-sale", icon: <FiZap size={16} /> },
      { name: "Marketing Blast", path: "/admin/marketing", icon: <FiSend size={16} /> },
      { name: "Notification Center", path: "/admin/notification-center", icon: <FiSend size={16} /> },
      { name: "CMS Pages", path: "/admin/cms", icon: <FiClipboard size={16} /> },
      { name: "Abandoned Cart", path: "/admin/carts", icon: <FiShoppingCart size={16} /> },
      { name: "AI Pricing Engine", path: "/admin/pricing-engine", icon: <FiTrendingUp size={16} /> },
    ]
  },
  {
    title: "Engagement & Support",
    links: [
      { name: "Customer Center (CRM)", path: "/admin/crm", icon: <FiUsers size={16} /> },
      { name: "Support Inbox", path: "/admin/support", icon: <FiMessageSquare size={16} /> },
      { name: "Customers", path: "/admin/users", icon: <FiUsers size={16} /> },
      { name: "Messages", path: "/admin/messages", icon: <FiMail size={16} /> },
      { name: "Reviews", path: "/admin/reviews", icon: <FiStar size={16} /> },
      { name: "Search Discovery", path: "/admin/discovery", icon: <FiTarget size={16} /> },
    ]
  },
  {
    title: "Business Intelligence",
    links: [
      { name: "AI Operations Hub", path: "/admin/ai-hub", icon: <FiZap size={16} /> },
      { name: "BI Engine", path: "/admin/bi-engine", icon: <FiActivity size={16} /> },
      { name: "Demand Forecast", path: "/admin/forecast", icon: <FiTrendingUp size={16} /> },
      { name: "Customer Segments", path: "/admin/rfm", icon: <FiUsers size={16} /> },
      { name: "Inventory Alerts", path: "/admin/inventory-alerts", icon: <FiArchive size={16} /> },
    ]
  },
  {
    title: "Security & Intelligence",
    links: [
      { name: "Live Ops", path: "/admin/watchtower", icon: <FiActivity size={16} /> },
      { name: "Storefront Pulse", path: "/admin/pulse", icon: <FiZap size={16} /> },
      { name: "X-Ray Monitor", path: "/admin/xray", icon: <FiShield size={16} /> },
      { name: "Access Sentinel", path: "/admin/iam", icon: <FiShield size={16} /> },
      { name: "Multi-Store Manager", path: "/admin/multi-store", icon: <FiGlobe size={16} /> },
      { name: "Developer APIs", path: "/admin/api-hub", icon: <FiSettings size={16} /> },
      { name: "DevOps Monitor", path: "/admin/devops", icon: <FiActivity size={16} /> },
      { name: "System Audit", path: "/admin/security", icon: <FiShield size={16} /> },
      { name: "Audit Registry", path: "/admin/registry", icon: <FiArchive size={16} /> },
      { name: "Analytics", path: "/admin/analytics", icon: <FiActivity size={16} /> },
      { name: "Settings", path: "/admin/settings", icon: <FiSettings size={16} /> },
    ]
  }
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Keep Core Commerce and Operations open by default to minimize length, others collapsed
  const [expandedCategories, setExpandedCategories] = useState({
    "Core Commerce": true,
    "Operations & Logistics": true,
    "Marketing & Growth": false,
    "Engagement & Support": false,
    "Business Intelligence": false,
    "Security & Intelligence": false
  });

  const toggleCategory = (title) => {
    setExpandedCategories(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true });
    } catch (err) { }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="h-full flex flex-col bg-stone-50/50 border-r border-stone-200/60">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6">
        <Link to="/admin/dashboard" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-8 h-8 group-hover:scale-105 transition-transform duration-300">
            <img src="/logo.webp" alt="SeaBite Logo" width={32} height={32} className="w-full h-full object-contain drop-shadow-sm" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-stone-900 tracking-tight leading-tight group-hover:text-[#5BBFB5] transition-colors">SeaBite</h2>
            <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Admin Control Hub</p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-4 custom-scrollbar pb-6 scroll-smooth">
        {CATEGORIES.map((cat) => {
          const isExpanded = expandedCategories[cat.title];
          return (
            <div key={cat.title} className="space-y-1">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(cat.title)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[9px] font-black text-stone-400 uppercase tracking-widest hover:text-stone-700 transition-colors cursor-pointer text-left"
              >
                <span>{cat.title}</span>
                <FiChevronDown 
                  size={12} 
                  className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : "rotate-0"}`} 
                />
              </button>

              {/* Sub-links with collapsible Framer Motion wrapper */}
              <div className="overflow-hidden">
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="space-y-0.5"
                    >
                      {cat.links.map((link) => {
                        const isActive = location.pathname === link.path;
                        return (
                          <NavLink to={link.path} key={link.path} className="relative block group">
                            {isActive && (
                              <motion.div
                                layoutId="active-nav-pill"
                                className="absolute inset-0 bg-white rounded-xl shadow-xs border border-stone-150"
                                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                              />
                            )}

                            <div
                              className={`relative flex items-center justify-between px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all duration-200 ${isActive
                                ? "text-stone-900 font-bold"
                                : "text-stone-500 hover:text-stone-900 hover:bg-stone-100/50"
                                }`}
                            >
                              <span className="flex items-center gap-3">
                                <span className={`transition-colors duration-200 ${isActive ? "text-stone-900" : "text-stone-400 group-hover:text-stone-600"}`}>
                                  {link.icon}
                                </span>
                                {link.name}
                              </span>

                              {link.name === "Live Ops" && (
                                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                              )}

                              {isActive && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                  <FiChevronRight size={12} className="text-stone-400" />
                                </motion.div>
                              )}
                            </div>
                          </NavLink>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-stone-200/50 bg-stone-50/30 space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 px-3.5 py-2.5 text-[11px] font-bold text-stone-500 hover:text-stone-900 hover:bg-white hover:shadow-xs rounded-xl transition-all group border border-transparent hover:border-stone-150"
        >
          <FiGlobe size={14} className="text-stone-400 group-hover:text-stone-850 transition-colors" />
          <span>View Live Store</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[11px] font-bold text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all group cursor-pointer"
        >
          <FiLogOut size={14} className="text-stone-400 group-hover:text-rose-500 transition-colors" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}