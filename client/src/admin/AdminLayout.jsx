// AdminLayout.jsx
import { useState, Suspense } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { FiMenu, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const AdminPageLoader = () => (
  <div className="w-full animate-pulse space-y-8 p-2">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-slate-200/60 rounded-lg" />
        <div className="h-4 w-32 bg-slate-100 rounded" />
      </div>
      <div className="h-9 w-28 bg-slate-200/40 rounded-xl" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-100/60 rounded-2xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 h-72 bg-slate-100/40 rounded-2xl" />
      <div className="h-72 bg-slate-100/40 rounded-2xl" />
    </div>
  </div>
);

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] font-sans overflow-hidden relative">
      
      {/* Subtle Background Gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-slate-200/30 rounded-full blur-[120px] translate-y-1/4" />
      </div>

      {/* Mobile Top Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 z-[40] flex items-center justify-between px-5">
        <span className="font-bold text-lg text-slate-900 tracking-tight">SeaBite Admin</span>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 bg-slate-100 rounded-xl text-slate-600 active:bg-slate-200 transition-colors"
        >
          <FiMenu size={20} />
        </motion.button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 lg:w-[260px] bg-white border-r border-slate-200/80 z-30 relative h-full">
        <AdminSidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative z-10 overflow-y-auto scroll-smooth h-full pt-14 md:pt-0">
        <div className="max-w-[1400px] mx-auto min-h-full">
          <Suspense fallback={<AdminPageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[50] md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[60] md:hidden shadow-2xl flex flex-col"
            >
              <div className="p-3 flex justify-end">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <FiX size={22} />
                </motion.button>
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