import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FiActivity, FiMapPin, FiClock, FiUser, FiGlobe } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const zonesData = [
  { id: "center", name: "Bhimavaram Center Hub", fill: "rgba(16, 185, 129, 0.12)", stroke: "#10b981", density: 8, load: "Clear (Low Latency)", colorClass: "text-emerald-500" },
  { id: "north", name: "North Outskirts Corridor", fill: "rgba(239, 68, 68, 0.12)", stroke: "#ef4444", density: 1, load: "Rider Bottleneck (High Latency)", colorClass: "text-rose-500" },
  { id: "east", name: "East Aquaculture Zone", fill: "rgba(245, 158, 11, 0.12)", stroke: "#f59e0b", density: 3, load: "Moderate Load", colorClass: "text-amber-500" },
  { id: "west", name: "West Farm Gate Sector", fill: "rgba(16, 185, 129, 0.12)", stroke: "#10b981", density: 5, load: "Clear", colorClass: "text-emerald-500" }
];

export default function AdminLiveRadar() {
  const { socket } = useSocket();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredZone, setHoveredZone] = useState(null);
  
  // Promo Push State
  const [selectedVisitorForPromo, setSelectedVisitorForPromo] = useState(null);
  const [promoCode, setPromoCode] = useState("FRESH15");
  const [discountPercent, setDiscountPercent] = useState(15);
  const [promoMessage, setPromoMessage] = useState("We noticed you looking at our fresh seafood collection! Here is a special treat just for you.");
  const [isSendingPromo, setIsSendingPromo] = useState(false);

  const handleInitiateOffer = (visitorId) => {
    const prefixes = ["DELISH", "OCEAN", "FRESHCATCH", "SEAFOOD", "SHRIMP", "CRAB", "SQUID", "BITE"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const percent = [10, 15, 20, 25][Math.floor(Math.random() * 4)];
    const randomCode = `${prefix}-${randomHex}-${percent}`;

    setPromoCode(randomCode);
    setDiscountPercent(percent);
    setPromoMessage(`Special Treat! We noticed you looking at our fresh seafood collection. Take ${percent}% off your checkout!`);
    setSelectedVisitorForPromo(visitorId);
  };

  const handleSendPromo = async () => {
    if (!selectedVisitorForPromo) return;
    setIsSendingPromo(true);
    
    try {
      await axios.post("/api/telemetry/push-promo", {
        visitorId: selectedVisitorForPromo,
        promoCode,
        discountPercent,
        message: promoMessage
      });
      // Update local state instantly to provide immediate feedback to admin
      setVisitors(prev => prev.map(v => v.visitorId === selectedVisitorForPromo ? { ...v, promoStatus: "sent" } : v));
      toast.success("Promo offer pushed directly to visitor screen!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to push promo offer.");
    } finally {
      setIsSendingPromo(false);
      setSelectedVisitorForPromo(null);
    }
  };

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  
  const visitorMarkersRef = useRef({});
  const driverMarkersRef = useRef({});

  // Fix leaflet default icon path issue in Vite
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }, []);

  const fetchActiveVisitors = async () => {
    try {
      const { data } = await axios.get("/api/admin/telemetry/active");
      setVisitors(data);
      
      // Plot existing active visitors on the map if they have coordinates
      data.forEach(v => {
        if (v.lat && v.lng) {
          updateVisitorMarker(v.visitorId, v.userId, { lat: v.lat, lng: v.lng }, v.currentPath);
        }
      });
    } catch (err) {
      console.error("Failed to fetch live radar data");
    } finally {
      setLoading(false);
    }
  };

  const updateVisitorMarker = (visitorId, userId, coords, path = "/") => {
    if (!mapInstance.current) return;
    
    // Avoid redrawing and closing popup if coordinates are exactly identical
    if (visitorMarkersRef.current[visitorId]) {
      const currentLatLng = visitorMarkersRef.current[visitorId].getLatLng();
      if (currentLatLng.lat === coords.lat && currentLatLng.lng === coords.lng) {
        return;
      }
      visitorMarkersRef.current[visitorId].remove();
    }
    
    const icon = L.divIcon({
      className: "",
      html: `<div style="width:28px;height:28px;border-radius:50%;background:#3b82f6;display:flex;align-items:center;justify-content:center;color:white;font-size:12px;box-shadow:0 0 10px rgba(59,130,246,0.6);border:2px solid white;animation: pulse-blue 2s infinite;">👤</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    
    const marker = L.marker([coords.lat, coords.lng], { icon })
      .addTo(mapInstance.current)
      .bindPopup(`<strong>${userId ? "User" : "Visitor"}: ${visitorId}</strong><br/>Viewing: ${path}`);
      
    visitorMarkersRef.current[visitorId] = marker;
  };

  const updateDriverMarker = (driverId, name, coords) => {
    if (!mapInstance.current) return;
    
    if (driverMarkersRef.current[driverId]) {
      driverMarkersRef.current[driverId].remove();
    }
    
    const icon = L.divIcon({
      className: "",
      html: `<div style="width:34px;height:34px;border-radius:50%;background:#10b981;display:flex;align-items:center;justify-content:center;color:white;font-size:16px;box-shadow:0 0 10px rgba(16,185,129,0.6);border:2px solid white;">🛵</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
    
    const marker = L.marker([coords.lat, coords.lng], { icon })
      .addTo(mapInstance.current)
      .bindPopup(`<strong>Rider: ${name || driverId}</strong>`);
      
    driverMarkersRef.current[driverId] = marker;
  };

  // Map Initialization
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    
    mapInstance.current = L.map(mapRef.current).setView([16.5449, 81.5212], 13);
    
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(mapInstance.current);

    // Draw Bhimavaram Hub Zones
    L.circle([16.5449, 81.5212], { radius: 1000, color: '#10b981', fillColor: 'rgba(16, 185, 129, 0.08)', weight: 2 })
      .addTo(mapInstance.current)
      .on('mouseover', () => setHoveredZone(zonesData[0]))
      .on('mouseout', () => setHoveredZone(null));
      
    L.circle([16.565, 81.5212], { radius: 1000, color: '#ef4444', fillColor: 'rgba(239, 68, 68, 0.08)', weight: 2 })
      .addTo(mapInstance.current)
      .on('mouseover', () => setHoveredZone(zonesData[1]))
      .on('mouseout', () => setHoveredZone(null));

    L.circle([16.5449, 81.545], { radius: 1000, color: '#f59e0b', fillColor: 'rgba(245, 158, 11, 0.08)', weight: 2 })
      .addTo(mapInstance.current)
      .on('mouseover', () => setHoveredZone(zonesData[2]))
      .on('mouseout', () => setHoveredZone(null));

    L.circle([16.5449, 81.498], { radius: 1000, color: '#10b981', fillColor: 'rgba(16, 185, 129, 0.08)', weight: 2 })
      .addTo(mapInstance.current)
      .on('mouseover', () => setHoveredZone(zonesData[3]))
      .on('mouseout', () => setHoveredZone(null));

    fetchActiveVisitors();
    
    const interval = setInterval(fetchActiveVisitors, 10000);
    
    return () => {
      clearInterval(interval);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Socket.io Real-Time Stream Listeners
  useEffect(() => {
    if (!socket) return;
    
    // Join the admins room to receive VISITOR_LOCATION_STREAM events
    socket.emit("join-admin");
    
    socket.on("VISITOR_LOCATION_STREAM", (data) => {
      const { visitorId, userId, location, city } = data;
      if (location && location.lat && location.lng) {
        updateVisitorMarker(visitorId, userId, location);
        
        // Update visitors list status if they match
        setVisitors(prev => {
          const match = prev.find(v => v.visitorId === visitorId);
          if (match) {
            return prev.map(v => v.visitorId === visitorId ? { ...v, lat: location.lat, lng: location.lng, locationSource: "gps", lastActive: new Date(), ...(city ? { city } : {}) } : v);
          } else {
            return [{
              visitorId,
              userId,
              lat: location.lat,
              lng: location.lng,
              locationSource: "gps",
              ipAddress: "Live Stream",
              city: city || "Detected Live",
              currentPath: "Home",
              lastActive: new Date()
            }, ...prev];
          }
        });
      }
    });

    socket.on("DRIVER_LOCATION_STREAM", (data) => {
      const { driverId, location } = data;
      if (location && location.lat && location.lng) {
        updateDriverMarker(driverId, `Driver ${driverId.substring(0, 5)}`, location);
      }
    });

    return () => {
      socket.off("VISITOR_LOCATION_STREAM");
      socket.off("DRIVER_LOCATION_STREAM");
    };
  }, [socket]);

  const formatTime = (dateString) => {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins === 0) return "Just now";
    return `${diffMins} min ago`;
  };

  const focusOnLocation = (lat, lng, visitorId) => {
    if (mapInstance.current && lat && lng) {
      mapInstance.current.setView([lat, lng], 16);
      if (visitorMarkersRef.current[visitorId]) {
        visitorMarkersRef.current[visitorId].openPopup();
      } else {
        updateVisitorMarker(visitorId, null, { lat, lng });
        setTimeout(() => {
          if (visitorMarkersRef.current[visitorId]) {
            visitorMarkersRef.current[visitorId].openPopup();
          }
        }, 100);
      }
    } else {
      toast.error("No coordinates available for this user");
    }
  };

  return (
    <div className="p-6 md:p-8 bg-[#f8fafc] dark:bg-[#0a1625] min-h-screen text-[#1A2E2C] dark:text-[#E2EEEC] font-sans">
      <style>{`
        @keyframes pulse-blue {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
      `}</style>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
              <FiActivity className="text-emerald-500" />
              Live Radar & Geofences
            </h1>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-2 uppercase tracking-widest">
              Real-time Fleet Densities & Storefront visitors
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white dark:bg-[#122134] px-5 py-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="relative flex items-center justify-center h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-sm font-bold tracking-wide">
              {visitors.length} Active {visitors.length === 1 ? "Visitor" : "Visitors"}
            </span>
          </div>
        </div>

        {/* Geofenced Delivery Density Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Interactive Leaflet Map */}
          <div className="lg:col-span-2 bg-white dark:bg-[#122134] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                📍 Interactive Geofence Delivery Density
              </h2>
              <p className="text-xs text-gray-500 mt-1">Live coverage map of Bhimavaram Hub zones. Hover on zones to view active logistics metrics.</p>
            </div>
            
            <div className="h-[450px] relative w-full rounded-2xl overflow-hidden z-0">
              <div ref={mapRef} className="h-full w-full" />
            </div>

            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest border-t border-gray-50 dark:border-gray-800 pt-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Green = Clear</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Orange = Moderate</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" /> Red = Bottleneck</span>
            </div>
          </div>

          {/* Details Sidebar Card */}
          <div className="bg-white dark:bg-[#122134] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            {hoveredZone ? (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Selected Zone</span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{hoveredZone.name}</h3>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-[#0d1826] p-4 rounded-2xl border border-gray-100/50 dark:border-gray-800/50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rider Load Status</p>
                    <p className={`text-sm font-extrabold ${hoveredZone.colorClass}`}>{hoveredZone.load}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-[#0d1826] p-4 rounded-2xl border border-gray-100/50 dark:border-gray-800/50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Active Riders</p>
                      <p className="text-lg font-black text-gray-800 dark:text-white">{hoveredZone.density}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#0d1826] p-4 rounded-2xl border border-gray-100/50 dark:border-gray-800/50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Avg SLA Delay</p>
                      <p className="text-lg font-black text-gray-800 dark:text-white">
                        {hoveredZone.id === 'north' ? '28 mins' : hoveredZone.id === 'east' ? '14 mins' : '6 mins'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed pt-2">
                  ℹ️ AI dispatch recommends assigning backup riders from the <strong>West Farm Gate Sector</strong> to mitigate latency in the <strong>North Outskirts Corridor</strong>.
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 dark:text-gray-500">
                <FiMapPin size={32} className="opacity-30 mb-3" />
                <p className="text-xs font-bold uppercase tracking-wider">No Zone Selected</p>
                <p className="text-[10px] mt-1">Hover over map segments to view geofenced rider loads.</p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-800">
              <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">
                <span>Total Fleet Live</span>
                <span>17 Riders</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "75%" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#122134] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-[#0d1826] border-b border-gray-100 dark:border-gray-800 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  <th className="px-6 py-4">Visitor / User</th>
                  <th className="px-6 py-4">Location & IP</th>
                  <th className="px-6 py-4">Currently Viewing</th>
                  <th className="px-6 py-4">Time Active</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                <AnimatePresence>
                  {loading && visitors.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-sm font-semibold text-gray-400">
                        Initializing radar sweep...
                      </td>
                    </tr>
                  ) : visitors.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-sm font-semibold text-gray-400">
                        No active visitors detected in the last 15 minutes.
                      </td>
                    </tr>
                  ) : (
                    visitors.map((visitor) => (
                      <motion.tr 
                        key={visitor.visitorId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="hover:bg-gray-50/50 dark:hover:bg-[#162940] transition-colors group cursor-pointer"
                        onClick={() => focusOnLocation(visitor.lat, visitor.lng, visitor.visitorId)}
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                              {visitor.userId ? <FiUser size={18} /> : <FiGlobe size={18} />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {visitor.userId ? "Registered User" : "Anonymous Guest"}
                              </p>
                              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 font-mono mt-0.5 truncate max-w-[120px]">
                                {visitor.visitorId}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                              <FiMapPin className="text-gray-400" />
                              {visitor.city}
                              {visitor.locationSource === "gps" && (
                                <span className="text-[10px] bg-emerald-50 dark:bg-[#064e3b]/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md font-mono font-bold">GPS (Accurate)</span>
                              )}
                              {visitor.locationSource === "geoip" && (
                                <span className="text-[10px] bg-amber-50 dark:bg-[#78350f]/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md font-mono font-bold">IP (Estimated)</span>
                              )}
                              {visitor.locationError === 1 && (
                                <span className="text-[10px] bg-rose-50 dark:bg-[#881337]/30 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md font-mono font-bold">GPS Blocked</span>
                              )}
                              {visitor.locationError === 2 && (
                                <span className="text-[10px] bg-rose-50 dark:bg-[#881337]/30 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md font-mono font-bold">GPS Unavailable</span>
                              )}
                              {visitor.locationError === 3 && (
                                <span className="text-[10px] bg-rose-50 dark:bg-[#881337]/30 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md font-mono font-bold">GPS Timeout</span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-gray-400 dark:text-gray-500 ml-6">
                              {visitor.ipAddress}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-block px-3 py-1.5 bg-gray-100 dark:bg-[#1a2e44] text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold font-mono truncate max-w-[200px]">
                            {visitor.currentPath}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                            <FiClock className="text-gray-400" />
                            {formatTime(visitor.lastActive)}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            {/* Pulse Dot */}
                            <div className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </div>
                            
                            {/* Promo Status Badge */}
                            {visitor.promoStatus && visitor.promoStatus !== "none" && (
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mt-1 border ${
                                visitor.promoStatus === "sent" 
                                  ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200/40 dark:border-blue-900/30"
                                  : visitor.promoStatus === "copied"
                                  ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200/40 dark:border-amber-900/30"
                                  : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/40 dark:border-emerald-900/30 font-extrabold"
                              }`}>
                                {visitor.promoStatus === "used" ? "Used 🎉" : visitor.promoStatus}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => handleInitiateOffer(visitor.visitorId)}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-black shadow-sm shadow-blue-500/10 hover:shadow-md transition-all"
                          >
                            Offer Promo
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Promo Push Setup Modal */}
      {selectedVisitorForPromo && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#122134] border border-gray-100 dark:border-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">
              Push Real-Time Promo Offer
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">
                  Target Visitor
                </label>
                <input 
                  type="text" 
                  value={selectedVisitorForPromo} 
                  disabled 
                  className="w-full bg-gray-50 dark:bg-[#0d1826] border border-gray-100 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-gray-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">
                  Discount Code
                </label>
                <input 
                  type="text" 
                  value={promoCode} 
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="w-full bg-white dark:bg-[#0d1826] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-sm font-mono font-black text-gray-900 dark:text-white focus:outline-none focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">
                  Discount Percentage
                </label>
                <div className="flex items-center gap-2">
                  {[10, 15, 20, 25].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        setDiscountPercent(pct);
                        const parts = promoCode.split("-");
                        if (parts.length === 3) {
                          parts[2] = pct.toString();
                          setPromoCode(parts.join("-"));
                        } else {
                          const baseCode = promoCode.replace(/\d+/g, "");
                          setPromoCode(`${baseCode}${pct}`);
                        }
                      }}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                        discountPercent === pct 
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                          : "bg-white dark:bg-[#0d1826] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">
                  Promo Message
                </label>
                <textarea 
                  rows="3"
                  value={promoMessage} 
                  onChange={(e) => setPromoMessage(e.target.value)}
                  className="w-full bg-white dark:bg-[#0d1826] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-semibold text-gray-850 dark:text-gray-300 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setSelectedVisitorForPromo(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendPromo}
                disabled={isSendingPromo}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/10 transition-all disabled:opacity-50"
              >
                {isSendingPromo ? "Pushing offer..." : "Push Offer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
