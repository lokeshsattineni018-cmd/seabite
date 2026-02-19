// AdminLayout.jsx
import { useState, Suspense, useEffect, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import axios from "axios";
import toast from "react-hot-toast";
import { FiMenu, FiX, FiSearch, FiBell } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../context/SocketContext";

const AdminPageLoader = () => (
  <div className="w-full animate-pulse space-y-8 p-6">
    <div className="flex justify-between items-center">
      <div className="space-y-3">
        <div className="h-8 w-48 bg-stone-200 rounded-lg" />
        <div className="h-4 w-32 bg-stone-100 rounded" />
      </div>
      <div className="h-10 w-32 bg-stone-200 rounded-xl" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-40 bg-white border border-stone-100 rounded-2xl shadow-sm" />
      ))}
    </div>
    <div className="h-96 bg-white border border-stone-100 rounded-2xl shadow-sm" />
  </div>
);

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [settings, setSettings] = useState({ isMaintenanceMode: false, maintenanceMessage: "", banner: { active: false, image: "", text: "" } });
  const navigate = useNavigate();

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
          <img src="/round-logo.png" alt="SeaBite" className="h-8 w-auto mix-blend-multiply" />
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
      <main className="flex-1 relative z-10 overflow-y-auto overflow-x-hidden h-full pt-16 md:pt-0 scroll-smooth bg-[#fafaf9]">
        {/* Top Navigation Bar (Desktop) */}
        <div className="hidden md:flex items-center justify-between px-8 py-5 sticky top-0 bg-[#fafaf9]/90 backdrop-blur-sm z-20 mb-2">
          <div>
            <h1 className="text-xl font-bold text-stone-800 tracking-tight">Overview</h1>
            <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-0.5">Welcome back, Lokesh</p>
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
            <div className="relative group">
              <button className="relative p-3 bg-white border border-stone-200/80 rounded-2xl text-stone-400 hover:text-stone-900 hover:border-stone-300 transition-all shadow-sm active:scale-95">
                <FiBell size={20} />
                <span className="absolute top-2.5 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
              </button>

              {/* Dropdown Content (Hover or Focus) */}
              <div className="absolute right-0 top-full mt-3 w-80 bg-white rounded-3xl shadow-xl border border-stone-100 p-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all z-50 transform origin-top-right scale-95 group-hover:scale-100">
                <div className="px-4 py-3 border-b border-stone-50 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Notifications</span>
                  <span className="text-[10px] font-bold text-stone-900 cursor-pointer hover:underline">Mark read</span>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-3 text-stone-300">
                      <FiBell size={20} />
                    </div>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">No new alerts</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center gap-3 pl-4 border-l border-stone-200">
              <div className="w-10 h-10 rounded-2xl bg-stone-900 p-0.5 shadow-lg shadow-stone-200 cursor-pointer hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-2xl bg-stone-900 flex items-center justify-center text-xs font-bold text-white border border-white/20">LS</div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-8 pb-10 min-h-full">
          <Suspense fallback={<AdminPageLoader />}>
            <Outlet context={{ settings, setSettings, fetchSettings }} />
          </Suspense>
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
    </div>
  );
}