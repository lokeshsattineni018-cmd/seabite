// AdminLayout.jsx
import { useState, Suspense, useEffect, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import axios from "axios";
import toast from "react-hot-toast";
import { FiMenu, FiX, FiSearch, FiBell } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";

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

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [settings, setSettings] = useState({ isMaintenanceMode: false, maintenanceMessage: "", banner: { active: false, image: "", text: "" } });
  const [notifications, setNotifications] = useState([]); // 🟢 Added
  const [unreadCount, setUnreadCount] = useState(0); // 🟢 Added
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/admin/enterprise/settings", { withCredentials: true });
      setSettings(data);
    } catch (err) {
      if (err.response?.status === 401) navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // 🟢 NEW: Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/admin/notifications", { withCredentials: true });
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllAsRead = async () => {
    try {
      await axios.put("/api/admin/notifications/read-all", {}, { withCredentials: true });
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
      // Play sound
      const audio = new Audio("https://cdn.freesound.org/previews/536/536108_1415754-lq.mp3"); // Simple ding sound
      audio.play().catch(e => console.log("Audio play failed (user interaction needed)", e));

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

  const updateBanner = async (newBanner) => {
    try {
      const { data } = await axios.put("/api/admin/enterprise/settings", { ...settings, banner: newBanner }, { withCredentials: true });
      setSettings(data);
      toast.success("Banner updated successfully");
    } catch (err) {
      toast.error("Failed to update banner");
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#fafaf9] font-sans text-stone-900 overflow-hidden selection:bg-stone-200 selection:text-stone-900">

      {/* 🟢 Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-stone-200/60 z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <img src="/roundlogo.png" alt="SeaBite" className="h-8 w-auto mix-blend-multiply" />
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
      <aside className="hidden md:flex flex-col w-[280px] bg-stone-50/50 border-r border-stone-200/60 z-30 h-full">
        <AdminSidebar settings={settings} onUpdateBanner={updateBanner} />
      </aside>

      {/* 🟢 Main Content Area */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden h-full pt-16 md:pt-0 scroll-smooth bg-[#fafaf9]">
        {/* Top Navigation Bar (Desktop) */}
        <div className="hidden md:flex items-center justify-between px-8 py-5 sticky top-0 bg-[#fafaf9]/95 backdrop-blur-md z-20 border-b border-stone-200/40">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-xl font-bold text-stone-900 tracking-tight">System Control</h1>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                Live: {user?.name?.split(" ")[0] || "Operator"}
              </p>
            </div>
            <div className="h-8 w-px bg-stone-200/60" />
            <div className="px-3 py-1.5 bg-stone-100/50 rounded-full border border-stone-200/40 flex items-center gap-2">
              <span className="text-[9px] font-bold text-stone-500 uppercase tracking-tighter">Status:</span>
              <span className="text-[10px] font-bold text-stone-800 uppercase">Operational</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-600 transition-colors" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-11 pr-4 py-2.5 bg-white border border-stone-200/80 rounded-2xl text-sm w-64 focus:w-80 transition-all outline-none focus:ring-4 focus:ring-stone-100 focus:border-stone-300 shadow-sm font-medium text-stone-600 placeholder:text-stone-300"
              />
            </div>

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
                    </motion.div >
                  </>
                )}
              </AnimatePresence >
            </div >

            {/* Profile Avatar */}
            < div className="flex items-center gap-3 pl-4 border-l border-stone-200" >
              <div
                onClick={() => navigate("/profile")}
                className="w-10 h-10 rounded-2xl bg-stone-900 p-0.5 shadow-lg shadow-stone-200 cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="w-full h-full rounded-2xl bg-stone-900 flex items-center justify-center text-xs font-bold text-white border border-white/20">
                  {user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "AD"}
                </div>
              </div>
            </div >
          </div >
        </div >

        <div className="px-4 md:px-8 pb-6 min-h-full">
          <Suspense fallback={<AdminPageLoader />}>
            <Outlet context={{ settings, setSettings, fetchSettings }} />
          </Suspense>
        </div>
      </main >

      {/* 🟢 Mobile Sidebar Drawer */}
      < AnimatePresence >
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
      </AnimatePresence >
    </div >
  );
}