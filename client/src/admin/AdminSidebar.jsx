// AdminSidebar.jsx
import { NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiGrid, FiPlusSquare, FiShoppingBag, FiClipboard,
  FiUsers, FiLogOut, FiGlobe, FiMail, FiTag,
  FiChevronRight, FiZap, FiSend, FiShoppingCart, FiCreditCard, FiStar, FiActivity, FiSettings, FiShield,
  FiArchive, FiTarget
} from "react-icons/fi";
import axios from "axios";

const LINKS = [
  { name: "Overview", path: "/admin/dashboard", icon: <FiGrid size={18} /> },
  { name: "Products", path: "/admin/products", icon: <FiShoppingBag size={18} /> },
  { name: "Add Product", path: "/admin/add-product", icon: <FiPlusSquare size={18} /> },
  { name: "Orders", path: "/admin/orders", icon: <FiClipboard size={18} /> },
  { name: "POS Terminal", path: "/admin/pos", icon: <FiCreditCard size={18} /> },
  { name: "Customers", path: "/admin/users", icon: <FiUsers size={18} /> },
  { name: "Messages", path: "/admin/messages", icon: <FiMail size={18} /> },
  { name: "Reviews", path: "/admin/reviews", icon: <FiStar size={18} /> },
  { name: "Coupons", path: "/admin/coupons", icon: <FiTag size={18} /> },
  { name: "Flash Sales", path: "/admin/flash-sale", icon: <FiZap size={18} /> },
  { name: "Marketing", path: "/admin/marketing", icon: <FiSend size={18} /> },
  { name: "Abandoned Cart", path: "/admin/carts", icon: <FiShoppingCart size={18} /> },
  { name: "Live Ops", path: "/admin/watchtower", icon: <FiActivity size={18} /> },
  { name: "Access Sentinel", path: "/admin/iam", icon: <FiShield size={18} /> },
  { name: "Audit Registry", path: "/admin/registry", icon: <FiArchive size={18} /> },
  { name: "Search Discovery", path: "/admin/discovery", icon: <FiTarget size={18} /> },
  { name: "Analytics", path: "/admin/analytics", icon: <FiActivity size={18} /> },
  { name: "Settings", path: "/admin/settings", icon: <FiSettings size={18} /> },
];

export default function AdminSidebar({ settings, onUpdateBanner }) {
  const navigate = useNavigate();
  const location = useLocation();

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
      <div className="h-24 flex items-center px-8">
        <Link to="/admin/dashboard" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-10 h-10 group-hover:scale-105 transition-transform duration-300">
            <img src="/logo.png" alt="SeaBite Logo" className="w-full h-full object-contain drop-shadow-sm" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-stone-900 tracking-tight leading-tight group-hover:text-stone-600 transition-colors">SeaBite</h2>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar pb-6 scroll-smooth">
        <p className="px-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 mt-2">Main Menu</p>

        {LINKS.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <NavLink to={link.path} key={link.path} className="relative block group">
              {isActive && (
                <motion.div
                  layoutId="active-nav-pill"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm border border-stone-100"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              <div
                className={`relative flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-medium transition-all duration-200 ${isActive
                  ? "text-stone-900 font-bold"
                  : "text-stone-500 hover:text-stone-900 hover:bg-stone-100/50"
                  }`}
              >
                <span className="flex items-center gap-3.5">
                  <span className={`transition-colors duration-200 ${isActive ? "text-stone-900" : "text-stone-400 group-hover:text-stone-600"}`}>
                    {link.icon}
                  </span>
                  {link.name}
                </span>

                {isActive && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <FiChevronRight size={14} className="text-stone-400" />
                  </motion.div>
                )}
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-stone-200/50 bg-stone-50/30 space-y-2">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 text-[12px] font-semibold text-stone-500 hover:text-stone-900 hover:bg-white hover:shadow-sm rounded-xl transition-all group border border-transparent hover:border-stone-100"
        >
          <FiGlobe size={16} className="text-stone-400 group-hover:text-stone-800 transition-colors" />
          <span>View Live Store</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-[12px] font-semibold text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all group"
        >
          <FiLogOut size={16} className="text-stone-400 group-hover:text-rose-500 transition-colors" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}