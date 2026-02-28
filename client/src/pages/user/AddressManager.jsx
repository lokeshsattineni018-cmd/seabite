/**
 * AddressManager.jsx — Premium Redesign
 *
 * Design: "Address Book"
 * ─────────────────────────────────────────────────────────────
 * Address management should feel like a polished mobile-app
 * settings panel — cards with clear hierarchy, smooth CRUD
 * animations, and a well-designed modal form.
 *
 * Key choices:
 *   • Address cards: Tap-to-select feeling with border + bg
 *     highlight on default. Edit/delete icons reveal on hover.
 *   • Delete: Uses window.confirm (matches original behaviour)
 *     but a future version could replace with an inline confirm.
 *   • Modal: AnimatePresence + spring scale entry. Backdrop blur.
 *     Delegates form rendering to AddressForm (unchanged).
 *   • Empty state: Centered map-pin with soft glow.
 *   • Add button: Teal filled, top-right of section header.
 *
 * All data contracts, API paths, and AddressForm integration
 * are unchanged from the original.
 */

import { useState, useEffect } from "react";
import axios from "axios";
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiX } from "react-icons/fi";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import AddressForm from "../../components/forms/AddressForm";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const T = {
  bg:        "#F7F8FA",
  surface:   "#FFFFFF",
  border:    "#EAECF0",
  ink:       "#0D1117",
  inkMid:    "#44505C",
  inkSoft:   "#8A96A3",
  inkGhost:  "#B8C0C8",
  teal:      "#4ECDC4",
  tealDeep:  "#38B2AC",
  tealGlow:  "rgba(78,205,196,0.12)",
  coral:     "#EF4444",
  coralBg:   "rgba(239,68,68,0.07)",
  shadow:    "0 1px 4px rgba(13,17,23,0.06), 0 3px 12px rgba(13,17,23,0.04)",
  shadowMd:  "0 6px 28px rgba(13,17,23,0.09), 0 1px 5px rgba(13,17,23,0.04)",
  shadowTeal:"0 8px 28px rgba(78,205,196,0.24)",
  ease:      [0.16, 1, 0.3, 1],
  spring:    { type: "spring", stiffness: 340, damping: 32 },
  r:         12,
  rLg:       18,
  rXl:       24,
  rFull:     9999,
};

