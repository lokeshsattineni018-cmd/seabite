import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Truck,
  Phone,
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  ArrowLeft
} from "lucide-react";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "";

export default function DeliveryTracker() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTracking = async () => {
    try {
      const { data } = await axios.get(`${API}/api/delivery-tracking/track/${orderId}`);
      setTracking(data);
    } catch (err) {
      toast.error("Failed to load live tracking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 15000); // Poll location every 15s
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a1625] text-slate-400">
        <Truck size={36} className="text-sky-400 animate-bounce mb-4" />
        <p className="text-xs">Locating delivery partner...</p>
      </div>
    );
  }

  if (!tracking) return null;

  return (
    <div className="p-6 min-h-screen bg-[#0a1625] text-slate-100 font-sans max-w-[600px] mx-auto">
      {/* Top Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white">Track Order #{orderId}</h1>
          <p className="text-[10px] text-slate-500">Live delivery coordinate streams</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Map Placeholder or Leaflet simulation */}
        <div className="h-[250px] bg-slate-900 border border-white/5 rounded-3xl overflow-hidden relative flex items-center justify-center">
          <div className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: "radial-gradient(circle, #64748b 1px, transparent 1px)",
              backgroundSize: "20px 20px"
            }}
          />
          <div className="relative text-center space-y-2 z-10 p-6">
            <MapPin size={32} className="text-sky-400 mx-auto animate-bounce" />
            <p className="text-xs font-bold text-white">Simulated Map Location</p>
            {tracking.coordinates && (
              <p className="text-[10px] text-slate-400 font-mono">
                Lat: {tracking.coordinates.lat?.toFixed(4)} • Lng: {tracking.coordinates.lng?.toFixed(4)}
              </p>
            )}
          </div>
        </div>

        {/* ETA & Driver info */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-400 shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Estimated Arrival</span>
                <span className="text-sm font-bold text-white mt-0.5">
                  {new Date(tracking.estimatedDeliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 uppercase">
              {tracking.deliveryStatus}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                {tracking.driverName?.[0]}
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Delivery Partner</span>
                <span className="text-xs font-bold text-white block mt-0.5">{tracking.driverName}</span>
              </div>
            </div>
            <a
              href={`tel:${tracking.driverPhone}`}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-sky-400"
            >
              <Phone size={16} />
            </a>
          </div>
        </div>

        {/* Status timeline */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 space-y-4">
          <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider">Status History</h3>
          <div className="relative pl-6 space-y-4">
            {/* Timeline line */}
            <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-slate-800" />

            {[
              { id: "Pending", label: "Order Received", done: true },
              { id: "Processing", label: "Packing Fresh Catch", done: tracking.status !== "Pending" },
              { id: "Shipped", label: "Out for Delivery", done: ["Shipped", "Delivered"].includes(tracking.status) },
              { id: "Delivered", label: "Arrived at Destination", done: tracking.status === "Delivered" },
            ].map(step => (
              <div key={step.id} className="relative flex items-start gap-4 text-xs">
                <div className={`absolute -left-[22px] w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center text-[8px] font-bold ${
                  step.done ? "bg-emerald-600 border-emerald-500 text-white" : "bg-slate-900 border-slate-700 text-slate-500"
                }`}>
                  {step.done ? "✓" : ""}
                </div>
                <div>
                  <span className={`font-semibold ${step.done ? "text-white" : "text-slate-500"}`}>{step.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
