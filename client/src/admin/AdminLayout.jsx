// AdminLayout.jsx
import { useState, Suspense, useEffect, useCallback, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import axios from "axios";
import toast from "react-hot-toast";
import { FiMenu, FiX, FiSearch, FiBell, FiLock, FiTerminal, FiDatabase, FiLayers } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import AnnouncementBar from "../components/layout/AnnouncementBar";

const API_URL = import.meta.env.VITE_API_URL || "";

const AdminPageLoader = () => (
  <div className="w-full animate-pulse space-y-8 p-6">
    <div className="flex justify-between items-center">
      <div className="space-y-3">
        <div className="h-8 w-48 bg-stone-200 rounded-lg" />
        <div className="h-4 w-32 bg-stone-100 rounded" />
      </div>
      <div className="h-10 w-40 bg-stone-200 rounded-xl" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-white border border-stone-100 rounded-3xl" />
      ))}
    </div>
    <div className="h-96 bg-white border border-stone-100 rounded-3xl" />
  </div>
);

const ROUTE_METADATA = {
  "/admin": { title: "Command Center", subtitle: "Real-time commerce operations & telemetry hub", emoji: "📡" },
  "/admin/": { title: "Command Center", subtitle: "Real-time commerce operations & telemetry hub", emoji: "📡" },
  "/admin/dashboard": { title: "Command Center", subtitle: "Real-time commerce operations & telemetry hub", emoji: "📡" },
  "/admin/products": { title: "Inventory & Catch Catalog", subtitle: "Manage species, pricing, and stock levels", emoji: "🐟" },
  "/admin/add-product": { title: "Register New Catch", subtitle: "Introduce fresh marine arrivals to the catalog", emoji: "➕" },
  "/admin/orders": { title: "Order Fulfillment Matrix", subtitle: "Fulfill, dispatch, and track live order lifecycles", emoji: "📦" },
  "/admin/users": { title: "Identity & Accounts Management", subtitle: "Manage customers, vendors, and operator accounts", emoji: "👥" },
  "/admin/messages": { title: "Communications Hub", subtitle: "Real-time chat and operator interventions", emoji: "💬" },
  "/admin/reviews": { title: "Reputation Audit", subtitle: "Verify customer reviews, feedback, and ratings", emoji: "⭐️" },
  "/admin/pos": { title: "Point of Sale (POS)", subtitle: "Direct-to-customer retail billing checkout console", emoji: "🖨️" },
  "/admin/coupons": { title: "Loyalty & Promotion Center", subtitle: "Configure dynamic discount rates and vouchers", emoji: "🎟️" },
  "/admin/flash-sale": { title: "Flash Sales Coordinator", subtitle: "Schedule time-locked discount campaigns", emoji: "⚡" },
  "/admin/marketing": { title: "Marketing Campaigns", subtitle: "Enterprise promotion strategies and user banners", emoji: "📢" },
  "/admin/watchtower": { title: "Enterprise Watchtower", subtitle: "High-integrity audit trails, errors, and system activity logs", emoji: "🛡️" },
  "/admin/carts": { title: "Abandoned Cart Recovery", subtitle: "Analyze and incentivize pending checkouts", emoji: "🛒" },
  "/admin/settings": { title: "Enterprise Settings", subtitle: "Global flags, operational banners, and key configuration", emoji: "⚙️" },
  "/admin/analytics": { title: "Performance Analytics", subtitle: "Aggregated growth, margins, and sales metrics", emoji: "📈" },
  "/admin/delivery": { title: "Logistics & Fleet Registry", subtitle: "Active dispatch vehicles, routes, and agents", emoji: "🚚" },
  "/admin/fleet": { title: "Logistics & Fleet Registry", subtitle: "Active dispatch vehicles, routes, and agents", emoji: "🚚" },
  "/admin/iam": { title: "Team Identity Management (IAM)", subtitle: "System operator credentials and permissions", emoji: "🔑" },
  "/admin/registry": { title: "Vendor & Partner Registry", subtitle: "Authorized landing harbor coordinates and profiles", emoji: "⚓" },
  "/admin/discovery": { title: "Search & Discovery Engine", subtitle: "Synonyms, redirects, and search gaps analyzer", emoji: "🔍" },
  "/admin/complaints": { title: "Escalation & Resolution Center", subtitle: "Verify refunds, disputes, and customer complaints", emoji: "🚨" },
  "/admin/radar": { title: "Live Satellite Radar", subtitle: "Simulated fleet coordination and vessel tracking", emoji: "🛰️" },
  "/admin/pulse": { title: "Storefront Pulse Monitor", subtitle: "Real-time telemetry of user sessions and cart actions", emoji: "💓" },
  "/admin/xray": { title: "System X-Ray Audits", subtitle: "Low-level API logs, query benchmarks, and server telemetry", emoji: "💀" },
  "/admin/pricing-engine": { title: "AI Dynamic Pricing Engine", subtitle: "Weather-adaptive pricing curves linked to landing scarcity", emoji: "🌦️" },
  "/admin/compliance": { title: "Cold-Chain Compliance Audit Panel", subtitle: "Transit temperature coordinates & proactive quality-recovery logs", emoji: "📋" },
  "/admin/returns": { title: "Freshness Return Claims Queue", subtitle: "Review, approve or dispute freshness guarantee refund requests", emoji: "🔄" },
  "/admin/campaigns": { title: "Multi-Channel Notification Orchestrator", subtitle: "Email, Web Push, SMS and WhatsApp marketing manager", emoji: "📣" },
  "/admin/ab-tests": { title: "Storefront split-testing engine", subtitle: "Deploy and analyze layout, pricing and banner A/B tests", emoji: "🔬" },
  "/admin/health-scores": { title: "Customer Churn & Health Scores", subtitle: "AI Customer retention scoring metrics dashboard", emoji: "👥" }
};

