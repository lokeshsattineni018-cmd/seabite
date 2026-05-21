// AdminCompliance.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiCheckCircle, FiAlertTriangle, FiThermometer, FiTruck, 
  FiMessageSquare, FiDollarSign, FiClock, FiSearch, FiCornerDownRight
} from "react-icons/fi";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import toast from "react-hot-toast";

const MOCK_SHIPMENTS = [
  { 
    id: "SB-9204", 
    customer: "Sattineni Lokesh", 
    address: "Bhimavaram, Mogalthur Bypass",
    avgTemp: 1.4, 
    maxTemp: 2.1,
    status: "Pristine",
    timestamp: "10 mins ago",
    tempHistory: [
      { time: "14:00", temp: 1.0 },
      { time: "14:15", temp: 1.2 },
      { time: "14:30", temp: 1.5 },
      { time: "14:45", temp: 2.1 },
      { time: "15:00", temp: 1.4 }
    ]
  },
  { 
    id: "SB-8841", 
    customer: "Vara Prasad", 
    address: "Palakollu Road, Hub 2",
    avgTemp: 3.5, 
    maxTemp: 3.9,
    status: "Caution",
    timestamp: "45 mins ago",
    tempHistory: [
      { time: "13:30", temp: 2.0 },
      { time: "13:45", temp: 3.1 },
      { time: "14:00", temp: 3.8 },
      { time: "14:15", temp: 3.9 },
      { time: "14:30", temp: 3.5 }
    ]
  },
  { 
    id: "SB-7429", 
    customer: "Aditya Murthy", 
    address: "Jubilee Hills, Road 4",
    avgTemp: 4.6, 
    maxTemp: 5.2,
    status: "Danger",
    timestamp: "1 hr ago",
    tempHistory: [
      { time: "12:00", temp: 1.5 },
      { time: "12:30", temp: 3.0 },
      { time: "13:00", temp: 4.8 },
      { time: "13:30", temp: 5.2 },
      { time: "14:00", temp: 4.6 }
    ]
  }
];

