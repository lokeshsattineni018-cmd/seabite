// src/admin/AdminLayout.jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { FiMenu, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans overflow-hidden relative">
      {/* Soft background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-blue-100/40 rounded-full blur-[90px] translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[360px] h-[360px] bg-slate-200/40 rounded-full blur-[80px] -translate-x-1/3 translate-y-1/3" />
      </div>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-[40] flex items-center justify-between px-6">
        <span className="font-serif font-bold text-xl text-slate-900 tracking-tight">
          Admin Panel
        </span>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 bg-slate-100 rounded-lg text-slate-600 active:bg-slate-200 transition-colors"
        >
          <FiMenu size={24} />
        </button>
      </header>

      {/* Mobile drawer */}
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
              className="fixed top-0 left-0 bottom-0 w-72 bg-white z-[60] md:hidden shadow-2xl"
            >
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600"
                >
                  <FiX size={24} />
                </button>
              </div>
              <div className="h-full pt-4" onClick={() => setIsSidebarOpen(false)}>
                <AdminSidebar />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 lg:w-72 bg-white border-r border-slate-200 z-20 flex-shrink-0 relative">
        <AdminSidebar />
      </aside>

      {/* Main content */}
      <main className="flex-1 relative z-10 overflow-y-auto scroll-smooth">
        <div className="max-w-7xl mx-auto p-4 md:p-10 pt-24 md:pt-10 min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
