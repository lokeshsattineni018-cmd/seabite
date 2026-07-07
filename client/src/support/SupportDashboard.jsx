import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  FiSearch, FiInbox, FiActivity, FiDollarSign, FiClock, 
  FiAlertCircle, FiUser, FiInfo, FiCheckCircle, FiSend, FiX, FiSmile
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const API = import.meta.env.VITE_API_URL || "";

// Sentiment Analysis Helper (Advanced Option I)
const evaluateSentiment = (text) => {
  if (!text) return { label: "Neutral ⚖️", color: "text-stone-500 bg-stone-100 border-stone-200" };
  const words = text.toLowerCase().split(" ");
  
  const negativeWords = ["angry", "bad", "late", "delay", "slow", "terrible", "waste", "worst", "spill", "cold", "refund", "ruined", "hate"];
  const positiveWords = ["happy", "great", "thanks", "thank", "awesome", "perfect", "good", "fast", "love", "fresh", "sweet", "nice"];
  
  let negCount = 0;
  let posCount = 0;
  
  words.forEach(word => {
    if (negativeWords.includes(word)) negCount++;
    if (positiveWords.includes(word)) posCount++;
  });

  if (negCount > posCount) {
    return { label: "Angry 🔴", color: "text-rose-700 bg-rose-50 border-rose-200" };
  } else if (posCount > negCount) {
    return { label: "Satisfied 🟢", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  }
  return { label: "Neutral ⚖️", color: "text-stone-500 bg-stone-100 border-stone-200" };
};

export default function SupportDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [tickets, setTickets] = useState([]);
  const [searchId, setSearchId] = useState("");
  const [xrayOrder, setXrayOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  // ── Option H: Frustration Ticker ──
  const [frustrations, setFrustrations] = useState([]);

  // ── Option I: Live Support Chat ──
  const [activeChatRecipient, setActiveChatRecipient] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [recipientIsTyping, setRecipientIsTyping] = useState(false);
  const [customerSentiment, setCustomerSentiment] = useState({ label: "Neutral ⚖️", color: "text-stone-500 bg-stone-100" });

  // ── Option B: Live Leaflet Driver Tracker Map ──
  const mapRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const [driverLatLng, setDriverLatLng] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  // Inject Leaflet Scripts
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
      document.head.removeChild(link);
      document.head.removeChild(script);
    };
  }, []);

  // Socket Connections (Frustrations, Locations, Chat)
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit("join-chat", { userId: user.id || user._id });

    // Option H: Rage-click/Frustration telemetry
    const handleFrustration = (data) => {
      // Add frustration alert to list
      setFrustrations(prev => [data, ...prev].slice(0, 10)); // Keep last 10
      toast.error(`⚠️ Alert: customer experiencing issues!`, { duration: 5000 });
      // Play warning sound
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-600.wav");
      audio.play().catch(e => console.log("Sound error:", e));
    };

    // Option A: Live coordinate stream from driver
    const handleLocationStream = (data) => {
      const { driverId, location } = data;
      // If we are currently diagnosing an order with this driver
      if (xrayOrder && xrayOrder.deliveryPartner === driverId) {
        setDriverLatLng(location);
        updateDriverMarkerOnMap(location);
      }
    };

    // Option I: Chat receiver
    const handleIncomingMessage = (msg) => {
      if (activeChatRecipient && (msg.sender === activeChatRecipient._id || msg.sender === activeChatRecipient.id)) {
        setChatMessages(prev => [...prev, msg]);
        
        // Dynamic sentiment calculation in real-time
        setCustomerSentiment(evaluateSentiment(msg.message));
      } else {
        toast.success(`New support message: ${msg.message}`);
      }
    };

    const handleTypingIndicator = (data) => {
      if (activeChatRecipient && data.sender === (activeChatRecipient._id || activeChatRecipient.id)) {
        setRecipientIsTyping(data.isTyping);
      }
    };

    socket.on("FRUSTRATION_EVENT", handleFrustration);
    socket.on("DRIVER_LOCATION_STREAM", handleLocationStream);
    socket.on("chat-message", handleIncomingMessage);
    socket.on("typing-indicator", handleTypingIndicator);

    return () => {
      socket.off("FRUSTRATION_EVENT", handleFrustration);
      socket.off("DRIVER_LOCATION_STREAM", handleLocationStream);
      socket.off("chat-message", handleIncomingMessage);
      socket.off("typing-indicator", handleTypingIndicator);
    };
  }, [socket, user, xrayOrder, activeChatRecipient]);

  // Leaflet Map Init/Update
  const initLeafletMap = (lat, lng) => {
    if (!window.L || mapRef.current) return;
    const L = window.L;

    const map = L.map("support-driver-map", {
      zoomControl: false,
      attributionControl: false
    }).setView([lat, lng], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
    mapRef.current = map;
  };

  const updateDriverMarkerOnMap = (coords) => {
    if (!window.L || !mapRef.current) return;
    const L = window.L;

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = L.marker([coords.lat, coords.lng], {
        icon: L.icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/3180/3180209.png",
          iconSize: [35, 35]
        })
      }).addTo(mapRef.current);
    } else {
      driverMarkerRef.current.setLatLng([coords.lat, coords.lng]);
    }
    mapRef.current.panTo([coords.lat, coords.lng]);
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/support/tickets`, { withCredentials: true });
      setTickets(data || []);
    } catch (err) {
      toast.error("Failed to load tickets queue");
    } finally {
      setLoading(false);
    }
  };

  const handleOrderLookup = async (id = searchId) => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/support/order/${id}`, { withCredentials: true });
      setXrayOrder(data);
      
      // Initialize map with default center if driver is not online yet
      setDriverLatLng(null);
      setTimeout(() => {
        initLeafletMap(16.5449, 81.5212);
      }, 500);

    } catch (err) {
      toast.error("Order lookup failed. Verify ID.");
      setXrayOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!xrayOrder) return;
    if (!refundAmount || isNaN(refundAmount) || Number(refundAmount) <= 0) {
      toast.error("Enter a valid refund amount");
      return;
    }

    setRefunding(true);
    try {
      const { data } = await axios.post(`${API}/api/support/refund`, {
        orderId: xrayOrder._id,
        amount: Number(refundAmount)
      }, { withCredentials: true });

      toast.success(data.message || "Refund issued successfully!");
      setRefundAmount("");
      handleOrderLookup(xrayOrder._id);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to process refund";
      toast.error(msg);
    } finally {
      setRefunding(false);
    }
  };

  // Open Chat Room Workspace
  const openChatWith = (recipient) => {
    setActiveChatRecipient(recipient);
    setChatMessages([]);
    setCustomerSentiment({ label: "Neutral ⚖️", color: "text-stone-500 bg-stone-100 border-stone-200" });

    // Load Chat logs
    axios.get(`${API}/api/chat/history/${recipient._id || recipient.id}`, { withCredentials: true })
      .then(res => {
        setChatMessages(res.data || []);
      })
      .catch(() => toast.error("Failed to load chat history"));
  };

  const sendChatMessage = () => {
    if (!newMessage.trim() || !socket || !user || !activeChatRecipient) return;

    socket.emit("send-chat-message", {
      sender: user.id || user._id,
      recipient: activeChatRecipient._id || activeChatRecipient.id,
      message: newMessage,
      senderRole: "support",
      recipientRole: activeChatRecipient.role || "user"
    });

    setNewMessage("");
    socket.emit("typing", { sender: user.id || user._id, recipient: activeChatRecipient._id || activeChatRecipient.id, isTyping: false });
    setIsTyping(false);
  };

  const handleTypingChange = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !activeChatRecipient || !user) return;

    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      socket.emit("typing", { sender: user.id || user._id, recipient: activeChatRecipient._id || activeChatRecipient.id, isTyping: true });
    } else if (isTyping && e.target.value.length === 0) {
      setIsTyping(false);
      socket.emit("typing", { sender: user.id || user._id, recipient: activeChatRecipient._id || activeChatRecipient.id, isTyping: false });
    }
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-stone-50 to-white text-stone-900 font-sans p-4 md:p-8">
      {/* Support Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            🎧 Customer Support Portal
          </h1>
          <p className="text-sm text-stone-500 mt-1">Order Resolution, Diagnostics, and Compensation Controls</p>
        </div>
        <div className="relative">
          <select
            value="support"
            onChange={(e) => {
              const val = e.target.value;
              if (val === "admin") navigate("/admin/dashboard");
              if (val === "driver") navigate("/driver");
            }}
            className="bg-stone-100 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-800 focus:outline-none cursor-pointer hover:bg-stone-200/60 transition-colors"
          >
            <option value="admin">🏢 Admin Dashboard</option>
            <option value="driver">🛵 Driver Dashboard</option>
            <option value="support">🎧 Support Dashboard</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Tickets Queue & Frustration Ticker (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* ── OPTION H: CUSTOMER FRUSTRATION TICKER ── */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-sm font-bold mb-3 flex items-center gap-1.5 text-rose-600">
              <FiActivity className="animate-pulse" /> Live Frustration Ticker
            </h2>
            <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1">
              {frustrations.length === 0 ? (
                <p className="text-[10px] text-stone-400 italic">No checkout or navigation issues detected.</p>
              ) : (
                frustrations.map((f, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2 text-[10px]">
                    <FiAlertCircle className="text-rose-500 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-800">{f.msg}</p>
                      <p className="text-stone-400 mt-0.5">User ID: {f.userId || "Guest"}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm flex flex-col">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FiInbox className="text-stone-700" /> Active Resolution Queue
            </h2>

            <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1">
              {tickets.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <FiInfo className="mx-auto mb-2" size={24} />
                  <p className="text-xs">No active tickets requiring resolution.</p>
                </div>
              ) : (
                tickets.map(ticket => (
                  <div 
                    key={ticket._id}
                    onClick={() => {
                      setSelectedTicketId(ticket._id);
                      setXrayOrder(ticket);
                      openChatWith(ticket.user || { _id: "guest-user", name: "Guest User", role: "user" });
                    }}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${selectedTicketId === ticket._id ? "bg-stone-50 border-stone-800 shadow-sm" : "bg-white border-stone-150 hover:bg-stone-50"}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold font-mono text-stone-600">#{ticket.orderId}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold uppercase">
                        {ticket.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold mt-2 flex items-center gap-1.5">
                      <FiUser size={12} /> {ticket.user?.name || "Guest User"}
                    </h4>
                    <p className="text-[10px] text-stone-500 mt-1">Total Order Value: ₹{ticket.totalAmount}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Order X-Ray diagnostics & Live Chat (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Diagnostic Search Input */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FiActivity className="text-rose-500 animate-pulse" /> Order X-Ray diagnostics
            </h2>
            <div className="flex gap-3">
              <div className="relative flex-grow">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Paste order MongoDB ID or Order ID here..."
                  value={searchId}
                  onChange={e => setSearchId(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs outline-none focus:bg-white focus:border-stone-800 transition-all"
                />
              </div>
              <button 
                onClick={() => handleOrderLookup()}
                className="px-6 py-3 bg-stone-900 hover:bg-stone-850 text-white font-bold text-xs rounded-2xl transition-all shadow-sm"
              >
                Scan Order
              </button>
            </div>
          </div>

          {/* Diagnostic details */}
          <AnimatePresence mode="wait">
            {xrayOrder ? (
              <motion.div 
                key="diagnostics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Stepper timeline & Map details */}
                <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex justify-between items-start border-b pb-4">
                    <div>
                      <h3 className="text-base font-extrabold">Order #{xrayOrder.orderId}</h3>
                      <p className="text-[10px] text-stone-400 mt-0.5">Database ID: {xrayOrder._id}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-rose-500">₹{xrayOrder.totalAmount}</span>
                    </div>
                  </div>

                  {/* ── OPTION B: LIVE GEOLOCATION MAP ── */}
                  <div>
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Rider Live Navigation</h4>
                    <div 
                      id="support-driver-map" 
                      className="bg-stone-50 border border-stone-200 rounded-2xl h-48 relative overflow-hidden z-10"
                    />
                    {driverLatLng ? (
                      <p className="text-[9px] text-emerald-600 font-bold mt-1.5">📡 Rider streaming coordinates: {driverLatLng.lat.toFixed(4)}, {driverLatLng.lng.toFixed(4)}</p>
                    ) : (
                      <p className="text-[9px] text-stone-400 italic mt-1.5">Waiting for rider GPS to begin streaming...</p>
                    )}
                  </div>

                  {/* Compensation controls */}
                  <div className="border-t pt-4">
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Support Compensations</h4>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder="Amount" 
                        value={refundAmount}
                        onChange={e => setRefundAmount(e.target.value)}
                        className="w-full max-w-[120px] px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-stone-850"
                      />
                      <button 
                        onClick={handleProcessRefund}
                        disabled={refunding}
                        className="flex-grow py-2 bg-stone-900 hover:bg-stone-850 text-white text-xs font-bold rounded-xl disabled:opacity-50"
                      >
                        {refunding ? "Processing..." : "Refund Apology"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── OPTION I: LIVE CHAT CENTER WITH SENTIMENT ANALYSIS ── */}
                <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm flex flex-col h-[400px]">
                  <div className="flex justify-between items-center border-b pb-3 mb-3">
                    <h4 className="text-xs font-extrabold flex items-center gap-1.5">
                      💬 Customer Chat
                    </h4>
                    {/* Real-time Sentiment analysis display */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] border font-bold uppercase tracking-wider ${customerSentiment.color}`}>
                      {customerSentiment.label}
                    </span>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-grow overflow-y-auto space-y-2 pr-1 bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                    {chatMessages.length === 0 ? (
                      <p className="text-[10px] text-stone-400 italic text-center py-10">No messages. Support session initialized.</p>
                    ) : (
                      chatMessages.map((msg, i) => {
                        const isSelf = msg.sender === (user.id || user._id);
                        return (
                          <div key={i} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                            <div className={`p-2.5 rounded-2xl max-w-[85%] text-[11px] shadow-sm ${isSelf ? "bg-stone-900 text-white rounded-tr-none" : "bg-white border border-stone-150 rounded-tl-none text-stone-800"}`}>
                              <p>{msg.message}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    {recipientIsTyping && (
                      <span className="text-[9px] text-stone-400 italic block mt-1 animate-pulse">Customer typing...</span>
                    )}
                  </div>

                  {/* Input controls */}
                  <div className="mt-3 flex gap-2 pt-2 border-t">
                    <input 
                      type="text" 
                      placeholder="Type apology note or instructions..."
                      value={newMessage}
                      onChange={handleTypingChange}
                      onKeyDown={e => e.key === "Enter" && sendChatMessage()}
                      className="flex-grow px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-stone-850 transition-all"
                    />
                    <button 
                      onClick={sendChatMessage}
                      className="px-3 bg-stone-900 hover:bg-stone-855 text-white rounded-xl active:scale-95 transition-all"
                    >
                      Send
                    </button>
                  </div>
                </div>

              </motion.div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center text-stone-400 shadow-sm">
                <FiActivity className="mx-auto mb-3" size={32} />
                <p className="text-sm font-semibold">Ready for Diagnostic Scan</p>
                <p className="text-xs mt-1">Select an order from the queue or search directly to display full diagnostics.</p>
              </div>
            )}
          </AnimatePresence>

        </div>

      </div>
    </div>
  );
}
