import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { FiSend, FiX, FiMessageSquare } from "react-icons/fi";

const API = import.meta.env.VITE_API_URL || "";

export default function SupportWidget() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("whatsapp"); // whatsapp, livechat
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [agentIsTyping, setAgentIsTyping] = useState(false);

  const phoneNumber = "9866635566"; 
  const whatsappMessage = "Hi SeaBite! I have a question about my order. 🦞";

  // Socket chat sync & HTTP polling fallback
  useEffect(() => {
    if (!user || activeTab !== "livechat") return;

    if (socket) {
      socket.emit("join-chat", { userId: user.id || user._id });
    }

    const fetchHistory = () => {
      axios.get(`${API}/api/chat/history/support-agent`, { withCredentials: true })
        .then(res => {
          setMessages(res.data || []);
        })
        .catch(() => {});
    };

    fetchHistory();

    if (socket) {
      const handleIncomingMessage = (msg) => {
        const isFromSupport = msg.senderRole === "support" || msg.senderRole === "admin";
        const isFromSelf = msg.sender === (user.id || user._id);

        if (isFromSupport || isFromSelf) {
          setMessages(prev => {
            if (prev.some(m => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
          if (isFromSupport) {
            try { new Audio("https://assets.mixkit.co/active_storage/sfx/911/911-600.wav").play(); } catch(e) {}
          }
        }
      };

      const handleTypingIndicator = (data) => {
        if (data.senderRole === "support" || data.senderRole === "admin") {
          setAgentIsTyping(data.isTyping);
        }
      };

      socket.on("chat-message", handleIncomingMessage);
      socket.on("typing-indicator", handleTypingIndicator);

      return () => {
        socket.off("chat-message", handleIncomingMessage);
        socket.off("typing-indicator", handleTypingIndicator);
      };
    } else {
      const interval = setInterval(fetchHistory, 3000);
      return () => clearInterval(interval);
    }
  }, [socket, user, activeTab]);

  const sendChatMessage = async () => {
    if (!newMessage.trim() || !user) return;
    const msgText = newMessage.trim();
    setNewMessage("");

    try {
      const { data } = await axios.post(`${API}/api/chat/message`, {
        recipient: "support-agent",
        message: msgText,
        senderRole: "user",
        recipientRole: "support"
      }, { withCredentials: true });

      if (!socket) {
        setMessages(prev => [...prev, data]);
      }
      
      if (socket) {
        socket.emit("typing", { sender: user.id || user._id, recipient: "support-agent", isTyping: false, senderRole: "user" });
      }
      setTyping(false);
    } catch {
      toast.error("Failed to send message");
    }
  };

  const handleTypingChange = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !user) return;

    if (!typing && e.target.value.length > 0) {
      setTyping(true);
      socket.emit("typing", { sender: user.id || user._id, recipient: "support-agent", isTyping: true, senderRole: "user" });
    } else if (typing && e.target.value.length === 0) {
      setTyping(false);
      socket.emit("typing", { sender: user.id || user._id, recipient: "support-agent", isTyping: false, senderRole: "user" });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.95 }}
            className="w-80 bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[450px]"
          >
            {/* Widget Header with navigation tabs */}
            <div className="p-4 bg-stone-50 border-b flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-stone-850">SeaBite Live Assistant</span>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-stone-200 rounded-full transition-colors"
                >
                  <FiX size={14} />
                </button>
              </div>
              
              <div className="flex bg-stone-200/60 p-1 rounded-xl text-[10px] font-bold">
                <button 
                  onClick={() => setActiveTab("whatsapp")}
                  className={`flex-1 py-1 rounded-lg text-center ${activeTab === "whatsapp" ? "bg-white text-stone-800 shadow-sm" : "text-stone-500"}`}
                >
                  WhatsApp
                </button>
                <button 
                  onClick={() => setActiveTab("livechat")}
                  className={`flex-1 py-1 rounded-lg text-center ${activeTab === "livechat" ? "bg-white text-stone-800 shadow-sm" : "text-stone-500"}`}
                >
                  Live Chat
                </button>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="p-4 flex-1 flex flex-col overflow-y-auto">
              
              {activeTab === "whatsapp" && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <span className="text-3xl mb-2">🟢</span>
                  <h4 className="text-xs font-bold">Message on WhatsApp</h4>
                  <p className="text-[10px] text-stone-400 mt-1 max-w-[200px]">Get instant order updates and shipping coordinates directly on WhatsApp.</p>
                  <a
                    href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 px-5 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow transition-all active:scale-95"
                  >
                    Open WhatsApp Chat
                  </a>
                </div>
              )}

              {activeTab === "livechat" && (
                <div className="flex-1 flex flex-col h-72">
                  {!user ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                      <FiMessageSquare className="text-stone-300 mb-2" size={24} />
                      <p className="text-xs text-stone-500 font-medium">Please log in to chat with support agents.</p>
                    </div>
                  ) : (
                    <>
                      {/* Chat messages */}
                      <div className="flex-1 overflow-y-auto space-y-2.5 pb-2 pr-1">
                        {messages.length === 0 ? (
                          <p className="text-[10px] text-stone-400 italic text-center py-8">No messages. Ask support anything about seafood fresh dispatch!</p>
                        ) : (
                          messages.map((msg, i) => {
                            const isSelf = msg.sender === (user.id || user._id);
                            return (
                              <div key={i} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                                <div className={`p-2.5 rounded-2xl max-w-[85%] text-[10px] shadow-sm ${isSelf ? "bg-stone-900 text-white rounded-tr-none" : "bg-stone-100 border border-stone-200 rounded-tl-none text-stone-850"}`}>
                                  <p>{msg.message}</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                        {agentIsTyping && (
                          <span className="text-[9px] text-stone-400 italic block animate-pulse">Agent is typing...</span>
                        )}
                      </div>

                      {/* Chat Input */}
                      <div className="pt-2 border-t flex gap-1.5 mt-auto">
                        <input 
                          type="text" 
                          placeholder="Type query here..."
                          value={newMessage}
                          onChange={handleTypingChange}
                          onKeyDown={e => e.key === "Enter" && sendChatMessage()}
                          className="flex-grow px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-[11px] outline-none focus:bg-white focus:border-stone-800 transition-all"
                        />
                        <button 
                          onClick={sendChatMessage}
                          className="p-2 bg-stone-900 hover:bg-stone-850 text-white rounded-xl active:scale-95 transition-all"
                        >
                          <FiSend size={12} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-[#1A2B35] hover:bg-[#253d4a] text-white rounded-full shadow-[0_8px_30px_rgba(26,43,53,0.3)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
      >
        {isOpen ? (
          <FiX size={20} />
        ) : (
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/></svg>
        )}
      </button>
    </div>
  );
}