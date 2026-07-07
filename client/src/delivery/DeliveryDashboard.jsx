import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  FiMapPin, FiCamera, FiClock, FiCheckCircle, FiNavigation, 
  FiCheck, FiX, FiMessageSquare, FiSend, FiPhone, FiStar, 
  FiPower, FiPackage, FiTruck, FiDollarSign, FiTarget, FiAward,
  FiChevronRight, FiRefreshCw
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const API = import.meta.env.VITE_API_URL || "";

/* ─── Theme ─── */
const T = {
  bg: "#FFFFFF",
  surface: "#F8F9FA",
  card: "#FFFFFF",
  border: "#E8EAED",
  ink: "#1A1A2E",
  inkMid: "#5F6368",
  inkLight: "#9AA0A6",
  accent: "#FF6B35",
  accentLight: "#FFF3ED",
  green: "#34A853",
  greenLight: "#E6F4EA",
  red: "#EA4335",
  redLight: "#FCE8E6",
  blue: "#4285F4",
  blueLight: "#E8F0FE",
  purple: "#A855F7",
  purpleLight: "#F3E8FF",
};

export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  /* ── Core State ── */
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  /* ── Active Delivery Stepper ── */
  const [selectedOrder, setSelectedOrder] = useState(null);

  /* ── Camera / POD ── */
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  /* ── Dispatch Overlay ── */
  const [incomingDispatch, setIncomingDispatch] = useState(null);

  /* ── Chat ── */
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [recipientTyping, setRecipientTyping] = useState(false);

  /* ── Map ── */
  const [driverLatLng, setDriverLatLng] = useState({ lat: 16.5449, lng: 81.5212 });
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapContainerRef = useRef(null);

  /* ── Data Fetching ── */
  const fetchData = useCallback(async () => {
    try {
      const [oRes, sRes] = await Promise.all([
        axios.get(`${API}/api/delivery/my-orders`, { withCredentials: true }),
        axios.get(`${API}/api/delivery/my-stats`, { withCredentials: true })
      ]);
      setOrders(oRes.data || []);
      setStats(sRes.data || {});
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Auto-refresh every 30s ── */
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  /* ── Leaflet Map Init ── */
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      if (window.L && !mapRef.current && document.getElementById("driver-map")) {
        const map = window.L.map("driver-map", { zoomControl: false, attributionControl: false })
          .setView([driverLatLng.lat, driverLatLng.lng], 14);
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
        mapRef.current = map;
      }
    };
    document.head.appendChild(script);
    return () => {
      try { document.head.removeChild(link); document.head.removeChild(script); } catch(e) {}
    };
  }, []);

  /* ── GPS Tracking (only when online) ── */
  useEffect(() => {
    if (!navigator.geolocation || !isOnline) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDriverLatLng(coords);
        if (socket && user) {
          socket.emit("driver-location", { driverId: user.id || user._id, location: coords });
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [socket, user, isOnline]);

  /* ── Update Map Marker ── */
  useEffect(() => {
    if (!window.L || !mapRef.current) return;
    const L = window.L;
    if (!markerRef.current) {
      markerRef.current = L.marker([driverLatLng.lat, driverLatLng.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="width:32px;height:32px;border-radius:50%;background:${T.accent};display:flex;align-items:center;justify-content:center;color:white;font-size:16px;box-shadow:0 2px 8px rgba(255,107,53,0.4)">🛵</div>`,
          iconSize: [32, 32], iconAnchor: [16, 16]
        })
      }).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng([driverLatLng.lat, driverLatLng.lng]);
    }
    mapRef.current.panTo([driverLatLng.lat, driverLatLng.lng]);
  }, [driverLatLng]);

  /* ── Socket Events ── */
  useEffect(() => {
    if (!socket || !user) return;
    socket.emit("join-chat", { userId: user.id || user._id });

    const handleDispatch = (data) => {
      if (data.driverId === (user.id || user._id)) {
        try { new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav").play(); } catch(e) {}
        setIncomingDispatch(data.order);
        fetchData();
      }
    };

    const handleChat = (msg) => {
      setChatMessages(prev => [...prev, msg]);
    };

    const handleTyping = (data) => {
      if (data.sender !== (user.id || user._id)) setRecipientTyping(data.isTyping);
    };

    const handleFleetUpdate = () => fetchData();

    socket.on("ORDER_DISPATCHED", handleDispatch);
    socket.on("chat-message", handleChat);
    socket.on("typing-indicator", handleTyping);
    socket.on("FLEET_UPDATE", handleFleetUpdate);

    return () => {
      socket.off("ORDER_DISPATCHED", handleDispatch);
      socket.off("chat-message", handleChat);
      socket.off("typing-indicator", handleTyping);
      socket.off("FLEET_UPDATE", handleFleetUpdate);
    };
  }, [socket, user]);

  /* ── Actions ── */
  const toggleDuty = async () => {
    const next = !isOnline;
    try {
      await axios.put(`${API}/api/delivery/status`, { status: next ? "Active" : "Offline" }, { withCredentials: true });
      setIsOnline(next);
      try { new Audio(next ? "https://assets.mixkit.co/active_storage/sfx/1086/1086-600.wav" : "https://assets.mixkit.co/active_storage/sfx/2568/2568-600.wav").play(); } catch(e) {}
      toast.success(next ? "You're online! Ready for orders." : "You're offline.");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/api/delivery/orders/${orderId}/status`, { status, podUrl: capturedPhoto || null }, { withCredentials: true });
      toast.success(`Order → ${status}`);
      setCapturedPhoto(null);
      setSelectedOrder(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const startCamera = async () => {
    setCameraActive(true);
    setCapturedPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { setCameraActive(false); toast.error("Camera access denied"); }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const v = videoRef.current, c = canvasRef.current;
      c.width = v.videoWidth; c.height = v.videoHeight;
      c.getContext("2d").drawImage(v, 0, 0);
      setCapturedPhoto(c.toDataURL("image/jpeg"));
      v.srcObject?.getTracks().forEach(t => t.stop());
      setCameraActive(false);
    }
  };

  const openChat = (target) => {
    setChatTarget(target);
    setChatOpen(true);
    setChatMessages([]);
    const tid = target?._id || target?.id;
    if (tid) {
      axios.get(`${API}/api/chat/history/${tid}`, { withCredentials: true })
        .then(r => setChatMessages(r.data || [])).catch(() => {});
    }
  };

  const sendMessage = () => {
    if (!chatInput.trim() || !socket || !chatTarget) return;
    socket.emit("send-chat-message", {
      sender: user.id || user._id,
      recipient: chatTarget._id || chatTarget.id,
      message: chatInput,
      senderRole: "driver",
      recipientRole: chatTarget.role || "support"
    });
    setChatInput("");
  };

  /* ── Helpers ── */
  const getStepperState = (order) => {
    if (!order) return 0;
    const s = order.status;
    if (s === "Shipped" || s === "Processing") return 1;
    if (s === "Out for Delivery") return 2;
    if (s === "Delivered") return 3;
    return 1;
  };

  const formatTime = (d) => {
    if (!d) return "--";
    return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatAddress = (addr) => {
    if (!addr) return "No address";
    return [addr.houseNo, addr.street, addr.city].filter(Boolean).join(", ");
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: T.bg }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${T.border}`, borderTopColor: T.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
          <p style={{ marginTop: 16, color: T.inkMid, fontSize: 13, fontWeight: 500 }}>Loading your dashboard...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter(o => ["Processing", "Shipped", "Out for Delivery"].includes(o.status));
  const dailyMilestoneTarget = 5;
  const totalDone = stats?.totalDeliveries || 0;
  const milestoneProgress = Math.min(100, (totalDone / dailyMilestoneTarget) * 100);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Inter', 'DM Sans', -apple-system, sans-serif" }}>
      
      {/* ═══ DISPATCH OVERLAY ═══ */}
      <AnimatePresence>
        {incomingDispatch && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: T.card, borderRadius: 24, padding: 32, maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: T.accentLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>🚨</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: T.ink, margin: 0 }}>New Order Assigned!</h2>
              <p style={{ fontSize: 13, color: T.inkMid, marginTop: 8 }}>
                Order #{incomingDispatch.orderId} • ₹{incomingDispatch.totalAmount}
              </p>
              <p style={{ fontSize: 12, color: T.inkLight, marginTop: 4 }}>
                {formatAddress(incomingDispatch.shippingAddress)}
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button onClick={() => { setIncomingDispatch(null); fetchData(); }}
                  style={{ flex: 1, padding: "14px 0", background: T.accent, color: "white", border: "none", borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Accept & Start
                </button>
                <button onClick={() => setIncomingDispatch(null)}
                  style={{ flex: 1, padding: "14px 0", background: T.surface, color: T.inkMid, border: `1px solid ${T.border}`, borderRadius: 14, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ HEADER ═══ */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: "16px 24px", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: T.ink, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22 }}>🛵</span> SeaBite Captain
            </h1>
            <p style={{ fontSize: 11, color: T.inkLight, margin: "2px 0 0", fontWeight: 500 }}>
              {user?.name || "Driver"} • {isOnline ? "Online" : "Offline"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={fetchData} style={{ padding: 8, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, cursor: "pointer", color: T.inkMid, display: "flex" }}>
              <FiRefreshCw size={16} />
            </button>
            <select value="driver" onChange={e => { if (e.target.value === "admin") navigate("/admin/dashboard"); if (e.target.value === "support") navigate("/support"); }}
              style={{ padding: "8px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12, fontWeight: 600, color: T.inkMid, cursor: "pointer" }}>
              <option value="admin">🏢 Admin</option>
              <option value="driver">🛵 Driver</option>
              <option value="support">🎧 Support</option>
            </select>
            {/* Duty Toggle */}
            <button onClick={toggleDuty}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, letterSpacing: "0.03em", transition: "all 0.3s",
                background: isOnline ? T.greenLight : T.surface, color: isOnline ? T.green : T.inkMid, boxShadow: isOnline ? `0 0 0 2px ${T.green}40` : `0 0 0 1px ${T.border}` }}>
              <FiPower size={14} />
              {isOnline ? "ONLINE" : "OFFLINE"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px 100px" }}>
        
        {/* ═══ STATS ROW ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Active Orders", value: activeOrders.length, icon: <FiPackage />, color: T.accent, bg: T.accentLight },
            { label: "Today's Earnings", value: `₹${stats?.dailyEarnings || 0}`, icon: <FiDollarSign />, color: T.green, bg: T.greenLight },
            { label: "Tips", value: `₹${stats?.tips || 0}`, icon: <FiStar />, color: "#F59E0B", bg: "#FEF3C7" },
            { label: "Completed", value: totalDone, icon: <FiCheckCircle />, color: T.blue, bg: T.blueLight },
            { label: "On-Time Rate", value: `${stats?.onTimeDeliveryRate || 98}%`, icon: <FiTarget />, color: T.purple, bg: T.purpleLight }
          ].map((s, i) => (
            <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.ink }}>{s.value}</div>
                <div style={{ fontSize: 11, color: T.inkLight, fontWeight: 500 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ MILESTONE PROGRESS ═══ */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Daily Milestone</span>
              <span style={{ fontSize: 11, color: T.inkLight, marginLeft: 8 }}>{totalDone}/{dailyMilestoneTarget} deliveries</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: totalDone >= dailyMilestoneTarget ? T.green : T.accent }}>
              {totalDone >= dailyMilestoneTarget ? "✅ Bonus Unlocked!" : `₹150 bonus at ${dailyMilestoneTarget}`}
            </span>
          </div>
          <div style={{ width: "100%", height: 8, background: T.surface, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${milestoneProgress}%`, height: "100%", background: `linear-gradient(90deg, ${T.accent}, ${T.green})`, borderRadius: 4, transition: "width 0.5s ease" }} />
          </div>
        </div>

        {/* ═══ TABS ═══ */}
        <div style={{ display: "flex", gap: 4, background: T.surface, padding: 4, borderRadius: 14, marginBottom: 24, maxWidth: 400 }}>
          {[
            { key: "active", label: "Active Routes" },
            { key: "map", label: "Live Map" },
            { key: "history", label: "Earnings" }
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                background: activeTab === t.key ? T.card : "transparent", color: activeTab === t.key ? T.ink : T.inkLight,
                boxShadow: activeTab === t.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══ ACTIVE ROUTES TAB ═══ */}
        {activeTab === "active" && (
          <div style={{ display: "grid", gridTemplateColumns: selectedOrder ? "1fr 1fr" : "1fr", gap: 24 }}>
            
            {/* Orders List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {activeOrders.length === 0 ? (
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 48, textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>{isOnline ? "🔍" : "😴"}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: T.ink, margin: 0 }}>
                    {isOnline ? "Waiting for dispatches..." : "You're offline"}
                  </h3>
                  <p style={{ fontSize: 13, color: T.inkLight, marginTop: 8 }}>
                    {isOnline ? "Stay online. New orders will appear here instantly." : "Toggle your duty status to start receiving orders."}
                  </p>
                </div>
              ) : (
                activeOrders.map(order => {
                  const step = getStepperState(order);
                  const isSelected = selectedOrder?._id === order._id;
                  return (
                    <div key={order._id} onClick={() => setSelectedOrder(order)}
                      style={{ background: T.card, border: `2px solid ${isSelected ? T.accent : T.border}`, borderRadius: 16, padding: 20, cursor: "pointer", transition: "all 0.2s" }}>
                      
                      {/* Order header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>#{order.orderId}</span>
                          <span style={{ fontSize: 11, color: T.inkLight, marginLeft: 8 }}>{formatTime(order.createdAt)}</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, 
                          background: step === 1 ? T.blueLight : step === 2 ? T.accentLight : T.greenLight,
                          color: step === 1 ? T.blue : step === 2 ? T.accent : T.green }}>
                          {order.status}
                        </span>
                      </div>

                      {/* Customer info */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.surface, display: "flex", alignItems: "center", justifyContent: "center", color: T.inkMid, fontSize: 12 }}>
                          {order.user?.name?.[0]?.toUpperCase() || "C"}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{order.user?.name || "Customer"}</div>
                          <div style={{ fontSize: 11, color: T.inkLight }}>{order.user?.phone || ""}</div>
                        </div>
                      </div>

                      {/* Address */}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 12 }}>
                        <FiMapPin size={13} style={{ color: T.accent, marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: T.inkMid, lineHeight: "1.4" }}>{formatAddress(order.shippingAddress)}</span>
                      </div>

                      {/* Items summary */}
                      <div style={{ fontSize: 12, color: T.inkMid, marginBottom: 12 }}>
                        {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""} • ₹{order.totalAmount}
                      </div>

                      {/* Stepper */}
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {["Hub Pickup", "In Transit", "Delivered"].map((label, i) => (
                          <React.Fragment key={i}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <div style={{ width: 20, height: 20, borderRadius: "50%", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                                background: i + 1 <= step ? T.green : T.surface, color: i + 1 <= step ? "white" : T.inkLight, border: `1.5px solid ${i + 1 <= step ? T.green : T.border}` }}>
                                {i + 1 <= step ? "✓" : i + 1}
                              </div>
                              <span style={{ fontSize: 10, color: i + 1 <= step ? T.ink : T.inkLight, fontWeight: i + 1 === step ? 700 : 500 }}>{label}</span>
                            </div>
                            {i < 2 && <div style={{ flex: 1, height: 2, background: i + 1 < step ? T.green : T.border, borderRadius: 1 }} />}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ═══ SELECTED ORDER DETAIL PANEL ═══ */}
            {selectedOrder && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, position: "sticky", top: 100, alignSelf: "start" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: T.ink, margin: 0 }}>Order #{selectedOrder.orderId}</h3>
                  <button onClick={() => setSelectedOrder(null)} style={{ background: T.surface, border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: T.inkMid }}>
                    <FiX size={16} />
                  </button>
                </div>

                {/* Customer Card */}
                <div style={{ background: T.surface, borderRadius: 12, padding: 14, marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{selectedOrder.user?.name || "Customer"}</div>
                  <div style={{ fontSize: 12, color: T.inkMid, marginTop: 4 }}>{selectedOrder.user?.phone}</div>
                  <div style={{ fontSize: 12, color: T.inkMid, marginTop: 2 }}>{formatAddress(selectedOrder.shippingAddress)}</div>
                </div>

                {/* Items */}
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: T.inkLight, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Items to Deliver</h4>
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < selectedOrder.items.length - 1 ? `1px solid ${T.border}` : "none" }}>
                      <span style={{ fontSize: 13, color: T.ink }}>{item.name} × {item.qty}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>₹{item.price * item.qty}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, marginTop: 4, borderTop: `2px solid ${T.border}` }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>Total</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: T.accent }}>₹{selectedOrder.totalAmount}</span>
                  </div>
                </div>

                {/* Camera / POD */}
                {cameraActive && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ background: "#000", borderRadius: 12, overflow: "hidden", aspectRatio: "16/9", position: "relative", marginBottom: 8 }}>
                      <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <canvas ref={canvasRef} style={{ display: "none" }} />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={capturePhoto} style={{ flex: 1, padding: 10, background: T.green, color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>📸 Capture</button>
                      <button onClick={() => { videoRef.current?.srcObject?.getTracks().forEach(t => t.stop()); setCameraActive(false); }}
                        style={{ padding: 10, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, fontWeight: 600, fontSize: 12, cursor: "pointer", color: T.inkMid }}>Cancel</button>
                    </div>
                  </div>
                )}

                {capturedPhoto && (
                  <div style={{ marginBottom: 16, textAlign: "center" }}>
                    <img src={capturedPhoto} alt="POD" style={{ width: "100%", maxHeight: 140, objectFit: "cover", borderRadius: 12, border: `1px solid ${T.border}` }} />
                    <button onClick={() => setCapturedPhoto(null)} style={{ marginTop: 8, fontSize: 11, color: T.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Re-take</button>
                  </div>
                )}

                {/* Action Buttons (depends on stepper state) */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {getStepperState(selectedOrder) <= 1 && (
                    <button onClick={() => updateOrderStatus(selectedOrder._id, "Out for Delivery")}
                      style={{ width: "100%", padding: 14, background: T.accent, color: "white", border: "none", borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <FiTruck size={16} /> Picked Up — Start Delivery
                    </button>
                  )}

                  {getStepperState(selectedOrder) === 2 && (
                    <>
                      <button onClick={startCamera}
                        style={{ width: "100%", padding: 14, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: T.ink }}>
                        <FiCamera size={16} /> Take Proof of Delivery Photo
                      </button>
                      <button onClick={() => updateOrderStatus(selectedOrder._id, "Delivered")}
                        style={{ width: "100%", padding: 14, background: T.green, color: "white", border: "none", borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <FiCheckCircle size={16} /> Mark as Delivered
                      </button>
                    </>
                  )}

                  <div style={{ display: "flex", gap: 8 }}>
                    <a href={`tel:${selectedOrder.user?.phone || selectedOrder.shippingAddress?.phone}`}
                      style={{ flex: 1, padding: 12, background: T.blueLight, color: T.blue, border: "none", borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <FiPhone size={14} /> Call Customer
                    </a>
                    <button onClick={() => openChat(selectedOrder.user || { _id: "support", name: "Support", role: "support" })}
                      style={{ flex: 1, padding: 12, background: T.surface, color: T.inkMid, border: `1px solid ${T.border}`, borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <FiMessageSquare size={14} /> Chat
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ MAP TAB ═══ */}
        {activeTab === "map" && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
            <div id="driver-map" style={{ height: 500, width: "100%" }} />
          </div>
        )}

        {/* ═══ EARNINGS TAB ═══ */}
        {activeTab === "history" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
            {/* Breakdown */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 16 }}>Earnings Breakdown</h3>
              {[
                { label: "Base Delivery Pay", value: `₹${(stats?.totalDeliveries || 0) * 45}`, desc: `${stats?.totalDeliveries || 0} × ₹45` },
                { label: "Distance Bonus", value: `₹${(stats?.totalDeliveries || 0) * 12}`, desc: "Avg 2.4 km × ₹5/km" },
                { label: "Surge Incentives", value: `₹${(stats?.totalDeliveries || 0) * 25}`, desc: "Peak demand zones" },
                { label: "Customer Tips", value: `₹${stats?.tips || 0}`, desc: "Direct tips" },
                { label: "Fuel Allowance", value: `₹${stats?.fuelBonus || 0}`, desc: "₹5 per trip" }
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{row.label}</div>
                    <div style={{ fontSize: 11, color: T.inkLight }}>{row.desc}</div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.green }}>{row.value}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 16, marginTop: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: T.ink }}>Total Earned</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: T.accent }}>₹{(stats?.dailyEarnings || 0) + (stats?.tips || 0) + (stats?.fuelBonus || 0) + (stats?.totalDeliveries || 0) * 37}</span>
              </div>
            </div>

            {/* Scorecard */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 16 }}>Performance Scorecard</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "Customer Rating", value: "4.9", suffix: "★", pct: 98, color: "#F59E0B" },
                  { label: "Acceptance Rate", value: "98", suffix: "%", pct: 98, color: T.green },
                  { label: "On-Time Delivery", value: `${stats?.onTimeDeliveryRate || 98}`, suffix: "%", pct: stats?.onTimeDeliveryRate || 98, color: T.blue }
                ].map((m, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{m.label}</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: m.color }}>{m.value}{m.suffix}</span>
                    </div>
                    <div style={{ height: 6, background: T.surface, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${m.pct}%`, height: "100%", background: m.color, borderRadius: 3, transition: "width 0.5s" }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 24 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: T.inkLight, textTransform: "uppercase", marginBottom: 12 }}>Badges Earned</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { icon: "🏆", title: "Zero Spills", desc: "30 day streak" },
                    { icon: "⚡", title: "Speed Captain", desc: "Fastest route" },
                    { icon: "🌙", title: "Night Owl", desc: "10 late rides" },
                    { icon: "💎", title: "Top Rated", desc: "4.9+ rating" }
                  ].map((b, i) => (
                    <div key={i} style={{ background: T.surface, borderRadius: 12, padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{b.icon}</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.ink }}>{b.title}</div>
                        <div style={{ fontSize: 10, color: T.inkLight }}>{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ FLOATING ACTION BAR ═══ */}
      {isOnline && activeOrders.length > 0 && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: "10px 24px", display: "flex", alignItems: "center", gap: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", zIndex: 30 }}>
          <a href="tel:9866635566" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, textDecoration: "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.accentLight, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent }}><FiPhone size={14} /></div>
            <span style={{ fontSize: 9, color: T.inkLight, fontWeight: 600 }}>Support</span>
          </a>
          <button onClick={() => openChat({ _id: "support", name: "Support", role: "support" })} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, border: "none", background: "none", cursor: "pointer" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.blueLight, display: "flex", alignItems: "center", justifyContent: "center", color: T.blue }}><FiMessageSquare size={14} /></div>
            <span style={{ fontSize: 9, color: T.inkLight, fontWeight: 600 }}>Chat</span>
          </button>
          {selectedOrder && (
            <a href={`tel:${selectedOrder.user?.phone || selectedOrder.shippingAddress?.phone}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, textDecoration: "none" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.greenLight, display: "flex", alignItems: "center", justifyContent: "center", color: T.green }}><FiPhone size={14} /></div>
              <span style={{ fontSize: 9, color: T.inkLight, fontWeight: 600 }}>Customer</span>
            </a>
          )}
        </div>
      )}

      {/* ═══ CHAT DRAWER ═══ */}
      <AnimatePresence>
        {chatOpen && chatTarget && (
          <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end" }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setChatOpen(false)}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{ position: "relative", width: "100%", maxWidth: 380, background: T.card, height: "100%", display: "flex", flexDirection: "column", boxShadow: "-4px 0 20px rgba(0,0,0,0.1)", zIndex: 51 }}>
              
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: T.ink, margin: 0 }}>{chatTarget.name || "Chat"}</h3>
                  <span style={{ fontSize: 11, color: T.inkLight }}>{chatTarget.role}</span>
                </div>
                <button onClick={() => setChatOpen(false)} style={{ background: T.surface, border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: T.inkMid }}><FiX size={16} /></button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {chatMessages.length === 0 && <p style={{ textAlign: "center", color: T.inkLight, fontSize: 12, marginTop: 40 }}>Start a conversation</p>}
                {chatMessages.map((msg, i) => {
                  const self = msg.sender === (user.id || user._id);
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: self ? "flex-end" : "flex-start" }}>
                      <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: 14, fontSize: 13, lineHeight: "1.4",
                        background: self ? T.accent : T.surface, color: self ? "white" : T.ink,
                        borderBottomRightRadius: self ? 4 : 14, borderBottomLeftRadius: self ? 14 : 4 }}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
                {recipientTyping && <span style={{ fontSize: 11, color: T.inkLight, fontStyle: "italic" }}>typing...</span>}
              </div>

              <div style={{ padding: 12, borderTop: `1px solid ${T.border}`, display: "flex", gap: 8 }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..." style={{ flex: 1, padding: "10px 14px", border: `1px solid ${T.border}`, borderRadius: 12, fontSize: 13, outline: "none" }} />
                <button onClick={sendMessage} style={{ padding: "10px 14px", background: T.accent, color: "white", border: "none", borderRadius: 12, cursor: "pointer" }}><FiSend size={16} /></button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
