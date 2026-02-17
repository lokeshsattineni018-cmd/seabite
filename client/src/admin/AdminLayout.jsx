import { useState, Suspense } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { FiMenu, FiX, FiSearch, FiBell } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const AdminPageLoader = () => (
  <div className="w-full animate-pulse space-y-8 p-6">
    <div className="flex justify-between items-center">
      <div className="space-y-3">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="h-4 w-32 bg-slate-100 rounded" />
      </div>
      <div className="h-10 w-32 bg-slate-200 rounded-xl" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-40 bg-white border border-slate-100 rounded-2xl shadow-sm" />
      ))}
    </div>
    <div className="h-96 bg-white border border-slate-100 rounded-2xl shadow-sm" />
  </div>
);

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] font-sans text-slate-900 overflow-hidden selection:bg-blue-100 selection:text-blue-900">

      {/* 🟢 Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="SeaBite" className="h-8 w-auto" />
          <span className="font-bold text-lg tracking-tight text-slate-800">Admin</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2.5 bg-slate-100/50 text-slate-600 rounded-xl active:scale-95 transition-all"
        >
          <FiMenu size={22} />
        </button>
      </header>

      {/* 🟢 Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-[280px] bg-white border-r border-slate-200/60 z-30 h-full shadow-[4px_0_24px_-12px_rgba(0,0,0,0.02)]">
        <AdminSidebar />
      </aside>

      {/* 🟢 Main Content Area */}
      <main className="flex-1 relative z-10 overflow-y-auto overflow-x-hidden h-full pt-16 md:pt-0 scroll-smooth">
        {/* Top Navigation Bar (Desktop) */}
        <div className="hidden md:flex items-center justify-between px-8 py-5 sticky top-0 bg-[#f8fafc]/90 backdrop-blur-sm z-20 mb-2">
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Overview</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Welcome back, Lokesh</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative group">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-sm w-64 focus:w-80 transition-all outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 shadow-sm"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2.5 bg-white border border-slate-200/80 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95">
              <FiBell size={18} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* Profile Avatar */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 p-0.5 shadow-md shadow-blue-500/20 cursor-pointer hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xs font-bold text-blue-600">LS</div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-8 pb-10 min-h-full">
          <Suspense fallback={<AdminPageLoader />}>
            <Outlet />
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
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-[80%] max-w-[300px] bg-white z-50 md:hidden shadow-2xl flex flex-col"
            >
              <div className="p-4 flex justify-end border-b border-slate-100">
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto" onClick={() => setIsSidebarOpen(false)}>
                <AdminSidebar />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}