import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  FiSearch, FiInbox, FiActivity, FiClock, FiAlertCircle, FiUser,
  FiCheckCircle, FiSend, FiX, FiPackage, FiMapPin, FiPhone,
  FiMessageSquare, FiRefreshCw, FiDollarSign, FiTruck, FiEye
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
  accent: "#4285F4",
  accentLight: "#E8F0FE",
  green: "#34A853",
  greenLight: "#E6F4EA",
  red: "#EA4335",
  redLight: "#FCE8E6",
  orange: "#FF6B35",
  orangeLight: "#FFF3ED",
  purple: "#A855F7",
  purpleLight: "#F3E8FF",
};

/* ─── Sentiment Analyzer ─── */
const analyzeSentiment = (text) => {
  if (!text) return { label: "Neutral", emoji: "⚖️", color: T.inkMid, bg: T.surface };
  const w = text.toLowerCase();
  const neg = ["angry", "bad", "late", "delay", "slow", "terrible", "waste", "worst", "spill", "cold", "refund", "ruined", "hate", "frustrated", "disgusting"];
  const pos = ["happy", "great", "thanks", "thank", "awesome", "perfect", "good", "fast", "love", "fresh", "sweet", "nice", "wonderful"];
  let n = 0, p = 0;
  w.split(/\s+/).forEach(word => { if (neg.includes(word)) n++; if (pos.includes(word)) p++; });
  if (n > p) return { label: "Angry", emoji: "🔴", color: T.red, bg: T.redLight };
  if (p > n) return { label: "Happy", emoji: "🟢", color: T.green, bg: T.greenLight };
  return { label: "Neutral", emoji: "⚖️", color: T.inkMid, bg: T.surface };
};

