import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  FiSearch, FiInbox, FiActivity, FiClock, FiAlertCircle, FiUser,
  FiCheckCircle, FiSend, FiX, FiPackage, FiMapPin, FiPhone,
  FiMessageSquare, FiRefreshCw, FiDollarSign, FiTruck, FiEye,
  FiTrendingUp, FiBookOpen, FiShare2, FiEdit2, FiStar
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
  accent: "#3B82F6",
  accentLight: "#EFF6FF",
  green: "#10B981",
  greenLight: "#E6F4EA",
  red: "#EF4444",
  redLight: "#FEE2E2",
  orange: "#F59E0B",
  orangeLight: "#FEF3C7",
  purple: "#8B5CF6",
  purpleLight: "#F5F3FF",
};

/* ─── Sentiment Analyzer ─── */
const analyzeSentiment = (text) => {
  if (!text) return { label: "Neutral", emoji: "⚖️", color: T.inkMid, bg: T.bg };
  const w = text.toLowerCase();
  const neg = ["angry", "bad", "late", "delay", "slow", "terrible", "waste", "worst", "spill", "cold", "refund", "ruined", "hate", "frustrated", "disgusting", "wrong", "expired"];
  const pos = ["happy", "great", "thanks", "thank", "awesome", "perfect", "good", "fast", "love", "fresh", "sweet", "nice", "wonderful"];
  let n = 0, p = 0;
  w.split(/\s+/).forEach(word => { if (neg.includes(word)) n++; if (pos.includes(word)) p++; });
  if (n > p) return { label: "Angry", emoji: "🔴", color: T.red, bg: T.redLight };
  if (p > n) return { label: "Happy", emoji: "🟢", color: T.green, bg: T.greenLight };
  return { label: "Neutral", emoji: "⚖️", color: T.inkMid, bg: T.bg };
};

/* ─── Complaint Auto-Categorization Helper ─── */
const getComplaintCategory = (ticket) => {
  if (!ticket) return "None";
  const text = ((ticket.cancelReason || "") + " " + (ticket.items?.map(i => i.name).join(" ") || "")).toLowerCase();
  if (text.includes("late") || text.includes("delay") || text.includes("slow")) return "Late Delivery";
  if (text.includes("wrong") || text.includes("different") || text.includes("instead")) return "Wrong Item";
  if (text.includes("smell") || text.includes("bad") || text.includes("spoiled") || text.includes("cold")) return "Quality Issue";
  if (text.includes("refund") || text.includes("money") || text.includes("charge")) return "Payment Problem";
  return "Missing Item";
};

/* ─── AI Response Suggestion Templates ─── */
const getAiSuggestions = (sentimentLabel, category) => {
  if (sentimentLabel === "Angry") {
    return [
      "We sincerely apologize for the inconvenience. Let me process an apology refund immediately.",
      "I understand your frustration. I am speaking directly to the delivery rider right now.",
      "This is not the standard we aim for. I am escalating this to our manager."
    ];
  }
  if (category === "Late Delivery") {
    return [
      "Your order is delayed due to high demand. We've added a ₹50 credit to your wallet.",
      "The rider is on the way. You can track them live on the map.",
      "I've contacted the driver. They are arriving in less than 5 minutes."
    ];
  }
  return [
    "Thank you for contacting SeaBite Support. How can I assist you with your order today?",
    "We are processing your request. Please hold on for a moment.",
    "Your satisfaction is our priority. Let me check that order history for you."
  ];
};

/* ─── Canned Response Library ─── */
const CANNED_RESPONSES = [
  { category: "Apology", text: "We are extremely sorry for the delivery lapse. I've initiated a full refund back to your account." },
  { category: "Apology", text: "We apologize for the missing item. We can dispatch a replacement immediately or refund the difference." },
  { category: "Status", text: "I've checked with our warehouse. Your fresh catch is packed and ready to be picked up by the captain." },
  { category: "Status", text: "The delivery partner was delayed due to heavy rain. They will reach you shortly." },
  { category: "Resolution", text: "As a token of apology, we have credited ₹100 SeaBite loyalty coins to your wallet." },
];

