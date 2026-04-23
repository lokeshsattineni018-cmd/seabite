import { useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CompareContext } from "../../context/CompareContext";
import { FiX, FiCheck, FiShoppingBag, FiLayers } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function ComparisonDrawer() {
  const { compareItems, toggleCompare, clearCompare } = useContext(CompareContext);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  if (compareItems.length === 0) return null;

  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return "https://placehold.co/400?text=No+Image";
    if (imagePath.startsWith("http")) return imagePath;
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return cleanPath.startsWith("/uploads")
      ? `${API_URL}${cleanPath}`
      : `${API_URL}/uploads${cleanPath}`;
  };

  return (
    <>
      {/* Floating Trigger */}
      {!isOpen && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed",
            bottom: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1A2E2C",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: "30px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            zIndex: 1000,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            border: "2px solid rgba(91,191,181,0.3)"
          }}
        >
          <FiLayers size={18} />
          <span style={{ fontSize: "14px", fontWeight: "700" }}>Compare ({compareItems.length})</span>
        </motion.div>
      )}

      {/* Full Comparison View */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              height: "75vh",
              background: "#fff",
              borderTopLeftRadius: "32px",
              borderTopRightRadius: "32px",
              boxShadow: "0 -20px 60px rgba(0,0,0,0.15)",
              zIndex: 2000,
              padding: "40px 24px",
              fontFamily: "'Manrope', sans-serif",
              overflow: "hidden"
            }}
          >
            <div style={{ maxWidth: "1200px", margin: "0 auto", height: "100%", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                <div>
                  <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#1A2E2C", margin: 0 }}>Product Comparison</h2>
                  <p style={{ fontSize: "14px", color: "#6B8F8A", margin: "4px 0 0" }}>Review and choose your perfect catch</p>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button onClick={clearCompare} style={{ background: "none", border: "1.5px solid #E2EEEC", borderRadius: "10px", padding: "8px 16px", fontSize: "13px", fontWeight: "700", color: "#6B8F8A", cursor: "pointer" }}>Clear All</button>
                  <button onClick={() => setIsOpen(false)} style={{ background: "#F4F9F8", border: "none", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", color: "#1A2E2C", cursor: "pointer" }}><FiX size={20} /></button>
                </div>
              </div>

              <div style={{ flex: 1, overflowX: "auto", paddingBottom: "20px" }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "20px 0" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "200px" }}></th>
                      {compareItems.map(item => (
                        <th key={item._id} style={{ minWidth: "220px", textAlign: "center", verticalAlign: "top" }}>
                          <div style={{ position: "relative" }}>
                            <button onClick={() => toggleCompare(item)} style={{ position: "absolute", top: "-10px", right: "-10px", background: "#fff", border: "1px solid #E2EEEC", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10, color: "#F07468" }}><FiX size={14} /></button>
                            <div style={{ width: "100%", aspectRatio: "1/1", background: "#F4F9F8", borderRadius: "20px", padding: "20px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <img src={getFullImageUrl(item.image)} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                            </div>
                            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1A2E2C", marginBottom: "8px" }}>{item.name}</h3>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: "14px" }}>
                    <tr>
                      <td style={{ padding: "16px 0", borderBottom: "1px solid #F4F9F8", color: "#6B8F8A", fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Price</td>
                      {compareItems.map(item => (
                        <td key={item._id} style={{ padding: "16px 0", borderBottom: "1px solid #F4F9F8", textAlign: "center", fontSize: "18px", fontWeight: "800", color: "#1A2E2C" }}>₹{item.basePrice}</td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ padding: "16px 0", borderBottom: "1px solid #F4F9F8", color: "#6B8F8A", fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Category</td>
                      {compareItems.map(item => (
                        <td key={item._id} style={{ padding: "16px 0", borderBottom: "1px solid #F4F9F8", textAlign: "center", color: "#5BBFB5", fontWeight: "700" }}>{item.category}</td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ padding: "16px 0", borderBottom: "1px solid #F4F9F8", color: "#6B8F8A", fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Rating</td>
                      {compareItems.map(item => (
                        <td key={item._id} style={{ padding: "16px 0", borderBottom: "1px solid #F4F9F8", textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                            <span style={{ fontWeight: "700" }}>{item.rating || "5.0"}</span>
                            <FiCheck size={14} style={{ color: "#5BBFB5" }} />
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ padding: "16px 0", borderBottom: "1px solid #F4F9F8", color: "#6B8F8A", fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>In Stock</td>
                      {compareItems.map(item => (
                        <td key={item._id} style={{ padding: "16px 0", borderBottom: "1px solid #F4F9F8", textAlign: "center" }}>
                          {item.stock === "in" ? <FiCheck style={{ color: "#5BBFB5" }} /> : <FiX style={{ color: "#F07468" }} />}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td></td>
                      {compareItems.map(item => (
                        <td key={item._id} style={{ padding: "24px 0", textAlign: "center" }}>
                          <button 
                            onClick={() => { navigate(`/products/${item._id}`); setIsOpen(false); }} 
                            style={{ 
                              width: "100%", 
                              padding: "12px 0", 
                              background: "#1A2E2C", 
                              color: "#fff", 
                              border: "none", 
                              borderRadius: "10px", 
                              fontSize: "13px", 
                              fontWeight: "700", 
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px"
                            }}
                          >
                            <FiShoppingBag size={14} /> View Details
                          </button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