// ─────────────────────────────────────────────────────────────
// ADDRESS CARD
// ─────────────────────────────────────────────────────────────
function AddressCard({ addr, onEdit, onDelete, reduced }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: reduced ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ duration: 0.36, ease: T.ease }}
      style={{
        padding: "16px 18px",
        borderRadius: T.r,
        background: addr.isDefault ? T.tealGlow : T.bg,
        border: `1.5px solid ${addr.isDefault ? `${T.teal}44` : T.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        gap: 14,
        transition: "background 0.2s, border-color 0.2s",
      }}
    >
      {/* Left: pin icon + details */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1, minWidth: 0 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: addr.isDefault ? T.teal : T.surface,
          border: `1px solid ${addr.isDefault ? T.teal : T.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: addr.isDefault ? T.surface : T.inkSoft,
          boxShadow: addr.isDefault ? T.shadowTeal : "none",
          transition: "all 0.2s",
        }}>
          <FiMapPin size={14} aria-hidden="true" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + default badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <h4 style={{
              fontFamily: "'DM Sans', sans-serif",
              margin: 0, fontSize: 14, fontWeight: 600, color: T.ink,
            }}>
              {addr.name}
            </h4>
            {addr.isDefault && (
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 9, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.1em",
                padding: "2px 8px", borderRadius: T.rFull,
                background: T.teal, color: T.surface,
              }}>
                Default
              </span>
            )}
          </div>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            margin: 0, fontSize: 12.5, color: T.inkMid, lineHeight: 1.55,
          }}>
            {addr.houseNo}, {addr.street}, {addr.city}, {addr.state} — {addr.postalCode}
          </p>
          {addr.phone && (
            <p style={{
              margin: "4px 0 0", fontSize: 11, color: T.inkSoft,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {addr.phone}
            </p>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        {/* Edit */}
        <motion.button
          whileHover={reduced ? {} : { scale: 1.12 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onEdit(addr)}
          aria-label={`Edit address: ${addr.name}`}
          style={{
            width: 34, height: 34, borderRadius: 9,
            background: T.surface, border: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: T.inkSoft, cursor: "pointer",
            transition: "color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = T.tealDeep; e.currentTarget.style.borderColor = T.teal; }}
          onMouseLeave={e => { e.currentTarget.style.color = T.inkSoft;  e.currentTarget.style.borderColor = T.border; }}
        >
          <FiEdit2 size={13} />
        </motion.button>

        {/* Delete */}
        <motion.button
          whileHover={reduced ? {} : { scale: 1.12 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onDelete(addr._id)}
          aria-label={`Delete address: ${addr.name}`}
          style={{
            width: 34, height: 34, borderRadius: 9,
            background: T.surface, border: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: T.inkSoft, cursor: "pointer",
            transition: "color 0.15s, border-color 0.15s, background 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = T.coral; e.currentTarget.style.borderColor = `rgba(239,68,68,0.3)`; e.currentTarget.style.background = T.coralBg; }}
          onMouseLeave={e => { e.currentTarget.style.color = T.inkSoft; e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface; }}
        >
          <FiTrash2 size={13} />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function AddressManager() {
  const [addresses,      setAddresses]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [modalOpen,      setModalOpen]      = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const reduced = useReducedMotion();

  const fetchAddresses = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/user/address`, { withCredentials: true });
      setAddresses(res.data);
    } catch {
      toast.error("Failed to fetch addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAddresses(); }, []);

  const openCreate = () => { setEditingAddress(null); setModalOpen(true); };
  const openEdit   = (addr) => { setEditingAddress(addr); setModalOpen(true); };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await axios.delete(`${API_URL}/api/user/address/${id}`, { withCredentials: true });
      toast.success("Address deleted");
      fetchAddresses();
    } catch {
      toast.error("Failed to delete address");
    }
  };

  const handleSave = async (data) => {
    try {
      if (editingAddress) {
        await axios.put(`${API_URL}/api/user/address/${editingAddress._id}`, data, { withCredentials: true });
        toast.success("Address updated");
      } else {
        await axios.post(`${API_URL}/api/user/address`, data, { withCredentials: true });
        toast.success("Address added");
      }
      setModalOpen(false);
      fetchAddresses();
    } catch {
      toast.error("Failed to save address");
    }
  };

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div style={{
      background: T.surface,
      borderRadius: 20,
      border: `1px solid ${T.border}`,
      boxShadow: "0 2px 24px rgba(13,17,23,0.06), 0 1px 4px rgba(13,17,23,0.04)",
      padding: "32px 32px 28px",
      marginBottom: 22,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 3, height: 20, borderRadius: 2, background: T.teal }} />
          <h2 style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: 16, fontWeight: 700, color: T.ink, margin: 0,
          }}>
            My Addresses
          </h2>
        </div>

        <motion.button
          whileHover={reduced ? {} : { y: -2, boxShadow: T.shadowTeal }}
          whileTap={{ scale: 0.96 }}
          onClick={openCreate}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: T.r,
            background: T.teal, color: T.surface,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12.5, fontWeight: 600, border: "none", cursor: "pointer",
            boxShadow: T.shadowTeal, transition: "box-shadow 0.2s",
          }}
        >
          <FiPlus size={14} aria-hidden="true" /> Add New
        </motion.button>
      </div>

      {/* Body */}
      {loading ? (
        <p style={{ color: T.inkSoft, fontSize: 13, margin: 0 }}>Loading addresses…</p>
      ) : addresses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: "center", padding: "40px 0" }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: T.tealGlow, border: `1px solid rgba(78,205,196,0.18)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px", color: T.teal,
          }}>
            <FiMapPin size={22} />
          </div>
          <p style={{ color: T.inkSoft, fontSize: 13.5, margin: 0 }}>No addresses saved yet.</p>
        </motion.div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <AnimatePresence mode="popLayout">
            {addresses.map(addr => (
              <AddressCard
                key={addr._id}
                addr={addr}
                onEdit={openEdit}
                onDelete={handleDelete}
                reduced={reduced}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── MODAL ───────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 20,
            }}
            role="dialog"
            aria-modal="true"
            aria-label={editingAddress ? "Edit Address" : "Add New Address"}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setModalOpen(false)}
              style={{
                position: "absolute", inset: 0,
                background: "rgba(13,17,23,0.52)",
                backdropFilter: "blur(8px)",
              }}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: reduced ? 1 : 0.93, y: reduced ? 0 : 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: reduced ? 1 : 0.93, y: reduced ? 0 : 16 }}
              transition={{ ...T.spring }}
              style={{ position: "relative", width: "100%", maxWidth: 640 }}
            >
              <AddressForm
                onSave={handleSave}
                onCancel={() => setModalOpen(false)}
                initialData={editingAddress}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}