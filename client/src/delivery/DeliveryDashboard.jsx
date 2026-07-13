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
  FiChevronRight, FiRefreshCw, FiAlertOctagon, FiTrendingUp, FiCalendar
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const API = import.meta.env.VITE_API_URL || "";

/* ─── Theme ─── */
const T = {
  bg: "#F4F6F9",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  border: "#E2E8F0",
  ink: "#0F172A",
  inkMid: "#475569",
  inkLight: "#94A3B8",
  accent: "#FF6B35",
  accentLight: "#FFF3ED",
  green: "#10B981",
  greenLight: "#E6F4EA",
  red: "#EF4444",
  redLight: "#FEE2E2",
  blue: "#3B82F6",
  blueLight: "#EFF6FF",
  purple: "#8B5CF6",
  purpleLight: "#F5F3FF",
};

// Simple Haversine distance calculator
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Greedy TSP path solver
const optimizeRoute = (startCoords, ordersList) => {
  if (!ordersList || ordersList.length === 0) return [];
  const unvisited = [...ordersList];
  const route = [];
  let current = startCoords;

  while (unvisited.length > 0) {
    let bestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const order = unvisited[i];
      const oLat = order.shippingAddress?.lat || 16.5449;
      const oLng = order.shippingAddress?.lng || 81.5212;
      const dist = getDistance(current.lat, current.lng, oLat, oLng);
      if (dist < minDistance) {
        minDistance = dist;
        bestIdx = i;
      }
    }

    const nextOrder = unvisited.splice(bestIdx, 1)[0];
    route.push(nextOrder);
    current = {
      lat: nextOrder.shippingAddress?.lat || 16.5449,
      lng: nextOrder.shippingAddress?.lng || 81.5212,
    };
  }
  return route;
};

