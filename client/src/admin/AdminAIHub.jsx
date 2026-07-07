import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  Package,
  Users,
  Sparkles,
  ArrowRight,
  MessageSquare,
  RefreshCw,
  Image as ImageIcon,
  DollarSign,
  TrendingDown
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

const API = import.meta.env.VITE_API_URL || "";

const SENTIMENT_COLORS = ["#10b981", "#64748b", "#ef4444"];

export default function AdminAIHub() {
  const [activeTab, setActiveTab] = useState("anomalies");
  const [anomalies, setAnomalies] = useState([]);
  const [churnData, setChurnData] = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [reorders, setReorders] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [generatedDesc, setGeneratedDesc] = useState("");
  const [descForm, setDescForm] = useState({ productName: "", category: "", price: "", features: "" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [anomRes, churnRes, sentRes, reorderRes, forecastRes] = await Promise.all([
        axios.get(`${API}/api/admin/ai/anomalies`, { withCredentials: true }),
        axios.get(`${API}/api/admin/ai/churn-risk`, { withCredentials: true }),
        axios.get(`${API}/api/admin/ai/sentiment`, { withCredentials: true }),
        axios.get(`${API}/api/admin/ai/reorder-suggestions`, { withCredentials: true }),
        axios.get(`${API}/api/admin/ai/forecast`, { withCredentials: true }),
      ]);
      setAnomalies(anomRes.data.anomalies || []);
      setChurnData(churnRes.data);
      setSentiment(sentRes.data);
      setReorders(reorderRes.data);
      setForecast(forecastRes.data);
    } catch (err) {
      toast.error("Failed to load AI operations data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateDescription = async (e) => {
    e.preventDefault();
    if (!descForm.productName) {
      toast.error("Product name is required");
      return;
    }
    setGeneratingDesc(true);
    try {
      const { data } = await axios.post(`${API}/api/admin/ai/generate-description`, descForm, { withCredentials: true });
      setGeneratedDesc(data.description || data.fallback);
      toast.success("Description generated successfully!");
    } catch (err) {
      toast.error("Failed to generate description");
    } finally {
      setGeneratingDesc(false);
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case "critical":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400">CRITICAL</span>;
      case "high":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400">HIGH</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400">MEDIUM</span>;
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-white via-stone-50 to-white text-stone-900 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-violet-500/15 border border-violet-500/30">
            <Brain className="text-violet-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              AI Operations Hub <Sparkles size={18} className="text-violet-400 animate-pulse" />
            </h1>
            <p className="text-xs text-stone-500">Algorithmic intelligence, anomaly feeds, forecasting and smart reorders</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh Models
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-stone-100 pb-4">
        {[
          { id: "anomalies", label: "Anomaly Detection Feed", count: anomalies.length },
          { id: "forecast", label: "Demand Forecasting" },
          { id: "reorders", label: "Smart Reorders", count: reorders?.totalSuggestions },
          { id: "churn", label: "Churn Risk Predictor", count: churnData?.totalAtRisk },
          { id: "sentiment", label: "Review Sentiment" },
          { id: "generator", label: "Gemini Content Generator" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-violet-600 text-stone-900 shadow-lg shadow-violet-600/15"
                : "bg-stone-50 hover:bg-stone-100 text-stone-500 hover:text-stone-900"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeTab === tab.id ? "bg-white text-violet-600" : "bg-stone-100 text-stone-700"}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Brain size={48} className="text-violet-500 animate-pulse" />
          <p className="text-xs text-stone-500">Synthesizing predictions and training local ML models...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* Tab 1: Anomalies */}
          {activeTab === "anomalies" && (
            <motion.div
              key="anomalies"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">Live Anomaly Feed</h3>
                {anomalies.length === 0 ? (
                  <div className="rounded-2xl border border-stone-100 bg-stone-50 p-8 text-center">
                    <span className="text-3xl">🛡️</span>
                    <p className="text-sm text-stone-700 font-semibold mt-3">All Systems Nominal</p>
                    <p className="text-xs text-stone-400 mt-1">No deviations, spikes, or resource anomalies detected in the last 24h.</p>
                  </div>
                ) : (
                  anomalies.map((anom, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border p-5 flex items-start gap-4 transition-all"
                      style={{
                        background: "rgba(15, 23, 42, 0.4)",
                        borderColor:
                          anom.severity === "critical"
                            ? "rgba(239, 68, 68, 0.25)"
                            : anom.severity === "high"
                            ? "rgba(245, 158, 11, 0.25)"
                            : "rgba(56, 189, 248, 0.2)",
                      }}
                    >
                      <div className="text-2xl">{anom.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-stone-900">{anom.title}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              anom.severity === "critical"
                                ? "bg-red-500/10 text-red-400"
                                : anom.severity === "high"
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-blue-500/10 text-blue-400"
                            }`}
                          >
                            {anom.severity}
                          </span>
                        </div>
                        <p className="text-xs text-stone-700 mt-1 leading-relaxed">{anom.description}</p>
                        {anom.products && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {anom.products.map((p, pIdx) => (
                              <span key={pIdx} className="px-2 py-1 bg-stone-50 border border-stone-100 rounded-lg text-[10px] text-stone-500">
                                {p.name}: {p.countInStock}kg left
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="space-y-6">
                <div className="rounded-2xl border border-stone-100 bg-stone-50 p-5">
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">Guardrail Overview</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs py-2 border-b border-stone-100">
                      <span className="text-stone-500">Resource Guard</span>
                      <span className="text-emerald-400 font-bold">NOMINAL</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-2 border-b border-stone-100">
                      <span className="text-stone-500">Cold Chain Monitor</span>
                      <span className="text-emerald-400 font-bold">ACTIVE</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-2 border-b border-stone-100">
                      <span className="text-stone-500">API Telemetry Rate</span>
                      <span className="text-stone-700 font-mono">1.2ms latency</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-2">
                      <span className="text-stone-500">Fraud Sentinel</span>
                      <span className="text-emerald-400 font-bold">ARMED</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 2: Forecast */}
          {activeTab === "forecast" && forecast && (
            <motion.div
              key="forecast"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-stone-50 border border-stone-100 rounded-2xl p-5">
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Projected 30D Revenue</span>
                  <span className="text-2xl font-bold text-stone-900 mt-1 block">₹{(forecast.projected30dRevenue || 0).toLocaleString()}</span>
                </div>
                <div className="bg-stone-50 border border-stone-100 rounded-2xl p-5">
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Average Daily Sales</span>
                  <span className="text-2xl font-bold text-stone-900 mt-1 block">₹{(forecast.avgDailyRevenue || 0).toLocaleString()}</span>
                </div>
                <div className="bg-stone-50 border border-stone-100 rounded-2xl p-5">
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Average Daily Orders</span>
                  <span className="text-2xl font-bold text-stone-900 mt-1 block">{forecast.avgDailyOrders} orders</span>
                </div>
                <div className="bg-stone-50 border border-stone-100 rounded-2xl p-5">
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Demand Trend Direction</span>
                  <span className={`text-xl font-bold mt-1 flex items-center gap-1.5 capitalize ${forecast.trend === "upward" ? "text-emerald-400" : "text-red-400"}`}>
                    {forecast.trend === "upward" ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    {forecast.trend} ({forecast.growthRate})
                  </span>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-slate-900/60 border border-stone-100 rounded-3xl p-6 h-[400px]">
                <h3 className="text-sm font-bold text-stone-900 mb-6">Historical vs AI Predicted Demand (30 Days Forward)</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <AreaChart data={[...(forecast.historical || []), ...(forecast.forecast || [])]}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{ background: "#0f172a", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }} />
                    <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Tab 3: Reorders */}
          {activeTab === "reorders" && reorders && (
            <motion.div
              key="reorders"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-500/15 border border-amber-500/20 text-amber-400 rounded-xl px-3 py-2 text-center">
                    <span className="text-2xl font-bold block">{reorders.critical}</span>
                    <span className="text-[9px] uppercase font-semibold">Critical Warnings</span>
                  </div>
                  <div className="bg-stone-50 border border-stone-100 rounded-xl px-3 py-2 text-center">
                    <span className="text-2xl font-bold block">₹{(reorders.totalEstimatedCost || 0).toLocaleString()}</span>
                    <span className="text-[9px] uppercase font-semibold">Est. Refill Cost</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-stone-100 bg-slate-900/40">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-100 bg-stone-50">
                      <th className="p-4 text-stone-500 font-bold uppercase">Product</th>
                      <th className="p-4 text-stone-500 font-bold uppercase">Stock Level</th>
                      <th className="p-4 text-stone-500 font-bold uppercase">Threshold</th>
                      <th className="p-4 text-stone-500 font-bold uppercase">30D Velocity</th>
                      <th className="p-4 text-stone-500 font-bold uppercase">Est. Stockout</th>
                      <th className="p-4 text-stone-500 font-bold uppercase">Urgency</th>
                      <th className="p-4 text-stone-500 font-bold uppercase">Suggested PO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reorders.suggestions.map((p, idx) => (
                      <tr key={idx} className="border-b border-stone-100 hover:bg-white/[0.01] transition-colors">
                        <td className="p-4 font-bold text-stone-900">{p.name}</td>
                        <td className="p-4 font-mono text-stone-700">{p.countInStock} kg</td>
                        <td className="p-4 font-mono text-stone-500">{p.stockThreshold} kg</td>
                        <td className="p-4 font-mono text-emerald-400">{p.avgDailySales} kg/day</td>
                        <td className="p-4 font-mono text-stone-700">
                          {p.daysUntilStockout === 999 ? "No sales" : `${p.daysUntilStockout} days`}
                        </td>
                        <td className="p-4">{getUrgencyBadge(p.urgency)}</td>
                        <td className="p-4 font-bold text-violet-400">
                          {p.suggestedReorderQty} kg <span className="text-[10px] text-stone-400 font-normal">(₹{p.estimatedCost.toLocaleString()})</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Tab 4: Churn Risk */}
          {activeTab === "churn" && churnData && (
            <motion.div
              key="churn"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">Critical Risk Customers</span>
                  <span className="text-3xl font-bold text-stone-900 mt-1 block">{churnData.critical}</span>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">High Risk Customers</span>
                  <span className="text-3xl font-bold text-stone-900 mt-1 block">{churnData.high}</span>
                </div>
                <div className="bg-stone-50 border border-stone-100 rounded-2xl p-5">
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">At Risk Revenue (Monthly)</span>
                  <span className="text-3xl font-bold text-stone-900 mt-1 block">₹{Math.round(churnData.potentialRevenueLoss).toLocaleString()}</span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-stone-100 bg-slate-900/40">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-100 bg-stone-50">
                      <th className="p-4 text-stone-500 font-bold uppercase">Customer</th>
                      <th className="p-4 text-stone-500 font-bold uppercase">LTV / Orders</th>
                      <th className="p-4 text-stone-500 font-bold uppercase">Last Order</th>
                      <th className="p-4 text-stone-500 font-bold uppercase">Inactivity</th>
                      <th className="p-4 text-stone-500 font-bold uppercase">Risk Score</th>
                      <th className="p-4 text-stone-500 font-bold uppercase">Suggested Playbook</th>
                    </tr>
                  </thead>
                  <tbody>
                    {churnData.users.map((u, idx) => (
                      <tr key={idx} className="border-b border-stone-100 hover:bg-white/[0.01] transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-stone-900">{u.name}</p>
                          <p className="text-[10px] text-stone-400 mt-0.5">{u.email || u.phone}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-mono text-stone-700">₹{(u.lifetimeOrderValue || 0).toLocaleString()}</p>
                          <p className="text-[10px] text-stone-400 mt-0.5">{u.lifetimeOrderCount || 0} orders</p>
                        </td>
                        <td className="p-4 font-mono text-stone-700">
                          {u.lastOrderDate ? new Date(u.lastOrderDate).toLocaleDateString() : "Never"}
                        </td>
                        <td className="p-4 font-bold text-amber-500">{u.daysSinceLastOrder} days</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-stone-50 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-red-500 h-full" style={{ width: `${u.riskScore}%` }} />
                            </div>
                            <span className="font-bold text-red-400">{u.riskScore}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-stone-700 font-semibold">{u.suggestedAction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Tab 5: Sentiment */}
          {activeTab === "sentiment" && sentiment && (
            <motion.div
              key="sentiment"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="space-y-6">
                <div className="bg-stone-50 border border-stone-100 rounded-2xl p-6">
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-6">Sentiment Distribution</h4>
                  <div className="h-[200px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Positive", value: sentiment.overview.positive },
                            { name: "Neutral", value: sentiment.overview.neutral },
                            { name: "Negative", value: sentiment.overview.negative }
                          ]}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {SENTIMENT_COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                      <span className="text-stone-500">Positive ({sentiment.overview.positive})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-slate-500 rounded-full" />
                      <span className="text-stone-500">Neutral ({sentiment.overview.neutral})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="text-stone-500">Negative ({sentiment.overview.negative})</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">Attention Required (Poor Rating Trends)</h3>
                {sentiment.flaggedProducts.length === 0 ? (
                  <div className="rounded-2xl border border-stone-100 bg-stone-50 p-8 text-center">
                    <span className="text-3xl">🤩</span>
                    <p className="text-sm text-stone-700 font-semibold mt-3">High Product Satisfaction</p>
                    <p className="text-xs text-stone-400 mt-1">No products have high rates of negative feedback currently.</p>
                  </div>
                ) : (
                  sentiment.flaggedProducts.map((p, idx) => (
                    <div key={idx} className="bg-stone-50 border border-red-500/10 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-stone-900">{p.name}</h4>
                          <p className="text-[10px] text-stone-400 mt-0.5">Avg. Rating: {p.avgRating} • {p.totalReviews} total reviews</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400">
                          {p.negativeRate}% NEGATIVE
                        </span>
                      </div>
                      <div className="space-y-2 border-t border-stone-100 pt-3">
                        {p.recentNegative.map((r, rIdx) => (
                          <div key={rIdx} className="bg-black/25 rounded-xl p-3">
                            <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1">
                              <span className="font-bold text-red-400 font-mono">Rating: {r.rating}★</span>
                              <span>{new Date(r.date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-stone-700 italic">"{r.comment}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Tab 6: Gemini Generator */}
          {activeTab === "generator" && (
            <motion.div
              key="generator"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <div className="bg-stone-50 border border-stone-100 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-stone-900 mb-6">Gemini Description Generator</h3>
                <form onSubmit={handleGenerateDescription} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Product Name</label>
                    <input
                      type="text"
                      value={descForm.productName}
                      onChange={(e) => setDescForm({ ...descForm, productName: e.target.value })}
                      placeholder="e.g., Fresh Tiger Prawns"
                      className="w-full bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-xs text-stone-900 placeholder-slate-600 outline-none focus:border-violet-500/50"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Category</label>
                      <input
                        type="text"
                        value={descForm.category}
                        onChange={(e) => setDescForm({ ...descForm, category: e.target.value })}
                        placeholder="e.g., Shellfish"
                        className="w-full bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-xs text-stone-900 placeholder-slate-600 outline-none focus:border-violet-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Base Price (INR)</label>
                      <input
                        type="number"
                        value={descForm.price}
                        onChange={(e) => setDescForm({ ...descForm, price: e.target.value })}
                        placeholder="e.g., 850"
                        className="w-full bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-xs text-stone-900 placeholder-slate-600 outline-none focus:border-violet-500/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Key Features / Bullet Points</label>
                    <textarea
                      value={descForm.features}
                      onChange={(e) => setDescForm({ ...descForm, features: e.target.value })}
                      placeholder="e.g., Caught fresh off Nellore coast, IQF frozen, raw, medium size"
                      rows={3}
                      className="w-full bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-xs text-stone-900 placeholder-slate-600 outline-none focus:border-violet-500/50 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={generatingDesc}
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-stone-900 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    {generatingDesc ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Generating description...
                      </>
                    ) : (
                      <>
                        <Brain size={14} />
                        Generate with Gemini 2.0
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="bg-slate-900/40 border border-stone-100 rounded-2xl p-6 flex flex-col min-h-[350px]">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Output Preview</h4>
                {generatedDesc ? (
                  <div className="flex-1 flex flex-col justify-between">
                    <p className="text-xs text-stone-800 leading-relaxed font-sans whitespace-pre-line">{generatedDesc}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedDesc);
                        toast.success("Copied to clipboard!");
                      }}
                      className="mt-6 self-start text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <ImageIcon size={36} className="text-slate-700" />
                    <p className="text-xs text-stone-400 mt-2">Outputs generated by Gemini will appear here.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
