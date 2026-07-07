import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  FiMapPin, FiCamera, FiDollarSign, FiClock, FiCheckCircle, 
  FiNavigation, FiTrendingUp, FiCheck, FiX, FiAward, FiMessageSquare,
  FiAlertTriangle, FiThermometer, FiSend, FiPhone, FiStar, FiPower
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
  
  // Swiggy duty status
  const [isOnline, setIsOnline] = useState(false);

  // Active delivery stepper state (1: Go to Store, 2: Pick Up catch, 3: Go to Customer)
  const [stepperStep, setStepperStep] = useState(1); 
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState(null);

  // Leaflet map
  const [driverLatLng, setDriverLatLng] = useState({ lat: 16.5449, lng: 81.5212 }); // default Bhimavaram Hub coords
  const mapRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const surgeZonesRef = useRef([]);

  // Dispatch overlay
  const [incomingDispatch, setIncomingDispatch] = useState(null);

  // Chat panel
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUser, setChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [recipientIsTyping, setRecipientIsTyping] = useState(false);

  // IoT box temp
  const [iotTemp, setIotTemp] = useState(2.8);
  const [iotAlert, setIotAlert] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Dynamically load Leaflet resources
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

  // Sync driver coordinates and push via socket
  useEffect(() => {
    if (!navigator.geolocation || !isOnline) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDriverLatLng(coords);

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
  }, [socket, user, isOnline]);

  // Redraw driver location & surge circles on map
  useEffect(() => {
    if (window.L && mapRef.current) {
      const L = window.L;
      
      // Update Driver Marker
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

      // Draw Swiggy Surge Heatmap circles
      if (surgeZonesRef.current.length === 0) {
        // Zone 1: Bhimavaram Center
        const circle1 = L.circle([16.5449, 81.5212], {
          color: "#f97316",
          fillColor: "#ffedd5",
          fillOpacity: 0.35,
          radius: 600
        }).addTo(mapRef.current).bindPopup("🔥 High Surge Zone (+₹25 Payout)");

        // Zone 2: Town Hall Zone
        const circle2 = L.circle([16.5410, 81.5300], {
          color: "#ef4444",
          fillColor: "#fee2e2",
          fillOpacity: 0.35,
          radius: 500
        }).addTo(mapRef.current).bindPopup("🚨 Extreme Demand Zone (+₹40 Payout)");

        surgeZonesRef.current = [circle1, circle2];
      }
    }
  }, [driverLatLng]);

  // Box temperature sensor
  useEffect(() => {
    const interval = setInterval(() => {
      setIotTemp((prev) => {
        const variance = (Math.random() - 0.5) * 0.4;
        const nextTemp = Number((prev + variance).toFixed(1));
        setIotAlert(nextTemp > 4.0);
        return nextTemp;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Socket receivers
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit("join-chat", { userId: user.id || user._id });

    const handleNewDispatch = (data) => {
      if (data.driverId === (user.id || user._id)) {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav");
        audio.play().catch(e => {});
        setIncomingDispatch(data.order);
      }
    };

    const handleIncomingMessage = (msg) => {
      setChatMessages((prev) => [...prev, msg]);
      if (!chatOpen) {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/911/911-600.wav");
        audio.play().catch(e => {});
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
    }).setView([driverLatLng.lat, driverLatLng.lng], 14);

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

      // Determine active order and stepper position based on current order status
      const active = ordersRes.data?.[0];
      if (active) {
        if (active.status === "Shipped" || active.status === "Processing") setStepperStep(1);
        else if (active.status === "Reached Store") setStepperStep(2);
        else if (active.status === "Out for Delivery") setStepperStep(3);
      }
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Swiggy Duty Online/Offline Status
  const toggleDutyStatus = async () => {
    const nextOnlineState = !isOnline;
    const newStatus = nextOnlineState ? "Active" : "Offline";
    
    // Play swiggy status chime
    const toneUrl = nextOnlineState 
      ? "https://assets.mixkit.co/active_storage/sfx/1086/1086-600.wav" 
      : "https://assets.mixkit.co/active_storage/sfx/2568/2568-600.wav";
    
    new Audio(toneUrl).play().catch(e => {});

    try {
      await axios.put(`${API}/api/delivery/status`, { status: newStatus }, { withCredentials: true });
      setIsOnline(nextOnlineState);
      toast.success(nextOnlineState ? "You are now ONLINE 🟢" : "You are now OFFLINE 🔴");
    } catch (err) {
      toast.error("Failed to update status");
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

  // Stepper Transition Control (Swiggy Stepper)
  const handleStepperAdvance = (orderId, step) => {
    if (step === 1) {
      handleUpdateStatus(orderId, "Reached Store");
      setStepperStep(2);
    } else if (step === 2) {
      handleUpdateStatus(orderId, "Out for Delivery");
      setStepperStep(3);
    }
  };

  const openChatWith = (recipientUser) => {
    setChatUser(recipientUser);
    setChatOpen(true);
    setChatMessages([]);
    axios.get(`${API}/api/chat/history/${recipientUser._id || recipientUser.id}`, { withCredentials: true })
      .then(res => setChatMessages(res.data || []))
      .catch(() => toast.error("Failed to load chat"));
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
    socket.emit("typing", { sender: user.id || user._id, recipient: chatUser._id || chatUser.id, isTyping: false });
    setIsTyping(false);
  };

  const startCamera = async (orderId) => {
    setActiveOrderId(orderId);
    setCameraActive(true);
    setCapturedPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      toast.error("Camera access failed.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      setCapturedPhoto(canvas.toDataURL("image/jpeg"));
      stopCamera();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const activeOrder = orders?.[0];

  return (
    <div className="min-h-screen bg-stone-950 text-white font-sans p-4 md:p-6 pb-24 relative select-none">
      
      {/* ── OPTION C: DISPATCH OVERLAY ── */}
      <AnimatePresence>
        {incomingDispatch && (
          <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-stone-900 border border-stone-850 p-6 rounded-3xl max-w-sm w-full shadow-2xl text-center"
            >
              <span className="text-4xl">🚨</span>
              <h2 className="text-lg font-black mt-4">Order Assigned!</h2>
              <p className="text-xs text-stone-400 mt-2">
                Order #{incomingDispatch.orderId} is ready for pick up. Payout surge active.
              </p>
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => {
                    setIncomingDispatch(null);
                    handleUpdateStatus(incomingDispatch._id, "Shipped");
                  }}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-2xl transition-all shadow-md active:scale-95"
                >
                  Accept Delivery
                </button>
                <button onClick={() => setIncomingDispatch(null)} className="flex-1 py-3 bg-stone-800 text-stone-300 text-xs font-bold rounded-2xl">
                  Ignore
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header Panel with Swiggy Duty Status Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-stone-800 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            🛵 SeaBite Captain
          </h1>
          <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Logistics & Delivery Portal</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Dashboard Selector */}
          <select
            value="driver"
            onChange={(e) => {
              const val = e.target.value;
              if (val === "admin") navigate("/admin/dashboard");
              if (val === "support") navigate("/support");
            }}
            className="bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs font-bold text-stone-300 focus:outline-none cursor-pointer"
          >
            <option value="admin">🏢 Admin Dashboard</option>
            <option value="driver">🛵 Driver Dashboard</option>
            <option value="support">🎧 Support Dashboard</option>
          </select>

          {/* Swiggy Duty Toggle (Online/Offline) */}
          <button 
            onClick={toggleDutyStatus}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 border ${
              isOnline 
                ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]" 
                : "bg-stone-900 border-stone-800 text-stone-400"
            }`}
          >
            <FiPower size={14} className={isOnline ? "animate-pulse" : ""} />
            {isOnline ? "Duty: Online" : "Duty: Offline"}
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex bg-stone-900 p-1 rounded-2xl border border-stone-800 mb-6 max-w-md">
        {["routes", "earnings", "performance"].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all uppercase tracking-wider ${
              activeTab === tab ? "bg-orange-500 text-white shadow" : "text-stone-400 hover:text-stone-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        
        {/* ROUTES / ACTIVE JOBS TAB */}
        {activeTab === "routes" && (
          <motion.div key="routes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Map / Directions */}
            <div className="lg:col-span-8 bg-stone-900 border border-stone-850 rounded-3xl p-5 shadow-lg flex flex-col gap-4">
              <h2 className="text-sm font-black flex items-center gap-2 uppercase tracking-wider text-orange-500">
                <FiNavigation /> Surge Heatmap & Navigation
              </h2>

              <div id="delivery-leaflet-map" className="bg-stone-950 border border-stone-800 rounded-2xl h-80 z-10" />

              {/* Swiggy Stepper Action Card (Only shows if an order is active) */}
              {isOnline && activeOrder ? (
                <div className="bg-stone-950 border border-stone-800 rounded-2xl p-5 mt-2 space-y-4">
                  <div className="flex justify-between items-center border-b border-stone-850 pb-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-orange-500">Current Task: Order #{activeOrder.orderId}</h3>
                      <p className="text-[10px] text-stone-500 mt-0.5">{activeOrder.shippingAddress?.street}, {activeOrder.shippingAddress?.city}</p>
                    </div>
                    {/* Sticky Chat Button */}
                    <button 
                      onClick={() => openChatWith(activeOrder.user || { _id: "support-agent", name: "Support Dispatcher", role: "support" })}
                      className="p-2 bg-stone-900 border border-stone-800 rounded-xl hover:bg-stone-800 flex items-center gap-1.5 text-xs text-orange-400 font-bold"
                    >
                      <FiMessageSquare /> Chat Support
                    </button>
                  </div>

                  {/* Swiggy 3-Step Stepper Component */}
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] uppercase font-black tracking-wider py-2">
                    {[
                      { step: 1, label: "1. Go to Hub" },
                      { step: 2, label: "2. Verify Catch" },
                      { step: 3, label: "3. Deliver" }
                    ].map(s => (
                      <div key={s.step} className={`py-2 rounded-xl border ${
                        stepperStep === s.step 
                          ? "bg-orange-500/10 border-orange-500 text-orange-400" 
                          : stepperStep > s.step 
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" 
                            : "bg-stone-900/40 border-stone-850 text-stone-500"
                      }`}>
                        {s.label}
                      </div>
                    ))}
                  </div>

                  {/* Stepper active step controls */}
                  <div className="pt-2">
                    {stepperStep === 1 && (
                      <button 
                        onClick={() => handleStepperAdvance(activeOrder._id, 1)}
                        className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow active:scale-98 transition-all"
                      >
                        Arrived at Bhimavaram Hub (Check-In)
                      </button>
                    )}

                    {stepperStep === 2 && (
                      <div className="space-y-3">
                        <p className="text-[10px] text-amber-500 font-bold">⚠️ VERIFY SEAFOOD COLD ICE PACKS BEFORE DEPARTURE</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => startCamera(activeOrder._id)}
                            className="flex-1 py-3 bg-stone-800 hover:bg-stone-750 text-stone-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                          >
                            <FiCamera /> Snap Hub Bill
                          </button>
                          <button 
                            onClick={() => handleStepperAdvance(activeOrder._id, 2)}
                            className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl"
                          >
                            Ready to Depart (Start Route)
                          </button>
                        </div>
                      </div>
                    )}

                    {stepperStep === 3 && (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          {/* Call Client Floating action */}
                          <a 
                            href={`tel:${activeOrder.shippingAddress?.phone || "9866635566"}`}
                            className="p-3 bg-stone-900 border border-stone-800 rounded-xl flex items-center justify-center text-orange-400 hover:bg-stone-800"
                          >
                            <FiPhone size={16} />
                          </a>
                          <button 
                            onClick={() => handleUpdateStatus(activeOrder._id, "Delivered")}
                            className="flex-grow py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                          >
                            Confirm Handover (Mark Delivered)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-stone-950 border border-stone-800 rounded-2xl p-8 text-center text-stone-500">
                  {!isOnline ? "🔴 You are offline. Toggle duty status above to search dispatches." : "🟢 Searching for nearby orders..."}
                </div>
              )}
            </div>

            {/* Sidebar telemetry */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Box IoT Telemetry */}
              <div className={`border rounded-3xl p-5 shadow transition-colors duration-500 ${
                iotAlert ? "bg-rose-950/20 border-rose-500 text-rose-300" : "bg-stone-900 border-stone-800"
              }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider">
                      <FiThermometer /> IoT Box Temperature
                    </h3>
                    <p className="text-[9px] text-stone-500 mt-0.5">Live sensors inside Box #FD-42</p>
                  </div>
                  <span className={`text-xl font-black ${iotAlert ? "text-rose-500 animate-bounce" : "text-emerald-400"}`}>
                    {iotTemp}°C
                  </span>
                </div>
                {iotAlert && (
                  <div className="mt-3 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[9px] text-rose-400 font-bold flex items-center gap-1.5">
                    <FiAlertTriangle className="animate-pulse" /> Warning: temperature exceeds ice packs limit!
                  </div>
                )}
              </div>

              {/* Camera Preview */}
              {cameraActive && (
                <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 text-center">
                  <h3 className="text-xs font-bold mb-3 uppercase tracking-wider text-stone-300">Hub Document Verification</h3>
                  <div className="bg-black rounded-2xl overflow-hidden aspect-video relative mb-3">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={capturePhoto} className="flex-grow py-2 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs rounded-xl">Capture</button>
                    <button onClick={stopCamera} className="px-4 py-2 bg-stone-800 font-bold text-xs rounded-xl">Cancel</button>
                  </div>
                </div>
              )}

              {capturedPhoto && (
                <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 text-center">
                  <h3 className="text-xs font-bold mb-3 text-emerald-400 flex items-center justify-center gap-1.5 uppercase">
                    <FiCheckCircle /> Invoice Scanned
                  </h3>
                  <img src={capturedPhoto} alt="Hub Bill" className="w-full rounded-2xl mb-3 max-h-36 object-cover border border-stone-800" />
                  <button onClick={() => setCapturedPhoto(null)} className="w-full py-2 bg-stone-800 text-stone-300 font-bold text-xs rounded-xl">Re-Take Scan</button>
                </div>
              )}

              {/* Scorecard Widget (Option 6) */}
              <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5">
                <h3 className="text-xs font-black uppercase tracking-widest text-stone-400 mb-4 border-b border-stone-850 pb-2">Fleet Rating Board</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-stone-950/40 p-2.5 rounded-xl border border-stone-850">
                    <FiStar className="mx-auto text-amber-500 mb-1" size={14} />
                    <span className="text-sm font-black block">4.9★</span>
                    <span className="text-[8px] text-stone-500 font-bold uppercase block mt-1">Rating</span>
                  </div>
                  <div className="bg-stone-950/40 p-2.5 rounded-xl border border-stone-850">
                    <FiCheckCircle className="mx-auto text-emerald-500 mb-1" size={14} />
                    <span className="text-sm font-black block">98%</span>
                    <span className="text-[8px] text-stone-500 font-bold uppercase block mt-1">Accept</span>
                  </div>
                  <div className="bg-stone-950/40 p-2.5 rounded-xl border border-stone-850">
                    <FiClock className="mx-auto text-purple-500 mb-1" size={14} />
                    <span className="text-sm font-black block">99%</span>
                    <span className="text-[8px] text-stone-500 font-bold uppercase block mt-1">On-Time</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* EARNINGS TAB (Option 3) */}
        {activeTab === "earnings" && (
          <motion.div key="earnings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            
            {/* Earnings stats dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: "Today's Payout", value: `₹${stats?.dailyEarnings || 0}`, desc: "Orders base payout", color: "border-orange-500/20 text-orange-400" },
                { title: "Surge & Rain Incentives", value: `₹${(stats?.totalDeliveries || 0) * 25}`, desc: "Peak demand zones", color: "border-red-500/20 text-red-400" },
                { title: "Tips Collected", value: `₹${stats?.tips || 0}`, desc: "Direct from customers", color: "border-cyan-500/20 text-cyan-400" },
                { title: "Weekly Milestone Payout", value: `₹${stats?.fuelBonus || 0}`, desc: "Weekly active bonus", color: "border-amber-500/20 text-amber-400" }
              ].map((item, i) => (
                <div key={i} className="bg-stone-900 border border-stone-850 rounded-3xl p-5 shadow flex flex-col justify-between h-28">
                  <span className="text-[9px] font-black uppercase text-stone-400 tracking-wider">{item.title}</span>
                  <div>
                    <span className={`text-xl font-black ${item.color}`}>{item.value}</span>
                    <span className="text-[8px] text-stone-500 block mt-0.5">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Daily Milestone Incentive Meter */}
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-400 mb-3">Daily Payout Milestones</h3>
              <div className="flex justify-between items-center text-[10px] text-stone-400 font-bold mb-2">
                <span>Completed: {stats?.totalDeliveries || 0} / 5 Deliveries</span>
                <span className="text-orange-400">Bonus: +₹150</span>
              </div>
              {/* Progress gauge */}
              <div className="w-full bg-stone-950 h-3 rounded-full overflow-hidden border border-stone-850">
                <div 
                  className="bg-orange-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, ((stats?.totalDeliveries || 0) / 5) * 100)}%` }}
                />
              </div>
              <p className="text-[9.5px] text-stone-500 mt-2 font-medium">
                {(stats?.totalDeliveries || 0) >= 5 
                  ? "🎉 Milestone achieved! Payout bonus applied." 
                  : `Deliver ${5 - (stats?.totalDeliveries || 0)} more orders to unlock the ₹150 daily cash incentive.`}
              </p>
            </div>
            
            {/* Ledger ledger */}
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5">
              <h2 className="text-sm font-black uppercase tracking-wider text-orange-500 mb-4">Payout Ledger</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-stone-800 text-stone-500 text-[10px] uppercase font-bold">
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Trip Pay</th>
                      <th className="py-2.5">Surge</th>
                      <th className="py-2.5">Tips</th>
                      <th className="py-2.5">Total Payout</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-stone-850 text-stone-300">
                      <td className="py-3 font-semibold">Today, 02:40 PM</td>
                      <td className="py-3">₹45.00</td>
                      <td className="py-3">₹25.00</td>
                      <td className="py-3">₹30.00</td>
                      <td className="py-3 font-bold text-emerald-400">₹100.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </motion.div>
        )}

        {/* PERFORMANCE TAB */}
        {activeTab === "performance" && (
          <motion.div key="performance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* SLA Gauge */}
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 flex flex-col justify-between h-72">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-stone-400 mb-1">On-Time SLA Reliability</h2>
                <p className="text-[10px] text-stone-500">Your reliability metric over the last 30 days</p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center relative w-24 h-24">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="38" stroke="#1c1917" strokeWidth="8" fill="transparent" />
                    <circle cx="48" cy="48" r="38" stroke="#f97316" strokeWidth="8" fill="transparent" strokeDasharray="238.6" strokeDashoffset={238.6 - (238.6 * (stats?.onTimeDeliveryRate || 98)) / 100} />
                  </svg>
                  <span className="absolute text-xl font-black text-orange-500">{stats?.onTimeDeliveryRate || 98}%</span>
                </div>
              </div>

              <div className="bg-stone-950/45 p-3 rounded-2xl border border-stone-850 text-[10px] text-stone-400 leading-relaxed">
                🚀 <strong>Top Captain Standing!</strong> You are qualified for the weekend incentive multipliers.
              </div>
            </div>

            {/* Badges milestones */}
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-4">
              <h2 className="text-xs font-black uppercase tracking-wider text-stone-400">Milestone Badges</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { title: "Perfect Run", desc: "No spill complaints in 30 days", badge: "🏆", unlocked: true },
                  { title: "Night Owl", desc: "10 deliveries after 8 PM", badge: "🌙", unlocked: true },
                  { title: "Storm Rider", desc: "Deliver in heavy rain", badge: "⛈️", unlocked: false },
                  { title: "Speedster", desc: "Fastest route run in slot", badge: "⚡", unlocked: true }
                ].map((b, i) => (
                  <div key={i} className={`p-3 rounded-2xl border flex flex-col justify-between h-24 ${
                    b.unlocked ? "bg-stone-950/40 border-stone-850" : "bg-stone-950/10 border-stone-900 opacity-40"
                  }`}>
                    <span className="text-xl">{b.badge}</span>
                    <div>
                      <h4 className="text-[10px] font-bold text-stone-200">{b.title}</h4>
                      <p className="text-[8px] text-stone-500 mt-0.5">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        )}

      </AnimatePresence>

      {/* ── OPTION D: CHAT PANEL DRAWER ── */}
      <AnimatePresence>
        {chatOpen && chatUser && (
          <div className="fixed inset-0 z-40 overflow-hidden flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setChatOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-xs" />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-sm bg-stone-900 h-full shadow-2xl border-l border-stone-850 flex flex-col z-50"
            >
              {/* Header */}
              <div className="p-4 border-b border-stone-850 flex justify-between items-center bg-stone-950">
                <div>
                  <h3 className="text-xs font-black uppercase text-stone-300">💬 {chatUser.name}</h3>
                  <p className="text-[8px] text-orange-400 uppercase tracking-widest font-black mt-0.5">{chatUser.role || "support"}</p>
                </div>
                <button onClick={() => setChatOpen(false)} className="p-2 text-stone-500 hover:text-stone-300"><FiX /></button>
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-950/40">
                {chatMessages.length === 0 ? (
                  <p className="text-[10px] text-stone-600 italic text-center py-10">Send a note to initialize live chat.</p>
                ) : (
                  chatMessages.map((msg, i) => {
                    const isSelf = msg.sender === (user.id || user._id);
                    return (
                      <div key={i} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                        <div className={`p-2.5 rounded-2xl max-w-[80%] text-[11px] shadow-sm ${
                          isSelf ? "bg-orange-500 text-white rounded-tr-none" : "bg-stone-800 text-stone-200 rounded-tl-none border border-stone-750"
                        }`}>
                          <p>{msg.message}</p>
                          <span className="text-[7.5px] text-stone-500 block text-right mt-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                {recipientIsTyping && (
                  <span className="text-[8px] text-stone-500 italic block animate-pulse">Recipient is typing...</span>
                )}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-stone-850 bg-stone-900 flex gap-2">
                <input 
                  type="text" placeholder="Type message..." value={newMessage} onChange={handleTypingChange}
                  onKeyDown={e => e.key === "Enter" && sendChatMessage()}
                  className="flex-grow px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white outline-none focus:border-orange-500 transition-all"
                />
                <button onClick={sendChatMessage} className="p-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow">
                  <FiSend size={14} />
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── OPTION 5: STICKY FLOATING SHORTCUT PANEL ── */}
      {isOnline && activeOrder && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-stone-900/90 backdrop-blur border border-stone-800 px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-6 z-30">
          <a href="tel:9866635566" className="flex flex-col items-center gap-1 text-[8px] font-bold text-stone-400 hover:text-white transition-colors">
            <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-orange-400">
              <FiPhone size={14} />
            </div>
            <span>Support</span>
          </a>
          <button 
            onClick={() => openChatWith({ _id: "support-agent", name: "Support Dispatcher", role: "support" })}
            className="flex flex-col items-center gap-1 text-[8px] font-bold text-stone-400 hover:text-white transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-orange-400">
              <FiMessageSquare size={14} />
            </div>
            <span>Chat Ops</span>
          </button>
          <a 
            href={`tel:${activeOrder.shippingAddress?.phone || "9866635566"}`}
            className="flex flex-col items-center gap-1 text-[8px] font-bold text-stone-400 hover:text-white transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FiPhone size={14} />
            </div>
            <span>Customer</span>
          </a>
        </div>
      )}

    </div>
  );
}
