import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Users,
  Search,
  Filter,
  DollarSign,
  ShoppingCart,
  Calendar,
  AlertCircle,
  TrendingUp,
  User,
  Activity,
  Heart,
  MessageSquare
} from "lucide-react";
import OrderDrawer from "./components/OrderDrawer";

const API = import.meta.env.VITE_API_URL || "";

export default function AdminCRM() {
  const [customers, setCustomers] = useState([]);
  const [segments, setSegments] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customer360, setCustomer360] = useState(null);
  const [loading360, setLoading360] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchCRMData = async () => {
    setLoading(true);
    try {
      const [custRes, segRes] = await Promise.all([
        axios.get(`${API}/api/admin/users`, { withCredentials: true }),
        axios.get(`${API}/api/admin/crm/segments`, { withCredentials: true })
      ]);
      setCustomers(Array.isArray(custRes.data) ? custRes.data : []);
      setSegments(segRes.data.segments || []);
    } catch (err) {
      toast.error("Failed to load CRM data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomer360 = async (id) => {
    setLoading360(true);
    setSelectedCustomerId(id);
    try {
      const { data } = await axios.get(`${API}/api/admin/crm/customer/${id}/360`, { withCredentials: true });
      setCustomer360(data);
    } catch (err) {
      toast.error("Failed to load customer profile details");
    } finally {
      setLoading360(false);
    }
  };

  useEffect(() => {
    fetchCRMData();
  }, []);

  const getHealthScoreColor = (score) => {
    if (score >= 80) return "text-emerald-400 bg-emerald-500/10";
    if (score >= 50) return "text-amber-400 bg-amber-500/10";
    return "text-red-400 bg-red-500/10";
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm);
    return matchesSearch;
  });

  return (
    <div className="p-6 min-h-screen bg-[#0a1625] text-slate-100 font-sans">
      <OrderDrawer
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdate={fetchCRMData}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-sky-500/15 border border-sky-500/30">
            <Users className="text-sky-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Customer Relationship Management</h1>
            <p className="text-xs text-slate-400">Granular customer profiles, automated segment lists, engagement metrics, and health scores</p>
          </div>
        </div>
      </div>

      {/* CRM Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2 Columns: Segments & Customers List */}
        <div className="xl:col-span-2 space-y-6">
          {/* Segments Quick Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {segments.map(seg => (
              <div
                key={seg.id}
                onClick={() => setSelectedSegment(seg.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedSegment === seg.id
                    ? "bg-sky-600/10 border-sky-500"
                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                }`}
              >
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{seg.name}</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-bold text-white">{seg.count}</span>
                  <span className="text-[10px] text-sky-400 font-semibold">Customers</span>
                </div>
              </div>
            ))}
          </div>

          {/* Search & Table list */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-bold text-white">All Active Accounts</h3>
              <div className="relative w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input
                  type="text"
                  placeholder="Search name, email, phone..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500/50"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 font-bold uppercase">
                    <th className="pb-3 pr-4">Customer</th>
                    <th className="pb-3 px-4">Loyalty Tier</th>
                    <th className="pb-3 px-4">LTV</th>
                    <th className="pb-3 px-4">Points</th>
                    <th className="pb-3 pl-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">Loading customer roster...</td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">No matching accounts found</td>
                    </tr>
                  ) : (
                    filteredCustomers.map(c => (
                      <tr key={c._id} className="border-b border-white/5 hover:bg-white/[0.01] transition-all">
                        <td className="py-3.5 pr-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                            {c.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white">{c.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{c.email || c.phone}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-300">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            c.loyaltyTier === "Platinum" ? "bg-purple-500/20 text-purple-400" :
                            c.loyaltyTier === "Gold" ? "bg-amber-500/20 text-amber-400" :
                            c.loyaltyTier === "Silver" ? "bg-slate-500/20 text-slate-300" : "bg-stone-500/20 text-stone-400"
                          }`}>
                            {c.loyaltyTier || "Bronze"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-white">₹{(c.lifetimeOrderValue || 0).toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">{c.totalLoyaltyPoints || 0} pts</td>
                        <td className="py-3.5 pl-4 text-right">
                          <button
                            onClick={() => fetchCustomer360(c._id)}
                            className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                          >
                            Explore 360°
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Customer 360° View */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Customer 360° Insights</h3>
          {selectedCustomerId ? (
            loading360 ? (
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 animate-pulse space-y-4">
                <div className="h-10 w-2/3 bg-slate-800 rounded" />
                <div className="h-24 bg-slate-800 rounded" />
                <div className="h-40 bg-slate-800 rounded" />
              </div>
            ) : customer360 ? (
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-6">
                {/* Profile Brief */}
                <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center font-bold text-lg text-sky-400">
                    {customer360.user.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{customer360.user.name}</h4>
                    <p className="text-[10px] text-slate-500">{customer360.user.email || "No email linked"}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{customer360.user.phone || "No phone linked"}</p>
                  </div>
                </div>

                {/* Loyalty Tier Status */}
                <div className="p-3.5 bg-black/20 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Loyalty Program status</span>
                    <span className="text-[10px] uppercase font-bold text-sky-400">{customer360.user.loyaltyTier || "Bronze"} Tier</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <div className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-center">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Streak</span>
                      <span className="text-sm font-mono font-bold text-amber-400">{customer360.user.currentStreak || 0} Days 🔥</span>
                    </div>
                    <div className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-center">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Wishlist</span>
                      <span className="text-sm font-mono font-bold text-rose-400">{customer360.user.wishlist?.length || 0} Items</span>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-3">
                    <ShoppingCart size={16} className="text-sky-400" />
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Total orders</span>
                      <span className="text-base font-bold text-white">{customer360.stats.totalOrders}</span>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-3">
                    <DollarSign size={16} className="text-emerald-400" />
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">LTV Spend</span>
                      <span className="text-base font-bold text-white">₹{customer360.stats.totalSpent.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Order History List */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Order History</span>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                    {customer360.orders.length === 0 ? (
                      <p className="text-slate-500 text-xs py-4 text-center">No orders placed yet</p>
                    ) : (
                      customer360.orders.map(order => (
                        <div
                          key={order._id}
                          onClick={() => setSelectedOrder(order)}
                          className="bg-black/20 border border-white/5 rounded-xl p-3 flex justify-between items-center hover:border-white/10 transition-colors cursor-pointer"
                        >
                          <div>
                            <span className="font-mono text-xs font-bold text-blue-600">#{order.orderId}</span>
                            <p className="text-[9px] text-slate-500 mt-0.5">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-white">₹{(order.totalAmount || 0).toLocaleString()}</span>
                            <span className={`block text-[9px] font-bold ${
                              order.status === "Delivered" ? "text-emerald-400" :
                              order.status === "Cancelled" ? "text-red-400" : "text-amber-400"
                            }`}>{order.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center">
                <AlertCircle size={28} className="text-slate-700 mx-auto" />
                <p className="text-xs text-slate-500 mt-2">Error rendering customer metadata.</p>
              </div>
            )
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center bg-white/[0.01]">
              <User size={28} className="text-slate-700 mx-auto" />
              <p className="text-xs text-slate-500 mt-2">Select a customer to view their 360° metrics, preferences, and transaction details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
