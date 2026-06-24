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

  // Weather state (Simulating Mogalthur Marine landing parameters)
  const weather = {
    condition: stormOverride ? "Severe Storm" : "Heavy Rain",
    windSpeed: stormOverride ? 48 : 34,
    waveHeight: stormOverride ? 4.2 : 2.8,
    scarcityIndex: stormOverride ? 1.35 : 1.18 // 35% or 18% scarcity multiplier
  };

  const getDynamicPrice = (base) => {
    let multiplier = 1;
    if (aiEnabled) {
      multiplier *= weather.scarcityIndex;
      multiplier += marginOffset / 100;
      if (competitorMatch) multiplier -= 0.05;
      if (demandDensity) multiplier += 0.08;
    }
    return Math.round(base * multiplier);
  };

  // Generate simulated chart data for price elasticity vs supply scarcity
  const chartData = [
    { index: "Calm Sea", demand: 100, supply: 100, price: 100 },
    { index: "Light Wind", demand: 95, supply: 90, price: 105 },
    { index: "Choppy Water", demand: 90, supply: 75, price: 112 },
    { index: "Heavy Rain", demand: 85, supply: 60, price: 122 },
    { index: "Severe Storm", demand: 70, supply: 30, price: 145 }
  ];

  const handleApplyBulkPrices = async () => {
    setUpdating(true);
    try {
      const { data } = await axios.post("/api/admin/pricing-engine/sync", {
        aiEnabled,
        stormOverride,
        marginOffset,
        competitorMatch,
        demandDensity
      });
      toast.success(data.message || "AI Weather-Adaptive dynamic prices pushed successfully!", { icon: "🌦️" });
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
          <span className="text-sm text-stone-400 font-bold">Synchronizing meteorological logs...</span>
        </div>
      ) : (
        /* Main Section Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Weather Intelligence Dashboard & Settings */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Weather status glass card */}
            <div className={`p-6 rounded-2xl border transition-all duration-500 ${
              stormOverride 
                ? "bg-rose-50/60 border-rose-200 text-rose-950 shadow-[0_8px_30px_rgba(244,63,94,0.08)]" 
                : "bg-amber-50/60 border-amber-200 text-amber-950 shadow-[0_8px_30px_rgba(245,158,11,0.05)]"
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Live Marine Feed</span>
                  <h3 className="text-lg font-extrabold mt-1 flex items-center gap-2">
                    <FiCloudRain className={stormOverride ? "text-rose-500 animate-bounce" : "text-amber-500 animate-pulse"} size={22} />
                    {stormOverride ? "Mogalthur: Severe Storm Warning" : "Mogalthur: Monsoon Chop"}
                  </h3>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                  stormOverride ? "bg-rose-200 text-rose-800" : "bg-amber-200 text-amber-800"
                }`}>
                  {stormOverride ? "Red Flag" : "Caution"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-stone-500 uppercase flex items-center gap-1"><FiWind /> Wind Speed</p>
                  <p className="text-xl font-black">{weather.windSpeed} km/h</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-stone-500 uppercase flex items-center gap-1">🌊 Wave Height</p>
                  <p className="text-xl font-black">{weather.waveHeight} meters</p>
                </div>
              </div>

              <div className="h-px bg-stone-200/50 my-5" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-stone-500 uppercase">Dynamic Scarcity Offset</p>
                  <p className="text-sm font-extrabold text-[#5BBFB5]">+{Math.round((weather.scarcityIndex - 1) * 100)}% Supply Multiplier</p>
                </div>
                <div className="p-3 bg-white/80 rounded-xl border border-stone-200/40">
                  <FiTrendingUp className="text-[#5BBFB5]" size={20} />
                </div>
              </div>
            </div>

            {/* Engine Parameters Controller */}
            <div className="p-6 bg-white rounded-2xl border border-stone-200/60 shadow-sm space-y-6">
              <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <FiSliders className="text-[#5BBFB5]" /> Engine Control Panel
              </h3>

              {/* AI Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-800 block">AI Automated Scarcity</span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">Auto-adjust using meteorological feeds</span>
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

              {/* Storm Override Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-800 block">Forced Storm Mode</span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">Simulate severe landing blockages</span>
                </div>
                <button
                  onClick={() => setStormOverride(!stormOverride)}
                  className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 relative cursor-pointer ${
                    stormOverride ? "bg-rose-500" : "bg-stone-200"
                  }`}
                >
                  <motion.div
                    layout
                    className="w-4.5 h-4.5 bg-white rounded-full shadow-sm"
                    animate={{ x: stormOverride ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Competitor Price Matching Toggle */}
              <div className="flex items-center justify-between">
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
              <div className="flex items-center justify-between">
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
              <div className="space-y-2">
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
                  className="w-full accent-[#5BBFB5] h-1.5 bg-stone-150 rounded-lg cursor-pointer"
                />
                <span className="text-[9px] text-stone-400 block">Adds static percentage offset above catch scarcity base.</span>
              </div>
            </div>
          </div>

          {/* Elasticity Chart & Real-Time Price Log */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Recharts dynamic elastic dashboard */}
            <div className="p-6 bg-white rounded-2xl border border-stone-200/60 shadow-sm">
              <h3 className="text-base font-extrabold text-stone-900 mb-4 flex items-center gap-2">
                <FiTrendingUp className="text-[#5BBFB5]" /> Price Scarcity Elasticity Model
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
                    <Area type="monotone" dataKey="supply" name="Supply Cap (%)" stroke="#EF4444" strokeWidth={1.5} fillOpacity={0} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 items-center justify-center text-[10px] font-bold text-stone-500 uppercase mt-4">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#5BBFB5]" /> Dynamic Price Curve</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Fisherman Supply Availability</span>
              </div>
            </div>

            {/* Pricing Catalog Log */}
            <div className="p-6 bg-white rounded-2xl border border-stone-200/60 shadow-sm">
              <h3 className="text-base font-extrabold text-stone-900 mb-4 flex items-center gap-2">
                <FiDollarSign className="text-[#5BBFB5]" /> Dynamic Catalog Output
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
                        <th className="py-3">Category</th>
                        <th className="py-3 text-right">Standard Base</th>
                        <th className="py-3 text-right text-stone-800">Dynamic AI Price</th>
                        <th className="py-3 text-right text-[#5BBFB5]">Delta Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50 text-xs">
                      {products.map((prod) => {
                        const dyn = getDynamicPrice(prod.basePrice);
                        return (
                          <tr key={prod._id} className="hover:bg-stone-50/50 transition-colors">
                            <td className="py-4.5 font-bold text-stone-900">{prod.name}</td>
                            <td className="py-4.5 text-stone-500 font-semibold">{prod.category}</td>
                            <td className="py-4.5 text-right font-medium text-stone-400">₹{prod.basePrice}</td>
                            <td className="py-4.5 text-right font-extrabold text-stone-900">₹{dyn}</td>
                            <td className="py-4.5 text-right font-black text-[#5BBFB5]">
                              +{Math.round((dyn / prod.basePrice - 1) * 100)}%
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
