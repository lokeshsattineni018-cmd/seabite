import { motion, AnimatePresence } from "framer-motion";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from "react-icons/fi";

// Helper to determine styles based on type
const getModalStyles = (type) => {
  switch (type) {
    case "error":
      return {
        icon: <FiAlertCircle size={32} className="text-rose-500" />,
        bgIcon: "bg-rose-50",
        btn: "bg-rose-500 hover:bg-rose-600",
        title: "Oops!",
      };
    case "success":
      return {
        icon: <FiCheckCircle size={32} className="text-emerald-500" />,
        bgIcon: "bg-emerald-50",
        btn: "bg-emerald-500 hover:bg-emerald-600",
        title: "Success",
      };
    default: // info
      return {
        icon: <FiInfo size={32} className="text-blue-500" />,
        bgIcon: "bg-blue-50",
        btn: "bg-slate-900 hover:bg-slate-800",
        title: "Note",
      };
  }
};

export default function PopupModal({ show, message, type = "info", onClose }) {
  const style = getModalStyles(type);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* BACKDROP BLUR */}
          <motion.div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* MODAL CARD */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-6 md:p-8 text-center overflow-hidden"
          >
            {/* Decorative Top Gradient */}
            <div className={`absolute top-0 left-0 w-full h-1 ${style.btn.split(" ")[0]}`} />

            {/* Icon Bubble */}
            <div className={`mx-auto w-20 h-20 rounded-full ${style.bgIcon} flex items-center justify-center mb-5`}>
              {style.icon}
            </div>

            {/* Content */}
            <h3 className="text-2xl font-serif font-bold text-slate-800 mb-2">
              {style.title}
            </h3>
            
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              {message}
            </p>

            {/* Button */}
            <button
              onClick={onClose}
              className={`w-full py-3.5 rounded-full text-white font-medium shadow-lg shadow-gray-200 active:scale-95 transition-all duration-200 ${style.btn}`}
            >
              Okay, Got it
            </button>
            
            {/* Close X (Optional, top right) */}
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-300 hover:text-slate-600 transition-colors"
            >
                <FiX size={20} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}