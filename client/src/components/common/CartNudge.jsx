import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiShoppingBag, FiX, FiZap, FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function CartNudge({ isOpen, onClose, onApplyOffer }) {
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClaim = () => {
    onApplyOffer("SEABITE5"); // Extra 5% discount
    onClose();
    navigate("/checkout");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 100000,
            width: "340px",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(12px)",
            borderRadius: "24px",
            padding: "24px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            border: "1px solid rgba(91, 191, 181, 0.2)",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div style={{ width: "48px", height: "48px", background: "#E2F5F3", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: "#5BBFB5" }}>
              <FiShoppingBag size={24} />
            </div>
            <button 
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#999", padding: "4px" }}
            >
              <FiX size={20} />
            </button>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#1A2E2C", marginBottom: "6px" }}>
              Still Thinking? 🎣
            </h3>
            <p style={{ margin: 0, fontSize: "14px", color: "#6B8F8A", lineHeight: "1.5" }}>
              We've reserved your catch. Check out in the next <span style={{ color: "#E8816A", fontWeight: "700" }}>{formatTime(timeLeft)}</span> to get an extra <span style={{ color: "#5BBFB5", fontWeight: "800" }}>5% OFF</span>.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", background: "#F4F9F8", borderRadius: "12px", marginBottom: "20px" }}>
            <FiZap style={{ color: "#F59E0B" }} />
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#1A2E2C" }}>Code: SEABITE5</span>
            <div style={{ marginLeft: "auto", fontSize: "11px", fontWeight: "700", color: "#5BBFB5", textTransform: "uppercase" }}>Auto-Applied</div>
          </div>

          <button
            onClick={handleClaim}
            style={{
              width: "100%",
              padding: "14px",
              background: "#1A2E2C",
              color: "#fff",
              border: "none",
              borderRadius: "14px",
              fontWeight: "700",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: "pointer",
              boxShadow: "0 10px 20px rgba(26, 46, 44, 0.2)",
            }}
          >
            Claim & Checkout <FiArrowRight size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
