import { useState, useEffect } from "react";
import axios from "axios";
import { FiActivity, FiMapPin, FiClock, FiUser, FiGlobe } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const zonesData = [
  { id: "center", name: "Bhimavaram Center Hub", path: "M 160 140 m -60, 0 a 60,60 0 1,0 120,0 a 60,60 0 1,0 -120,0", fill: "rgba(16, 185, 129, 0.12)", stroke: "#10b981", density: 8, load: "Clear (Low Latency)", colorClass: "text-emerald-500", rawFill: "rgba(16, 185, 129, 0.25)" },
  { id: "north", name: "North Outskirts Corridor", path: "M 60 20 L 260 20 L 220 90 L 100 90 Z", fill: "rgba(239, 68, 68, 0.12)", stroke: "#ef4444", density: 1, load: "Rider Bottleneck (High Latency)", colorClass: "text-rose-500", rawFill: "rgba(239, 68, 68, 0.25)" },
  { id: "east", name: "East Aquaculture Zone", path: "M 220 90 L 290 120 L 290 230 L 220 200 Z", fill: "rgba(245, 158, 11, 0.12)", stroke: "#f59e0b", density: 3, load: "Moderate Load", colorClass: "text-amber-500", rawFill: "rgba(245, 158, 11, 0.25)" },
  { id: "west", name: "West Farm Gate Sector", path: "M 10 120 L 100 90 L 100 200 L 10 230 Z", fill: "rgba(16, 185, 129, 0.12)", stroke: "#10b981", density: 5, load: "Clear", colorClass: "text-emerald-500", rawFill: "rgba(16, 185, 129, 0.25)" }
];

export default function AdminLiveRadar() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredZone, setHoveredZone] = useState(null);

  const fetchActiveVisitors = async () => {
    try {
      const { data } = await axios.get("/api/admin/telemetry/active");
      setVisitors(data);
    } catch (err) {
      console.error("Failed to fetch live radar data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveVisitors();
    const interval = setInterval(fetchActiveVisitors, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (dateString) => {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins === 0) return "Just now";
    return `${diffMins} min ago`;
  };

  return (
    <div className="p-6 md:p-8 bg-[#f8fafc] dark:bg-[#0a1625] min-h-screen text-[#1A2E2C] dark:text-[#E2EEEC] font-sans">
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
          {/* Interactive SVG Geofence Map */}
          <div className="lg:col-span-2 bg-white dark:bg-[#122134] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                📍 Interactive Geofence Delivery Density
              </h2>
              <p className="text-xs text-gray-500 mt-1">Live coverage map of Bhimavaram Hub zones. Hover on zones to view active logistics metrics.</p>
            </div>
            
            <div className="flex items-center justify-center py-6 relative">
              <svg viewBox="0 0 320 260" className="w-full max-w-[360px] drop-shadow-xl select-none">
                {zonesData.map(zone => (
                  <motion.path
                    key={zone.id}
                    d={zone.path}
                    fill={hoveredZone?.id === zone.id ? zone.rawFill : zone.fill}
                    stroke={zone.stroke}
                    strokeWidth={hoveredZone?.id === zone.id ? 3 : 1.5}
                    className="cursor-pointer transition-all duration-300"
                    onMouseEnter={() => setHoveredZone(zone)}
                    onMouseLeave={() => setHoveredZone(null)}
                    whileHover={{ scale: 1.02 }}
                  />
                ))}
                {/* Hub Center Pin */}
                <circle cx="160" cy="140" r="6" fill="#1e293b" stroke="#ffffff" strokeWidth="2" />
              </svg>
            </div>

            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest border-t border-gray-50 dark:border-gray-800 pt-4">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Green = Clear</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Orange = Moderate</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Red = Bottleneck</span>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                <AnimatePresence>
                  {loading && visitors.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-sm font-semibold text-gray-400">
                        Initializing radar sweep...
                      </td>
                    </tr>
                  ) : visitors.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-sm font-semibold text-gray-400">
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
                        className="hover:bg-gray-50/50 dark:hover:bg-[#162940] transition-colors group"
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
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
                            <div className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </div>
                          </div>
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
    </div>
  );
}
