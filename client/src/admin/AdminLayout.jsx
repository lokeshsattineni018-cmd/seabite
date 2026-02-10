import { useState, Suspense } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { FiMenu, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

// ✅ Proper Skeleton that stays inside the content area
const AdminPageLoader = () => (
  <div className="w-full animate-pulse space-y-8">
    <div className="flex justify-between items-center">
      <div className="h-8 w-48 bg-slate-200 rounded-lg" />
      <div className="h-10 w-32 bg-slate-200 rounded-lg" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="h-32 bg-slate-100 rounded-2xl" />
      <div className="h-32 bg-slate-100 rounded-2xl" />
      <div className="h-32 bg-slate-100 rounded-2xl" />
    </div>
    <div className="h-64 bg-slate-50 rounded-3xl border border-slate-100" />
  </div>
);

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    // ✅ Use h-screen + overflow-hidden to lock the layout and prevent white flashes
    <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden relative">
      
      {/* 1. STABLE BACKGROUND: This layer NEVER moves or flashes */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-slate-50">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px] translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-slate-200/40 rounded-full blur-[100px] -translate-x-1/4 translate-y-1/4" />
      </div>

      {/* 2. MOBILE TOP BAR */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-[40] flex items-center justify-between px-6">
        <span className="font-serif font-bold text-xl text-slate-900 tracking-tight">Admin Panel</span>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 bg-slate-100 rounded-lg text-slate-600 active:bg-slate-200 transition-colors"
        >
          <FiMenu size={24} />
        </button>
      </header>

      {/* 3. DESKTOP SIDEBAR: flex-col + h-full ensures bottom buttons are visible */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-slate-200 z-30 relative h-full">
        <AdminSidebar />
      </aside>

      {/* 4. MAIN CONTENT: independent scroll keeps Sidebar and Buttons fixed */}
      <main className="flex-1 relative z-10 overflow-y-auto scroll-smooth h-full pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-10 min-h-full">
          {/* ✅ Localized Suspense prevents the entire layout from resetting */}
          <Suspense fallback={<AdminPageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      {/* 5. MOBILE DRAWER */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[50] md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white z-[60] md:hidden shadow-2xl flex flex-col"
            >
              <div className="p-4 flex justify-end">
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
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