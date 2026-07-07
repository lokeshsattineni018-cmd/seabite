import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  FiMapPin, FiCamera, FiDollarSign, FiClock, FiCheckCircle, 
  FiNavigation, FiTrendingUp, FiCheck, FiX, FiAward, FiMessageSquare,
  FiAlertTriangle, FiThermometer, FiSend
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const API = import.meta.env.VITE_API_URL || "";

export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("routes"); // routes, earnings, performance
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState(null);

  // ── Option A & B: Leaflet Map & GPS Tracking ──
  const [driverLatLng, setDriverLatLng] = useState({ lat: 16.5449, lng: 81.5212 }); // Default: Bhimavaram Hub coords
  const mapRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);

  // ── Option C: Dispatch Alert Overlay ──
  const [incomingDispatch, setIncomingDispatch] = useState(null);

  // ── Option D: Real-Time Chat Drawer ──
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUser, setChatUser] = useState(null); // recipient support/user details
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [recipientIsTyping, setRecipientIsTyping] = useState(false);

  // ── Option E: Cold Chain IoT Telemetry Monitor ──
  const [iotTemp, setIotTemp] = useState(2.8);
  const [iotAlert, setIotAlert] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // 1. Initial Load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 2. Leaflet Scripts & CSS Dynamically Injected
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      initLeafletMap();
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(script);
    };
  }, []);

  // 3. Geolocation Tracker (Option A)
  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error("Browser does not support GPS tracking.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDriverLatLng(coords);

        // Send to Server in real time via Socket.io
        if (socket && user) {
          socket.emit("driver-location", {
            driverId: user.id || user._id,
            location: coords
          });
        }
      },
      (err) => console.log("GPS Track Error:", err.message),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [socket, user]);

  // 4. Update Map Position in real-time (Option B)
  useEffect(() => {
    if (window.L && mapRef.current) {
      const L = window.L;
      if (!driverMarkerRef.current) {
        driverMarkerRef.current = L.marker([driverLatLng.lat, driverLatLng.lng], {
          icon: L.icon({
            iconUrl: "https://cdn-icons-png.flaticon.com/512/3180/3180209.png",
            iconSize: [35, 35]
          })
        }).addTo(mapRef.current);
      } else {
        driverMarkerRef.current.setLatLng([driverLatLng.lat, driverLatLng.lng]);
      }
      mapRef.current.panTo([driverLatLng.lat, driverLatLng.lng]);
    }
  }, [driverLatLng]);

  // 5. IoT Temperature Simulator (Option E)
  useEffect(() => {
    const interval = setInterval(() => {
      setIotTemp((prev) => {
        // Fluctuate temperature slightly
        const variance = (Math.random() - 0.5) * 0.4;
        const nextTemp = Number((prev + variance).toFixed(1));
        
        // Trigger alert if above 4 degrees
        if (nextTemp > 4.0) {
          setIotAlert(true);
        } else {
          setIotAlert(false);
        }
        return nextTemp;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // 6. Socket Receivers (Option C: Dispatch alert, Option D: Chat messages)
  useEffect(() => {
    if (!socket || !user) return;

    // Join room for chat
    socket.emit("join-chat", { userId: user.id || user._id });

    // Listen for new dispatches
    const handleNewDispatch = (data) => {
      if (data.driverId === (user.id || user._id)) {
        // Play alert sound
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav");
        audio.play().catch(e => console.log("Sound play error:", e));
        setIncomingDispatch(data.order);
      }
    };

    // Chat listeners
    const handleIncomingMessage = (msg) => {
      setChatMessages((prev) => [...prev, msg]);
      // Play ding sound if chat drawer is closed
      if (!chatOpen) {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/911/911-600.wav");
        audio.play().catch(e => console.log("Sound play error:", e));
        toast.success(`Support: ${msg.message}`);
      }
    };

    const handleTypingIndicator = (data) => {
      if (data.sender !== (user.id || user._id)) {
        setRecipientIsTyping(data.isTyping);
      }
    };

    socket.on("ORDER_DISPATCHED", handleNewDispatch);
    socket.on("chat-message", handleIncomingMessage);
    socket.on("typing-indicator", handleTypingIndicator);

    return () => {
      socket.off("ORDER_DISPATCHED", handleNewDispatch);
      socket.off("chat-message", handleIncomingMessage);
      socket.off("typing-indicator", handleTypingIndicator);
    };
  }, [socket, user, chatOpen]);

  const initLeafletMap = () => {
    if (!window.L || mapRef.current) return;
    const L = window.L;

    const map = L.map("delivery-leaflet-map", {
      zoomControl: false,
      attributionControl: false
    }).setView([driverLatLng.lat, driverLatLng.lng], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

    mapRef.current = map;
  };

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

  // Open Chat Panel with Support/Customer
  const openChatWith = (recipientUser) => {
    setChatUser(recipientUser);
    setChatOpen(true);
    setChatMessages([]);
    
    // Load historical messages from DB
    axios.get(`${API}/api/chat/history/${recipientUser._id || recipientUser.id}`, { withCredentials: true })
      .then(res => {
        setChatMessages(res.data || []);
      })
      .catch(() => toast.error("Failed to load chat history"));
  };

  const sendChatMessage = () => {
    if (!newMessage.trim() || !socket || !user || !chatUser) return;

    socket.emit("send-chat-message", {
      sender: user.id || user._id,
      recipient: chatUser._id || chatUser.id,
      message: newMessage,
      senderRole: "driver",
      recipientRole: chatUser.role || "support"
    });

    setNewMessage("");
    // Notify stop typing
    socket.emit("typing", { sender: user.id || user._id, recipient: chatUser._id || chatUser.id, isTyping: false });
    setIsTyping(false);
  };

  const handleTypingChange = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !chatUser || !user) return;

    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      socket.emit("typing", { sender: user.id || user._id, recipient: chatUser._id || chatUser.id, isTyping: true });
    } else if (isTyping && e.target.value.length === 0) {
      setIsTyping(false);
      socket.emit("typing", { sender: user.id || user._id, recipient: chatUser._id || chatUser.id, isTyping: false });
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
    <div className="min-h-screen bg-gradient-to-br from-white via-stone-50 to-white text-stone-900 font-sans p-4 md:p-8 relative">
      
      {/* ── OPTION C: INCOMING DISPATCH OVERLAY ── */}
      <AnimatePresence>
        {incomingDispatch && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-stone-200 p-8 rounded-3xl max-w-md w-full shadow-2xl text-center"
            >
              <span className="text-4xl">🚨</span>
              <h2 className="text-xl font-extrabold mt-4">New Order Dispatched!</h2>
              <p className="text-sm text-stone-500 mt-2">
                Order #{incomingDispatch.orderId} needs delivery dispatch to Bhimavaram zones.
              </p>
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => {
                    setIncomingDispatch(null);
                    handleUpdateStatus(incomingDispatch._id, "Out for Delivery");
                  }}
                  className="flex-1 py-3 bg-stone-900 hover:bg-stone-850 text-white text-xs font-bold rounded-2xl transition-all shadow-md active:scale-95"
                >
                  Accept Dispatch
                </button>
                <button 
                  onClick={() => setIncomingDispatch(null)}
                  className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-2xl transition-all"
                >
                  Ignore
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              
              {/* ── OPTION B: LEAFLET MAP ELEMENT ── */}
              <div 
                id="delivery-leaflet-map" 
                className="bg-stone-100 border border-stone-200 rounded-2xl h-96 relative overflow-hidden z-10"
              />

              {/* Batched Stops Timeline */}
              <div className="mt-6 space-y-4">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Stops Timeline</h3>
                <div className="relative pl-6 border-l-2 border-stone-200 space-y-6">
                  {orders.length === 0 ? (
                    <p className="text-sm text-stone-500">No active runs dispatched.</p>
                  ) : (
                    orders.map((order, i) => (
                      <div key={order._id} className="relative">
                        <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-stone-800 flex items-center justify-center font-mono text-[9px] font-bold">
                          {i + 1}
                        </div>
                        <div className="bg-stone-50 border border-stone-150 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-bold">Order #{order.orderId}</h4>
                            <p className="text-xs text-stone-500 mt-0.5">{order.shippingAddress?.street || "Custom zone"}, {order.shippingAddress?.city}</p>
                            <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-2">
                              <span>Status: {order.status}</span>
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            {/* Option D: Real-Time Chat Button */}
                            <button
                              onClick={() => openChatWith(order.user || { _id: "support-agent", name: "Support Dispatcher", role: "support" })}
                              className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-850 text-xs font-bold rounded-xl flex items-center gap-1.5"
                            >
                              <FiMessageSquare /> Chat
                            </button>

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
                                  className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-850 text-xs font-bold rounded-xl flex items-center gap-1.5"
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
              
              {/* ── OPTION E: COLD CHAIN IoT TELEMETRY CARD ── */}
              <div className={`border rounded-3xl p-6 shadow-sm transition-colors duration-500 ${iotAlert ? "bg-rose-50 border-rose-200" : "bg-white border-stone-200"}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`text-sm font-bold flex items-center gap-1.5 ${iotAlert ? "text-rose-700" : "text-stone-800"}`}>
                      <FiThermometer /> IoT Freshness Telemetry
                    </h3>
                    <p className="text-[10px] text-stone-500 mt-1">Live sensors inside Box #FD-42</p>
                  </div>
                  <span className={`text-xl font-black ${iotAlert ? "text-rose-600 animate-bounce" : "text-emerald-600"}`}>
                    {iotTemp}°C
                  </span>
                </div>
                
                {iotAlert && (
                  <div className="mt-4 p-3 bg-rose-100 border border-rose-200 rounded-xl text-[10px] text-rose-800 font-bold flex items-center gap-1.5">
                    <FiAlertTriangle className="animate-pulse" /> WARNING: Box temp exceeds 4°C limit! Ice packs alignment required.
                  </div>
                )}
              </div>

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
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-stone-500">GPS Coordinates</span>
                    <span className="font-mono text-[10px] text-stone-700">{driverLatLng.lat.toFixed(4)}, {driverLatLng.lng.toFixed(4)}</span>
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

      {/* ── OPTION D: REAL-TIME SUPPORT CHAT DRAWER ── */}
      <AnimatePresence>
        {chatOpen && chatUser && (
          <div className="fixed inset-0 z-40 overflow-hidden flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setChatOpen(false)}
              className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-stone-200 flex flex-col z-50"
            >
              {/* Chat Header */}
              <div className="p-5 border-b flex justify-between items-center bg-stone-50">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-1.5">
                    💬 {chatUser.name}
                  </h3>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest">{chatUser.role || "support"}</p>
                </div>
                <button 
                  onClick={() => setChatOpen(false)}
                  className="p-2 hover:bg-stone-200/60 rounded-full text-stone-500 transition-colors"
                >
                  <FiX />
                </button>
              </div>

              {/* Chat Message feed */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-stone-50/50">
                {chatMessages.length === 0 ? (
                  <p className="text-xs text-stone-400 italic text-center py-10">No messages yet. Send a note to establish contact.</p>
                ) : (
                  chatMessages.map((msg, i) => {
                    const isSelf = msg.sender === (user.id || user._id);
                    return (
                      <div key={i} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                        <div className={`p-3 rounded-2xl max-w-[80%] text-xs shadow-sm ${isSelf ? "bg-stone-900 text-white rounded-tr-none" : "bg-white border border-stone-200 rounded-tl-none text-stone-850"}`}>
                          <p>{msg.message}</p>
                          <span className="text-[8px] text-stone-400 block text-right mt-1.5">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                {recipientIsTyping && (
                  <div className="flex justify-start">
                    <span className="bg-stone-200/60 text-stone-600 px-3 py-1.5 rounded-full text-[10px] font-medium animate-pulse">Recipient is typing...</span>
                  </div>
                )}
              </div>

              {/* Chat Input panel */}
              <div className="p-4 border-t bg-white flex gap-2">
                <input 
                  type="text" 
                  placeholder="Type message here..."
                  value={newMessage}
                  onChange={handleTypingChange}
                  onKeyDown={e => e.key === "Enter" && sendChatMessage()}
                  className="flex-grow px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:bg-white focus:border-stone-800 transition-all"
                />
                <button 
                  onClick={sendChatMessage}
                  className="p-2.5 bg-stone-900 hover:bg-stone-850 text-white rounded-xl active:scale-95 transition-all shadow-md"
                >
                  <FiSend size={16} />
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
