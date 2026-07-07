import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  FiSearch, FiInbox, FiActivity, FiDollarSign, FiClock, 
  FiAlertCircle, FiUser, FiInfo, FiCheckCircle 
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const API = import.meta.env.VITE_API_URL || "";

export default function SupportDashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [searchId, setSearchId] = useState("");
  const [xrayOrder, setXrayOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/support/tickets`, { withCredentials: true });
      setTickets(data || []);
    } catch (err) {
      toast.error("Failed to load tickets queue");
    } finally {
      setLoading(false);
    }
  };

  const handleOrderLookup = async (id = searchId) => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/support/order/${id}`, { withCredentials: true });
      setXrayOrder(data);
    } catch (err) {
      toast.error("Order lookup failed. Verify ID.");
      setXrayOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!xrayOrder) return;
    if (!refundAmount || isNaN(refundAmount) || Number(refundAmount) <= 0) {
      toast.error("Enter a valid refund amount");
      return;
    }

    setRefunding(true);
    try {
      const { data } = await axios.post(`${API}/api/support/refund`, {
        orderId: xrayOrder._id,
        amount: Number(refundAmount)
      }, { withCredentials: true });

      toast.success(data.message || "Refund issued successfully!");
      setRefundAmount("");
      // Reload order detail
      handleOrderLookup(xrayOrder._id);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to process refund";
      toast.error(msg);
    } finally {
      setRefunding(false);
    }
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-stone-50 to-white text-stone-900 font-sans p-4 md:p-8">
      {/* Support Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            🎧 Customer Support Portal
          </h1>
          <p className="text-sm text-stone-500 mt-1">Order Resolution, Diagnostics, and Compensation Controls</p>
        </div>
        <div className="relative">
          <select
            value="support"
            onChange={(e) => {
              const val = e.target.value;
              if (val === "admin") navigate("/admin/dashboard");
              if (val === "driver") navigate("/driver");
            }}
            className="bg-stone-100 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-800 focus:outline-none cursor-pointer hover:bg-stone-200/60 transition-colors"
          >
            <option value="admin">🏢 Admin Dashboard</option>
            <option value="driver">🛵 Driver Dashboard</option>
            <option value="support">🎧 Support Dashboard</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Tickets Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-stone-200 rounded-3xl p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FiInbox className="text-stone-700" /> Active Resolution Queue
          </h2>

          <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
            {tickets.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <FiInfo className="mx-auto mb-2" size={24} />
                <p className="text-xs">No active tickets requiring resolution.</p>
              </div>
            ) : (
              tickets.map(ticket => (
                <div 
                  key={ticket._id}
                  onClick={() => {
                    setSelectedTicketId(ticket._id);
                    setXrayOrder(ticket);
                  }}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${selectedTicketId === ticket._id ? "bg-stone-50 border-stone-800 shadow-sm" : "bg-white border-stone-150 hover:bg-stone-50"}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold font-mono text-stone-600">#{ticket.orderId}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold uppercase">
                      {ticket.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold mt-2 flex items-center gap-1.5">
                    <FiUser size={12} /> {ticket.user?.name || "Guest User"}
                  </h4>
                  <p className="text-[10px] text-stone-500 mt-1">Total Order Value: ₹{ticket.totalAmount}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Order X-Ray Diagnostics & Restricted Actions (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Diagnostic Search Input */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FiActivity className="text-rose-500 animate-pulse" /> Order X-Ray diagnostics
            </h2>
            <div className="flex gap-3">
              <div className="relative flex-grow">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Paste order MongoDB ID or Order ID here..."
                  value={searchId}
                  onChange={e => setSearchId(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs outline-none focus:bg-white focus:border-stone-800 transition-all"
                />
              </div>
              <button 
                onClick={() => handleOrderLookup()}
                className="px-6 py-3 bg-stone-900 hover:bg-stone-850 text-white font-bold text-xs rounded-2xl transition-all shadow-sm"
              >
                Scan Order
              </button>
            </div>
          </div>

          {/* Diagnostic details */}
          <AnimatePresence mode="wait">
            {xrayOrder ? (
              <motion.div 
                key="diagnostics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-6"
              >
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <h3 className="text-base font-extrabold">Order #{xrayOrder.orderId}</h3>
                    <p className="text-[10px] text-stone-400 mt-0.5">Database ID: {xrayOrder._id}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-rose-500">₹{xrayOrder.totalAmount}</span>
                    <p className="text-[10px] text-stone-500 mt-0.5">Payment Method: {xrayOrder.paymentMethod || "COD"}</p>
                  </div>
                </div>

                {/* Logistics timeline audit */}
                <div>
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Order Lifecycle Timeline</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    {[
                      { status: "Placed", done: true, time: new Date(xrayOrder.createdAt).toLocaleTimeString() },
                      { status: "Shipped", done: xrayOrder.isShipped || xrayOrder.status === "Shipped", time: xrayOrder.shippedAt ? new Date(xrayOrder.shippedAt).toLocaleTimeString() : "Pending" },
                      { status: "Out for Delivery", done: xrayOrder.status === "Out for Delivery" || xrayOrder.status === "Delivered", time: "Pending" },
                      { status: "Delivered", done: xrayOrder.isDelivered || xrayOrder.status === "Delivered", time: xrayOrder.deliveredAt ? new Date(xrayOrder.deliveredAt).toLocaleTimeString() : "Pending" }
                    ].map((step, index) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-2xl border flex flex-col justify-between h-24 ${step.done ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-stone-50 border-stone-150 text-stone-400"}`}
                      >
                        <span className="text-xs font-bold">{step.status}</span>
                        <div className="flex flex-col items-center gap-1">
                          {step.done ? <FiCheckCircle className="text-emerald-600" /> : <FiAlertCircle />}
                          <span className="text-[9px] font-semibold">{step.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Restricted actions compensation console */}
                <div className="border-t pt-6">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">Restricted Compensation Controls</h4>
                  
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="max-w-md">
                      <h5 className="text-xs font-bold flex items-center gap-1.5 text-stone-700">
                        <FiDollarSign className="text-emerald-600" /> Issue Partial Refund/Credit
                      </h5>
                      <p className="text-[10px] text-stone-500 mt-1">
                        Compensation limit is strictly capped at **₹500** per transaction for customer support agents. Escalations beyond this require Admin overrides.
                      </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-bold">₹</span>
                        <input 
                          type="number" 
                          placeholder="Amount" 
                          value={refundAmount}
                          onChange={e => setRefundAmount(e.target.value)}
                          className="w-full pl-6 pr-3 py-2 bg-white border border-stone-300 rounded-xl text-xs outline-none focus:border-stone-800"
                        />
                      </div>
                      <button 
                        onClick={handleProcessRefund}
                        disabled={refunding}
                        className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white text-xs font-bold rounded-xl disabled:opacity-50"
                      >
                        {refunding ? "Processing..." : "Issue Compensation"}
                      </button>
                    </div>
                  </div>
                </div>

              </motion.div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center text-stone-400 shadow-sm">
                <FiActivity className="mx-auto mb-3" size={32} />
                <p className="text-sm font-semibold">Ready for Diagnostic Scan</p>
                <p className="text-xs mt-1">Select an order from the queue or search directly to display full diagnostics.</p>
              </div>
            )}
          </AnimatePresence>

        </div>

      </div>
    </div>
  );
}
