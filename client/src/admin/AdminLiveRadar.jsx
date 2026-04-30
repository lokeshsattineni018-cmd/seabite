import { useState, useEffect } from "react";
import axios from "axios";
import { FiActivity, FiMapPin, FiClock, FiUser, FiGlobe } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLiveRadar() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

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
              Live Radar
            </h1>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-2 uppercase tracking-widest">
              Real-time Global Telemetry
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
