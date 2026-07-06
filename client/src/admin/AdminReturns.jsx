import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import {
  RotateCcw,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  FileText,
  DollarSign,
  User,
  Package,
  Calendar,
  AlertCircle
} from "lucide-react";
import OrderDrawer from "./components/OrderDrawer";

const API = import.meta.env.VITE_API_URL || "";

export default function AdminReturns() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("requested");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/returns?status=all`, { withCredentials: true });
      setOrders(data.orders || []);
    } catch (err) {
      toast.error("Failed to load return requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleApproveReturn = async (id, refundAmount, refundMethod) => {
    if (!window.confirm("Approve this return request and initiate refund?")) return;
    try {
      await axios.put(`${API}/api/returns/${id}/approve`, {
        refundAmount,
        refundMethod,
        adminNotes: "Approved by Admin"
      }, { withCredentials: true });
      toast.success("Return request approved and refunded!");
      fetchOrders();
    } catch (err) {
      toast.error("Failed to approve request");
    }
  };

  const handleRejectReturn = async (id, reason) => {
    if (!window.confirm("Reject this return request?")) return;
    try {
      await axios.put(`${API}/api/returns/${id}/reject`, {
        adminNotes: reason,
      }, { withCredentials: true });
      toast.success("Return request rejected");
      fetchOrders();
    } catch (err) {
      toast.error("Failed to reject request");
    }
  };

  const filtered = orders.filter(o => {
    const matchesFilter = filter === "all" || o.returnRequest.status === filter;
    const matchesSearch = o.orderId?.toString().includes(searchTerm) ||
      o.shippingAddress?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 min-h-screen bg-[#0a1625] text-slate-100 font-sans">
      <OrderDrawer
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdate={fetchOrders}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-rose-500/15 border border-rose-500/30">
            <RotateCcw className="text-rose-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Returns & Refunds
            </h1>
            <p className="text-xs text-slate-400">Manage return approvals, verify product weights, and issue digital wallet refunds</p>
          </div>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Sync Returns
        </button>
      </div>

      {/* Controls & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: "requested", label: "Requested" },
            { id: "approved", label: "Approved" },
            { id: "rejected", label: "Rejected" },
            { id: "refunded", label: "Refunded" },
            { id: "all", label: "All Returns" },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filter === f.id
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/15"
                  : "bg-white/5 hover:bg-white/10 text-slate-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Search Order ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500/50"
            />
          </div>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
          <RotateCcw size={36} className="text-slate-600 mx-auto" />
          <p className="text-sm text-slate-400 font-semibold mt-3">No return requests found</p>
          <p className="text-xs text-slate-500 mt-1">Return requests from customers will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map(order => (
            <motion.div
              key={order._id}
              className="rounded-2xl border border-white/5 bg-slate-900/30 p-5 space-y-4 hover:border-white/10 transition-all flex flex-col justify-between"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Order #{order.orderId}
                      <span className="px-2 py-0.5 rounded-full text-[9px] bg-slate-800 text-slate-400 font-semibold uppercase">
                        {order.returnRequest.status}
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Requested {new Date(order.returnRequest.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    View Details
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 bg-black/20 rounded-xl p-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Customer</span>
                    <span className="text-slate-300 font-semibold flex items-center gap-1">
                      <User size={12} /> {order.shippingAddress?.fullName || order.user?.name}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Refund Amount</span>
                    <span className="text-rose-400 font-bold flex items-center">
                      <DollarSign size={12} /> {order.totalAmount}
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Reason for Return</span>
                  <p className="text-xs text-slate-300 bg-white/5 rounded-xl p-3 border border-white/5 leading-relaxed">
                    "{order.returnRequest.reason}"
                  </p>
                </div>
              </div>

              {order.returnRequest.status === "requested" && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
                  <button
                    onClick={() => handleApproveReturn(order._id, order.totalAmount, "wallet")}
                    className="flex-1 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle size={14} /> Approve (Wallet Refund)
                  </button>
                  <button
                    onClick={() => {
                      const reason = window.prompt("Enter rejection reason:");
                      if (reason) handleRejectReturn(order._id, reason);
                    }}
                    className="px-4 py-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