export default function AdminCompliance() {
  const [selectedShipment, setSelectedShipment] = useState(MOCK_SHIPMENTS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refundingId, setRefundingId] = useState(null);
  const [creditingId, setCreditingId] = useState(null);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pristine":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Caution":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Danger":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-stone-50 text-stone-700 border-stone-200";
    }
  };

  const handleRefund = (shipmentId) => {
    setRefundingId(shipmentId);
    setTimeout(() => {
      setRefundingId(null);
      toast.success(`Refund processed successfully for ${shipmentId}!`, { icon: "💸" });
    }, 1000);
  };

  const handleProactiveRecovery = (shipment) => {
    setCreditingId(shipment.id);
    setTimeout(() => {
      setCreditingId(null);
      toast.success(`Wallet credited with ₹150 & Apology SMS sent to ${shipment.customer}!`, { icon: "✉️" });
    }, 1000);
  };

  const filteredShipments = MOCK_SHIPMENTS.filter(s => 
    s.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-stone-900 flex items-center gap-3">
          📋 Cold-Chain Compliance Audit Panel
        </h1>
        <p className="text-sm text-stone-500 font-semibold mt-1">
          Trace transit temperature coordinates and execute proactive quality-recovery protocols before complaints happen.
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 bg-white rounded-2xl border border-stone-200/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 flex-shrink-0">
            <FiCheckCircle size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Compliance Score</p>
            <h3 className="text-2xl font-black text-stone-900 mt-0.5">98.4%</h3>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-stone-200/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-500 flex-shrink-0">
            <FiThermometer size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Average Box Temp</p>
            <h3 className="text-2xl font-black text-stone-900 mt-0.5">1.8°C</h3>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-stone-200/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 flex-shrink-0 animate-pulse">
            <FiAlertTriangle size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Flagged Transits</p>
            <h3 className="text-2xl font-black text-stone-900 mt-0.5">1 Today</h3>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left: Tabular Log Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 bg-white rounded-2xl border border-stone-200/60 shadow-sm space-y-4">
            
            {/* Table Search Header */}
            <div className="flex justify-between items-center gap-4 flex-wrap">
              <h3 className="text-base font-extrabold text-stone-900">Active Shipments Log</h3>
              <div className="relative w-full max-w-xs">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                <input
                  type="text"
                  placeholder="Search Shipment ID / Client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-2 bg-stone-50 border border-stone-200/70 rounded-xl text-xs font-semibold outline-none focus:border-[#5BBFB5] transition-all"
                />
              </div>
            </div>

            {/* Shipment Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 text-[10px] font-black uppercase text-stone-400 tracking-wider">
                    <th className="py-3">Shipment</th>
                    <th className="py-3">Customer</th>
                    <th className="py-3 text-right">Avg Temp</th>
                    <th className="py-3 text-right">Max Temp</th>
                    <th className="py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 text-xs">
                  {filteredShipments.map((ship) => {
                    const isSelected = selectedShipment.id === ship.id;
                    return (
                      <tr 
                        key={ship.id} 
                        onClick={() => setSelectedShipment(ship)}
                        className={`cursor-pointer transition-all ${
                          isSelected ? "bg-stone-50" : "hover:bg-stone-50/40"
                        }`}
                      >
                        <td className="py-4 font-bold text-stone-950 flex items-center gap-2">
                          <FiTruck className="text-stone-400" /> {ship.id}
                        </td>
                        <td className="py-4 text-stone-500 font-semibold">{ship.customer}</td>
                        <td className="py-4 text-right font-black text-stone-800">{ship.avgTemp}°C</td>
                        <td className="py-4 text-right font-bold text-stone-400">{ship.maxTemp}°C</td>
                        <td className="py-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(ship.status)}`}>
                            {ship.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        </div>

        {/* Right: Selected Audit Deep Dive View */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedShipment.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="p-6 bg-white rounded-2xl border border-stone-200/60 shadow-sm space-y-6"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#5BBFB5]">Sensor Audit Deep-Dive</span>
                <h3 className="text-lg font-extrabold text-stone-900 mt-1 flex items-center gap-2">
                  🔍 Shipment {selectedShipment.id}
                </h3>
                <p className="text-[11px] text-stone-400 font-semibold leading-relaxed mt-1.5 flex items-start gap-1">
                  <FiClock className="mt-0.5 flex-shrink-0" /> Loaded {selectedShipment.timestamp} for {selectedShipment.customer} at {selectedShipment.address}.
                </p>
              </div>

              {/* Dynamic Recharts Temperature History Line chart */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Sensor Temperature Plot</span>
                <div className="h-40 w-full bg-stone-50/50 rounded-xl p-2 border border-stone-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedShipment.tempHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                      <XAxis dataKey="time" stroke="#aaa" fontSize={9} tickLine={false} />
                      <YAxis stroke="#aaa" fontSize={9} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ background: "#fff", border: "1px solid #eee", borderRadius: "8px", fontFamily: "'Plus Jakarta Sans', sans-serif" }} 
                        labelStyle={{ fontWeight: 800, fontSize: 10 }}
                      />
                      <Line type="monotone" dataKey="temp" name="Temp (°C)" stroke={selectedShipment.status === "Danger" ? "#F43F5E" : "#5BBFB5"} strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status details warning banner */}
              {selectedShipment.status === "Danger" && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-950">
                  <FiAlertTriangle className="text-rose-500 flex-shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="font-extrabold text-xs">Quality Threshold Breach Triggered!</h4>
                    <p className="text-[10px] text-rose-800 leading-relaxed mt-0.5 font-medium">
                      Box temperature exceeded 4.0°C. Proactive customer compensation or full refund is recommended.
                    </p>
                  </div>
                </div>
              )}

              {/* Proactive Actions */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Proactive Recovery Suite</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleProactiveRecovery(selectedShipment)}
                    disabled={creditingId === selectedShipment.id}
                    className="p-3 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <FiMessageSquare size={16} className="text-[#5BBFB5]" />
                    {creditingId === selectedShipment.id ? "Crediting..." : "Send Apology + Cr"}
                  </button>
                  
                  <button
                    onClick={() => handleRefund(selectedShipment.id)}
                    disabled={refundingId === selectedShipment.id}
                    className="p-3 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <FiDollarSign size={16} className="text-rose-500" />
                    {refundingId === selectedShipment.id ? "Refunding..." : "Full Refund"}
                  </button>
                </div>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
