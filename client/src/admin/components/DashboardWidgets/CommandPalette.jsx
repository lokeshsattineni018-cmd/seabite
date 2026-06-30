import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Command, ArrowRight, Package, Users, ShoppingCart, Settings, BarChart3, MessageSquare, Shield, Zap, Layout, Truck, CreditCard, Tag, Bell, FileText, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

const COMMANDS = [
  { id: "dashboard", label: "Dashboard", icon: <Layout size={16} />, path: "/admin/dashboard", category: "Navigation" },
  { id: "products", label: "Products", icon: <Package size={16} />, path: "/admin/products", category: "Navigation" },
  { id: "add-product", label: "Add New Product", icon: <Package size={16} />, path: "/admin/add-product", category: "Quick Actions" },
  { id: "orders", label: "Orders", icon: <ShoppingCart size={16} />, path: "/admin/orders", category: "Navigation" },
  { id: "users", label: "Users & Customers", icon: <Users size={16} />, path: "/admin/users", category: "Navigation" },
  { id: "analytics", label: "Analytics", icon: <BarChart3 size={16} />, path: "/admin/analytics", category: "Navigation" },
  { id: "messages", label: "Messages", icon: <MessageSquare size={16} />, path: "/admin/messages", category: "Navigation" },
  { id: "delivery", label: "Delivery Management", icon: <Truck size={16} />, path: "/admin/delivery", category: "Navigation" },
  { id: "coupons", label: "Coupons & Discounts", icon: <Tag size={16} />, path: "/admin/coupons", category: "Navigation" },
  { id: "flash-sale", label: "Flash Sales", icon: <Zap size={16} />, path: "/admin/flash-sale", category: "Navigation" },
  { id: "marketing", label: "Marketing Hub", icon: <Bell size={16} />, path: "/admin/marketing", category: "Navigation" },
  { id: "reviews", label: "Reviews", icon: <MessageSquare size={16} />, path: "/admin/reviews", category: "Navigation" },
  { id: "pos", label: "Point of Sale", icon: <CreditCard size={16} />, path: "/admin/pos", category: "Navigation" },
  { id: "settings", label: "Settings", icon: <Settings size={16} />, path: "/admin/settings", category: "Navigation" },
  { id: "watchtower", label: "Watchtower", icon: <Shield size={16} />, path: "/admin/watchtower", category: "Navigation" },
  { id: "complaints", label: "Complaints", icon: <MessageSquare size={16} />, path: "/admin/complaints", category: "Navigation" },
  { id: "radar", label: "Live Radar", icon: <Activity size={16} />, path: "/admin/radar", category: "Monitoring" },
  { id: "pulse", label: "Storefront Pulse", icon: <Activity size={16} />, path: "/admin/pulse", category: "Monitoring" },
  { id: "xray", label: "X-Ray Monitor", icon: <Search size={16} />, path: "/admin/xray", category: "Monitoring" },
  { id: "rfm", label: "RFM Segments", icon: <Users size={16} />, path: "/admin/rfm", category: "Intelligence" },
  { id: "forecast", label: "Demand Forecast", icon: <BarChart3 size={16} />, path: "/admin/forecast", category: "Intelligence" },
  { id: "pricing-engine", label: "AI Pricing Engine", icon: <Zap size={16} />, path: "/admin/pricing-engine", category: "Intelligence" },
  { id: "compliance", label: "Compliance", icon: <Shield size={16} />, path: "/admin/compliance", category: "Enterprise" },
  { id: "iam", label: "Identity & Access", icon: <Shield size={16} />, path: "/admin/iam", category: "Enterprise" },
  { id: "registry", label: "Registry", icon: <FileText size={16} />, path: "/admin/registry", category: "Enterprise" },
  { id: "inventory-alerts", label: "Inventory Alerts", icon: <Package size={16} />, path: "/admin/inventory-alerts", category: "Operations" },
  { id: "carts", label: "Abandoned Carts", icon: <ShoppingCart size={16} />, path: "/admin/carts", category: "Operations" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const filtered = query
    ? COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.category.toLowerCase().includes(query.toLowerCase()))
    : COMMANDS;

  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  const flatFiltered = Object.values(grouped).flat();

  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen(prev => !prev);
      setQuery("");
      setSelectedIndex(0);
    }
    if (!open) return;
    
    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(prev => Math.min(prev + 1, flatFiltered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(prev => Math.max(prev - 1, 0)); }
    if (e.key === "Enter" && flatFiltered[selectedIndex]) {
      navigate(flatFiltered[selectedIndex].path);
      setOpen(false);
    }
  }, [open, flatFiltered, selectedIndex, navigate]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => { setOpen(true); setQuery(""); }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-all group"
      >
        <Search size={14} className="text-stone-500" />
        <span className="text-xs text-stone-500">Quick navigation...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white border border-stone-200/60 text-[10px] text-stone-500">
          <Command size={10} /> K
        </kbd>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed top-[15%] left-1/2 w-full max-w-xl -translate-x-1/2 z-50 rounded-2xl overflow-hidden bg-white border border-stone-200 shadow-2xl"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 bg-stone-50/50">
                <Search size={18} className="text-stone-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search commands, pages, actions..."
                  className="flex-1 bg-transparent text-stone-850 text-sm outline-none placeholder-stone-400 font-semibold"
                />
                <kbd className="px-1.5 py-0.5 rounded bg-white text-[10px] text-stone-400 border border-stone-200/60 font-bold select-none">ESC</kbd>
              </div>

              {/* Results */}
              <div className="max-h-[50vh] overflow-y-auto py-2">
                {Object.entries(grouped).length === 0 ? (
                  <div className="px-4 py-8 text-center text-stone-400 text-sm font-bold">No results found</div>
                ) : (
                  Object.entries(grouped).map(([category, commands]) => (
                    <div key={category} className="mb-2">
                      <div className="px-4 py-1.5">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">{category}</span>
                      </div>
                      {commands.map(cmd => {
                        const globalIndex = flatFiltered.indexOf(cmd);
                        const isSelected = globalIndex === selectedIndex;
                        return (
                          <button
                            key={cmd.id}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${
                              isSelected ? "bg-stone-100 text-stone-900 font-bold" : "text-stone-600 hover:bg-stone-50"
                            }`}
                            onClick={() => { navigate(cmd.path); setOpen(false); }}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                          >
                            <span className={`${isSelected ? "text-[#5BBFB5]" : "text-stone-450"}`}>{cmd.icon}</span>
                            <span className="text-xs flex-1">{cmd.label}</span>
                            {isSelected && <ArrowRight size={12} className="text-[#5BBFB5]" />}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 px-6 py-2.5 border-t border-stone-100 text-[10px] text-stone-400 font-bold bg-stone-50/30">
                <span className="flex items-center gap-1">↑↓ Navigate</span>
                <span className="flex items-center gap-1">↵ Open</span>
                <span className="flex items-center gap-1">esc Close</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
