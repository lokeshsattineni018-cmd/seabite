import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { FiAlertTriangle, FiAlertCircle, FiPackage, FiRefreshCw, FiTrendingDown } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "";

const getImageUrl = (img) => {
  if (!img) return "";
  if (img.startsWith("http")) return img;
  return `${API_URL}${img.startsWith("/uploads") ? img : `/uploads${img}`}`;
};

export default function AdminInventoryAlerts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("low");
  const [restocking, setRestocking] = useState({});

  const fetchAlerts = () => {
    setLoading(true);
    axios.get(`${API_URL}/api/admin/bi/inventory-alerts`, { withCredentials: true })
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleRestock = async (productName, productId) => {
    setRestocking(prev => ({ ...prev, [productId]: true }));
    try {
      await axios.post(`${API_URL}/api/admin/inventory/restock`, { productName }, { withCredentials: true });
      setTimeout(() => setRestocking(prev => ({ ...prev, [productId]: false })), 2000);
    } catch (err) {
      setRestocking(prev => ({ ...prev, [productId]: false }));
    }
  };

  const tabs = [
    { id: "low",       label: "Low Stock",    emoji: "⚠️",  count: data?.alerts?.length || 0 },
    { id: "out",       label: "Out of Stock", emoji: "🚫",  count: data?.outOfStock?.length || 0 },
    { id: "stagnant",  label: "Not Selling",  emoji: "📦",  count: data?.stagnant?.length || 0 },
  ];

  const currentItems = activeTab === "low" ? data?.alerts : activeTab === "out" ? data?.outOfStock : data?.stagnant;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFB", padding: "32px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "900", color: "#1A2E2C", letterSpacing: "-0.03em", margin: "0 0 6px" }}>
            📦 Inventory Alerts
          </h1>
          <p style={{ color: "#6B8F8A", fontSize: "14px", margin: 0, fontWeight: "500" }}>
            Real-time stock health monitoring across all products
          </p>
        </div>
        <button onClick={fetchAlerts}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "10px", border: "1.5px solid #E2EEEC", background: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: "700", color: "#6B8F8A", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Low Stock", value: data?.alerts?.length || 0, color: "#F59E0B", bg: "#FFFBEB", icon: <FiAlertCircle size={20} /> },
          { label: "Out of Stock", value: data?.outOfStock?.length || 0, color: "#EF4444", bg: "#FEF2F2", icon: <FiAlertTriangle size={20} /> },
          { label: "Not Selling (30d)", value: data?.stagnant?.length || 0, color: "#8B5CF6", bg: "#F5F3FF", icon: <FiTrendingDown size={20} /> },
        ].map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            style={{ background: "#fff", borderRadius: "18px", padding: "22px", border: "1.5px solid #E2EEEC" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", color: card.color }}>
                {card.icon}
              </div>
            </div>
            <p style={{ fontSize: "36px", fontWeight: "900", color: card.color, letterSpacing: "-0.04em", margin: "0 0 4px" }}>{card.value}</p>
            <p style={{ fontSize: "13px", fontWeight: "700", color: "#6B8F8A", margin: 0 }}>{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "9px 18px", borderRadius: "100px", border: "2px solid",
              borderColor: activeTab === tab.id ? "#5BBFB5" : "#E2EEEC",
              background: activeTab === tab.id ? "#F4F9F8" : "#fff",
              color: activeTab === tab.id ? "#1A2E2C" : "#6B8F8A",
              fontWeight: "800", fontSize: "13px", cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: "6px",
            }}
          >
            {tab.emoji} {tab.label}
            <span style={{ padding: "1px 8px", borderRadius: "20px", background: activeTab === tab.id ? "#5BBFB5" : "#E2EEEC", color: activeTab === tab.id ? "#fff" : "#6B8F8A", fontSize: "10px", fontWeight: "900" }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Items List */}
      {loading ? (
        <div style={{ background: "#fff", borderRadius: "20px", border: "1.5px solid #E2EEEC", padding: "80px", textAlign: "center" }}>
          <FiPackage size={40} color="#B8CFCC" style={{ marginBottom: "12px" }} />
          <p style={{ color: "#6B8F8A", fontWeight: "600" }}>Loading inventory data…</p>
        </div>
      ) : !currentItems?.length ? (
        <div style={{ background: "#fff", borderRadius: "20px", border: "1.5px solid #E2EEEC", padding: "80px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
          <p style={{ color: "#6B8F8A", fontWeight: "600" }}>All clear! No issues in this category.</p>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: "20px", border: "1.5px solid #E2EEEC", overflow: "hidden" }}>
          {currentItems.map((product, i) => {
            const isLow = activeTab === "low";
            const pctOfThreshold = isLow && product.stockThreshold > 0 ? (product.countInStock / product.stockThreshold) * 100 : null;
            const isRestocked = restocking[product._id] === true;

            return (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                style={{ display: "flex", alignItems: "center", gap: "16px", padding: "18px 24px", borderBottom: i < currentItems.length - 1 ? "1px solid #E2EEEC" : "none", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#F8FAFB"}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}
              >
                {/* Image */}
                <div style={{ width: "50px", height: "50px", borderRadius: "12px", background: "#F4F9F8", overflow: "hidden", flexShrink: 0 }}>
                  {product.image && <img src={getImageUrl(product.image)} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <p style={{ fontSize: "14px", fontWeight: "700", color: "#1A2E2C", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {product.name}
                    </p>
                    <span style={{ fontSize: "10px", fontWeight: "700", color: "#6B8F8A", background: "#F4F9F8", padding: "2px 8px", borderRadius: "20px", flexShrink: 0 }}>
                      {product.category}
                    </span>
                  </div>

                  {isLow && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ flex: 1, height: "6px", background: "#E2EEEC", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: "3px", transition: "width 0.5s",
                          width: `${Math.min(100, pctOfThreshold || 0)}%`,
                          background: product.countInStock === 0 ? "#EF4444" : product.countInStock <= product.stockThreshold ? "#F59E0B" : "#10B981",
                        }} />
                      </div>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#6B8F8A", flexShrink: 0 }}>
                        {product.countInStock} / {product.stockThreshold} threshold
                      </span>
                    </div>
                  )}

                  {activeTab === "stagnant" && (
                    <p style={{ fontSize: "12px", color: "#6B8F8A", margin: "4px 0 0", fontWeight: "600" }}>
                      No sales in 30 days · {product.countInStock} units in stock
                    </p>
                  )}
                </div>

                {/* Stock Badge */}
                {isLow && (
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <p style={{ fontSize: "22px", fontWeight: "900", color: product.countInStock === 0 ? "#EF4444" : "#F59E0B", letterSpacing: "-0.03em", margin: "0 0 2px" }}>
                      {product.countInStock}
                    </p>
                    <p style={{ fontSize: "10px", color: "#6B8F8A", margin: 0, fontWeight: "700" }}>
                      {product.unit || "units"}
                    </p>
                  </div>
                )}

                {/* Restock Button */}
                <button
                  onClick={() => handleRestock(product.name, product._id)}
                  disabled={isRestocked}
                  style={{
                    padding: "8px 16px", borderRadius: "10px", border: "1.5px solid",
                    borderColor: isRestocked ? "#10B981" : "#E2EEEC",
                    background: isRestocked ? "#F0FDF4" : "#fff",
                    color: isRestocked ? "#10B981" : "#6B8F8A",
                    fontSize: "12px", fontWeight: "800", cursor: isRestocked ? "default" : "pointer",
                    fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s",
                    flexShrink: 0, display: "flex", alignItems: "center", gap: "6px",
                  }}
                >
                  {isRestocked ? "✅ Sent" : <><FiRefreshCw size={12} /> Restock</>}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
