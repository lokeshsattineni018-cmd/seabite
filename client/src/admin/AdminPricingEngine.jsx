// AdminPricingEngine.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FiCloudRain, FiWind, FiTrendingUp, FiAlertTriangle, FiCheck,
  FiSliders, FiZap, FiRefreshCw, FiDollarSign, FiSun, FiLoader
} from "react-icons/fi";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import toast from "react-hot-toast";
import axios from "axios";

export default function AdminPricingEngine() {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [stormOverride, setStormOverride] = useState(false);
  const [marginOffset, setMarginOffset] = useState(15);
  const [competitorMatch, setCompetitorMatch] = useState(false);
  const [demandDensity, setDemandDensity] = useState(false);
  const [marketSurgeIndex, setMarketSurgeIndex] = useState(1.0);
  const [products, setProducts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Load actual settings and products from backend
  const loadPricingData = async () => {
    try {
      const { data } = await axios.get("/api/admin/pricing-engine");
      if (data.settings) {
        setAiEnabled(data.settings.aiEnabled);
        setStormOverride(data.settings.stormOverride);
        setMarginOffset(data.settings.marginOffset);
        setCompetitorMatch(data.settings.competitorMatch || false);
        setDemandDensity(data.settings.demandDensity || false);
        setMarketSurgeIndex(data.settings.marketSurgeIndex || 1.0);
      }
      setProducts(data.products || []);
    } catch (err) {
      toast.error("Failed to load pricing engine metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPricingData();
  }, []);

  // Market Price Indices state (Simulating open wholesale market conditions)
  const marketPrice = {
    condition: marketSurgeIndex >= 1.3 ? "Peak Market Inflation" : marketSurgeIndex >= 1.15 ? "General Wholesale Surge" : "Normal Stable Market",
    indexValue: marketSurgeIndex,
    competitorDiscountAverage: competitorMatch ? 5 : 0
  };

  const getDynamicPrice = (base) => {
    let multiplier = 1;
    if (aiEnabled) {
      multiplier *= marketSurgeIndex;
      multiplier += marginOffset / 100;
      if (competitorMatch) multiplier -= 0.05;
      if (demandDensity) multiplier += 0.08;
    }
    return Math.round(base * multiplier);
  };

  // Generate simulated chart data for price elasticity vs competitor market price
  const chartData = [
    { index: "Stable Market", demand: 100, competitorPrice: 100, price: 100 },
    { index: "Minor Rise", demand: 96, competitorPrice: 102, price: 106 },
    { index: "Wholesale Surge", demand: 90, competitorPrice: 110, price: 115 },
    { index: "High Demand", demand: 84, competitorPrice: 118, price: 126 },
    { index: "Peak Inflation", demand: 72, competitorPrice: 128, price: 140 }
  ];

  const handleApplyBulkPrices = async () => {
    setUpdating(true);
    try {
      const { data } = await axios.post("/api/admin/pricing-engine/sync", {
        aiEnabled,
        stormOverride,
        marginOffset,
        competitorMatch,
        demandDensity,
        marketSurgeIndex
      });
      toast.success(data.message || "AI Market-Driven dynamic prices pushed successfully!", { icon: "📈" });
      await loadPricingData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to push dynamic prices to live catalog.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Unified Controls / Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 mt-2 pb-4 border-b border-stone-200/40">
        <div>
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            AI Pricing Matrix Active
          </span>
        </div>
        
        <button
          onClick={handleApplyBulkPrices}
          disabled={updating || loading}
          className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
        >
          {updating ? (
            <FiRefreshCw className="animate-spin" />
          ) : (
            <FiZap className="text-[#5BBFB5]" />
          )}
          {updating ? "Syncing Catalog..." : "Sync Live Catalog"}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <FiLoader className="text-[#5BBFB5] animate-spin" size={32} />
          <span className="text-sm text-stone-400 font-bold">Synchronizing wholesale market prices...</span>
        </div>
      ) : (
        /* Main Section Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Market Intelligence Dashboard & Settings */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Market status glass card */}
            <div className={`p-6 rounded-2xl border transition-all duration-500 bg-emerald-50/60 border-emerald-200 text-emerald-950 shadow-[0_8px_30px_rgba(16,185,129,0.05)]`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 font-sans">Wholesale Index Feed</span>
                  <h3 className="text-lg font-extrabold mt-1 flex items-center gap-2 font-sans">
                    <FiTrendingUp className="text-emerald-600 animate-pulse" size={22} />
                    {marketPrice.condition}
                  </h3>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-200 text-emerald-850">
                  Live Feed
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-stone-500 uppercase flex items-center gap-1"><FiDollarSign /> Wholesale Surge</p>
                  <p className="text-xl font-black">+{Math.round((marketSurgeIndex - 1) * 100)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-stone-500 uppercase flex items-center gap-1">🏷️ Competitor Offset</p>
                  <p className="text-xl font-black">{marketPrice.competitorDiscountAverage > 0 ? `-${marketPrice.competitorDiscountAverage}%` : "None"}</p>
                </div>
              </div>

              <div className="h-px bg-stone-200/50 my-5" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-stone-500 uppercase">Live Pricing Factor</p>
                  <p className="text-sm font-extrabold text-[#5BBFB5]">{marketSurgeIndex.toFixed(2)}x Market Multiplier</p>
                </div>
                <div className="p-3 bg-white/85 rounded-xl border border-stone-200/40 shadow-sm">
                  <FiZap className="text-[#5BBFB5]" size={20} />
                </div>
              </div>
            </div>

            {/* Engine Parameters Controller */}
            <div className="p-6 bg-white rounded-2xl border border-stone-200/60 shadow-sm space-y-6">
              <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2 font-sans">
                <FiSliders className="text-[#5BBFB5]" /> Engine Control Panel
              </h3>

              {/* AI Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-800 block">AI Market-Tracking</span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">Auto-adjust using open market indices</span>
                </div>
                <button
                  onClick={() => setAiEnabled(!aiEnabled)}
                  className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 relative cursor-pointer ${
                    aiEnabled ? "bg-[#5BBFB5]" : "bg-stone-200"
                  }`}
                >
                  <motion.div
                    layout
                    className="w-4.5 h-4.5 bg-white rounded-full shadow-sm"
                    animate={{ x: aiEnabled ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Market Index Slider */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-stone-800">Wholesale Market Index</span>
                  <span className="text-xs font-black text-[#5BBFB5]">{marketSurgeIndex.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.8"
                  step="0.05"
                  value={marketSurgeIndex}
                  onChange={(e) => setMarketSurgeIndex(Number(e.target.value))}
                  className="w-full accent-[#5BBFB5] h-1.5 bg-stone-100 rounded-lg cursor-pointer"
                />
                <span className="text-[9px] text-stone-400 block">Simulates price surges (1.0x = normal, 1.25x = general rise, 0.9x = deflation).</span>
              </div>

              {/* Competitor Price Matching Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <div>
                  <span className="text-xs font-bold text-stone-800 block">Competitor Price Match</span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">Dynamically match competitor discounts (-5% offset)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCompetitorMatch(!competitorMatch)}
                  className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 relative cursor-pointer ${
                    competitorMatch ? "bg-amber-500" : "bg-stone-200"
                  }`}
                >
                  <motion.div
                    layout
                    className="w-4.5 h-4.5 bg-white rounded-full shadow-sm"
                    animate={{ x: competitorMatch ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Demand Density Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <div>
                  <span className="text-xs font-bold text-stone-800 block">Demand Density Surge</span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">Surge price in high order density areas (+8% offset)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDemandDensity(!demandDensity)}
                  className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 relative cursor-pointer ${
                    demandDensity ? "bg-purple-500" : "bg-stone-200"
                  }`}
                >
                  <motion.div
                    layout
                    className="w-4.5 h-4.5 bg-white rounded-full shadow-sm"
                    animate={{ x: demandDensity ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Target Margin Slider */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-stone-800">Target Profit Margin</span>
                  <span className="text-xs font-black text-[#5BBFB5]">+{marginOffset}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={marginOffset}
                  onChange={(e) => setMarginOffset(Number(e.target.value))}
                  className="w-full accent-[#5BBFB5] h-1.5 bg-stone-100 rounded-lg cursor-pointer"
                />
                <span className="text-[9px] text-stone-400 block">Adds static percentage offset above base wholesale prices.</span>
              </div>
            </div>
          </div>

          {/* Elasticity Chart & Real-Time Price Log */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Recharts dynamic elastic dashboard */}
            <div className="p-6 bg-white rounded-2xl border border-stone-200/60 shadow-sm">
              <h3 className="text-base font-extrabold text-stone-900 mb-4 flex items-center gap-2 font-sans">
                <FiTrendingUp className="text-[#5BBFB5]" /> Market Price Elasticity Model
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5BBFB5" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#5BBFB5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="index" stroke="#888" fontSize={10} tickLine={false} />
                    <YAxis stroke="#888" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ background: "#fff", border: "1px solid #eee", borderRadius: "10px", fontFamily: "'Plus Jakarta Sans', sans-serif" }} 
                      labelStyle={{ fontWeight: 800, fontSize: 12, color: "#1A2E2C" }}
                    />
                    <Area type="monotone" dataKey="price" name="Pricing Mult (%)" stroke="#5BBFB5" strokeWidth={2} fillOpacity={1} fill="url(#priceColor)" />
                    <Area type="monotone" dataKey="competitorPrice" name="Competitor Price (%)" stroke="#F59E0B" strokeWidth={1.5} fillOpacity={0} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 items-center justify-center text-[10px] font-bold text-stone-500 uppercase mt-4">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#5BBFB5]" /> Dynamic Price Curve</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Competitor Wholesale Price Index</span>
              </div>
            </div>

            {/* Pricing Catalog Log */}
            <div className="p-6 bg-white rounded-2xl border border-stone-200/60 shadow-sm">
              <h3 className="text-base font-extrabold text-stone-900 mb-4 flex items-center gap-2 font-sans">
                <FiDollarSign className="text-[#5BBFB5]" /> Dynamic Catalog Output & Profit Margins
              </h3>

              <div className="overflow-x-auto">
                {products.length === 0 ? (
                  <div className="text-center py-10 text-stone-400 font-semibold text-xs">
                    No active catalog products found to adjust.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-stone-100 text-[10px] font-black uppercase text-stone-400 tracking-wider">
                        <th className="py-3">Product Name</th>
                        <th className="py-3 text-right">Cost (Buy)</th>
                        <th className="py-3 text-right">Base (MRP)</th>
                        <th className="py-3 text-right text-stone-800 font-bold">Dynamic AI Price</th>
                        <th className="py-3 text-right text-emerald-600 font-bold">Net Profit (₹)</th>
                        <th className="py-3 text-right text-[#5BBFB5] font-bold">Profit Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50 text-xs">
                      {products.map((prod) => {
                        const cost = prod.buyingPrice || Math.round(prod.basePrice * 0.7);
                        const dyn = getDynamicPrice(prod.basePrice);
                        const profit = dyn - cost;
                        const marginPct = Math.round((profit / dyn) * 100);
                        return (
                          <tr key={prod._id} className="hover:bg-stone-50/50 transition-colors">
                            <td className="py-4.5 font-bold text-stone-900">{prod.name}</td>
                            <td className="py-4.5 text-right font-medium text-stone-400 font-semibold">₹{cost}</td>
                            <td className="py-4.5 text-right font-medium text-stone-400 font-semibold">₹{prod.basePrice}</td>
                            <td className="py-4.5 text-right font-extrabold text-stone-900 text-sm">₹{dyn}</td>
                            <td className="py-4.5 text-right font-bold text-emerald-600 font-bold">₹{profit}</td>
                            <td className="py-4.5 text-right font-black text-[#5BBFB5]">
                              {marginPct}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
