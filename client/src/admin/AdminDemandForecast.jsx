import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { FiAlertTriangle, FiAlertCircle, FiCheckCircle, FiTrendingUp, FiRefreshCw } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "";

const urgencyConfig = {
  critical: { color: "#EF4444", bg: "#FEF2F2", label: "Critical", icon: <FiAlertTriangle size={14} /> },
  warning:  { color: "#F59E0B", bg: "#FFFBEB", label: "Warning",  icon: <FiAlertCircle size={14} /> },
  ok:       { color: "#10B981", bg: "#F0FDF4", label: "Healthy",  icon: <FiCheckCircle size={14} /> },
};

const getImageUrl = (img) => {
  if (!img) return "";
  if (img.startsWith("http")) return img;
  return `${API_URL}${img.startsWith("/uploads") ? img : `/uploads${img}`}`;
};

export default function AdminDemandForecast() {
  const [summary, setSummary] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [filterUrgency, setFilterUrgency] = useState("all");

  useEffect(() => {
    setLoadingSummary(true);
    axios.get(`${API_URL}/api/admin/bi/forecast`, { withCredentials: true })
      .then(res => { setSummary(res.data); setLoadingSummary(false); })
      .catch(() => setLoadingSummary(false));
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    setLoadingDetail(true);
    axios.get(`${API_URL}/api/admin/bi/forecast/${selectedProduct.productId}?days=30`, { withCredentials: true })
      .then(res => { setDetail(res.data); setLoadingDetail(false); })
      .catch(() => setLoadingDetail(false));
  }, [selectedProduct]);

  const filteredSummary = summary.filter(p => filterUrgency === "all" || p.urgency === filterUrgency);
  const chartData = detail ? [...detail.history, ...detail.forecast] : [];

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFB", padding: "32px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "900", color: "#1A2E2C", letterSpacing: "-0.03em", margin: "0 0 6px" }}>
          📊 Demand Forecasting
        </h1>
        <p style={{ color: "#6B8F8A", fontSize: "14px", margin: 0, fontWeight: "500" }}>
          30-day sales history + 7-day moving average forecast per product
        </p>
      </div>

      {/* Urgency Filter */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
        {["all", "critical", "warning", "ok"].map(u => (
          <button key={u} onClick={() => setFilterUrgency(u)}
            style={{
              padding: "7px 18px", borderRadius: "100px", border: "2px solid",
              borderColor: filterUrgency === u ? urgencyConfig[u]?.color || "#5BBFB5" : "#E2EEEC",
              background: filterUrgency === u ? (urgencyConfig[u]?.bg || "#F4F9F8") : "#fff",
              color: filterUrgency === u ? (urgencyConfig[u]?.color || "#1A2E2C") : "#6B8F8A",
              fontWeight: "700", fontSize: "12px", cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s",
            }}
          >
            {u === "all" ? "All Products" : urgencyConfig[u].label}
            {u !== "all" && ` (${summary.filter(p => p.urgency === u).length})`}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selectedProduct ? "350px 1fr" : "1fr", gap: "24px" }}>
        {/* Product Table */}
        <div style={{ background: "#fff", borderRadius: "20px", border: "1.5px solid #E2EEEC", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2EEEC" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#1A2E2C", margin: 0 }}>
              Reorder Suggestions ({filteredSummary.length})
            </h2>
          </div>
          {loadingSummary ? (
            <div style={{ padding: "60px", textAlign: "center", color: "#6B8F8A", fontWeight: "600" }}>Loading forecast data…</div>
          ) : filteredSummary.length === 0 ? (
            <div style={{ padding: "60px", textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>✅</div>
              <p style={{ color: "#6B8F8A", fontWeight: "600" }}>All products well-stocked!</p>
            </div>
          ) : (
            <div style={{ maxHeight: selectedProduct ? "600px" : "none", overflowY: "auto" }}>
              {filteredSummary.map((p, i) => {
                const cfg = urgencyConfig[p.urgency] || urgencyConfig.ok;
                const isSelected = selectedProduct?.productId === p.productId;
                return (
                  <motion.div
                    key={p.productId || i}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedProduct(p)}
                    style={{
                      padding: "16px 20px", cursor: "pointer",
                      borderBottom: "1px solid #E2EEEC",
                      background: isSelected ? "rgba(91,191,181,0.06)" : "#fff",
                      borderLeft: isSelected ? "3px solid #5BBFB5" : "3px solid transparent",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      {p.image && (
                        <img src={getImageUrl(p.image)} alt={p.name} style={{ width: "40px", height: "40px", borderRadius: "10px", objectFit: "contain", background: "#F4F9F8" }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: "700", color: "#1A2E2C", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</p>
                        <div style={{ display: "flex", gap: "8px", marginTop: "4px", alignItems: "center" }}>
                          <span style={{ fontSize: "11px", color: "#6B8F8A", fontWeight: "600" }}>
                            {p.avgDailyQty} {p.unit}/day avg
                          </span>
                          {p.daysToStockout !== null && (
                            <span style={{ fontSize: "10px", fontWeight: "800", color: cfg.color, background: cfg.bg, padding: "2px 8px", borderRadius: "20px" }}>
                              {p.daysToStockout <= 0 ? "Stockout!" : `${p.daysToStockout}d left`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: cfg.color }}>{cfg.icon}</div>
                        <p style={{ fontSize: "11px", color: "#6B8F8A", margin: "4px 0 0", fontWeight: "600" }}>Stock: {p.countInStock ?? "?"}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Chart */}
        {selectedProduct && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ background: "#fff", borderRadius: "20px", border: "1.5px solid #E2EEEC", padding: "28px" }}>
            {loadingDetail ? (
              <div style={{ textAlign: "center", padding: "60px", color: "#6B8F8A", fontWeight: "600" }}>Loading chart…</div>
            ) : detail ? (
              <>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
                  <div>
                    <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#1A2E2C", letterSpacing: "-0.02em", margin: "0 0 6px" }}>{detail.product?.name}</h2>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <div>
                        <p style={{ fontSize: "11px", color: "#6B8F8A", fontWeight: "600", margin: 0 }}>Avg Daily</p>
                        <p style={{ fontSize: "18px", fontWeight: "900", color: "#1A2E2C", margin: 0 }}>{detail.avgDailyQty} {detail.product?.unit}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "11px", color: "#6B8F8A", fontWeight: "600", margin: 0 }}>In Stock</p>
                        <p style={{ fontSize: "18px", fontWeight: "900", color: "#1A2E2C", margin: 0 }}>{detail.product?.countInStock}</p>
                      </div>
                      {detail.daysToStockout !== null && (
                        <div>
                          <p style={{ fontSize: "11px", color: "#6B8F8A", fontWeight: "600", margin: 0 }}>Days to Stockout</p>
                          <p style={{ fontSize: "18px", fontWeight: "900", color: detail.daysToStockout <= 3 ? "#EF4444" : detail.daysToStockout <= 7 ? "#F59E0B" : "#10B981", margin: 0 }}>
                            {detail.daysToStockout <= 0 ? "⚠️ Now" : `${detail.daysToStockout}d`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setSelectedProduct(null)} style={{ padding: "8px 16px", borderRadius: "10px", border: "1.5px solid #E2EEEC", background: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: "700", color: "#6B8F8A", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Close
                  </button>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5BBFB5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#5BBFB5" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="foreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F4F9F8" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6B8F8A" }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: "#6B8F8A" }} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "1.5px solid #E2EEEC", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "12px" }}
                      formatter={(v, n) => [v, n === "qty" ? `Qty (${detail.product?.unit})` : "Revenue"]}
                    />
                    <ReferenceLine x={detail.history[detail.history.length - 1]?.date} stroke="#E2EEEC" strokeDasharray="4 4" label={{ value: "Today", position: "top", fontSize: 10, fill: "#6B8F8A" }} />
                    <Area type="monotone" dataKey="qty" stroke="#5BBFB5" strokeWidth={2.5} fill="url(#histGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>

                <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6B8F8A", fontWeight: "600" }}>
                    <div style={{ width: "12px", height: "3px", background: "#5BBFB5", borderRadius: "2px" }} /> Historical
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6B8F8A", fontWeight: "600" }}>
                    <div style={{ width: "12px", height: "3px", background: "#F59E0B", borderRadius: "2px" }} /> 7-day Forecast
                  </div>
                </div>
              </>
            ) : null}
          </motion.div>
        )}
      </div>
    </div>
  );
}
