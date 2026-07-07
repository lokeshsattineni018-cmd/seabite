import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiActivity, FiTrendingUp, FiPlus, FiTrash2, FiPlay, FiSquare, FiAward,
  FiPieChart, FiAlertCircle
} from "react-icons/fi";

const API = import.meta.env.VITE_API_URL || "";

export default function AdminABTesting() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("banner");
  const [winnerMetric, setWinnerMetric] = useState("click_rate");
  
  // Variants
  const [variantAName, setVariantAName] = useState("Variant A (Control)");
  const [variantAContent, setVariantAContent] = useState("");
  const [variantBName, setVariantBName] = useState("Variant B (Challenger)");
  const [variantBContent, setVariantBContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTests = async () => {
    try {
      const { data } = await axios.get(`${API}/api/ab-tests`, { withCredentials: true });
      setTests(data || []);
    } catch (e) {
      toast.error("Failed to load A/B tests index");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleCreateTest = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Test name is required");

    setSubmitting(true);
    try {
      const payload = {
        name,
        description,
        type,
        winnerMetric,
        variants: [
          { name: variantAName, content: variantAContent, trafficRatio: 50 },
          { name: variantBName, content: variantBContent, trafficRatio: 50 }
        ]
      };

      await axios.post(`${API}/api/ab-tests`, payload, { withCredentials: true });
      toast.success("Split Test defined successfully!");
      
      // Reset Form
      setName("");
      setDescription("");
      setVariantAContent("");
      setVariantBContent("");
      
      fetchTests();
    } catch (err) {
      toast.error("Failed to define test configuration");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartTest = async (id) => {
    try {
      await axios.post(`${API}/api/ab-tests/${id}/start`, {}, { withCredentials: true });
      toast.success("Split test deployed to live traffic!");
      fetchTests();
    } catch (e) {
      toast.error("Failed to launch split test");
    }
  };

  const handleStopTest = async (id) => {
    try {
      await axios.post(`${API}/api/ab-tests/${id}/stop`, {}, { withCredentials: true });
      toast.success("Split test completed. Winner declared!");
      fetchTests();
    } catch (e) {
      toast.error("Failed to end split test");
    }
  };

  const handleDeleteTest = async (id) => {
    if (!window.confirm("Delete this test permanently?")) return;
    try {
      await axios.delete(`${API}/api/ab-tests/${id}`, { withCredentials: true });
      toast.success("A/B test configuration deleted");
      fetchTests();
    } catch (e) {
      toast.error("Failed to delete test");
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-white via-stone-50 to-white text-stone-900 font-sans">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <FiActivity className="text-[#5BBFB5]" /> Create Split Test (A/B)
            </h2>
            
            <form onSubmit={handleCreateTest} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-1">EXPERIMENT NAME</label>
                  <input
                    type="text"
                    placeholder="e.g. Free Delivery Threshold CTA"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-gradient-to-br from-white via-stone-50 to-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#5BBFB5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-1">EXPERIMENT TYPE</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full bg-gradient-to-br from-white via-stone-50 to-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#5BBFB5]"
                  >
                    <option value="banner">Homepage Banner Content</option>
                    <option value="product_card">Product Listing Layout Variant</option>
                    <option value="cta_button">Add To Cart Button Styling</option>
                    <option value="pricing_display">Pricing Display Format</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-1">GOAL SUCCESS METRIC</label>
                  <select
                    value={winnerMetric}
                    onChange={e => setWinnerMetric(e.target.value)}
                    className="w-full bg-gradient-to-br from-white via-stone-50 to-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#5BBFB5]"
                  >
                    <option value="click_rate">Click-Through Ratio (CTR)</option>
                    <option value="conversion_rate">Fulfillment Conversion Rate</option>
                    <option value="revenue">Total Cumulative Sales Value</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-1">DESCRIPTION / THESIS</label>
                  <input
                    type="text"
                    placeholder="e.g. Red CTA raises conversions by 10%..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-gradient-to-br from-white via-stone-50 to-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#5BBFB5]"
                  />
                </div>
              </div>

              {/* Variants Configuration Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Variant A */}
                <div className="p-4 bg-gradient-to-br from-white via-stone-50 to-white/50 border border-stone-200 rounded-2xl">
                  <h4 className="text-sm font-bold mb-3 text-stone-700 flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Control Group (A)
                  </h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Variant A label name"
                      value={variantAName}
                      onChange={e => setVariantAName(e.target.value)}
                      className="w-full bg-gradient-to-br from-white via-stone-50 to-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#5BBFB5]"
                    />
                    <textarea
                      rows={3}
                      placeholder="Payload config values, text, or styling class names..."
                      value={variantAContent}
                      onChange={e => setVariantAContent(e.target.value)}
                      className="w-full bg-gradient-to-br from-white via-stone-50 to-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-[#5BBFB5]"
                    />
                  </div>
                </div>

                {/* Variant B */}
                <div className="p-4 bg-gradient-to-br from-white via-stone-50 to-white/50 border border-stone-200 rounded-2xl">
                  <h4 className="text-sm font-bold mb-3 text-stone-700 flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#5BBFB5]" /> Challenger Group (B)
                  </h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Variant B label name"
                      value={variantBName}
                      onChange={e => setVariantBName(e.target.value)}
                      className="w-full bg-gradient-to-br from-white via-stone-50 to-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#5BBFB5]"
                    />
                    <textarea
                      rows={3}
                      placeholder="Payload config values, text, or styling class names..."
                      value={variantBContent}
                      onChange={e => setVariantBContent(e.target.value)}
                      className="w-full bg-gradient-to-br from-white via-stone-50 to-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-[#5BBFB5]"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-[#5BBFB5] to-[#89C2D9] text-[#0a1625] font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all hover:shadow-cyan-900/40"
              >
                {submitting ? "Defining Experiment..." : "Deploy Experiment Schema 🔬"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Concept Explanation (1 col) */}
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FiPieChart className="text-[#5BBFB5]" /> Traffic Splitting
            </h3>
            <p className="text-sm text-stone-500 leading-relaxed mb-4">
              Your users are automatically distributed into equal traffic ratios (50% Variant A / 50% Variant B). 
              The storefront hook tracks clicks and conversions dynamically, and measures stats confidence.
            </p>
            <div className="p-4 bg-gradient-to-br from-white via-stone-50 to-white border border-stone-200 rounded-2xl flex items-center gap-3">
              <FiAlertCircle size={22} className="text-[#5BBFB5] flex-shrink-0" />
              <p className="text-xs text-stone-500">
                A confidence level above <strong>95%</strong> guarantees statistical significance before declaring a winner.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Historical/Active Experiments List */}
      <div className="mt-8 bg-white border border-stone-200 rounded-3xl p-6 shadow-2xl">
        <h3 className="text-lg font-bold mb-4">Split Testing Log</h3>

        {loading ? (
          <div className="text-center py-8 text-stone-500 text-sm">Loading split testing dashboard...</div>
        ) : tests.length === 0 ? (
          <div className="text-center py-8 text-stone-500 text-sm">No split tests defined yet. Get started above!</div>
        ) : (
          <div className="space-y-6">
            {tests.map(test => (
              <div key={test._id} className="p-5 bg-gradient-to-br from-white via-stone-50 to-white border border-stone-200 rounded-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-base font-bold text-stone-800">{test.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        test.status === "running" ? "bg-emerald-900/30 text-emerald-400 border border-emerald-500/20" :
                        test.status === "completed" ? "bg-slate-800 text-stone-500" : "bg-amber-900/20 text-amber-500"
                      }`}>
                        {test.status.toUpperCase()}
                      </span>
                    </div>
                    {test.description && <p className="text-xs text-stone-500 mt-1">{test.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    {test.status === "draft" && (
                      <button
                        onClick={() => handleStartTest(test._id)}
                        className="px-3 py-1.5 bg-[#5BBFB5]/10 text-[#5BBFB5] border border-[#5BBFB5]/20 rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <FiPlay size={12} /> Deploy Live
                      </button>
                    )}
                    {test.status === "running" && (
                      <button
                        onClick={() => handleStopTest(test._id)}
                        className="px-3 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <FiSquare size={12} /> Stop & Evaluate
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTest(test._id)}
                      className="p-2 hover:bg-rose-500/10 text-stone-500 hover:text-rose-400 rounded-lg transition-all"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {test.variants.map((v, idx) => {
                    const ctr = v.metrics?.impressions > 0 ? ((v.metrics.clicks / v.metrics.impressions) * 100).toFixed(1) : 0;
                    return (
                      <div key={idx} className={`p-4 rounded-xl border ${
                        v.isWinner ? "border-[#5BBFB5] bg-[#5BBFB5]/5" : "border-stone-200 bg-white border border-stone-200 shadow-sm"
                      }`}>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-bold text-slate-350">{v.name}</span>
                          {v.isWinner && <span className="text-xs font-extrabold text-[#5BBFB5] flex items-center gap-0.5"><FiAward /> WINNER</span>}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 bg-gradient-to-br from-white via-stone-50 to-white rounded-lg">
                            <p className="text-[9px] text-stone-400 font-bold uppercase">VIEWS</p>
                            <p className="text-sm font-bold text-stone-700 mt-0.5">{v.metrics?.impressions || 0}</p>
                          </div>
                          <div className="p-2 bg-gradient-to-br from-white via-stone-50 to-white rounded-lg">
                            <p className="text-[9px] text-stone-400 font-bold uppercase">CLICKS</p>
                            <p className="text-sm font-bold text-stone-700 mt-0.5">{v.metrics?.clicks || 0}</p>
                          </div>
                          <div className="p-2 bg-gradient-to-br from-white via-stone-50 to-white rounded-lg">
                            <p className="text-[9px] text-stone-400 font-bold uppercase">CTR</p>
                            <p className="text-sm font-bold text-[#5BBFB5] mt-0.5">{ctr}%</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
