import React, { useState, useEffect, useRef } from "react";
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
import { useSocket } from "../../context/SocketContext";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API = import.meta.env.VITE_API_URL || "";

export default function DeliveryTracker() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  const { socket } = useSocket();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const driverMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const routeLineRef = useRef(null);

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

  useEffect(() => {
    if (!mapRef.current || mapInstance.current || !tracking) return;
    
    // Fix default icon path issues in Vite
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    const driverCoords = tracking.coordinates || { lat: 16.5449, lng: 81.5212 };
    const custCoords = tracking.customerCoordinates || { lat: 16.5449, lng: 81.5212 };

    mapInstance.current = L.map(mapRef.current).setView([driverCoords.lat, driverCoords.lng], 14);
    
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(mapInstance.current);

    // Draw customer marker
    const customerIcon = L.divIcon({
      className: "",
      html: `<div style="width:30px;height:30px;border-radius:50%;background:#ef4444;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;box-shadow:0 0 10px rgba(239,68,68,0.6);border:2px solid white;">🏠</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    customerMarkerRef.current = L.marker([custCoords.lat, custCoords.lng], { icon: customerIcon })
      .addTo(mapInstance.current)
      .bindPopup("Delivery Address");

    // Draw driver marker
    const driverIcon = L.divIcon({
      className: "",
      html: `<div style="width:34px;height:34px;border-radius:50%;background:#10b981;display:flex;align-items:center;justify-content:center;color:white;font-size:16px;box-shadow:0 0 10px rgba(16,185,129,0.6);border:2px solid white;">🛵</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
    driverMarkerRef.current = L.marker([driverCoords.lat, driverCoords.lng], { icon: driverIcon })
      .addTo(mapInstance.current)
      .bindPopup("Delivery Partner");

    // Draw dashed connection line
    routeLineRef.current = L.polyline([[driverCoords.lat, driverCoords.lng], [custCoords.lat, custCoords.lng]], {
      color: "#3b82f6",
      weight: 3,
      opacity: 0.7,
      dashArray: "6, 8"
    }).addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [tracking]);

  useEffect(() => {
    if (!socket || !tracking) return;

    socket.on("DRIVER_LOCATION_STREAM", (data) => {
      const { driverId, location } = data;
      if (location && location.lat && driverMarkerRef.current && mapInstance.current) {
        driverMarkerRef.current.setLatLng([location.lat, location.lng]);
        if (routeLineRef.current && tracking.customerCoordinates) {
          routeLineRef.current.setLatLngs([
            [location.lat, location.lng],
            [tracking.customerCoordinates.lat, tracking.customerCoordinates.lng]
          ]);
        }
      }
    });

    return () => {
      socket.off("DRIVER_LOCATION_STREAM");
    };
  }, [socket, tracking]);

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
        {/* Live Leaflet Map Container */}
        <div className="h-[250px] bg-slate-900 border border-white/5 rounded-3xl overflow-hidden relative z-0">
          <div ref={mapRef} className="w-full h-full" />
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
