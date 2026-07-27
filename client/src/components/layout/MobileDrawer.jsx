import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser, FiPackage, FiBell, FiHeart, FiGrid,
  FiChevronDown, FiChevronRight, FiX
} from "react-icons/fi";

export default function MobileDrawer({ isOpen, onClose, user, unreadCount, onLogout, logoutLoading, onOpenAuth }) {
  const [showCatOpen, setShowCatOpen] = useState(true);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9998 }}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed", top: 0, left: 0,
              width: "80vw", maxWidth: "340px", height: "100dvh",
              background: "#fff", zIndex: 9999,
              display: "flex", flexDirection: "column",
              color: "#000", fontFamily: "'Manrope', sans-serif",
              boxShadow: "8px 0 40px rgba(0,0,0,0.15)",
              overscrollBehavior: "contain",
            }}
          >
            {/* Header */}
            <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0", flexShrink: 0 }}>
              <Link to="/" onClick={onClose} style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
                <img
                  src="/logo.webp"
                  alt="SeaBite"
                  width={66}
                  height={46}
                  style={{
                    height: "46px",
                    width: "auto",
                    objectFit: "contain"
                  }}
                />
              </Link>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{ background: "#f5f5f5", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", cursor: "pointer" }}
              >
                <FiX size={20} />
              </motion.button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }} className="drawer-scrollbar">

              {/* My Account */}
              <p style={{ fontSize: "10px", fontWeight: "800", color: "#8BA5B3", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "14px" }}>My Account</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "28px" }}>
                {user ? (
                  <>
                    <Link to="/profile" onClick={onClose} style={{ padding: "11px 12px", fontSize: "15px", fontWeight: "600", color: "#111", textDecoration: "none", display: "flex", alignItems: "center", gap: "12px", borderRadius: "10px" }}>
                      <FiUser size={17} color="#5BBFB5" /> Profile
                    </Link>
                    <Link to="/notifications" onClick={onClose} style={{ padding: "11px 12px", fontSize: "15px", fontWeight: "600", color: "#111", textDecoration: "none", display: "flex", alignItems: "center", gap: "12px", borderRadius: "10px", position: "relative" }}>
                      <FiBell size={17} color="#5BBFB5" /> Notifications
                      {unreadCount > 0 && <span style={{ position: "absolute", right: "12px", background: "#F07468", color: "#fff", padding: "2px 6px", borderRadius: "10px", fontSize: "10px", fontWeight: "800" }}>{unreadCount}</span>}
                    </Link>
                    <Link to="/orders" onClick={onClose} style={{ padding: "11px 12px", fontSize: "15px", fontWeight: "600", color: "#111", textDecoration: "none", display: "flex", alignItems: "center", gap: "12px", borderRadius: "10px" }}>
                      <FiPackage size={17} color="#5BBFB5" /> My Orders
                    </Link>
                    <Link to="/wishlist" onClick={onClose} style={{ padding: "11px 12px", fontSize: "15px", fontWeight: "600", color: "#111", textDecoration: "none", display: "flex", alignItems: "center", gap: "12px", borderRadius: "10px" }}>
                      <FiHeart size={17} color="#5BBFB5" /> Wishlist
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={() => { onOpenAuth(); onClose(); }}
                    style={{ padding: "11px 12px", fontSize: "15px", fontWeight: "600", color: "#111", background: "none", border: "none", display: "flex", alignItems: "center", gap: "12px", borderRadius: "10px", cursor: "pointer", textAlign: "left" }}
                  >
                    <FiUser size={17} color="#5BBFB5" /> Log In / Sign Up
                  </button>
                )}
              </div>

              {/* Shop — collapsible accordion, pre-open */}
              <div style={{ marginBottom: "28px" }}>
                <button
                  onClick={() => setShowCatOpen(o => !o)}
                  style={{
                    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "11px 12px", background: "none", border: "none",
                    fontSize: "15px", fontWeight: "700", color: "#111", cursor: "pointer",
                    borderRadius: "10px",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <FiGrid size={17} color="#5BBFB5" /> Shop
                  </span>
                  <FiChevronDown
                    size={17}
                    color="#aaa"
                    style={{ transform: showCatOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s ease" }}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {showCatOpen && (
                    <motion.div
                      key="cat-dropdown"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{ paddingLeft: "16px", paddingTop: "4px", display: "flex", flexDirection: "column", gap: "2px" }}>
                        {[
                          { label: "🐟 Fish", path: "/products?category=Fish" },
                          { label: "🦐 Prawns", path: "/products?category=Prawn" },
                          { label: "🦀 Crabs", path: "/products?category=Crab" },
                        ].map((item, idx) => (
                          <Link
                            key={idx}
                            to={item.path}
                            onClick={onClose}
                            style={{
                              padding: "10px 12px", fontSize: "14px", fontWeight: "600",
                              color: "#444", textDecoration: "none",
                              display: "flex", justifyContent: "space-between", alignItems: "center",
                              borderRadius: "8px",
                            }}
                          >
                            {item.label}
                            <FiChevronRight size={14} color="#ccc" />
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* More */}
              <p style={{ fontSize: "10px", fontWeight: "800", color: "#8BA5B3", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "14px" }}>More</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {[
                  { label: "About Us", path: "/about" },
                  { label: "Contact", path: "/contact" },
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    to={item.path}
                    onClick={onClose}
                    style={{ padding: "11px 12px", fontSize: "15px", fontWeight: "600", color: "#111", textDecoration: "none", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "10px" }}
                  >
                    {item.label} <FiChevronRight size={16} color="#ccc" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Footer */}
            {user && (
              <div style={{ padding: "16px 20px", borderTop: "1px solid #f0f0f0", flexShrink: 0 }}>
                <button
                  onClick={onLogout}
                  disabled={logoutLoading}
                  style={{ width: "100%", padding: "13px", borderRadius: "10px", background: "#1A2E2C", color: "#fff", border: "none", fontWeight: "700", fontSize: "14px", cursor: logoutLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  {logoutLoading && <div className="loading-spinner" style={{ width: "16px", height: "16px", border: "2px solid #fff", borderTopColor: "transparent" }} />}
                  <span>{logoutLoading ? "Signing Out..." : "Sign Out"}</span>
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
