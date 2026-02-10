// src/admin/AdminMessages.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { FiMail, FiCalendar, FiUser } from "react-icons/fi";
import { motion } from "framer-motion";

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const res = await axios.get("/api/contact");
      setMessages(res.data || []);
    } catch (err) {
      console.error("AdminMessages fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <div className="p-6 md:p-10 bg-[#f4f7fa] dark:bg-[#0a1625] min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Inbox
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Customer inquiries & messages
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-sm">
          <span className="text-sm font-bold text-blue-600">
            {messages.length} Messages
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">Loading...</div>
      ) : messages.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
          <FiMail className="mx-auto text-slate-300 text-4xl mb-4" />
          <p className="text-slate-500">No messages yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {messages.map((msg, index) => (
            <motion.div
              key={msg._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <FiUser />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {msg.email}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <FiCalendar size={10} />
                      {new Date(msg.createdAt).toLocaleDateString()} at{" "}
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg text-sm text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-700">
                {msg.message}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
