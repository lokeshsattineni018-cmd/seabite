// AdminSidebar.jsx
import { NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiGrid, FiPlusSquare, FiShoppingBag, FiClipboard,
  FiUsers, FiLogOut, FiGlobe, FiMail, FiTag,
  FiChevronRight, FiZap,
} from "react-icons/fi";
import axios from "axios";

const LINKS = [
  { name: "Dashboard", path: "/admin/dashboard", icon: <FiGrid size={18} /> },
  { name: "Products", path: "/admin/products", icon: <FiShoppingBag size={18} /> },
  { name: "Add Product", path: "/admin/add-product", icon: <FiPlusSquare size={18} /> },
  { name: "Orders", path: "/admin/orders", icon: <FiClipboard size={18} /> },
  { name: "Inbox", path: "/admin/messages", icon: <FiMail size={18} /> },
  { name: "Coupons", path: "/admin/coupons", icon: <FiTag size={18} /> },
  { name: "Users", path: "/admin/users", icon: <FiUsers size={18} /> },
];

const ease = [0.22, 1, 0.36, 1];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await axios.post("/api/admin/logout", {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/admin/login");
    }
  };

  return (
    <div className="h-full flex flex-col justify-between bg-white p-4 md:p-5">
      {/* Brand Header */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-2 mb-8 md:mb-10">
          <Link to="/admin/dashboard" className="block">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="SeaBite Logo"
                className="h-9 md:h-10 w-auto object-contain"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>
          </Link>
          <div className="mt-4 px-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Admin Console
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {LINKS.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <NavLink to={link.path} key={link.path} className="relative block">
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-slate-900 rounded-xl"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <motion.span
                  whileHover={{ x: isActive ? 0 : 3 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className={`relative flex items-center justify-between px-3.5 py-2.5 md:py-3 rounded-xl text-[13px] font-semibold transition-colors duration-200 ${
                    isActive
                      ? "text-white"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={isActive ? "text-blue-400" : "text-slate-400"}>
                      {link.icon}
                    </span>
                    {link.name}
                  </span>
                  {isActive && (
                    <FiChevronRight size={14} className="text-slate-400" />
                  )}
                </motion.span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="space-y-1 border-t border-slate-100 pt-5 mt-5 bg-white">
        <Link
          to="/"
          className="flex items-center gap-3 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl transition-all group"
        >
          <FiGlobe size={16} className="group-hover:rotate-12 transition-transform" />
          <span>View Store</span>
        </Link>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-red-600 hover:bg-red-50/80 rounded-xl transition-all group"
        >
          <FiLogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Log Out</span>
        </motion.button>
      </div>
    </div>
  );
}