const COMMANDS = [
  { category: "Navigation", title: "Go to Dashboard / Command Center", path: "/admin/dashboard", icon: "📊" },
  { category: "Navigation", title: "Go to POS Terminal", path: "/admin/pos", icon: "🖨️" },
  { category: "Navigation", title: "Go to Products Catalog", path: "/admin/products", icon: "🐟" },
  { category: "Navigation", title: "Register New Fresh Catch", path: "/admin/add-product", icon: "➕" },
  { category: "Navigation", title: "Go to Orders matrix", path: "/admin/orders", icon: "📦" },
  { category: "Navigation", title: "Go to Live Delivery Radar", path: "/admin/radar", icon: "🛰️" },
  { category: "Navigation", title: "Go to Storefront Pulse Monitor", path: "/admin/pulse", icon: "💓" },
  { category: "Navigation", title: "Go to X-Ray observatory", path: "/admin/xray", icon: "💀" },
  { category: "Navigation", title: "Go to AI Pricing Engine", path: "/admin/pricing-engine", icon: "🌦️" },
  { category: "Navigation", title: "Go to Registry Audit Ledger", path: "/admin/registry", icon: "⚓" },
  
  { category: "Actions", title: "Switch to Bhimavaram Hub", action: "switch_bhimavaram", icon: "🏢" },
  { category: "Actions", title: "Switch to Vijayawada Hub", action: "switch_vijayawada", icon: "🏢" },
  { category: "Actions", title: "Logout / Lock Session", action: "logout", icon: "🔒" }
];

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [settings, setSettings] = useState({ isMaintenanceMode: false, maintenanceMessage: "", banner: { active: false, image: "", text: "" } });
  const [notifications, setNotifications] = useState([]); 
  const [unreadCount, setUnreadCount] = useState(0); 
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Hub states
  const [activeHub, setActiveHub] = useState("Bhimavaram Hub");
  const [loadingHub, setLoadingHub] = useState(false);

  // Command palette states
  const [cmdKOpen, setCmdKOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const cmdInputRef = useRef(null);

  const switchHub = (hub) => {
    setLoadingHub(true);
    setActiveHub(hub);
    toast.success(`Switched active context to ${hub}`);
    setTimeout(() => {
      setLoadingHub(false);
    }, 600);
  };

  const getMetadata = () => {
    const path = location.pathname.replace(/\/$/, "");
    if (path.startsWith("/admin/edit-product/")) {
      return { title: "Edit Catch", subtitle: "Update inventory catalog parameters", emoji: "📝" };
    }
    return ROUTE_METADATA[path] || ROUTE_METADATA[`${path}/`] || {
      title: "System Control",
      subtitle: "SeaBite Enterprise Administration Portal",
      emoji: "🛡️"
    };
  };

  const currentRoute = getMetadata();

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/enterprise/settings`, { withCredentials: true });
      if (data && typeof data === "object") {
        setSettings(data);
      }
    } catch (err) {
      if (err.response?.status === 401) navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/notifications`, { withCredentials: true });
      const list = Array.isArray(data) ? data : [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read).length);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); 
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const isSuperAdmin = user?.email?.toLowerCase().includes("lokeshsattineni018");

  useEffect(() => {
    if (user && !isSuperAdmin) {
      const handleGlobalClick = (e) => {
        // Target elements that can cause mutations
        const target = e.target.closest("button, input, select, textarea, [role='checkbox'], [role='button']");
        if (!target) return;

        // Allow all sidebar clicks (expanding/collapsing categories, navigation)
        if (target.closest("aside")) {
          return;
        }

        // Allow list:
        const isSearch = target.tagName === "INPUT" && (target.type === "search" || target.placeholder?.toLowerCase().includes("search") || target.className?.toLowerCase().includes("search"));
        const isDashboardSelector = target.tagName === "SELECT" && (target.className?.includes("dashboard-selector") || target.innerHTML?.includes("Dashboard"));
        const isCloseButton = target.tagName === "BUTTON" && (target.className?.includes("close") || target.innerHTML?.includes("FiX") || target.closest("button")?.innerHTML?.includes("FiX"));
        const isNavigation = target.tagName === "BUTTON" && (target.className?.includes("sidebar-link") || target.className?.includes("nav") || target.textContent?.toLowerCase().includes("prev") || target.textContent?.toLowerCase().includes("next") || target.textContent?.toLowerCase().includes("page"));

        if (isSearch || isDashboardSelector || isCloseButton || isNavigation) {
          return; // Let it proceed
        }

        // Detect if it's a mutation element
        const isInputMutation = (target.tagName === "INPUT" && target.type !== "search") || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
        const isMutationButton = target.tagName === "BUTTON" && (
          target.type === "submit" ||
          /save|delete|add|update|apply|create|deploy|adjust|restrict|lift|sync|send|run|restart|approve|reject|refund|toggle|ban|action|submit/i.test(target.textContent || "") ||
          /save|delete|add|update|apply|create|deploy|adjust|restrict|lift|sync|send|run|restart|approve|reject|refund|toggle|ban|action|submit/i.test(target.className || "")
        );
        const isToggleClick = target.className?.toLowerCase().includes("toggle") || target.closest("[class*='toggle']") || target.closest("[class*='switch']");

        if (isInputMutation || isMutationButton || isToggleClick) {
          e.stopPropagation();
          e.preventDefault();
          // Silently block - no toast message popup
        }
      };
      
      document.addEventListener("click", handleGlobalClick, true);
      return () => document.removeEventListener("click", handleGlobalClick, true);
    }
  }, [user, isSuperAdmin]);

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_URL}/api/admin/notifications/read-all`, {}, { withCredentials: true });
      fetchNotifications();
      toast.success("All marked as read");
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (data) => {
      const audio = new Audio("https://cdn.freesound.org/previews/536/536108_1415754-lq.mp3");
      audio.play().catch(e => console.log("Audio play failed", e));

      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold">New Order Received!</span>
          <span className="text-xs">{(data.items || []).length} items • ₹{data.amount}</span>
        </div>,
        { duration: 5000, icon: '🔔' }
      );
    };

    socket.on('ORDER_PLACED', handleNewOrder);
    return () => socket.off('ORDER_PLACED', handleNewOrder);
  }, [socket]);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdKOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (cmdKOpen && cmdInputRef.current) {
      cmdInputRef.current.focus();
      setSelectedIndex(0);
    }
  }, [cmdKOpen]);

  const updateBanner = async (newBanner) => {
    try {
      const { data } = await axios.put(`${API_URL}/api/admin/enterprise/settings`, { ...settings, banner: newBanner }, { withCredentials: true });
      setSettings(data);
      toast.success("Banner updated successfully");
    } catch (err) {
      toast.error("Failed to update banner");
    }
  };

  const filteredCommands = COMMANDS.filter(cmd =>
    cmd.title.toLowerCase().includes(cmdQuery.toLowerCase()) ||
    cmd.category.toLowerCase().includes(cmdQuery.toLowerCase())
  );

  const handleCommandSelect = (cmd) => {
    setCmdKOpen(false);
    setCmdQuery("");
    if (cmd.path) {
      navigate(cmd.path);
    } else if (cmd.action) {
      if (cmd.action === "switch_bhimavaram") {
        switchHub("Bhimavaram Hub");
      } else if (cmd.action === "switch_vijayawada") {
        switchHub("Vijayawada Hub");
      } else if (cmd.action === "logout") {
        navigate("/login");
      }
    }
  };

  const handlePaletteKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleCommandSelect(filteredCommands[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setCmdKOpen(false);
    }
  };

  return (
    <div className={`admin-root flex h-screen w-full bg-[#fafaf9] font-sans text-stone-900 overflow-hidden selection:bg-stone-200 selection:text-stone-900 ${!isSuperAdmin ? "read-only-admin-mode" : ""}`}>
      {!isSuperAdmin && (
        <style dangerouslySetInnerHTML={{__html: `
          .read-only-admin-mode button:not(.sidebar-link):not(.nav-button):not(.search-btn):not([class*='view']):not([class*='View']):not([class*='detail']):not([class*='Detail']):not([class*='close']):not([class*='Close']):not([class*='nav-select']),
          .read-only-admin-mode input:not([type="search"]),
          .read-only-admin-mode select:not(.nav-select):not([class*='selector']),
          .read-only-admin-mode textarea {
            cursor: not-allowed !important;
            opacity: 0.65 !important;
          }
        `}} />
      )}

      {/* 🟢 Mobile Header */}
      <header 
        className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-stone-200/60 z-40 flex items-center justify-between px-6"
      >
        <div className="flex items-center gap-3">
          <img src="/roundlogo.webp" alt="SeaBite" width={32} height={32} className="h-8 w-8 mix-blend-multiply" />
          <span className="font-bold text-lg tracking-tight text-stone-800">Admin</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2.5 bg-stone-100 text-stone-600 rounded-xl active:scale-95 transition-all"
        >
          <FiMenu size={22} />
        </button>
      </header>

      {/* 🟢 Sidebar (Desktop) */}
      <aside 
        className="hidden md:flex flex-col w-[280px] bg-stone-50/50 border-r border-stone-200/60 z-30 h-full"
      >
        <AdminSidebar settings={settings} onUpdateBanner={updateBanner} />
      </aside>

      {/* 🟢 Main Content Area */}
      <main 
        className="flex-1 relative overflow-y-auto overflow-x-hidden pt-16 md:pt-0 scroll-smooth bg-[#fafaf9] h-full"
      >
        {!isSuperAdmin && (
          <div className="bg-amber-500/10 border-b border-amber-500/25 px-8 py-2.5 text-xs text-amber-700 font-bold flex items-center gap-2 select-none sticky top-0 z-30 backdrop-blur-md">
            <FiLock className="animate-pulse flex-shrink-0" /> <span>Read-Only Admin Mode — You have access to view all reports and telemetry, but are restricted from modifying settings or products.</span>
          </div>
        )}
        {/* Top Navigation Bar (Desktop) - Unified Dashboard Header */}
        <div className="hidden md:flex items-center justify-between px-8 py-3 sticky top-0 bg-[#fafaf9]/95 backdrop-blur-md z-20 border-b border-stone-200/40">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-xl select-none" role="img" aria-label={currentRoute.title}>
                {currentRoute.emoji}
              </span>
              <div>
                <h1 className="text-base font-black text-stone-900 tracking-tight leading-tight">
                  {currentRoute.title}
                </h1>
                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  {currentRoute.subtitle}
                </p>
              </div>
            </div>
            <div className="h-8 w-px bg-stone-200/60" />
            
            {/* Dashboard Selector */}
            <div className="relative flex items-center">
              <select
                value="admin"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "driver") navigate("/driver");
                  if (val === "support") navigate("/support");
                }}
                className="bg-stone-100 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-800 focus:outline-none cursor-pointer hover:bg-stone-200/60 transition-colors"
              >
                <option value="admin">🏢 Admin Dashboard</option>
                <option value="driver">🛵 Driver Dashboard</option>
                <option value="support">🎧 Support Dashboard</option>
              </select>
            </div>
            
            <div className="h-8 w-px bg-stone-200/60" />
            <div className="px-3 py-1.5 bg-stone-100/50 rounded-full border border-stone-200/40 flex items-center gap-2">
              <span className="text-[9px] font-bold text-stone-500 uppercase tracking-tighter">Operator:</span>
              <span className="text-[10px] font-bold text-stone-800 uppercase">{user?.name?.split(" ")[0] || "Operator"}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Hotkeys helper info */}
            <span className="text-[10px] text-stone-400 font-bold bg-stone-100 border border-stone-200/40 px-2.5 py-1.5 rounded-xl uppercase">
              Press <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border shadow-sm">⌘K</kbd> to search
            </span>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-3 bg-white border rounded-2xl transition-all shadow-sm active:scale-95 ${showNotifications ? "text-stone-900 border-stone-300 ring-4 ring-stone-100" : "text-stone-400 border-stone-200/80 hover:text-stone-900 hover:border-stone-300"}`}
              >
                <FiBell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-3 w-4 h-4 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-3 w-80 bg-white rounded-3xl shadow-xl border border-stone-100 p-2 z-50 transform origin-top-right transition-all"
                    >
                      <div className="px-4 py-3 border-b border-stone-50 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Notifications</span>
                        <button onClick={markAllAsRead} className="text-[10px] font-bold text-stone-900 cursor-pointer hover:underline disabled:opacity-50" disabled={unreadCount === 0}>
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                           <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-3 text-stone-300">
                              <FiBell size={20} />
                            </div>
                            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">No new alerts</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-stone-50">
                            {notifications.map((notif) => (
                              <div key={notif._id} className={`p-4 hover:bg-stone-50 transition-all ${!notif.read ? 'bg-stone-50/50' : ''}`}>
                                <div className="flex justify-between items-start gap-3">
                                  <p className={`text-xs ${!notif.read ? 'font-bold text-stone-900' : 'text-stone-500'}`}>
                                    {notif.message}
                                  </p>
                                  {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />}
                                </div>
                                <p className="text-[10px] text-stone-400 mt-1">
                                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center gap-3 pl-4 border-l border-stone-200">
              <div
                onClick={() => navigate("/profile")}
                className="w-10 h-10 rounded-2xl bg-stone-900 p-0.5 shadow-lg shadow-stone-200 cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="w-full h-full rounded-2xl bg-stone-900 flex items-center justify-center text-xs font-bold text-white border border-white/20">
                  {user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "AD"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-8 pb-6 min-h-full">
          {loadingHub ? (
            <AdminPageLoader />
          ) : (
            <Suspense fallback={<AdminPageLoader />}>
              <Outlet context={{ settings, setSettings, fetchSettings, activeHub, switchHub }} />
            </Suspense>
          )}
        </div>
      </main>

      {/* 🟢 Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-white z-50 md:hidden shadow-2xl flex flex-col"
            >
              <div className="p-5 flex justify-end border-b border-stone-100">
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 text-stone-400 hover:bg-stone-50 rounded-xl transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto" onClick={() => setIsSidebarOpen(false)}>
                <AdminSidebar settings={settings} onUpdateBanner={updateBanner} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ⌨️ Immersive Keyboard Command Modal (Cmd+K) */}
      <AnimatePresence>
        {cmdKOpen && (
          <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-24 px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCmdKOpen(false)}
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onKeyDown={handlePaletteKeyDown}
              className="relative w-full max-w-xl bg-white border border-stone-200 shadow-2xl rounded-3xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-6 py-4 border-b border-stone-100 bg-stone-50/50">
                <FiSearch className="text-stone-400" size={18} />
                <input
                  ref={cmdInputRef}
                  type="text"
                  placeholder="Type a navigation command or action..."
                  value={cmdQuery}
                  onChange={(e) => { setCmdQuery(e.target.value); setSelectedIndex(0); }}
                  className="w-full bg-transparent border-none outline-none text-stone-800 text-sm font-semibold placeholder-stone-400"
                />
                <span className="text-[10px] text-stone-400 font-bold bg-white px-2 py-1 rounded border shadow-sm select-none">ESC</span>
              </div>

              <div className="max-h-[350px] overflow-y-auto p-2">
                {filteredCommands.length > 0 ? (
                  <div>
                    {/* Render Category Grouped Lists */}
                    {["Navigation", "Actions"].map(cat => {
                      const categoryItems = filteredCommands.filter(c => c.category === cat);
                      if (categoryItems.length === 0) return null;
                      
                      return (
                        <div key={cat} className="mb-2">
                          <div className="px-4 py-2 text-[9px] font-black text-stone-400 uppercase tracking-widest">{cat}</div>
                          {categoryItems.map(cmd => {
                            // Find absolute index in filtered list
                            const absIndex = filteredCommands.indexOf(cmd);
                            const active = absIndex === selectedIndex;
                            return (
                              <div
                                key={cmd.title}
                                onClick={() => handleCommandSelect(cmd)}
                                onMouseEnter={() => setSelectedIndex(absIndex)}
                                className={`px-4 py-3 rounded-2xl cursor-pointer transition-all flex items-center justify-between ${active ? 'bg-stone-100 text-stone-900 font-bold' : 'text-stone-600'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-base select-none">{cmd.icon}</span>
                                  <span className="text-xs">{cmd.title}</span>
                                </div>
                                {active && (
                                  <span className="text-[9px] text-stone-400 font-mono bg-white border px-1.5 py-0.5 rounded shadow-sm">⏎ ENTER</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-stone-400 text-xs font-bold">
                    No matching commands found.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}