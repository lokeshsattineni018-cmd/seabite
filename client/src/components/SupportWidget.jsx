import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);

  // 📞 REPLACE WITH YOUR REAL DETAILS
  const phoneNumber = "9866635566"; 
  const whatsappMessage = "Hi SeaBite! I have a question about my order. 🦞";

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <AnimatePresence>
        {isOpen && (
          <>
            {/* WhatsApp Button (Only this remains) */}
            <motion.a
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-4 py-2 rounded-full shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="text-sm font-medium">WhatsApp</span>
              <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </div>
            </motion.a>
          </>
        )}
      </AnimatePresence>

      {/* Main Trigger Button (Headset Icon) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
      >
        {isOpen ? (
          // Close Icon (X)
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        ) : (
          // Support Icon (Headset)
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/></svg>
        )}
      </button>
    </div>
  );
}