import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { FiSend, FiX, FiMessageSquare } from "react-icons/fi";

const API = import.meta.env.VITE_API_URL || "";

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const phoneNumber = "9866635566"; 
  const whatsappMessage = "Hi SeaBite! I have a question about my order. 🦞";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.95 }}
            className="w-80 bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Widget Header */}
            <div className="p-4 bg-stone-50 border-b flex justify-between items-center">
              <span className="text-xs font-bold text-stone-850">SeaBite Live Assistant</span>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-stone-200 rounded-full transition-colors"
              >
                <FiX size={14} />
              </button>
            </div>

            {/* Content Tab (WhatsApp Only) */}
            <div className="p-6 flex flex-col items-center justify-center text-center">
              <span className="text-4xl mb-3">💬</span>
              <h4 className="text-sm font-bold text-stone-800">Message on WhatsApp</h4>
              <p className="text-xs text-stone-400 mt-2 max-w-[220px] leading-relaxed">
                Get instant order updates and support directly from our dispatch hub via WhatsApp.
              </p>
              <a
                href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 px-6 py-3 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all active:scale-95"
              >
                Open WhatsApp Chat
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-[#1A2B35] hover:bg-[#253d4a] text-white rounded-full shadow-[0_8px_30px_rgba(26,43,53,0.3)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
      >
        {isOpen ? (
          <FiX size={20} />
        ) : (
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/></svg>
        )}
      </button>
    </div>
  );
}