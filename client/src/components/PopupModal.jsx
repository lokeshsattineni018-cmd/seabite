// src/components/PopupModal.jsx
import { motion, AnimatePresence } from "framer-motion";

export default function PopupModal({ show, message, type = "info", onClose }) {
  if (!show) return null;

  const colors = {
    success: "bg-emerald-500",
    error: "bg-rose-500",
    info: "bg-slate-700",
  };

  const titleMap = {
    success: "Success",
    error: "Error",
    info: "Notice",
  };

  const color = colors[type] || colors.info;
  const title = titleMap[type] || titleMap.info;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`w-full max-w-sm rounded-2xl p-5 text-white shadow-2xl ${color}`}
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm leading-relaxed">{message}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