export default function SupportDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  /* ── Core State ── */
  const [tickets, setTickets] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("queue"); // queue, xray, chat
  const [searchId, setSearchId] = useState("");

  /* ── Order X-Ray ── */
  const [xrayOrder, setXrayOrder] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  /* ── Refund ── */
  const [refundAmount, setRefundAmount] = useState("");
  const [refunding, setRefunding] = useState(false);

  /* ── Frustration Alerts ── */
  const [frustrations, setFrustrations] = useState([]);

  /* ── Chat ── */
  const [chatRecipient, setChatRecipient] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [recipientTyping, setRecipientTyping] = useState(false);
  const [sentiment, setSentiment] = useState({ label: "Neutral", emoji: "⚖️", color: T.inkMid, bg: T.surface });
  const chatEndRef = useRef(null);

  /* ── Map ── */
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [driverCoords, setDriverCoords] = useState(null);

  /* ── Data Fetching ── */
  const fetchTickets = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/api/support/tickets`, { withCredentials: true });
      setTickets(data || []);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/api/chat/conversations`, { withCredentials: true });
      setConversations(data || []);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    }
  }, []);

  useEffect(() => { fetchTickets(); fetchConversations(); }, [fetchTickets, fetchConversations]);

  /* ── Auto-refresh ── */
  useEffect(() => {
    const interval = setInterval(() => { fetchTickets(); fetchConversations(); }, 30000);
    return () => clearInterval(interval);
  }, [fetchTickets, fetchConversations]);

  /* ── Leaflet ── */
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(link); document.head.removeChild(script); } catch(e) {} };
  }, []);

  const initMap = (lat, lng) => {
    if (!window.L || mapRef.current) return;
    const map = window.L.map("cs-map", { zoomControl: false, attributionControl: false }).setView([lat, lng], 14);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
    mapRef.current = map;
  };

  const updateMapMarker = (coords) => {
    if (!window.L || !mapRef.current) return;
    const L = window.L;
    if (!markerRef.current) {
      markerRef.current = L.marker([coords.lat, coords.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="width:28px;height:28px;border-radius:50%;background:${T.accent};display:flex;align-items:center;justify-content:center;color:white;font-size:14px;box-shadow:0 2px 8px rgba(66,133,244,0.4)">🛵</div>`,
          iconSize: [28, 28], iconAnchor: [14, 14]
        })
      }).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng([coords.lat, coords.lng]);
    }
    mapRef.current.panTo([coords.lat, coords.lng]);
  };

  /* ── Socket Events ── */
  useEffect(() => {
    if (!socket || !user) return;
    socket.emit("join-chat", { userId: user.id || user._id });

    const handleFrustration = (data) => {
      setFrustrations(prev => [{ ...data, time: new Date() }, ...prev].slice(0, 15));
      try { new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-600.wav").play(); } catch(e) {}
      toast.error("⚠️ Customer frustration detected!", { duration: 4000 });
    };

    const handleLocation = (data) => {
      if (xrayOrder && xrayOrder.deliveryPartner === data.driverId) {
        setDriverCoords(data.location);
        updateMapMarker(data.location);
      }
    };

    const handleChat = (msg) => {
      setChatMessages(prev => [...prev, msg]);
      setSentiment(analyzeSentiment(msg.message));
      if (!chatRecipient) {
        toast.success(`New message from customer`, { duration: 3000 });
      }
    };

    const handleTyping = (data) => {
      if (chatRecipient && data.sender === (chatRecipient._id || chatRecipient.id)) {
        setRecipientTyping(data.isTyping);
      }
    };

    const handleOrderPlaced = () => { fetchTickets(); };

    socket.on("FRUSTRATION_EVENT", handleFrustration);
    socket.on("DRIVER_LOCATION_STREAM", handleLocation);
    socket.on("chat-message", handleChat);
    socket.on("typing-indicator", handleTyping);
    socket.on("ORDER_PLACED", handleOrderPlaced);

    return () => {
      socket.off("FRUSTRATION_EVENT", handleFrustration);
      socket.off("DRIVER_LOCATION_STREAM", handleLocation);
      socket.off("chat-message", handleChat);
      socket.off("typing-indicator", handleTyping);
      socket.off("ORDER_PLACED", handleOrderPlaced);
    };
  }, [socket, user, xrayOrder, chatRecipient]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  /* ── Actions ── */
  const lookupOrder = async (id = searchId) => {
    if (!id) return;
    try {
      const { data } = await axios.get(`${API}/api/support/order/${id}`, { withCredentials: true });
      setXrayOrder(data);
      setSelectedTicketId(data._id);
      setActiveView("xray");
      setDriverCoords(null);
      mapRef.current = null;
      markerRef.current = null;
      setTimeout(() => initMap(16.5449, 81.5212), 500);
    } catch (err) {
      toast.error("Order not found. Check the ID.");
    }
  };

  const processRefund = async () => {
    if (!xrayOrder || !refundAmount || Number(refundAmount) <= 0) {
      toast.error("Enter a valid refund amount"); return;
    }
    setRefunding(true);
    try {
      const { data } = await axios.post(`${API}/api/support/refund`, {
        orderId: xrayOrder._id,
        amount: Number(refundAmount)
      }, { withCredentials: true });
      toast.success(data.message);
      setRefundAmount("");
      lookupOrder(xrayOrder._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Refund failed");
    } finally {
      setRefunding(false);
    }
  };

  const openChat = (recipient) => {
    setChatRecipient(recipient);
    setChatMessages([]);
    setSentiment({ label: "Neutral", emoji: "⚖️", color: T.inkMid, bg: T.surface });
    setActiveView("chat");
    const rid = recipient?._id || recipient?.id;
    if (rid) {
      axios.get(`${API}/api/chat/history/${rid}`, { withCredentials: true })
        .then(r => {
          setChatMessages(r.data || []);
          // Compute sentiment from last customer message
          const lastCustomerMsg = [...(r.data || [])].reverse().find(m => m.senderRole === "user");
          if (lastCustomerMsg) setSentiment(analyzeSentiment(lastCustomerMsg.message));
        })
        .catch(() => {});
    }
  };

  const sendMessage = () => {
    if (!chatInput.trim() || !socket || !chatRecipient) return;
    socket.emit("send-chat-message", {
      sender: user.id || user._id,
      recipient: chatRecipient._id || chatRecipient.id,
      message: chatInput,
      senderRole: "support",
      recipientRole: chatRecipient.role || "user"
    });
    setChatInput("");
  };

  /* ── Helpers ── */
  const formatTime = (d) => d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "--";
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "--";
  const formatAddress = (a) => a ? [a.houseNo, a.street, a.city, a.state, a.zip].filter(Boolean).join(", ") : "No address";

  const statusColor = (s) => {
    if (["Delivered"].includes(s)) return { bg: T.greenLight, color: T.green };
    if (["Cancelled"].includes(s)) return { bg: T.redLight, color: T.red };
    if (["Out for Delivery", "Shipped"].includes(s)) return { bg: T.accentLight, color: T.accent };
    return { bg: T.orangeLight, color: T.orange };
  };

  /* ── Stats from tickets ── */
  const totalOrders = tickets.length;
  const pendingCount = tickets.filter(t => ["Pending", "Processing"].includes(t.status)).length;
  const deliveredCount = tickets.filter(t => t.status === "Delivered").length;
  const issueCount = frustrations.length;

  /* ── Loading ── */
  if (loading && tickets.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: T.bg }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${T.border}`, borderTopColor: T.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
          <p style={{ marginTop: 16, color: T.inkMid, fontSize: 13 }}>Loading support console...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Inter', 'DM Sans', -apple-system, sans-serif" }}>
      
      {/* ═══ HEADER ═══ */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: "16px 24px", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: T.ink, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22 }}>🎧</span> Support Console
            </h1>
            <p style={{ fontSize: 11, color: T.inkLight, margin: "2px 0 0", fontWeight: 500 }}>
              {user?.name || "Agent"} • Resolution & Diagnostics
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => { fetchTickets(); fetchConversations(); }} style={{ padding: 8, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, cursor: "pointer", color: T.inkMid, display: "flex" }}>
              <FiRefreshCw size={16} />
            </button>
            <select value="support" onChange={e => { if (e.target.value === "admin") navigate("/admin/dashboard"); if (e.target.value === "driver") navigate("/driver"); }}
              style={{ padding: "8px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12, fontWeight: 600, color: T.inkMid, cursor: "pointer" }}>
              <option value="admin">🏢 Admin</option>
              <option value="driver">🛵 Driver</option>
              <option value="support">🎧 Support</option>
            </select>
            {/* Frustration Badge */}
            {frustrations.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: T.redLight, borderRadius: 10, color: T.red, fontSize: 11, fontWeight: 700 }}>
                <FiAlertCircle size={14} className="animate-pulse" /> {frustrations.length} Alert{frustrations.length > 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 24 }}>
        
        {/* ═══ STATS ROW ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total Orders", value: totalOrders, icon: <FiPackage />, color: T.accent, bg: T.accentLight },
            { label: "Pending Review", value: pendingCount, icon: <FiClock />, color: T.orange, bg: T.orangeLight },
            { label: "Resolved", value: deliveredCount, icon: <FiCheckCircle />, color: T.green, bg: T.greenLight },
            { label: "Frustration Alerts", value: issueCount, icon: <FiAlertCircle />, color: T.red, bg: T.redLight },
            { label: "Active Chats", value: conversations.length, icon: <FiMessageSquare />, color: T.purple, bg: T.purpleLight }
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

        {/* ═══ SEARCH BAR ═══ */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <FiSearch size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.inkLight }} />
            <input type="text" placeholder="Search by Order ID or MongoDB ID..." value={searchId}
              onChange={e => setSearchId(e.target.value)} onKeyDown={e => e.key === "Enter" && lookupOrder()}
              style={{ width: "100%", paddingLeft: 42, paddingRight: 14, padding: "12px 14px 12px 42px", border: `1px solid ${T.border}`, borderRadius: 14, fontSize: 13, outline: "none", background: T.card }} />
          </div>
          <button onClick={() => lookupOrder()}
            style={{ padding: "12px 24px", background: T.accent, color: "white", border: "none", borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <FiEye size={14} style={{ marginRight: 6, verticalAlign: "middle" }} /> X-Ray Scan
          </button>
        </div>

        {/* ═══ MAIN CONTENT ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 24 }}>
          
          {/* ── LEFT SIDEBAR ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            
            {/* Frustration Alerts */}
            {frustrations.length > 0 && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: T.red, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <FiAlertCircle size={14} /> Live Frustration Alerts
                </h3>
                <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                  {frustrations.map((f, i) => (
                    <div key={i} style={{ padding: 10, background: T.redLight, borderRadius: 10, fontSize: 11 }}>
                      <div style={{ fontWeight: 700, color: T.red }}>{f.msg || "Checkout rage-click detected"}</div>
                      <div style={{ color: T.inkLight, marginTop: 2, fontSize: 10 }}>
                        {f.userId || "Anonymous"} • {f.time ? formatTime(f.time) : "Just now"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, background: T.surface, padding: 4, borderRadius: 12 }}>
              {[
                { key: "orders", label: "Orders Queue" },
                { key: "chats", label: "Live Chats" }
              ].map(t => (
                <button key={t.key} onClick={() => {}} style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
                  background: T.card, color: T.ink, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Orders Queue */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: T.ink, margin: 0 }}>Recent Orders</h3>
                <span style={{ fontSize: 11, color: T.inkLight }}>{tickets.length} total</span>
              </div>
              <div style={{ maxHeight: 500, overflowY: "auto" }}>
                {tickets.map(ticket => {
                  const sc = statusColor(ticket.status);
                  const isActive = selectedTicketId === ticket._id;
                  return (
                    <div key={ticket._id} onClick={() => {
                      setSelectedTicketId(ticket._id);
                      setXrayOrder(ticket);
                      setActiveView("xray");
                      setDriverCoords(null);
                      mapRef.current = null; markerRef.current = null;
                      setTimeout(() => initMap(16.5449, 81.5212), 500);
                    }}
                      style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}`, cursor: "pointer", transition: "all 0.15s",
                        background: isActive ? T.accentLight : "transparent" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>#{ticket.orderId}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: sc.bg, color: sc.color }}>
                          {ticket.status}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <FiUser size={12} style={{ color: T.inkLight }} />
                          <span style={{ fontSize: 12, color: T.inkMid }}>{ticket.user?.name || "Guest"}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>₹{ticket.totalAmount}</span>
                      </div>
                      <div style={{ fontSize: 10, color: T.inkLight, marginTop: 4 }}>{formatDate(ticket.createdAt)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Conversations */}
            {conversations.length > 0 && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
                <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: T.ink, margin: 0 }}>Active Conversations</h3>
                </div>
                {conversations.slice(0, 8).map((conv, i) => (
                  <div key={i} onClick={() => openChat(conv.user)}
                    style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.accentLight, color: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {conv.user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>{conv.user?.name || "User"}</div>
                      <div style={{ fontSize: 11, color: T.inkLight, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{conv.lastMessage}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL ── */}
          <div>
            <AnimatePresence mode="wait">
              
              {/* X-Ray View */}
              {activeView === "xray" && xrayOrder ? (
                <motion.div key="xray" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  
                  {/* Order Details */}
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${T.border}` }}>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: T.ink, margin: 0 }}>Order #{xrayOrder.orderId}</h3>
                        <p style={{ fontSize: 11, color: T.inkLight, marginTop: 2 }}>ID: {xrayOrder._id}</p>
                      </div>
                      <span style={{ fontSize: 18, fontWeight: 800, color: T.accent }}>₹{xrayOrder.totalAmount}</span>
                    </div>

                    {/* Customer */}
                    <div style={{ background: T.surface, borderRadius: 12, padding: 14, marginBottom: 16 }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: T.inkLight, textTransform: "uppercase", marginBottom: 8 }}>Customer</h4>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{xrayOrder.user?.name || "Guest"}</div>
                      <div style={{ fontSize: 12, color: T.inkMid, marginTop: 2 }}>{xrayOrder.user?.email}</div>
                      <div style={{ fontSize: 12, color: T.inkMid }}>{xrayOrder.user?.phone}</div>
                    </div>

                    {/* Delivery Address */}
                    <div style={{ background: T.surface, borderRadius: 12, padding: 14, marginBottom: 16 }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: T.inkLight, textTransform: "uppercase", marginBottom: 8 }}>Delivery Address</h4>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <FiMapPin size={13} style={{ color: T.accent, marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: T.ink, lineHeight: "1.5" }}>{formatAddress(xrayOrder.shippingAddress)}</span>
                      </div>
                    </div>

                    {/* Items */}
                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: T.inkLight, textTransform: "uppercase", marginBottom: 8 }}>Items</h4>
                      {xrayOrder.items?.map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                          <span style={{ fontSize: 13, color: T.ink }}>{item.name} × {item.qty}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>₹{item.price * item.qty}</span>
                        </div>
                      ))}
                    </div>

                    {/* Status Timeline */}
                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: T.inkLight, textTransform: "uppercase", marginBottom: 10 }}>Status History</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {(xrayOrder.statusHistory?.length > 0 ? xrayOrder.statusHistory : [{ status: xrayOrder.status, timestamp: xrayOrder.updatedAt || xrayOrder.createdAt }]).map((h, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.green, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>{h.status}</span>
                            <span style={{ fontSize: 10, color: T.inkLight, marginLeft: "auto" }}>{formatTime(h.timestamp)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Refund / Compensation */}
                    <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: T.inkLight, textTransform: "uppercase", marginBottom: 10 }}>Compensation</h4>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input type="number" placeholder="₹ Amount" value={refundAmount} onChange={e => setRefundAmount(e.target.value)}
                          style={{ width: 120, padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 13, outline: "none" }} />
                        <button onClick={processRefund} disabled={refunding}
                          style={{ flex: 1, padding: "10px 0", background: T.accent, color: "white", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: refunding ? 0.5 : 1 }}>
                          {refunding ? "Processing..." : "Issue Refund"}
                        </button>
                      </div>
                      <p style={{ fontSize: 10, color: T.inkLight, marginTop: 6 }}>Max ₹500 per action for support agents.</p>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                      <a href={`tel:${xrayOrder.user?.phone}`}
                        style={{ flex: 1, padding: 10, background: T.greenLight, color: T.green, border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <FiPhone size={13} /> Call
                      </a>
                      <button onClick={() => openChat(xrayOrder.user || { _id: "guest", name: "Guest", role: "user" })}
                        style={{ flex: 1, padding: 10, background: T.accentLight, color: T.accent, border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <FiMessageSquare size={13} /> Chat
                      </button>
                    </div>
                  </div>

                  {/* Map + Chat Panel */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Map */}
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16 }}>
                      <h4 style={{ fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 10 }}>Live Rider Location</h4>
                      <div id="cs-map" style={{ height: 220, borderRadius: 12, background: T.surface, overflow: "hidden" }} />
                      {driverCoords ? (
                        <p style={{ fontSize: 10, color: T.green, fontWeight: 600, marginTop: 8 }}>📡 Streaming: {driverCoords.lat.toFixed(4)}, {driverCoords.lng.toFixed(4)}</p>
                      ) : (
                        <p style={{ fontSize: 10, color: T.inkLight, marginTop: 8 }}>Waiting for rider GPS stream...</p>
                      )}
                    </div>

                    {/* Quick Chat */}
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, flex: 1, display: "flex", flexDirection: "column", minHeight: 280 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <h4 style={{ fontSize: 12, fontWeight: 700, color: T.ink, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                          <FiMessageSquare size={14} /> Customer Chat
                        </h4>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: sentiment.bg, color: sentiment.color }}>
                          {sentiment.emoji} {sentiment.label}
                        </span>
                      </div>
                      <div style={{ flex: 1, overflowY: "auto", padding: 10, background: T.surface, borderRadius: 10, display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                        {chatMessages.length === 0 && (
                          <p style={{ textAlign: "center", color: T.inkLight, fontSize: 11, marginTop: 30 }}>
                            {xrayOrder.user ? `Start chat with ${xrayOrder.user.name}` : "Select a customer to start chatting"}
                          </p>
                        )}
                        {chatMessages.map((msg, i) => {
                          const self = msg.sender === (user.id || user._id);
                          return (
                            <div key={i} style={{ display: "flex", justifyContent: self ? "flex-end" : "flex-start" }}>
                              <div style={{ maxWidth: "80%", padding: "8px 12px", borderRadius: 12, fontSize: 12, lineHeight: "1.4",
                                background: self ? T.accent : T.card, color: self ? "white" : T.ink, border: self ? "none" : `1px solid ${T.border}`,
                                borderBottomRightRadius: self ? 4 : 12, borderBottomLeftRadius: self ? 12 : 4 }}>
                                {msg.message}
                              </div>
                            </div>
                          );
                        })}
                        {recipientTyping && <span style={{ fontSize: 10, color: T.inkLight, fontStyle: "italic" }}>typing...</span>}
                        <div ref={chatEndRef} />
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
                          placeholder="Type a response..." style={{ flex: 1, padding: "10px 14px", border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12, outline: "none" }} />
                        <button onClick={sendMessage}
                          style={{ padding: "10px 14px", background: T.accent, color: "white", border: "none", borderRadius: 10, cursor: "pointer" }}>
                          <FiSend size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : activeView === "chat" && chatRecipient ? (
                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, display: "flex", flexDirection: "column", height: 600 }}>
                  
                  {/* Chat Header */}
                  <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.accentLight, color: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                        {chatRecipient.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.ink, margin: 0 }}>{chatRecipient.name}</h3>
                        <span style={{ fontSize: 11, color: T.inkLight }}>{chatRecipient.email || chatRecipient.role}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: sentiment.bg, color: sentiment.color }}>
                        {sentiment.emoji} {sentiment.label}
                      </span>
                      <button onClick={() => { setActiveView("queue"); setChatRecipient(null); }}
                        style={{ background: T.surface, border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: T.inkMid }}><FiX size={16} /></button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                    {chatMessages.length === 0 && <p style={{ textAlign: "center", color: T.inkLight, fontSize: 12, marginTop: 50 }}>No messages yet</p>}
                    {chatMessages.map((msg, i) => {
                      const self = msg.sender === (user.id || user._id);
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: self ? "flex-end" : "flex-start" }}>
                          <div style={{ maxWidth: "70%", padding: "10px 14px", borderRadius: 14, fontSize: 13, lineHeight: "1.4",
                            background: self ? T.accent : T.surface, color: self ? "white" : T.ink,
                            borderBottomRightRadius: self ? 4 : 14, borderBottomLeftRadius: self ? 14 : 4 }}>
                            {msg.message}
                          </div>
                        </div>
                      );
                    })}
                    {recipientTyping && <span style={{ fontSize: 11, color: T.inkLight, fontStyle: "italic" }}>typing...</span>}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input */}
                  <div style={{ padding: "12px 20px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 8 }}>
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
                      placeholder="Type a support response..."
                      style={{ flex: 1, padding: "12px 16px", border: `1px solid ${T.border}`, borderRadius: 12, fontSize: 13, outline: "none" }} />
                    <button onClick={sendMessage}
                      style={{ padding: "12px 16px", background: T.accent, color: "white", border: "none", borderRadius: 12, cursor: "pointer" }}>
                      <FiSend size={16} />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 60, textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: T.ink, margin: 0 }}>Ready for Diagnostics</h3>
                  <p style={{ fontSize: 13, color: T.inkLight, marginTop: 8, maxWidth: 400, margin: "8px auto 0" }}>
                    Select an order from the queue, search by Order ID, or open an active conversation to begin resolving issues.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
