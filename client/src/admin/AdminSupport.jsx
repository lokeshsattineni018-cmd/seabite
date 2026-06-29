import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  User,
  Clock,
  Send,
  RefreshCw,
  FolderOpen
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/admin/support/tickets`, { withCredentials: true });
      setTickets(data || []);
    } catch (err) {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleResolveTicket = async (id) => {
    try {
      await axios.put(`${API}/api/admin/support/tickets/${id}`, {
        status: "resolved"
      }, { withCredentials: true });
      toast.success("Ticket resolved successfully!");
      fetchTickets();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    try {
      const ticket = tickets.find(t => t._id === selectedTicketId);
      const updatedMessages = [
        ...(ticket.messages || []),
        { sender: "agent", senderName: "Support Agent", content: replyMessage }
      ];

      await axios.put(`${API}/api/admin/support/tickets/${selectedTicketId}`, {
        messages: updatedMessages,
        status: "in_progress"
      }, { withCredentials: true });

      toast.success("Reply recorded!");
      setReplyMessage("");
      fetchTickets();
    } catch (err) {
      toast.error("Failed to record message");
    }
  };

  const selectedTicket = tickets.find(t => t._id === selectedTicketId);

  return (
    <div className="p-6 min-h-screen bg-[#0a1625] text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-violet-500/15 border border-violet-500/30">
            <MessageSquare className="text-violet-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Customer Support & SLA</h1>
            <p className="text-xs text-slate-400">Resolve client issues, review SLA timers, and reply to open tickets in real-time</p>
          </div>
        </div>
        <button
          onClick={fetchTickets}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Sync Queue
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns: Ticket Queue */}
        <div className="lg:col-span-1 bg-white/[0.02] border border-white/5 rounded-3xl p-5 space-y-4 h-[600px] flex flex-col">
          <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider">Support Inbox</h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
            {loading ? (
              <p className="text-xs text-slate-500 text-center py-10">Loading tickets...</p>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">No support requests in queue</div>
            ) : (
              tickets.map(t => (
                <div
                  key={t._id}
                  onClick={() => setSelectedTicketId(t._id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                    selectedTicketId === t._id
                      ? "bg-violet-600/10 border-violet-500"
                      : "bg-black/20 border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-bold text-slate-400">{t.category}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                      t.status === "open" ? "bg-red-500/10 text-red-400" :
                      t.status === "resolved" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                    }`}>{t.status}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-2 truncate">{t.subject}</h4>
                  <p className="text-[10px] text-slate-500 mt-1 truncate">ID: TKT-{t.ticketId}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Columns: Chat details & Reply */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTicketId ? (
            selectedTicket ? (
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col justify-between h-[600px]">
                {/* Header info */}
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Ticket details: {selectedTicket.subject}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Category: {selectedTicket.category.toUpperCase()} • TKT-{selectedTicket.ticketId}</p>
                  </div>
                  {selectedTicket.status !== "resolved" && (
                    <button
                      onClick={() => handleResolveTicket(selectedTicket._id)}
                      className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-xl text-xs font-bold transition-all"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>

                {/* Messages stream */}
                <div className="flex-1 overflow-y-auto space-y-3 my-4 pr-1 no-scrollbar text-xs">
                  {selectedTicket.messages?.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col max-w-[75%] p-3 rounded-2xl ${
                        msg.sender === "agent"
                          ? "bg-violet-600/15 border border-violet-500/25 ml-auto text-right"
                          : "bg-black/20 border border-white/5 mr-auto text-left"
                      }`}
                    >
                      <span className="text-[9px] text-slate-500 uppercase font-bold mb-1">
                        {msg.sender === "agent" ? "Support Agent" : "Customer"}
                      </span>
                      <p className="text-slate-200 leading-normal">{msg.content}</p>
                    </div>
                  ))}
                </div>

                {/* Reply action footer form */}
                <form onSubmit={handleReply} className="flex gap-2 border-t border-white/5 pt-4">
                  <input
                    type="text"
                    placeholder="Type support reply or SLA notes..."
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500/50"
                  />
                  <button
                    type="submit"
                    className="p-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center h-[600px] flex flex-col justify-center">
                <AlertTriangle size={32} className="text-slate-700 mx-auto" />
                <p className="text-xs text-slate-500 mt-2">Error rendering support ticket metadata.</p>
              </div>
            )
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center h-[600px] flex flex-col justify-center bg-white/[0.01]">
              <FolderOpen size={36} className="text-slate-700 mx-auto" />
              <p className="text-xs text-slate-500 mt-2">Select an inbox support ticket from the list to view SLA timelines and respond.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
