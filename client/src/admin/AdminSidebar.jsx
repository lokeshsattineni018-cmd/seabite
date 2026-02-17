import { NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiGrid, FiPlusSquare, FiShoppingBag, FiClipboard,
  FiUsers, FiLogOut, FiGlobe, FiMail, FiTag,
  FiChevronRight, FiZap, FiSend, FiLayout, FiShoppingCart, FiCreditCard, FiStar, FiActivity, FiSettings
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
  { name: "Analytics", path: "/admin/analytics", icon: <FiActivity size={18} /> }, // 🟢 NEW
  { name: "Settings", path: "/admin/settings", icon: <FiSettings size={18} /> }, // 🟢 NEW
];

export default function AdminSidebar({ settings, onUpdateBanner }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBannerToggle = () => {
    onUpdateBanner({ ...settings.banner, active: !settings.banner?.active });
  };

  const handleBannerUrlChange = (e) => {
    onUpdateBanner({ ...settings.banner, image: e.target.value });
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
    <div className="h-full flex flex-col bg-white">
      {/* Brand Header */}
      <div className="h-24 flex items-center px-8">
        <Link to="/admin/dashboard" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-300">
              S
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">SeaBite</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar pb-6">
        <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-2">Menu</p>

        {LINKS.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <NavLink to={link.path} key={link.path} className="relative block group">
              {isActive && (
                <motion.div
                  layoutId="active-nav-pill"
                  className="absolute inset-0 bg-blue-50/80 rounded-xl"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              <div
                className={`relative flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-medium transition-all duration-200 ${isActive
                  ? "text-blue-700 font-bold"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
              >
                <span className="flex items-center gap-3.5">
                  <span className={`transition-colors duration-200 ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`}>
                    {link.icon}
                  </span>
                  {link.name}
                </span>

                {isActive && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <FiChevronRight size={14} className="text-blue-400" />
                  </motion.div>
                )}
              </div>
            </NavLink>
          );
        })}

        {/* 🟢 Promo Banner Widget */}
        <div className="mt-8 px-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Promo Banner</p>
          <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 shadow-sm border-dashed">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-600">Active Status</span>
              <button
                onClick={handleBannerToggle}
                className={`w-9 h-5 rounded-full transition-all relative ${settings.banner?.active ? "bg-emerald-500" : "bg-slate-200"}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.banner?.active ? "left-5" : "left-1"}`} />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Banner Image URL</label>
              <input
                type="text"
                value={settings.banner?.image || ""}
                onChange={(e) => onUpdateBanner({ ...settings.banner, image: e.target.value })}
                onBlur={handleBannerUrlChange}
                placeholder="https://..."
                className="w-full bg-white border border-slate-100 rounded-lg py-1.5 px-3 text-[10px] font-medium text-slate-600 outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-200"
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/30 space-y-2">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 text-[12px] font-semibold text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all group"
        >
          <FiGlobe size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
          <span>View Live Store</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-[12px] font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all group"
        >
          <FiLogOut size={16} className="text-slate-400 group-hover:text-red-500 transition-colors" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}