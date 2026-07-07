import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  FiMapPin, FiCamera, FiDollarSign, FiClock, FiCheckCircle, 
  FiNavigation, FiTrendingUp, FiCheck, FiX, FiAward 
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const API = import.meta.env.VITE_API_URL || "";

export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("routes"); // routes, earnings, performance
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        axios.get(`${API}/api/delivery/my-orders`, { withCredentials: true }),
        axios.get(`${API}/api/delivery/my-stats`, { withCredentials: true })
      ]);
      setOrders(ordersRes.data || []);
      setStats(statsRes.data || null);
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, status, podUrl = null) => {
    try {
      await axios.put(`${API}/api/delivery/orders/${orderId}/status`, {
        status,
        podUrl
      }, { withCredentials: true });
      
      toast.success(`Order marked as ${status}`);
      fetchDashboardData();
      setActiveOrderId(null);
      setCapturedPhoto(null);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // HTML5 Camera controls
  const startCamera = async (orderId) => {
    setActiveOrderId(orderId);
    setCameraActive(true);
    setCapturedPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error("Unable to access camera. Please check permissions.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setCapturedPhoto(dataUrl);
      stopCamera();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-stone-50 to-white text-stone-900 font-sans p-4 md:p-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              🛵 Fleet Dashboard
            </h1>
            <p className="text-sm text-stone-500 mt-1">Driver Portal & Logistics Control</p>
          </div>
          <div className="relative">
            <select
              value="driver"
              onChange={(e) => {
                const val = e.target.value;
                if (val === "admin") navigate("/admin/dashboard");
                if (val === "support") navigate("/support");
              }}
              className="bg-stone-100 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-800 focus:outline-none cursor-pointer hover:bg-stone-200/60 transition-colors"
            >
              <option value="admin">🏢 Admin Dashboard</option>
              <option value="driver">🛵 Driver Dashboard</option>
              <option value="support">🎧 Support Dashboard</option>
            </select>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
          <button 
            onClick={() => setActiveTab("routes")}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === "routes" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
          >
            Routes & Tasks
          </button>
          <button 
            onClick={() => setActiveTab("earnings")}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === "earnings" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
          >
            Earnings
          </button>
          <button 
            onClick={() => setActiveTab("performance")}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === "performance" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
          >
            Performance (SLA)
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ROUTES TAB */}
        {activeTab === "routes" && (
          <motion.div 
            key="routes"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Live Map / Navigation Panel */}
            <div className="lg:col-span-8 bg-white border border-stone-200 rounded-3xl p-6 shadow-sm flex flex-col">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FiNavigation className="text-stone-700 animate-pulse" /> Live Route Optimization
              </h2>
              
              {/* Interactive Visual Map Placeholder */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl h-80 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {/* Visual grid / road simulation */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
                
                {/* Decorative map trace lines */}
                <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 50 150 Q 200 80 350 220 T 600 120" fill="none" stroke="#2b2b2b" strokeWidth="4" strokeDasharray="10, 5" />
                  <path d="M 120 300 Q 250 200 400 320" fill="none" stroke="#e11d48" strokeWidth="3" />
                </svg>

                <div className="z-10 text-center max-w-sm">
                  <FiMapPin className="mx-auto text-rose-500 mb-3" size={40} />
                  <p className="text-sm font-semibold">Active Logistics Router Running</p>
                  <p className="text-xs text-stone-500 mt-1">
                    Route mapped optimally for {orders.length} deliveries. Traffic and temperature sensors aligned.
                  </p>
                </div>
              </div>

              {/* Batched Stops Timeline */}
              <div className="mt-6 space-y-4">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Stops Timeline</h3>
                <div className="relative pl-6 border-l-2 border-stone-200 space-y-6">
                  {orders.length === 0 ? (
                    <p className="text-sm text-stone-500">No active runs dispatchable.</p>
                  ) : (
                    orders.map((order, i) => (
                      <div key={order._id} className="relative">
                        {/* Bullet Icon */}
                        <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-stone-800 flex items-center justify-center font-mono text-[9px] font-bold">
                          {i + 1}
                        </div>
                        <div className="bg-stone-50 border border-stone-150 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-bold">Order #{order.orderId}</h4>
                            <p className="text-xs text-stone-500 mt-0.5">{order.shippingAddress?.street}, {order.shippingAddress?.city}</p>
                            <p className="text-[10px] text-emerald-600 font-semibold mt-1">Status: {order.status}</p>
                          </div>
                          
                          <div className="flex gap-2">
                            {order.status === "Processing" && (
                              <button 
                                onClick={() => handleUpdateStatus(order._id, "Out for Delivery")}
                                className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-850 text-white text-xs font-bold rounded-xl"
                              >
                                Start Delivery
                              </button>
                            )}
                            
                            {order.status === "Out for Delivery" && (
                              <>
                                <button 
                                  onClick={() => startCamera(order._id)}
                                  className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 text-xs font-bold rounded-xl flex items-center gap-1.5"
                                >
                                  <FiCamera /> Snap POD
                                </button>
                                <button 
                                  onClick={() => handleUpdateStatus(order._id, "Delivered")}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                                >
                                  Mark Completed
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Controls & Camera Module */}
            <div className="lg:col-span-4 space-y-6">
              {/* HTML5 Camera overlay card */}
              {cameraActive && (
                <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm text-center">
                  <h3 className="text-sm font-bold mb-4">📸 Capture Delivery Proof</h3>
                  <div className="bg-black rounded-2xl overflow-hidden aspect-video relative mb-4">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button 
                      onClick={capturePhoto}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                    >
                      Capture
                    </button>
                    <button 
                      onClick={stopCamera}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {capturedPhoto && (
                <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm text-center">
                  <h3 className="text-sm font-bold mb-4 flex items-center justify-center gap-1.5 text-emerald-600">
                    <FiCheckCircle /> Proof Captured
                  </h3>
                  <img src={capturedPhoto} alt="POD" className="w-full rounded-2xl mb-4 max-h-48 object-cover border" />
                  <div className="flex gap-2 justify-center">
                    <button 
                      onClick={() => handleUpdateStatus(activeOrderId, "Delivered", capturedPhoto)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                    >
                      Upload & Submit
                    </button>
                    <button 
                      onClick={() => setCapturedPhoto(null)}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl"
                    >
                      Retake
                    </button>
                  </div>
                </div>
              )}

              {/* Rider quick status */}
              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-bold mb-3">Vehicle Details</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-stone-500">Vehicle Type</span>
                    <span className="font-semibold">Electric Scooter</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-stone-500">Status</span>
                    <span className="font-semibold text-emerald-600">Online & Tracking</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Telemetry Pings</span>
                    <span className="font-semibold text-stone-700">Healthy (5s rate)</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* EARNINGS TAB */}
        {activeTab === "earnings" && (
          <motion.div 
            key="earnings"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { title: "Today's Earnings", value: `₹${stats?.dailyEarnings || 0}`, icon: <FiDollarSign className="text-emerald-500" /> },
                { title: "Tips Collected", value: `₹${stats?.tips || 0}`, icon: <FiTrendingUp className="text-cyan-500" /> },
                { title: "Fuel Bonus", value: `₹${stats?.fuelBonus || 0}`, icon: <FiAward className="text-amber-500" /> },
                { title: "Total Deliveries", value: stats?.totalDeliveries || 0, icon: <FiCheck className="text-purple-500" /> }
              ].map((s, i) => (
                <div key={i} className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs text-stone-500 font-bold uppercase tracking-wider block">{s.title}</span>
                    <span className="text-2xl font-black mt-1.5 block">{s.value}</span>
                  </div>
                  <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center border border-stone-200">
                    {s.icon}
                  </div>
                </div>
              ))}
            </div>

            {/* Simulated Earnings ledger */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4">Earnings Ledger</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b text-stone-400">
                      <th className="py-3">Date</th>
                      <th className="py-3">Type</th>
                      <th className="py-3">Amount</th>
                      <th className="py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 font-semibold">Today, 02:40 PM</td>
                      <td className="py-3">Base Fare (Order #1209)</td>
                      <td className="py-3 font-bold text-emerald-600">₹45.00</td>
                      <td className="py-3"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">Settled</span></td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 font-semibold">Today, 01:10 PM</td>
                      <td className="py-3">Customer Tip (Order #1208)</td>
                      <td className="py-3 font-bold text-emerald-600">₹30.00</td>
                      <td className="py-3"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">Settled</span></td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 font-semibold">Today, 11:30 AM</td>
                      <td className="py-3">Fuel Incentive</td>
                      <td className="py-3 font-bold text-emerald-600">₹15.00</td>
                      <td className="py-3"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">Settled</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* PERFORMANCE TAB */}
        {activeTab === "performance" && (
          <motion.div 
            key="performance"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* SLA Gauge Card */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold mb-1">On-Time SLA Performance</h2>
                <p className="text-xs text-stone-500">Your reliability metric over the last 30 days</p>
              </div>

              <div className="py-8 text-center">
                <div className="inline-flex items-center justify-center relative w-36 h-36">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="72" cy="72" r="60" stroke="#f3f4f6" strokeWidth="12" fill="transparent" />
                    <circle cx="72" cy="72" r="60" stroke="#059669" strokeWidth="12" fill="transparent" strokeDasharray="376.8" strokeDashoffset={376.8 - (376.8 * (stats?.onTimeDeliveryRate || 98)) / 100} />
                  </svg>
                  <span className="absolute text-3xl font-black text-emerald-600">{stats?.onTimeDeliveryRate || 98}%</span>
                </div>
                <p className="text-xs font-semibold text-stone-600 mt-4">Target threshold: &gt;95%</p>
              </div>

              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-150">
                <p className="text-xs text-stone-500 leading-relaxed">
                  🌟 <strong>Excellent Standing!</strong> You are qualified for the weekend incentive multipliers. Keep it up!
                </p>
              </div>
            </div>

            {/* Performance Badges / Gamified scores */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-6">
              <h2 className="text-lg font-bold">Driver Badges & Milestones</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: "Perfect Run", desc: "No spill complaints in 30 days", badge: "🏆", unlocked: true },
                  { title: "Night Owl", desc: "10 deliveries after 8 PM", badge: "🌙", unlocked: true },
                  { title: "Storm Rider", desc: "Deliver in heavy rain", badge: "⛈️", unlocked: false },
                  { title: "Speedster", desc: "Fastest route run in slot", badge: "⚡", unlocked: true }
                ].map((b, i) => (
                  <div 
                    key={i} 
                    className={`p-4 rounded-2xl border flex flex-col justify-between h-32 ${b.unlocked ? "bg-stone-50 border-stone-200" : "bg-stone-50/50 border-stone-100 opacity-60"}`}
                  >
                    <div className="text-2xl">{b.badge}</div>
                    <div>
                      <h4 className="text-xs font-bold">{b.title}</h4>
                      <p className="text-[10px] text-stone-500 mt-0.5">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