export default function SupportDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  /* ── Core State ── */
  const [tickets, setTickets] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [queueStats, setQueueStats] = useState({ pendingCount: 0, inTransitCount: 0, deliveredToday: 0, cancelledToday: 0, avgResolutionMin: 12 });
  const [agentPerformance, setAgentPerformance] = useState({ avgCSAT: "4.8", ticketsResolvedToday: 4, totalCSATResponses: 10 });
  const [issueHeatmap, setIssueHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("queue"); // queue, xray, chat
  const [searchId, setSearchId] = useState("");

  /* ── Order X-Ray & Customer 360 ── */
  const [xrayOrder, setXrayOrder] = useState(null);
  const [customer360, setCustomer360] = useState(null);
  const [internalNotes, setInternalNotes] = useState([]);
  const [newInternalNote, setNewInternalNote] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  /* ── Refund & CSAT ── */
  const [refundAmount, setRefundAmount] = useState("");
  const [refunding, setRefunding] = useState(false);
  const [csatRating, setCsatRating] = useState(5);
  const [csatFeedback, setCsatFeedback] = useState("");

  /* ── Frustration Alerts ── */
  const [frustrations, setFrustrations] = useState([]);

  /* ── Chat ── */
  const [chatRecipient, setChatRecipient] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [recipientTyping, setRecipientTyping] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [sentiment, setSentiment] = useState({ label: "Neutral", emoji: "⚖️", color: T.inkMid, bg: T.bg });
  const [showCannedModal, setShowCannedModal] = useState(false);
  const chatEndRef = useRef(null);

  /* ── Map ── */
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [driverCoords, setDriverCoords] = useState(null);

  /* ── Data Fetching ── */
  const fetchAllData = useCallback(async () => {
    try {
      const [ticketsRes, convRes, statsRes, perfRes, heatmapRes] = await Promise.all([
        axios.get(`${API}/api/support/tickets`, { withCredentials: true }),
        axios.get(`${API}/api/chat/conversations`, { withCredentials: true }),
        axios.get(`${API}/api/support/queue-stats`, { withCredentials: true }).catch(() => ({ data: {} })),
        axios.get(`${API}/api/support/agent-stats`, { withCredentials: true }).catch(() => ({ data: {} })),
        axios.get(`${API}/api/support/issue-heatmap`, { withCredentials: true }).catch(() => ({ data: { categories: [] } }))
      ]);

      setTickets(ticketsRes.data || []);
      setConversations(convRes.data || []);
      setQueueStats(statsRes.data || { pendingCount: 0, inTransitCount: 0, deliveredToday: 0, cancelledToday: 0, avgResolutionMin: 12 });
      setAgentPerformance(perfRes.data || { avgCSAT: "4.8", ticketsResolvedToday: 4, totalCSATResponses: 10 });
      setIssueHeatmap(heatmapRes.data?.categories || []);
    } catch (err) {
      console.error("Failed to fetch support console data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  /* ── Auto-refresh ── */
  useEffect(() => {
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  /* ── Leaflet Scripts Load ── */
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    document.head.appendChild(script);
    return () => {
      try {
        document.head.removeChild(link);
        document.head.removeChild(script);
      } catch (e) {}
    };
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
          html: `<div style="width:28px;height:28px;border-radius:50%;background:${T.accent};display:flex;align-items:center;justify-content:center;color:white;font-size:14px;box-shadow:0 2px 8px rgba(59,130,246,0.4)">🛵</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      }).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng([coords.lat, coords.lng]);
    }
    mapRef.current.panTo([coords.lat, coords.lng]);
  };

  /* ── Socket Listeners ── */
  useEffect(() => {
    if (!socket || !user) return;
    
    // Join personal agent room and shared support rooms
    socket.emit("join-chat", { userId: user.id || user._id });
    if (user.role === "support" || user.role === "admin") {
      socket.emit("join-chat", { userId: "support-agent" });
      socket.emit("join-chat", { userId: "support" });
    }

    const handleFrustration = (data) => {
      setFrustrations(prev => [{ ...data, time: new Date() }, ...prev].slice(0, 15));
      try { new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-600.wav").play(); } catch(e) {}
      toast.error(`⚠️ Alert: Customer frustration detected!`, { duration: 4000 });
    };

    const handleLocation = (data) => {
      if (xrayOrder && xrayOrder.deliveryPartner === data.driverId) {
        setDriverCoords(data.location);
        updateMapMarker(data.location);
      }
    };

    const handleChat = (msg) => {
      const rid = chatRecipient ? (chatRecipient._id || chatRecipient.id) : null;
      const uid = user ? (user._id || user.id) : null;

      const isFromActiveRecipient = rid && msg.sender === rid;
      const isToActiveRecipient = rid && msg.recipient === rid;
      const isFromSelf = uid && msg.sender === uid;

      if (isFromActiveRecipient || (isFromSelf && isToActiveRecipient)) {
        setChatMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        setSentiment(analyzeSentiment(msg.message));
      }

      // Always update conversation list
      fetchAllData();

      if (msg.senderRole === "user" && msg.sender !== rid) {
        toast.success(`New message from customer: ${msg.message.substring(0, 30)}...`, { duration: 4000 });
        try { new Audio("https://assets.mixkit.co/active_storage/sfx/911/911-600.wav").play(); } catch(e) {}
      }
    };

    const handleTyping = (data) => {
      const rid = chatRecipient ? (chatRecipient._id || chatRecipient.id) : null;
      if (rid && data.sender === rid && data.senderRole === "user") {
        setRecipientTyping(data.isTyping);
      }
    };

    const handleOrderPlaced = () => { fetchAllData(); };

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
  }, [socket, user, xrayOrder, chatRecipient, fetchAllData]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  /* ── Escalation Alert check ── */
  const checkEscalatedStatus = (order) => {
    if (!order) return false;
    const durationMin = Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000);
    return durationMin >= 15 || sentiment.label === "Angry";
  };

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

      // Fetch Customer 360 profile
      if (data.user?._id || data.user?.id) {
        const profileRes = await axios.get(`${API}/api/support/customer-profile/${data.user._id || data.user.id}`, { withCredentials: true });
        setCustomer360(profileRes.data);
      }

      // Fetch Internal notes
      const notesRes = await axios.get(`${API}/api/support/notes/${data._id}`, { withCredentials: true });
      setInternalNotes(notesRes.data || []);

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
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Refund failed");
    } finally {
      setRefunding(false);
    }
  };

  const submitInternalNote = async () => {
    if (!newInternalNote.trim() || !xrayOrder) return;
    try {
      const { data } = await axios.post(`${API}/api/support/notes`, {
        orderId: xrayOrder._id,
        note: newInternalNote
      }, { withCredentials: true });
      setInternalNotes(data.notes || []);
      setNewInternalNote("");
      toast.success("Internal note added");
    } catch {
      toast.error("Failed to add internal note");
    }
  };

  const submitCSATScore = async () => {
    if (!xrayOrder) return;
    try {
      await axios.post(`${API}/api/support/csat`, {
        orderId: xrayOrder._id,
        score: csatRating,
        feedback: csatFeedback
      }, { withCredentials: true });
      toast.success("CSAT rating submitted");
      setCsatFeedback("");
      lookupOrder(xrayOrder._id);
      fetchAllData();
    } catch {
      toast.error("Failed to submit CSAT");
    }
  };

  // Poll chat history if socket is disabled or offline
  useEffect(() => {
    const recipient = chatRecipient || xrayOrder?.user;
    if (!recipient || (activeView !== "chat" && activeView !== "xray")) return;
    const rid = recipient._id || recipient.id;
    if (!rid) return;

    const fetchHistory = () => {
      axios.get(`${API}/api/chat/history/${rid}`, { withCredentials: true })
        .then((r) => {
          setChatMessages(r.data || []);
          const lastCustomerMsg = [...(r.data || [])].reverse().find(m => m.senderRole === "user");
          if (lastCustomerMsg) setSentiment(analyzeSentiment(lastCustomerMsg.message));
        })
        .catch(() => {});
    };

    if (!socket) {
      const interval = setInterval(fetchHistory, 3000);
      return () => clearInterval(interval);
    }
  }, [chatRecipient, xrayOrder, activeView, socket]);

  const openChat = (recipient) => {
    setChatRecipient(recipient);
    setChatMessages([]);
    setSentiment({ label: "Neutral", emoji: "⚖️", color: T.inkMid, bg: T.bg });
    setActiveView("chat");
    const rid = recipient?._id || recipient?.id;
    if (rid) {
      axios.get(`${API}/api/chat/history/${rid}`, { withCredentials: true })
        .then(r => {
          setChatMessages(r.data || []);
          const lastCustomerMsg = [...(r.data || [])].reverse().find(m => m.senderRole === "user");
          if (lastCustomerMsg) setSentiment(analyzeSentiment(lastCustomerMsg.message));
        })
        .catch(() => {});
    }
  };

  const handleAgentTypingChange = (e) => {
    setChatInput(e.target.value);
    const recipient = chatRecipient || xrayOrder?.user;
    if (!socket || !user || !recipient) return;

    const rid = recipient._id || recipient.id;

    if (!agentTyping && e.target.value.length > 0) {
      setAgentTyping(true);
      socket.emit("typing", { sender: user.id || user._id, recipient: rid, isTyping: true, senderRole: "support" });
    } else if (agentTyping && e.target.value.length === 0) {
      setAgentTyping(false);
      socket.emit("typing", { sender: user.id || user._id, recipient: rid, isTyping: false, senderRole: "support" });
    }
  };

  const sendMessage = async (customText = null) => {
    const textToSend = customText || chatInput;
    const recipient = chatRecipient || xrayOrder?.user;
    if (!textToSend.trim() || !recipient) return;
    if (!customText) setChatInput("");

    try {
      const { data } = await axios.post(`${API}/api/chat/message`, {
        recipient: recipient._id || recipient.id,
        message: textToSend,
        senderRole: "support",
        recipientRole: recipient.role || "user"
      }, { withCredentials: true });

      // Add locally if socket is disabled (since socket won't bounce it back)
      if (!socket) {
        setChatMessages((prev) => [...prev, data]);
      }

      if (socket) {
        const rid = recipient._id || recipient.id;
        socket.emit("typing", { sender: user.id || user._id, recipient: rid, isTyping: false, senderRole: "support" });
      }
      setAgentTyping(false);
    } catch {
      toast.error("Failed to send message");
    }
  };

  const requestScreenShare = () => {
    const shareLink = `https://seabite.com/cobrowse/session-${Math.random().toString(36).substring(7)}`;
    toast.success("Generated shareable co-browsing token!");
    sendMessage(`I have generated a secure co-browsing link to guide you. Please click here to share your screen: ${shareLink}`);
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

  if (loading && tickets.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: T.bg }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${T.border}`, borderTopColor: T.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
          <p style={{ marginTop: 16, color: T.inkMid, fontSize: 13 }}>Connecting to resolution queue...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Inter', 'DM Sans', sans-serif" }}>
      
      {/* ═══ HEADER ═══ */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: "16px 24px", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: T.ink, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22 }}>🎧</span> CS Control Room
            </h1>
            <p style={{ fontSize: 11, color: T.inkLight, margin: "2px 0 0", fontWeight: 500 }}>
              Agent Mode • NPS average {agentPerformance.avgCSAT}★
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={fetchAllData} style={{ padding: 8, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, cursor: "pointer", color: T.inkMid, display: "flex" }}>
              <FiRefreshCw size={16} />
            </button>
            <select value="support" onChange={e => { if (e.target.value === "admin") navigate("/admin/dashboard"); if (e.target.value === "driver") navigate("/driver"); }}
              style={{ padding: "8px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12, fontWeight: 600, color: T.inkMid, cursor: "pointer" }}>
              <option value="admin">🏢 Admin</option>
              <option value="driver">🛵 Driver</option>
              <option value="support">🎧 Support</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 24 }}>
        
        {/* ═══ TIER 2: QUEUE & PERFORMANCE MONITOR ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Pending Tickets", value: queueStats.pendingCount, icon: <FiClock />, color: T.orange, bg: T.orangeLight },
            { label: "Active In-Transit", value: queueStats.inTransitCount, icon: <FiTruck />, color: T.accent, bg: T.accentLight },
            { label: "Resolved Today", value: queueStats.deliveredToday, icon: <FiCheckCircle />, color: T.green, bg: T.greenLight },
            { label: "Avg Resolution Time", value: `${queueStats.avgResolutionMin} mins`, icon: <FiActivity />, color: T.purple, bg: T.purpleLight },
            { label: "My Avg CSAT", value: `${agentPerformance.avgCSAT} ★`, icon: <FiStar />, color: "#F59E0B", bg: "#FEF3C7" }
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

        {/* ═══ SEARCH & SCAN BAR ═══ */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <FiSearch size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.inkLight }} />
            <input type="text" placeholder="Search customer ID or Order MongoDB ID..." value={searchId}
              onChange={e => setSearchId(e.target.value)} onKeyDown={e => e.key === "Enter" && lookupOrder()}
              style={{ width: "100%", paddingLeft: 42, paddingRight: 14, padding: "12px 14px 12px 42px", border: `1px solid ${T.border}`, borderRadius: 14, fontSize: 13, outline: "none", background: T.card }} />
          </div>
          <button onClick={() => lookupOrder()}
            style={{ padding: "12px 24px", background: T.accent, color: "white", border: "none", borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <FiEye size={14} style={{ marginRight: 6, verticalAlign: "middle" }} /> Order X-Ray
          </button>
        </div>

        {/* ═══ MAIN WORKSPACE ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 24 }}>
          
          {/* LEFT SIDEBAR: ACTIVE TICKETS & CHANNELS */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            
            {/* Frustration Ticker */}
            {frustrations.length > 0 && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16 }}>
                <h3 style={{ fontSize: 12, fontWeight: 800, color: T.red, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <FiAlertCircle className="animate-pulse" /> Live Rage-Click Alerts
                </h3>
                <div style={{ maxHeight: 120, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                  {frustrations.map((f, i) => (
                    <div key={i} style={{ padding: 10, background: T.redLight, borderRadius: 10, fontSize: 11 }}>
                      <div style={{ fontWeight: 700, color: T.red }}>{f.msg}</div>
                      <div style={{ color: T.inkLight, fontSize: 9, marginTop: 2 }}>{f.userId || "Guest"} • {f.time ? formatTime(f.time) : "Just now"}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Issue Category Heatmap */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16 }}>
              <h3 style={{ fontSize: 12, fontWeight: 800, color: T.ink, marginBottom: 12 }}>📊 Issue Categories Heatmap</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {issueHeatmap.map((item, idx) => (
                  <div key={idx}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: T.inkMid }}>{item.label}</span>
                      <span style={{ fontWeight: 700, color: T.ink }}>{item.count}</span>
                    </div>
                    <div style={{ height: 6, background: T.bg, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, (item.count / 10) * 100)}%`, height: "100%", background: item.color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Orders list / Tickets Queue */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: 16, borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: T.ink, margin: 0 }}>Resolution Queue</h3>
                <span style={{ fontSize: 11, color: T.inkLight, fontWeight: 600 }}>{tickets.length} unresolved</span>
              </div>
              <div style={{ maxHeight: 400, overflowY: "auto" }}>
                {tickets.map(ticket => {
                  const sc = statusColor(ticket.status);
                  const isAngry = checkEscalatedStatus(ticket);
                  const isSel = selectedTicketId === ticket._id;

                  return (
                    <div 
                      key={ticket._id} 
                      onClick={() => {
                        setSelectedTicketId(ticket._id);
                        setXrayOrder(ticket);
                        setActiveView("xray");
                        setDriverCoords(null);
                        mapRef.current = null; markerRef.current = null;
                        setTimeout(() => initMap(16.5449, 81.5212), 500);
                        lookupOrder(ticket._id);
                      }}
                      style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}`, cursor: "pointer", transition: "all 0.15s", background: isSel ? T.accentLight : "transparent" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: T.ink }}>#{ticket.orderId}</span>
                        <div style={{ display: "flex", gap: 4 }}>
                          {isAngry && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: T.redLight, color: T.red }}>🔥 ANGRY</span>}
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: sc.bg, color: sc.color }}>{ticket.status}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: T.inkMid }}>{ticket.user?.name || "Guest"}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>₹{ticket.totalAmount}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, fontSize: 10, color: T.inkLight }}>
                        <span>📍 {getComplaintCategory(ticket)}</span>
                        <span>{formatDate(ticket.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Conversations list (with channel badges) */}
            {conversations.length > 0 && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
                <div style={{ padding: 16, borderBottom: `1px solid ${T.border}` }}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: T.ink, margin: 0 }}>Live Dialog Conversations</h3>
                </div>
                {conversations.map((conv, i) => (
                  <div key={i} onClick={() => openChat(conv.user)}
                    style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.accentLight, color: T.accent, display: "flex", alignItems: "center", justifyCenter: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {conv.user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>{conv.user?.name}</span>
                        <span style={{ fontSize: 9, color: T.purple, background: T.purpleLight, padding: "2px 6px", borderRadius: 4 }}>In-App Chat</span>
                      </div>
                      <div style={{ fontSize: 11, color: T.inkLight, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{conv.lastMessage}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* RIGHT VIEWWORKSPACE */}
          <div>
            <AnimatePresence mode="wait">
              
              {/* Order X-Ray Diagnostics View */}
              {activeView === "xray" && xrayOrder ? (
                <motion.div key="xray" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
                  
                  {/* Left Column: Diagnostics details */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    
                    {/* Order Meta details */}
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.border}`, paddingBottom: 16, marginBottom: 16 }}>
                        <div>
                          <h3 style={{ fontSize: 16, fontWeight: 800, color: T.ink, margin: 0 }}>Order X-Ray #{xrayOrder.orderId}</h3>
                          <span style={{ fontSize: 11, color: T.inkLight }}>Auto-Category: <b>{getComplaintCategory(xrayOrder)}</b></span>
                        </div>
                        {checkEscalatedStatus(xrayOrder) && (
                          <span style={{ background: T.redLight, color: T.red, fontWeight: 800, fontSize: 10, padding: "4px 10px", borderRadius: 8 }}>🚨 ESCALATED</span>
                        )}
                      </div>

                      {/* Customer Address & Items */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                        <div>
                          <span style={{ fontSize: 11, color: T.inkLight, textTransform: "uppercase", fontWeight: 700 }}>Drop Address</span>
                          <div style={{ fontSize: 13, color: T.ink, marginTop: 4 }}>{formatAddress(xrayOrder.shippingAddress)}</div>
                        </div>
                        <div>
                          <span style={{ fontSize: 11, color: T.inkLight, textTransform: "uppercase", fontWeight: 700 }}>Items ordered</span>
                          {xrayOrder.items?.map((item, idx) => (
                            <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, borderBottom: `1px solid ${T.bg}` }}>
                              <span>{item.name} x {item.qty}</span>
                              <span style={{ fontWeight: 700 }}>₹{item.price * item.qty}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Refund apologies */}
                      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
                        <span style={{ fontSize: 11, color: T.inkLight, textTransform: "uppercase", fontWeight: 700 }}>Compensation apology control</span>
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <input type="number" placeholder="₹ Amount" value={refundAmount} onChange={e => setRefundAmount(e.target.value)}
                            style={{ width: 100, padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 13, outline: "none" }} />
                          <button onClick={processRefund} disabled={refunding}
                            style={{ flex: 1, padding: "10px 0", background: T.accent, color: "white", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                            {refunding ? "Processing..." : "Issue Apology Refund"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Customer 360 Profile details */}
                    {customer360 && (
                      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 16 }}>👤 Customer 360° Profile</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                          <div>
                            <span style={{ fontSize: 10, color: T.inkLight }}>Loyalty Tier</span>
                            <div style={{ fontSize: 14, fontWeight: 800, color: T.purple }}>{customer360.loyaltyTier}</div>
                          </div>
                          <div>
                            <span style={{ fontSize: 10, color: T.inkLight }}>Lifetime Spend</span>
                            <div style={{ fontSize: 14, fontWeight: 800, color: T.green }}>₹{customer360.lifetimeSpend}</div>
                          </div>
                          <div>
                            <span style={{ fontSize: 10, color: T.inkLight }}>Total Orders</span>
                            <div style={{ fontSize: 14, fontWeight: 800 }}>{customer360.totalOrders}</div>
                          </div>
                          <div>
                            <span style={{ fontSize: 10, color: T.inkLight }}>Past Complaints</span>
                            <div style={{ fontSize: 14, fontWeight: 800, color: T.red }}>{customer360.complaints} issues</div>
                          </div>
                        </div>

                        {/* Recent orders */}
                        <div>
                          <span style={{ fontSize: 11, color: T.inkLight, fontWeight: 700 }}>Recent Order History</span>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                            {customer360.recentOrders?.map((ro, i) => (
                              <div key={i} style={{ display: "flex", justifyBetween: "space-between", justifyContent: "space-between", fontSize: 12, padding: "6px 8px", background: T.bg, borderRadius: 8 }}>
                                <span>#{ro.orderId} ({ro.status})</span>
                                <span style={{ fontWeight: 700 }}>₹{ro.total}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Right Column: Live GPS & Chat Suggestions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    
                    {/* Live Rider GPS Geolocation Map */}
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16 }}>
                      <h4 style={{ fontSize: 12, fontWeight: 800, color: T.ink, marginBottom: 8 }}>Live Rider GPS Navigation</h4>
                      <div id="cs-map" style={{ height: 180, borderRadius: 12, background: T.bg, overflow: "hidden" }} />
                      {driverCoords ? (
                        <span style={{ fontSize: 10, color: T.green, fontWeight: 700, display: "block", marginTop: 8 }}>📡 Rider online coordinates: {driverCoords.lat.toFixed(4)}, {driverCoords.lng.toFixed(4)}</span>
                      ) : (
                        <span style={{ fontSize: 10, color: T.inkLight, display: "block", marginTop: 8 }}>Waiting for driver GPS streams...</span>
                      )}
                    </div>

                    {/* Internal Notes Notepad (Private) */}
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16 }}>
                      <h4 style={{ fontSize: 12, fontWeight: 800, color: T.ink, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><FiEdit2 size={13} /> Internal Private Notes (Agents Only)</h4>
                      <div style={{ maxHeight: 110, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                        {internalNotes.length === 0 && <span style={{ fontSize: 11, color: T.inkLight, italic: "true" }}>No internal notes saved yet.</span>}
                        {internalNotes.map((n, i) => (
                          <div key={i} style={{ background: T.bg, padding: 8, borderRadius: 8, fontSize: 11 }}>
                            <div style={{ fontWeight: 700 }}>{n.agentName}</div>
                            <div style={{ color: T.inkMid }}>{n.note}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <input value={newInternalNote} onChange={e => setNewInternalNote(e.target.value)} placeholder="Add private audit note..."
                          style={{ flex: 1, padding: "8px 12px", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, outline: "none" }} />
                        <button onClick={submitInternalNote} style={{ padding: "8px 12px", background: T.ink, color: "white", border: "none", borderRadius: 8, fontSize: 11, cursor: "pointer" }}>Add</button>
                      </div>
                    </div>

                    {/* Live chat with auto templates suggestions */}
                    {xrayOrder.user && (
                      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", minHeight: 300 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <h4 style={{ fontSize: 12, fontWeight: 800, color: T.ink, margin: 0 }}>💬 Live Chat</h4>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: sentiment.bg, color: sentiment.color }}>
                            {sentiment.emoji} {sentiment.label}
                          </span>
                        </div>

                        {/* Suggestions panel */}
                        <div style={{ background: T.accentLight, padding: 10, borderRadius: 10, marginBottom: 10 }}>
                          <span style={{ fontSize: 9, color: T.accent, fontWeight: 800, display: "block", marginBottom: 6 }}>💡 AI AUTO-REPLY SUGGESTIONS</span>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {getAiSuggestions(sentiment.label, getComplaintCategory(xrayOrder)).map((sug, i) => (
                              <button key={i} onClick={() => sendMessage(sug)}
                                style={{ textAlign: "left", fontSize: 10, color: T.ink, background: "white", border: `1px solid ${T.border}`, padding: "6px 8px", borderRadius: 6, cursor: "pointer", transition: "all 0.15s" }}>
                                {sug}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Messages Area */}
                        <div style={{ flex: 1, overflowY: "auto", padding: 10, background: T.bg, borderRadius: 10, display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                          {chatMessages.length === 0 && <span style={{ fontSize: 11, color: T.inkLight, textAlign: "center", marginTop: 20 }}>Send a greeting to start resolving.</span>}
                          {chatMessages.map((msg, i) => {
                            const self = msg.sender === (user.id || user._id);
                            return (
                              <div key={i} style={{ display: "flex", justifyContent: self ? "flex-end" : "flex-start" }}>
                                <div style={{ maxWidth: "80%", padding: "8px 12px", borderRadius: 12, fontSize: 12,
                                  background: self ? T.accent : T.card, color: self ? "white" : T.ink, border: self ? "none" : `1px solid ${T.border}` }}>
                                  {msg.message}
                                </div>
                              </div>
                            );
                          })}
                          <div ref={chatEndRef} />
                        </div>

                        {/* Controls */}
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setShowCannedModal(true)} style={{ padding: 10, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, cursor: "pointer" }} title="Canned library"><FiBookOpen size={14} /></button>
                          <button onClick={requestScreenShare} style={{ padding: 10, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, cursor: "pointer" }} title="Request Screen Share"><FiShare2 size={14} /></button>
                          <input value={chatInput} onChange={handleAgentTypingChange} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Response chat..."
                            style={{ flex: 1, padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12, outline: "none" }} />
                          <button onClick={() => sendMessage()} style={{ padding: "10px 14px", background: T.accent, color: "white", border: "none", borderRadius: 10, cursor: "pointer" }}><FiSend size={14} /></button>
                        </div>

                        {/* CSAT Collection Rating trigger */}
                        <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 14, paddingTop: 12 }}>
                          <span style={{ fontSize: 10, color: T.inkLight, fontWeight: 800, display: "block", marginBottom: 6 }}>⭐ RESOLUTION SURVEY RATING</span>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button key={star} onClick={() => setCsatRating(star)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>
                                {star <= csatRating ? "★" : "☆"}
                              </button>
                            ))}
                            <input value={csatFeedback} onChange={e => setCsatFeedback(e.target.value)} placeholder="CSAT remarks..."
                              style={{ flex: 1, padding: "6px 10px", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, outline: "none" }} />
                            <button onClick={submitCSATScore} style={{ padding: "6px 10px", background: T.green, color: "white", border: "none", borderRadius: 8, fontSize: 11, cursor: "pointer" }}>Submit CSAT</button>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                </motion.div>
              ) : activeView === "chat" && chatRecipient ? (
                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, display: "flex", flexDirection: "column", height: 500 }}>
                  <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: T.ink, margin: 0 }}>{chatRecipient.name}</h3>
                      <span style={{ fontSize: 11, color: T.inkLight }}>{chatRecipient.email}</span>
                    </div>
                    <button onClick={() => { setActiveView("queue"); setChatRecipient(null); }} style={{ background: T.bg, border: "none", borderRadius: 8, padding: 6, cursor: "pointer" }}><FiX size={16} /></button>
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                    {chatMessages.map((msg, i) => {
                      const self = msg.sender === (user.id || user._id);
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: self ? "flex-end" : "flex-start" }}>
                          <div style={{ maxWidth: "70%", padding: "10px 14px", borderRadius: 14, fontSize: 13, background: self ? T.accent : T.bg, color: self ? "white" : T.ink }}>
                            {msg.message}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>
                  <div style={{ padding: "12px 20px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 8 }}>
                    <input value={chatInput} onChange={handleAgentTypingChange} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Type message..."
                      style={{ flex: 1, padding: "12px 16px", border: `1px solid ${T.border}`, borderRadius: 12, fontSize: 13, outline: "none" }} />
                    <button onClick={() => sendMessage()} style={{ padding: "12px 16px", background: T.accent, color: "white", border: "none", borderRadius: 12, cursor: "pointer" }}><FiSend size={16} /></button>
                  </div>
                </motion.div>
              ) : (
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 60, textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: T.ink, margin: 0 }}>Ready for Diagnostic Scan</h3>
                  <p style={{ fontSize: 13, color: T.inkLight, marginTop: 8 }}>Select an order from the active queue or search directly above to open Order X-Ray.</p>
                </div>
              )}

            </AnimatePresence>
          </div>

        </div>

      </div>

      {/* 📖 CANNED LIBRARY MODAL 📖 */}
      <AnimatePresence>
        {showCannedModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: T.card, borderRadius: 20, padding: 24, maxWidth: 500, width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>📖 Canned Apologies & Status templates</h3>
                <button onClick={() => setShowCannedModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: T.inkLight }}><FiX size={18} /></button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {CANNED_RESPONSES.map((res, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      setChatInput(res.text);
                      setShowCannedModal(false);
                    }}
                    style={{ padding: 12, background: T.bg, borderRadius: 10, border: `1px solid ${T.border}`, cursor: "pointer", hover: { background: T.accentLight } }}
                  >
                    <span style={{ fontSize: 9, fontWeight: 800, color: T.accent, background: T.accentLight, padding: "2px 6px", borderRadius: 4, display: "inline-block", marginBottom: 6 }}>{res.category}</span>
                    <p style={{ fontSize: 12, color: T.inkMid, margin: 0 }}>{res.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
