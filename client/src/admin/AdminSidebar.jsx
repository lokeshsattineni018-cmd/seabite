import { NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiGrid,
  FiPlusSquare,
  FiShoppingBag,
  FiClipboard,
  FiUsers,
  FiLogOut,
  FiGlobe,
  FiMail,
  FiTag,
} from "react-icons/fi";
import axios from "axios";

const LINKS = [
  { name: "Dashboard", path: "/admin/dashboard", icon: <FiGrid size={20} /> },
  { name: "Products", path: "/admin/products", icon: <FiShoppingBag size={20} /> },
  { name: "Add Product", path: "/admin/add-product", icon: <FiPlusSquare size={20} /> },
  { name: "Orders", path: "/admin/orders", icon: <FiClipboard size={20} /> },
  { name: "Inbox", path: "/admin/messages", icon: <FiMail size={20} /> },
  { name: "Coupons", path: "/admin/coupons", icon: <FiTag size={20} /> },
  { name: "Users", path: "/admin/users", icon: <FiUsers size={20} /> },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ UPDATED: Logout logic to handle session cleanup properly
  const handleLogout = async () => {
    try {
      // Ensuring credentials are sent for session destruction
      await axios.post("/api/admin/logout", {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Clear local state and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/admin/login");
    }
  };

  return (
    <div className="h-full flex flex-col justify-between bg-white md:border-r border-slate-200 p-5 md:p-6 overflow-y-auto no-scrollbar">
      <div>
        <div className="flex flex-col items-start px-2 mb-8 md:mb-10">
          <Link to="/admin/dashboard" className="block w-full">
            <img
              src="/logo.png"
              alt="SeaBite Logo"
              className="h-10 md:h-12 w-auto object-contain"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </Link>
          <p className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mt-3 ml-1 opacity-70">
            Admin Management
          </p>
        </div>

        <nav className="space-y-1.5 md:space-y-2">
          {LINKS.map((link) => {
            const isActive = location.pathname === link.path;

            return (
              <NavLink 
                to={link.path} 
                key={link.path} 
                className="relative block"
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-slate-900 rounded-xl shadow-sm"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                <span
                  className={`relative flex items-center gap-3 px-4 py-3.5 md:py-3 rounded-xl text-sm font-bold transition-colors duration-200 ${
                    isActive
                      ? "text-white"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <span className={isActive ? "text-blue-400" : "text-slate-400"}>
                    {link.icon}
                  </span>
                  {link.name}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="space-y-1.5 md:space-y-2 border-t border-slate-100 pt-6 mt-6">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3.5 md:py-3 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
        >
          <FiGlobe size={18} />
          <span>View Store</span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 md:py-3 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all group"
        >
          <FiLogOut
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}