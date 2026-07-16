import toast from "react-hot-toast";
import { FiX } from "react-icons/fi";

/**
 * Custom SeaBite Toast Wrapper
 * Adds a dismissal (close) button and consistent teal styling.
 */
const showToast = {
  success: (message, options = {}) => {
    return toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } shadow-lg rounded-xl flex ring-1 ring-black ring-opacity-5`}
          style={{
            ...options.style,
            background: "#5BBFB5",
            color: "#fff",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "12.5px",
            fontWeight: "600",
            fontFamily: "'Manrope', sans-serif",
            pointerEvents: "auto",
            width: "320px",
            maxWidth: "320px",
          }}
        >
          <div className="flex-1 flex items-center gap-2">
             <span style={{ fontSize: "16px", flexShrink: 0 }}>{options.icon || "🛒"}</span>
             <p style={{ margin: 0, lineHeight: "1.4" }}>{message}</p>
          </div>
          <div className="flex border-l border-white/20 pl-1" style={{ pointerEvents: "auto", flexShrink: 0, alignItems: "center" }}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toast.dismiss(t.id);
              }}
              className="border border-transparent rounded-none rounded-r-lg flex items-center justify-center text-sm font-medium text-white hover:text-white/80 focus:outline-none cursor-pointer"
              style={{ transition: "color 0.2s", pointerEvents: "auto", width: "40px", height: "40px", background: "none" }}
            >
              <FiX size={18} />
            </button>
          </div>
        </div>
      ),
      {
        duration: 4500,
        position: "top-right",
        ...options,
      }
    );
  },
  
  error: (message, options = {}) => {
    return toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } shadow-lg rounded-xl flex ring-1 ring-black ring-opacity-5`}
          style={{
            ...options.style,
            background: "#F07468",
            color: "#fff",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "12.5px",
            fontWeight: "600",
            fontFamily: "'Manrope', sans-serif",
            pointerEvents: "auto",
            width: "320px",
            maxWidth: "320px",
          }}
        >
          <div className="flex-1 flex items-center gap-2">
             <span style={{ fontSize: "16px", flexShrink: 0 }}>{options.icon || "❌"}</span>
             <p style={{ margin: 0, lineHeight: "1.4" }}>{message}</p>
          </div>
          <div className="flex border-l border-white/20 pl-1" style={{ pointerEvents: "auto", flexShrink: 0, alignItems: "center" }}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toast.dismiss(t.id);
              }}
              className="border border-transparent rounded-none rounded-r-lg flex items-center justify-center text-sm font-medium text-white hover:text-white/80 focus:outline-none cursor-pointer"
              style={{ transition: "color 0.2s", pointerEvents: "auto", width: "40px", height: "40px", background: "none" }}
            >
              <FiX size={18} />
            </button>
          </div>
        </div>
      ),
      {
        duration: 4500,
        position: "top-right",
        ...options,
      }
    );
  }
};

export default showToast;
