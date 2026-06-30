import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, ChevronDown, ChevronRight, DollarSign } from "lucide-react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "";

export default function PLDrilldown() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("month");
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPnl = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API}/api/admin/dashboard/pnl?period=${period}`);
        setData(data);
      } catch (err) {
        console.error("P&L fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPnl();
  }, [period]);

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const formatMoney = (val) => {
    if (val === undefined || val === null) return "₹0";
    const abs = Math.abs(val);
    if (abs >= 100000) return `${val < 0 ? "-" : ""}₹${(abs / 100000).toFixed(2)}L`;
    if (abs >= 1000) return `${val < 0 ? "-" : ""}₹${(abs / 1000).toFixed(1)}K`;
    return `₹${val.toLocaleString()}`;
  };

  const PnlRow = ({ label, value, isPositive, indent = 0, expandable, expanded: isExpanded, onToggle, isBold, children }) => (
    <div>
      <div
        className={`flex items-center justify-between py-2.5 px-3 rounded-lg cursor-pointer hover:bg-stone-50 transition-colors ${isBold ? "font-bold" : ""}`}
        style={{ paddingLeft: `${12 + indent * 20}px` }}
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {expandable && (
            isExpanded ? <ChevronDown size={14} className="text-stone-400" /> : <ChevronRight size={14} className="text-stone-400" />
          )}
          <span className={`text-sm ${isBold ? "text-stone-900" : "text-stone-600"}`}>{label}</span>
        </div>
        <span className={`text-sm font-mono font-semibold ${
          isPositive === true ? "text-emerald-600" : isPositive === false ? "text-rose-600" : "text-stone-900"
        }`}>
          {formatMoney(value)}
        </span>
      </div>
      {isExpanded && children}
    </div>
  );

  return (
    <motion.div
      className="rounded-2xl p-6 relative overflow-hidden bg-gradient-to-br from-[#fbfbfa] to-white border border-stone-200 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-50 border border-orange-100">
              <ArrowUpDown size={16} className="text-orange-600" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">P&L Statement</h3>
          </div>
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="bg-white text-stone-850 text-xs rounded-xl px-2.5 py-1.5 outline-none border border-stone-200 cursor-pointer"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-stone-50 border border-stone-100 rounded-lg animate-pulse" />)}
          </div>
        ) : data && data.pnl ? (
          <div className="space-y-0.5">
            {/* Gross Revenue */}
            <PnlRow
              label="Gross Revenue"
              value={data.pnl.grossRevenue}
              isPositive={true}
              isBold
              expandable
              expanded={expanded.revenue}
              onToggle={() => toggle("revenue")}
            >
              <PnlRow label={`${data.totalOrders} Orders`} value={data.pnl.grossRevenue} indent={1} isPositive={true} />
              <PnlRow label="Shipping Revenue" value={data.pnl.shippingRevenue} indent={1} isPositive={true} />
            </PnlRow>

            {/* Discounts */}
            <PnlRow label="(−) Discounts" value={-data.pnl.discounts} isPositive={false} />

            {/* Divider */}
            <div className="border-t border-stone-100 my-1" />

            {/* Net Revenue */}
            <PnlRow label="Net Revenue" value={data.pnl.netRevenue} isBold isPositive={true} />

            {/* COGS */}
            <PnlRow
              label="(−) Cost of Goods Sold"
              value={-data.pnl.cogs}
              isPositive={false}
              expandable
              expanded={expanded.cogs}
              onToggle={() => toggle("cogs")}
            >
              <PnlRow label="Product Costs" value={data.pnl.cogs} indent={1} />
            </PnlRow>

            <div className="border-t border-stone-100 my-1" />

            {/* Gross Profit */}
            <PnlRow
              label={`Gross Profit (${data.pnl.grossMarginPct}% margin)`}
              value={data.pnl.grossProfit}
              isBold
              isPositive={data.pnl.grossProfit >= 0}
            />

            {/* Refunds */}
            {data.pnl.refunds > 0 && (
              <PnlRow label="(−) Refunds" value={-data.pnl.refunds} isPositive={false} />
            )}

            {/* Tax */}
            <PnlRow label="Tax Collected (GST)" value={data.pnl.taxCollected} />

            <div className="border-t border-stone-200/60 my-2" />

            {/* Net Profit */}
            <div className="flex items-center justify-between py-3 px-3 rounded-xl border"
              style={{
                background: data.pnl.netProfit >= 0 ? "rgba(16, 185, 129, 0.05)" : "rgba(239, 68, 68, 0.05)",
                borderColor: data.pnl.netProfit >= 0 ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"
              }}>
              <span className="text-sm font-bold text-stone-850">Net Profit</span>
              <span className={`text-lg font-bold font-mono ${data.pnl.netProfit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {formatMoney(data.pnl.netProfit)}
              </span>
            </div>

            {/* Per Order Stats */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-stone-50 border border-stone-100 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-stone-500 font-medium">Avg Order Value</p>
                <p className="text-sm font-bold text-stone-900">{formatMoney(data.breakdown.avgOrderValue)}</p>
              </div>
              <div className="bg-stone-50 border border-stone-100 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-stone-500 font-medium">Profit/Order</p>
                <p className={`text-sm font-bold ${data.breakdown.avgProfitPerOrder >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  {formatMoney(data.breakdown.avgProfitPerOrder)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-stone-400 text-sm text-center py-4">No data available</p>
        )}
      </div>
    </motion.div>
  );
}