export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  /* ── Core State ── */
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [payoutCalendar, setPayoutCalendar] = useState([]);
  const [streakData, setStreakData] = useState({ streak: 0, achievements: [] });
  const [fatigueData, setFatigueData] = useState({ totalMinutesToday: 0, limit: 600 });
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [activeTab, setActiveTab] = useState("active"); // active, map, leaderboard, earnings

  /* ── Inspection checklist gate ── */
  const [inspectionDone, setInspectionDone] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [checklist, setChecklist] = useState({
    tires: false,
    lights: false,
    iceBox: false,
    documents: false,
  });

  /* ── Active Delivery Stepper ── */
  const [selectedOrder, setSelectedOrder] = useState(null);

  /* ── Camera & Digital Signature POD ── */
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [driverPaymentMethod, setDriverPaymentMethod] = useState("Cash");
  const signatureCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);

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
  const routePolylineRef = useRef(null);
  const markersGroupRef = useRef(null);

  /* ── ETA Timer Tick state ── */
  const [, setTimerTick] = useState(0);

  /* ── Data Fetching ── */
  const fetchData = useCallback(async () => {
    try {
      const [oRes, sRes, lbRes, calRes, streakRes, fatigueRes, inspectRes] = await Promise.all([
        axios.get(`${API}/api/delivery/my-orders`, { withCredentials: true }),
        axios.get(`${API}/api/delivery/my-stats`, { withCredentials: true }),
        axios.get(`${API}/api/delivery/leaderboard`, { withCredentials: true }).catch(() => ({ data: [] })),
        axios.get(`${API}/api/delivery/payout-calendar`, { withCredentials: true }).catch(() => ({ data: [] })),
        axios.get(`${API}/api/delivery/streak`, { withCredentials: true }).catch(() => ({ data: { streak: 0, achievements: [] } })),
        axios.get(`${API}/api/delivery/fatigue`, { withCredentials: true }).catch(() => ({ data: { totalMinutesToday: 0, limit: 600 } })),
        axios.get(`${API}/api/delivery/inspection/today`, { withCredentials: true }).catch(() => ({ data: { done: false } }))
      ]);

      setOrders(oRes.data || []);
      setStats(sRes.data || {});
      setLeaderboard(lbRes.data || []);
      setPayoutCalendar(calRes.data || []);
      setStreakData(streakRes.data || { streak: 0, achievements: [] });
      setFatigueData(fatigueRes.data || { totalMinutesToday: 0, limit: 600 });
      setInspectionDone(inspectRes.data?.done || false);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Auto-refresh every 30s ── */
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  /* ── Seconds ticker for ETA timers ── */
  useEffect(() => {
    const timer = setInterval(() => {
      setTimerTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
        markersGroupRef.current = window.L.layerGroup().addTo(map);
      }
    };
    document.head.appendChild(script);
    return () => {
      try {
        document.head.removeChild(link);
        document.head.removeChild(script);
      } catch (e) {}
    };
  }, []);

  /* ── Update Map Path / Batching / Route Optimization ── */
  useEffect(() => {
    if (!window.L || !mapRef.current) return;
    const L = window.L;

    // Clear old layers except driver
    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();
    }
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    const activeOrders = orders.filter((o) => ["Processing", "Shipped", "Out for Delivery"].includes(o.status));

    // Optimize Route
    const optimized = optimizeRoute(driverLatLng, activeOrders);

    // Draw lines & points
    if (optimized.length > 0) {
      const pathPoints = [[driverLatLng.lat, driverLatLng.lng]];
      
      optimized.forEach((order, index) => {
        const oLat = order.shippingAddress?.lat || 16.5449 + (index * 0.005);
        const oLng = order.shippingAddress?.lng || 81.5212 + (index * 0.005);
        
        pathPoints.push([oLat, oLng]);

        // Smart Batching Check: count orders within 500m
        const closeOrders = optimized.filter(other => 
          other._id !== order._id && 
          getDistance(oLat, oLng, other.shippingAddress?.lat || 16.5449, other.shippingAddress?.lng || 81.5212) <= 0.5
        );

        const isGrouped = closeOrders.length > 0;

        // Custom marker
        const pinHtml = `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
            <div style="background:${isGrouped ? T.purple : T.accent}; color:white; font-size:10px; font-weight:800; padding:3px 6px; border-radius:10px; white-space:nowrap; box-shadow:0 2px 5px rgba(0,0,0,0.2)">
              ${isGrouped ? `📦 Batched x${closeOrders.length + 1}` : `#${order.orderId}`}
            </div>
            <div style="width:12px; height:12px; border-radius:50%; background:${isGrouped ? T.purple : T.accent}; border:2px solid white; margin-top:2px;"></div>
          </div>
        `;

        L.marker([oLat, oLng], {
          icon: L.divIcon({
            className: "",
            html: pinHtml,
            iconSize: [60, 30],
            iconAnchor: [30, 25],
          }),
        }).addTo(markersGroupRef.current).bindPopup(`Order #${order.orderId} - ${order.user?.name || "Customer"}`);
      });

      // Draw polyline
      routePolylineRef.current = L.polyline(pathPoints, {
        color: T.blue,
        weight: 4,
        opacity: 0.8,
        dashArray: "5, 10",
      }).addTo(mapRef.current);
    }
  }, [driverLatLng, orders, activeTab]);

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

  /* ── PERSISTENT SCREEN WAKE LOCK API ── */
  useEffect(() => {
    let wakeLockInstance = null;

    const requestWakeLock = async () => {
      if (!('wakeLock' in navigator)) return;
      try {
        wakeLockInstance = await navigator.wakeLock.request('screen');
        console.log('🔒 Screen Wake Lock acquired!');
      } catch (err) {
        console.warn('Failed to acquire screen wake lock:', err.message);
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockInstance) {
        try {
          await wakeLockInstance.release();
          console.log('🔓 Screen Wake Lock released!');
        } catch (err) {
          console.error(err);
        }
        wakeLockInstance = null;
      }
    };

    if (isOnline) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => {
      releaseWakeLock();
    };
  }, [isOnline]);

  /* ── Update Driver Marker On Map ── */
  useEffect(() => {
    if (!window.L || !mapRef.current) return;
    const L = window.L;
    if (!markerRef.current) {
      markerRef.current = L.marker([driverLatLng.lat, driverLatLng.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="width:34px;height:34px;border-radius:50%;background:${T.green};display:flex;align-items:center;justify-content:center;color:white;font-size:16px;box-shadow:0 2px 10px rgba(16,185,129,0.4);border:2px solid white;">🛵</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        })
      }).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng([driverLatLng.lat, driverLatLng.lng]);
    }
  }, [driverLatLng]);

  /* ── Socket Listeners ── */
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
  }, [socket, user, fetchData]);

  /* ── Actions ── */
  const toggleDuty = async () => {
    if (!isOnline && !inspectionDone) {
      setShowInspectionModal(true);
      return;
    }

    const next = !isOnline;
    try {
      await axios.put(`${API}/api/delivery/status`, { status: next ? "Active" : "Offline" }, { withCredentials: true });
      setIsOnline(next);
      try {
        new Audio(next ? "https://assets.mixkit.co/active_storage/sfx/1086/1086-600.wav" : "https://assets.mixkit.co/active_storage/sfx/2568/2568-600.wav").play();
      } catch (e) {}
      toast.success(next ? "You're online! Ready for orders." : "You're offline.");
      fetchData();
    } catch (err) {
      if (err.response?.data?.message === "FATIGUE_LIMIT") {
        toast.error("Fatigue limit reached! Please rest today.");
      } else {
        toast.error(err.response?.data?.detail || "Failed to update status");
      }
    }
  };

  const submitInspection = async () => {
    try {
      const { data } = await axios.post(`${API}/api/delivery/inspection`, { items: checklist }, { withCredentials: true });
      if (data.passed) {
        setInspectionDone(true);
        setShowInspectionModal(false);
        toast.success("Inspection passed! Toggling duty online...");
        // Auto go online
        await axios.put(`${API}/api/delivery/status`, { status: "Active" }, { withCredentials: true });
        setIsOnline(true);
        fetchData();
      } else {
        toast.error("Please fix and verify all checklist items first.");
      }
    } catch {
      toast.error("Inspection submit failed");
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    if (status === "Delivered") {
      if (!capturedPhoto) {
        toast.error("📸 Please capture a Proof of Delivery Photo first.");
        return;
      }
      if (!signatureData) {
        toast.error("✍️ Please collect the customer's signature first.");
        return;
      }
    }

    try {
      await axios.put(
        `${API}/api/delivery/orders/${orderId}/status`, 
        { 
          status, 
          podUrl: capturedPhoto || null, 
          signature: signatureData || null,
          paymentMethod: status === "Delivered" ? driverPaymentMethod : null
        }, 
        { withCredentials: true }
      );
      toast.success(`Status updated: ${status}`);
      setCapturedPhoto(null);
      setSignatureData(null);
      setSelectedOrder(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Status update failed");
    }
  };

  const triggerSOS = async () => {
    try {
      const { data } = await axios.post(`${API}/api/delivery/sos`, {
        lat: driverLatLng.lat,
        lng: driverLatLng.lng,
      }, { withCredentials: true });
      toast.error("🚨 " + data.message, { duration: 8000 });
    } catch {
      toast.error("SOS trigger failed. Call admin immediately!");
    }
  };

  /* ── Signature Canvas Functions ── */
  const startDrawing = (e) => {
    isDrawingRef.current = true;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = T.ink;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const endDrawing = () => {
    isDrawingRef.current = false;
  };

  const saveSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL("image/png"));
      setIsSigning(false);
      toast.success("Signature captured successfully!");
    }
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureData(null);
    }
  };

  const startCamera = async () => {
    setCameraActive(true);
    setCapturedPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraActive(false);
      toast.error("Camera access denied");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const v = videoRef.current, c = canvasRef.current;
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      c.getContext("2d").drawImage(v, 0, 0);
      setCapturedPhoto(c.toDataURL("image/jpeg"));
      v.srcObject?.getTracks().forEach((t) => t.stop());
      setCameraActive(false);
    }
  };

  // Poll chat history if socket is disabled or offline
  useEffect(() => {
    if (!chatOpen || !chatTarget) return;
    const tid = chatTarget._id || chatTarget.id;
    if (!tid) return;

    const fetchHistory = () => {
      axios.get(`${API}/api/chat/history/${tid}`, { withCredentials: true })
        .then((r) => setChatMessages(r.data || []))
        .catch(() => {});
    };

    if (!socket) {
      const interval = setInterval(fetchHistory, 3000);
      return () => clearInterval(interval);
    }
  }, [chatOpen, chatTarget, socket]);

  const openChat = (target) => {
    setChatTarget(target);
    setChatOpen(true);
    setChatMessages([]);
    const tid = target?._id || target?.id;
    if (tid) {
      axios.get(`${API}/api/chat/history/${tid}`, { withCredentials: true })
        .then((r) => setChatMessages(r.data || []))
        .catch(() => {});
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !chatTarget) return;
    const textToSend = chatInput.trim();
    setChatInput("");

    try {
      const { data } = await axios.post(`${API}/api/chat/message`, {
        recipient: chatTarget._id || chatTarget.id,
        message: textToSend,
        senderRole: "driver",
        recipientRole: chatTarget.role || "support",
      }, { withCredentials: true });

      // Add locally if socket is disabled (since socket won't bounce it back)
      if (!socket) {
        setChatMessages((prev) => [...prev, data]);
      }
    } catch {
      toast.error("Failed to send message");
    }
  };

  const openVoiceNavigation = (order) => {
    const oLat = order.shippingAddress?.lat || 16.5449;
    const oLng = order.shippingAddress?.lng || 81.5212;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${oLat},${oLng}&travelmode=driving`, "_blank");
  };

  /* ── Get Live Dynamic ETA Countdown ── */
  const getLiveETA = (order) => {
    const oLat = order.shippingAddress?.lat || 16.5449;
    const oLng = order.shippingAddress?.lng || 81.5212;
    const dist = getDistance(driverLatLng.lat, driverLatLng.lng, oLat, oLng);
    const estMin = Math.max(2, Math.round(dist * 3)); // Average 3 mins per km
    return `${estMin} min (${dist.toFixed(1)} km)`;
  };

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

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: T.bg }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${T.border}`, borderTopColor: T.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
          <p style={{ marginTop: 16, color: T.inkMid, fontSize: 13, fontWeight: 500 }}>Initializing SeaBite Captain Console...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter((o) => ["Processing", "Shipped", "Out for Delivery"].includes(o.status));
  const dailyMilestoneTarget = 5;
  const totalDone = stats?.totalDeliveries || 0;
  const milestoneProgress = Math.min(100, (totalDone / dailyMilestoneTarget) * 100);

  // Gamification achievements unlock list
  const badgesList = [
    { id: "rain_warrior", title: "Rain Warrior 🌧️", desc: "Delivered in extreme weather", goal: 1 },
    { id: "night_captain", title: "Night Captain 🌙", desc: "Completed late night dispatch", goal: 1 },
    { id: "century", title: "Century 💯", desc: "100 total career orders done", goal: 100 },
    { id: "speedster", title: "Speedster ⚡", desc: "Delivered within 15 mins", goal: 5 },
  ];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Inter', 'DM Sans', sans-serif" }}>
      
      {/* 🆘 EMERGENCY SOS BUTTON 🆘 */}
      <button 
        onClick={triggerSOS}
        style={{ position: "fixed", bottom: 85, right: 20, zIndex: 45, width: 56, height: 56, borderRadius: "50%", background: T.red, color: "white", border: "none", boxShadow: "0 4px 15px rgba(239,68,68,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 11 }}
      >
        <FiAlertOctagon size={24} />
      </button>

      {/* 🚨 VEHICLE INSPECTION CHECKLIST MODAL 🚨 */}
      <AnimatePresence>
        {showInspectionModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: T.card, borderRadius: 20, padding: 24, maxWidth: 400, width: "100%", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: T.ink }}>🔧 Daily Vehicle Checklist</h3>
                <button onClick={() => setShowInspectionModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: T.inkLight }}><FiX size={18} /></button>
              </div>
              <p style={{ fontSize: 12, color: T.inkMid, marginBottom: 16 }}>Please inspect your vehicle and check off each item to toggle duty online.</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                {Object.keys(checklist).map((item) => (
                  <label key={item} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, textTransform: "capitalize", color: T.ink }}>
                    <input 
                      type="checkbox" 
                      checked={checklist[item]} 
                      onChange={(e) => setChecklist(prev => ({ ...prev, [item]: e.target.checked }))}
                      style={{ width: 18, height: 18, accentColor: T.accent }}
                    />
                    {item === "iceBox" ? "Cold Ice Box / Freezer Clean" : item}
                  </label>
                ))}
              </div>

              <button 
                onClick={submitInspection}
                style={{ width: "100%", padding: 14, background: T.accent, color: "white", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
              >
                Verify & Go Online
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
            <h1 style={{ fontSize: 18, fontWeight: 800, color: T.ink, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22 }}>🛵</span> SeaBite Captain
            </h1>
            <p style={{ fontSize: 11, color: T.inkLight, margin: "2px 0 0", fontWeight: 500 }}>
              {user?.name || "Driver"} • {isOnline ? "Duty: Online" : "Duty: Offline"}
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
            {/* Duty Toggle Switch */}
            <button onClick={toggleDuty}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, transition: "all 0.3s",
                background: isOnline ? T.greenLight : T.surface, color: isOnline ? T.green : T.inkMid, boxShadow: isOnline ? `0 0 0 2px ${T.green}40` : `0 0 0 1px ${T.border}` }}>
              <FiPower size={14} />
              {isOnline ? "ONLINE" : "OFFLINE"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px 100px" }}>
        
        {/* 🚨 FATIGUE ALERT ALARM BAR 🚨 */}
        {fatigueData.totalMinutesToday >= fatigueData.limit && (
          <div style={{ background: T.redLight, border: `1px solid ${T.red}`, padding: 14, borderRadius: 16, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <FiAlertOctagon size={24} style={{ color: T.red }} />
            <div>
              <div style={{ fontWeight: 800, color: T.red, fontSize: 13 }}>Mandatory Shift Break Active</div>
              <div style={{ fontSize: 12, color: T.inkMid }}>You've exceeded the daily online duty limit of 10 hours. Going offline.</div>
            </div>
          </div>
        )}

        {/* ═══ STATS ROW ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Active Orders", value: activeOrders.length, icon: <FiPackage />, color: T.accent, bg: T.accentLight },
            { label: "Today's Earnings", value: `₹${stats?.dailyEarnings || 0}`, icon: <FiDollarSign />, color: T.green, bg: T.greenLight },
            { label: "Weekly Streak", value: `🔥 ${streakData.streak} days`, icon: <FiTrendingUp />, color: "#F59E0B", bg: "#FEF3C7" },
            { label: "Completed Today", value: totalDone, icon: <FiCheckCircle />, color: T.blue, bg: T.blueLight },
            { label: "Duty Time Today", value: `${Math.round(fatigueData.totalMinutesToday || 0)} min`, icon: <FiClock />, color: T.purple, bg: T.purpleLight }
          ].map((s, i) => (
            <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.ink }}>{s.value}</div>
                <div style={{ fontSize: 11, color: T.inkLight, fontWeight: 500 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ TABS ═══ */}
        <div style={{ display: "flex", gap: 4, background: "#E2E8F0", padding: 4, borderRadius: 14, marginBottom: 24, maxWidth: 500 }}>
          {[
            { key: "active", label: "Active Deliveries" },
            { key: "map", label: "Optimized Map" },
            { key: "leaderboard", label: "Captain Leaderboard" },
            { key: "earnings", label: "Earnings Calendar" }
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                background: activeTab === t.key ? T.card : "transparent", color: activeTab === t.key ? T.ink : T.inkMid }}>
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
                activeOrders.map((order, idx) => {
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
                        <div style={{ display: "flex", gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: T.blueLight, color: T.blue }}>
                            ⏱️ {getLiveETA(order)}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8, 
                            background: step === 1 ? T.blueLight : step === 2 ? T.accentLight : T.greenLight,
                            color: step === 1 ? T.blue : step === 2 ? T.accent : T.green }}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Address */}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 12 }}>
                        <FiMapPin size={13} style={{ color: T.accent, marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: T.inkMid, lineHeight: "1.4" }}>{formatAddress(order.shippingAddress)}</span>
                      </div>

                      {/* Optimized Sequence Badge */}
                      <div style={{ display: "inline-block", background: T.greenLight, color: T.green, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, marginBottom: 12 }}>
                        🧭 Stop #{idx + 1} on optimized route
                      </div>

                      {/* Stepper */}
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {["Hub Pickup", "In Transit", "Delivered"].map((label, i) => (
                          <React.Fragment key={i}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <div style={{ width: 20, height: 20, borderRadius: "50%", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                                background: i + 1 <= step ? T.green : T.bg, color: i + 1 <= step ? "white" : T.inkLight, border: `1.5px solid ${i + 1 <= step ? T.green : T.border}` }}>
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
                  <button onClick={() => setSelectedOrder(null)} style={{ background: T.bg, border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: T.inkMid }}>
                    <FiX size={16} />
                  </button>
                </div>

                {/* Live ETA timer countdown display */}
                <div style={{ background: T.accentLight, borderRadius: 12, padding: 12, marginBottom: 16, display: "flex", justifyBetween: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 11, color: T.accent, fontWeight: 700 }}>LIVE DRIVER DESTINATION ETA</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: T.ink }}>{getLiveETA(selectedOrder)}</div>
                  </div>
                  <button 
                    onClick={() => openVoiceNavigation(selectedOrder)}
                    style={{ background: T.accent, border: "none", color: "white", padding: "8px 12px", borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: "pointer", marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <FiNavigation size={13} /> Navigate
                  </button>
                </div>

                {/* Items */}
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ fontSize: 11, fontWeight: 700, color: T.inkLight, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Items to Deliver</h4>
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < selectedOrder.items.length - 1 ? `1px solid ${T.border}` : "none" }}>
                      <span style={{ fontSize: 13, color: T.ink }}>{item.name} × {item.qty}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>₹{item.price * item.qty}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, marginTop: 4, borderTop: `2px solid ${T.border}` }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>Total Amount to Collect</span>
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
                        style={{ padding: 10, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, fontWeight: 600, fontSize: 12, cursor: "pointer", color: T.inkMid }}>Cancel</button>
                    </div>
                  </div>
                )}

                {capturedPhoto && (
                  <div style={{ marginBottom: 16, textAlign: "center" }}>
                    <img src={capturedPhoto} alt="POD" style={{ width: "100%", maxHeight: 140, objectFit: "cover", borderRadius: 12, border: `1px solid ${T.border}` }} />
                    <button onClick={() => setCapturedPhoto(null)} style={{ marginTop: 8, fontSize: 11, color: T.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Re-take</button>
                  </div>
                )}

                {/* 📝 DIGITAL SIGNATURE CAPTURE GATED PAD 📝 */}
                {isSigning ? (
                  <div style={{ background: T.bg, padding: 12, borderRadius: 12, marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700 }}>Customer Signature Pad</span>
                      <button onClick={clearSignature} style={{ color: T.red, background: "none", border: "none", fontSize: 11, cursor: "pointer" }}>Clear</button>
                    </div>
                    <canvas 
                      ref={signatureCanvasRef}
                      width={300}
                      height={120}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={endDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={endDrawing}
                      style={{ background: "white", borderRadius: 8, width: "100%", border: `1px solid ${T.border}`, cursor: "crosshair" }}
                    />
                    <button onClick={saveSignature} style={{ width: "100%", padding: 8, background: T.green, color: "white", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, marginTop: 8, cursor: "pointer" }}>
                      Save Signature
                    </button>
                  </div>
                ) : (
                  signatureData && (
                    <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 12, marginBottom: 16, background: T.greenLight, textAlign: "center" }}>
                      <span style={{ fontSize: 11, color: T.green, fontWeight: 700, display: "block", marginBottom: 6 }}>Signature Captured</span>
                      <img src={signatureData} alt="signature" style={{ maxHeight: 60, maxWidth: "100%", objectFit: "contain" }} />
                      <button onClick={() => setIsSigning(true)} style={{ fontSize: 10, color: T.accent, background: "none", border: "none", cursor: "pointer", display: "block", margin: "6px auto 0" }}>Change Signature</button>
                    </div>
                  )
                )}

                {/* Action Buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {getStepperState(selectedOrder) <= 1 && (
                    <button onClick={() => updateOrderStatus(selectedOrder._id, "Out for Delivery")}
                      style={{ width: "100%", padding: 14, background: T.accent, color: "white", border: "none", borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <FiTruck size={16} /> Picked Up — Start Delivery
                    </button>
                  )}

                  {getStepperState(selectedOrder) === 2 && (
                    <>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={startCamera}
                          style={{ flex: 1, padding: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: T.ink }}>
                          <FiCamera size={14} /> Photo POD
                        </button>
                        <button onClick={() => setIsSigning(true)}
                          style={{ flex: 1, padding: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: T.ink }}>
                          ✍️ E-Sign
                        </button>
                      </div>
                      {selectedOrder.paymentMethod !== "Prepaid" && selectedOrder.paymentMethod !== "Wallet" && (
                        <div style={{ margin: "12px 0 4px", padding: 12, background: T.accentLight, borderRadius: 12, border: `1px solid ${T.border}` }}>
                          <span style={{ fontSize: 10, color: T.accent, fontWeight: 800, display: "block", marginBottom: 6, textTransform: "uppercase" }}>💰 Collect Payment (COD Order)</span>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button 
                              onClick={() => setDriverPaymentMethod("Cash")}
                              style={{ 
                                flex: 1, 
                                padding: "8px 10px", 
                                background: driverPaymentMethod === "Cash" ? T.accent : T.surface, 
                                color: driverPaymentMethod === "Cash" ? "white" : T.ink, 
                                border: `1px solid ${driverPaymentMethod === "Cash" ? T.accent : T.border}`, 
                                borderRadius: 10, 
                                fontSize: 11, 
                                fontWeight: 700, 
                                cursor: "pointer",
                                transition: "all 0.15s"
                              }}
                            >
                              💵 Cash
                            </button>
                            <button 
                              onClick={() => setDriverPaymentMethod("UPI")}
                              style={{ 
                                flex: 1, 
                                padding: "8px 10px", 
                                background: driverPaymentMethod === "UPI" ? T.accent : T.surface, 
                                color: driverPaymentMethod === "UPI" ? "white" : T.ink, 
                                border: `1px solid ${driverPaymentMethod === "UPI" ? T.accent : T.border}`, 
                                borderRadius: 10, 
                                fontSize: 11, 
                                fontWeight: 700, 
                                cursor: "pointer",
                                transition: "all 0.15s"
                              }}
                            >
                              📱 UPI / Scan
                            </button>
                          </div>
                        </div>
                      )}
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
                      style={{ flex: 1, padding: 12, background: T.bg, color: T.inkMid, border: `1px solid ${T.border}`, borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
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
            <div style={{ padding: 16, borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: T.ink, margin: 0 }}>🧭 Dynamic TSP Route Map</h3>
                <p style={{ fontSize: 11, color: T.inkLight, margin: 0 }}>Showing optimized shortest sequence across drop points.</p>
              </div>
            </div>
            <div id="driver-map" style={{ height: 500, width: "100%" }} />
          </div>
        )}

        {/* ═══ LEADERBOARD TAB ═══ */}
        {activeTab === "leaderboard" && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 16 }}>🏆 SeaBite Captain Leaderboard</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {leaderboard.length === 0 ? (
                <div style={{ padding: 20, color: T.inkLight, textAlign: "center" }}>No active leader board metrics computed yet.</div>
              ) : (
                leaderboard.map((captain, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderRadius: 12, background: user.email === captain.email ? T.accentLight : T.bg, border: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: T.ink, width: 30 }}>#{idx + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{captain.name}</div>
                      <div style={{ fontSize: 11, color: T.inkLight }}>⭐ {captain.rating} • {captain.onTimePct}% On-time</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.accent }}>{captain.weeklyDeliveries} deliveries</div>
                      <div style={{ fontSize: 10, color: T.inkLight }}>🔥 {captain.streak} day streak</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Achievements Grid */}
            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: T.ink, marginBottom: 16 }}>⭐ Unlocked Captain Badges</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {badgesList.map((badge) => {
                  const isUnlocked = streakData.achievements?.some(a => a.badge === badge.id) || (badge.id === "century" && totalDone >= 100);
                  return (
                    <div key={badge.id} style={{ background: isUnlocked ? T.greenLight : T.bg, border: `1px solid ${T.border}`, padding: 14, borderRadius: 12, display: "flex", gap: 12, alignItems: "center", opacity: isUnlocked ? 1 : 0.6 }}>
                      <div style={{ fontSize: 24 }}>{isUnlocked ? "🏆" : "🔒"}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{badge.title}</div>
                        <div style={{ fontSize: 11, color: T.inkMid }}>{badge.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ EARNINGS CALENDAR TAB ═══ */}
        {activeTab === "earnings" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24 }}>
            {/* Heatmap Calendar */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}><FiCalendar /> Payout Calendar (Heatmap)</h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, textAlign: "center" }}>
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={i} style={{ fontSize: 11, fontWeight: 700, color: T.inkLight, paddingBottom: 8 }}>{d}</div>
                ))}

                {Array.from({ length: 30 }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dateStr = `2026-07-${dayNum.toString().padStart(2, "0")}`;
                  const record = payoutCalendar.find(c => c.date === dateStr);
                  const heatColor = record ? (record.total > 200 ? T.green : T.greenLight) : T.bg;

                  return (
                    <div 
                      key={idx} 
                      title={record ? `Deliveries: ${record.deliveries} | Earned: ₹${record.total}` : "No deliveries"}
                      style={{ 
                        aspectRatio: "1", 
                        borderRadius: 8, 
                        background: heatColor, 
                        color: record ? "white" : T.inkMid, 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        fontSize: 11, 
                        fontWeight: 700,
                        cursor: record ? "pointer" : "default" 
                      }}
                    >
                      {dayNum}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Breakdown details */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 16 }}>Payout Breakdown</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Base Payout", value: `₹${totalDone * 45}`, desc: "₹45 per completed dispatch" },
                  { label: "Tips Collected", value: `₹${stats?.tips || 0}`, desc: "100% of customer tips passed to you" },
                  { label: "Surge incentives", value: `₹${totalDone * 25}`, desc: "Collected in peak demand hours" },
                  { label: "Fuel Incentives", value: `₹${stats?.fuelBonus || 0}`, desc: "₹5 per delivery" },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{row.label}</div>
                      <div style={{ fontSize: 11, color: T.inkLight }}>{row.desc}</div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: T.green }}>{row.value}</span>
                  </div>
                ))}

                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>LTD Balance</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: T.accent }}>₹{(stats?.dailyEarnings || 0) + (stats?.tips || 0) + (stats?.fuelBonus || 0)}</span>
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
                <button onClick={() => setChatOpen(false)} style={{ background: T.bg, border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: T.inkMid }}><FiX size={16} /></button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {chatMessages.length === 0 && <p style={{ textAlign: "center", color: T.inkLight, fontSize: 12, marginTop: 40 }}>Start a conversation</p>}
                {chatMessages.map((msg, i) => {
                  const self = msg.sender === (user.id || user._id);
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: self ? "flex-end" : "flex-start" }}>
                      <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: 14, fontSize: 13, lineHeight: "1.4",
                        background: self ? T.accent : T.bg, color: self ? "white" : T.ink,
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
