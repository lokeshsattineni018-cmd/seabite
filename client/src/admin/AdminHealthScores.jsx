import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiUsers, FiAlertTriangle, FiTrendingUp, FiActivity, FiSend,
  FiTrendingDown, FiShield, FiSliders
} from "react-icons/fi";

const API = import.meta.env.VITE_API_URL || "";

export default function AdminHealthScores() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState("all");
  const [search, setSearch] = useState("");

  const fetchScores = async () => {
    try {
      const { data: res } = await axios.get(`${API}/api/admin/bi/health-scores`, { withCredentials: true });
      setData(res || []);
    } catch (e) {
      toast.error("Failed to load customer health scores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  // Filter & Search
  const filteredData = data.filter(u => {
    const matchesRisk = filterRisk === "all" || u.risk.toLowerCase() === filterRisk.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase()) ||
                          u.phone.includes(search);
    return matchesRisk && matchesSearch;
  });

  const avgScore = data.length > 0 ? Math.round(data.reduce((sum, u) => sum + u.healthScore, 0) / data.length) : 0;
  const redCount = data.filter(u => u.risk === "Red").length;
  const yellowCount = data.filter(u => u.risk === "Yellow").length;
  const greenCount = data.filter(u => u.risk === "Green").length;

  const triggerRetentionOffer = async (user) => {
    const couponCode = prompt(`Create dynamic retention offer coupon for ${user.name} (e.g. WINBACK15):`);
    if (!couponCode) return;
    
    try {
      // Send retention email blast directly using existing marketing service or Resend APIs
      await axios.post(`${API}/api/admin/marketing/email-blast`, {
        subject: `We Miss You, ${user.name}! Here is ₹100 off your next catch 🐟`,
        message: `<p>Hello ${user.name},</p><p>We noticed you haven't ordered your favorite seafood recently. Use coupon code <strong>${couponCode}</strong> at checkout to get ₹100 off your next order!</p><p>Stay Fresh,<br>Team SeaBite</p>`,
        recipients: [user._id]
      }, { withCredentials: true });
      
      toast.success(`Retention offer dispatched to ${user.name}!`);
    } catch (e) {
      toast.error("Failed to send retention offer email");
    }
  };

  return (
    <div className="p-6 min-h-screen bg-[#0a1625] text-slate-100 font-sans">
      
      {/* Dynamic Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
        <div className="bg-[#0f2137] border border-slate-800 rounded-3xl p-5 shadow-lg flex justify-between items-center">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AVERAGE HEALTH SCORE</p>
            <p className="text-3xl font-black mt-1 text-[#5BBFB5]">{avgScore}/100</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#5BBFB5]/10 flex items-center justify-center text-[#5BBFB5]">
            <FiActivity size={22} />
          </div>
        </div>

        <div className="bg-[#0f2137] border border-slate-800 rounded-3xl p-5 shadow-lg flex justify-between items-center">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">HIGH CHURN RISK (RED)</p>
            <p className="text-3xl font-black mt-1 text-rose-400">{redCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400">
            <FiTrendingDown size={22} />
          </div>
        </div>

        <div className="bg-[#0f2137] border border-slate-800 rounded-3xl p-5 shadow-lg flex justify-between items-center">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">MODERATE RISK (YELLOW)</p>
            <p className="text-3xl font-black mt-1 text-amber-400">{yellowCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <FiAlertTriangle size={22} />
          </div>
        </div>

        <div className="bg-[#0f2137] border border-slate-800 rounded-3xl p-5 shadow-lg flex justify-between items-center">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">LOYAL / ACTIVE (GREEN)</p>
            <p className="text-3xl font-black mt-1 text-emerald-400">{greenCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <FiTrendingUp size={22} />
          </div>
        </div>

      </div>

      {/* Main Table section */}
      <div className="bg-[#0f2137] border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-bold">Churn Predictor & Customer Segments</h3>
          
          <div className="flex flex-wrap gap-2">
            {/* Filter buttons */}
            {["all", "green", "yellow", "red"].map(risk => (
              <button
                key={risk}
                onClick={() => setFilterRisk(risk)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border capitalize transition-all ${
                  filterRisk === risk
                    ? "bg-[#5BBFB5] text-[#0a1625] border-[#5BBFB5]"
                    : "bg-[#0a1625] text-slate-400 border-slate-800 hover:border-slate-700"
                }`}
              >
                {risk} Risk
              </button>
            ))}
            
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-[#0a1625] border border-slate-800 rounded-xl px-4 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-[#5BBFB5]"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">Analyzing user databases & ordering frequencies...</div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No customers match the current filter selection.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-850 text-slate-400 font-semibold text-xs">
                  <th className="py-3 px-4">CUSTOMER DETAILS</th>
                  <th className="py-3 px-4 text-center">HEALTH SCORE</th>
                  <th className="py-3 px-4">RISK STATUS</th>
                  <th className="py-3 px-4">LAST ORDER</th>
                  <th className="py-3 px-4">ORDERS</th>
                  <th className="py-3 px-4">LTV</th>
                  <th className="py-3 px-4">NEXT ORDER EST.</th>
                  <th className="py-3 px-4 text-center">RETENTION ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredData.map(u => (
                  <tr key={u._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-200">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email} • {u.phone}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-base font-black ${
                        u.risk === "Green" ? "text-emerald-400" :
                        u.risk === "Yellow" ? "text-amber-400" : "text-rose-400"
                      }`}>
                        {u.healthScore}/100
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.risk === "Green" ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20" :
                        u.risk === "Yellow" ? "bg-amber-950/40 text-amber-500 border border-amber-500/20" :
                        "bg-rose-950/40 text-rose-400 border border-rose-500/20"
                      }`}>
                        {u.risk === "Green" ? "Healthy" : u.risk === "Yellow" ? "At Risk" : "Churning"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-350 text-xs font-semibold">{u.recencyDays}</td>
                    <td className="py-3 px-4 text-slate-350 font-bold">{u.totalOrders}</td>
                    <td className="py-3 px-4 text-[#5BBFB5] font-black">₹{u.ltv}</td>
                    <td className="py-3 px-4 text-slate-300 font-semibold text-xs">{u.estimatedNextOrder}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => triggerRetentionOffer(u)}
                        className="px-2.5 py-1 bg-[#5BBFB5]/10 text-[#5BBFB5] border border-[#5BBFB5]/20 hover:bg-[#5BBFB5] hover:text-[#0a1625] rounded-lg text-xs font-bold transition-all flex items-center gap-1 mx-auto"
                      >
                        <FiSend size={11} /> Send Coupon
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
