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
          } max-w-md w-full bg-[#5BBFB5] shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          style={{
            ...options.style,
            background: "#5BBFB5",
            color: "#fff",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "13px",
            fontWeight: "600",
            fontFamily: "'Manrope', sans-serif",
            pointerEvents: "auto",
          }}
        >
          <div className="flex-1 flex items-center gap-3">
             <span style={{ fontSize: "18px" }}>{options.icon || "🛒"}</span>
             <p>{message}</p>
          </div>
          <div className="flex border-l border-white/20 pl-3">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg flex items-center justify-center text-sm font-medium text-white hover:text-white/80 focus:outline-none"
              style={{ transition: "color 0.2s", pointerEvents: "auto" }}
            >
              <FiX size={16} />
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
          } max-w-md w-full bg-[#F07468] shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          style={{
            ...options.style,
            background: "#F07468",
            color: "#fff",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "13px",
            fontWeight: "600",
            fontFamily: "'Manrope', sans-serif",
            pointerEvents: "auto",
          }}
        >
          <div className="flex-1 flex items-center gap-3">
             <span style={{ fontSize: "18px" }}>{options.icon || "❌"}</span>
             <p>{message}</p>
          </div>
          <div className="flex border-l border-white/20 pl-3">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg flex items-center justify-center text-sm font-medium text-white hover:text-white/80 focus:outline-none"
              style={{ transition: "color 0.2s", pointerEvents: "auto" }}
            >
              <FiX size={16} />
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
