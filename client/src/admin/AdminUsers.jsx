// AdminUsers.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch, FiUsers, FiRefreshCw,
  FiShield, FiUser, FiArrowUpRight, FiEdit2, FiX, FiCheck,
  FiActivity, FiClock, FiShoppingBag, FiTrendUp, FiAlertTriangle, FiTarget
} from "react-icons/fi";
import toast from "react-hot-toast";

// --- Design Constants ---
const ease = [0.16, 1, 0.3, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: (i = 0) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.05, duration: 0.6, ease },
  }),
};
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/users/intelligence", { withCredentials: true });
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdate = async () => {
    if (!editingUser) return;
    try {
      await axios.put(`/api/admin/users/${editingUser._id}`, {
        isBanned: editingUser.isBanned
      }, { withCredentials: true });

      toast.success(editingUser.isBanned ? "User banned" : "User unbanned");
      setUsers(users.map(u => u._id === editingUser._id ? { ...u, isBanned: editingUser.isBanned } : u));
      setEditingUser(null);
    } catch {
      toast.error("Update failed");
    }
  };

  const filteredUsers = users.filter(u =>
    (u.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (u.email?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const adminCount = users.filter(u => u.role === "admin").length;
  const totalRevenue = users.reduce((sum, u) => sum + (u.intelligence?.totalSpent || 0), 0);

  return (
    <motion.div
      initial="hidden" animate="visible" variants={staggerContainer}
      className="min-h-screen bg-gradient-to-br from-white via-stone-50 to-white p-6 md:p-10 font-sans"
    >
      <div className="max-w-[1600px] mx-auto space-y-8">

        {/* Header */}
        <motion.div variants={fadeUp} className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-stone-200/50 pb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-light text-stone-900 tracking-tight mb-2">
              Customers
            </h1>
            <p className="text-sm text-stone-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-stone-300" />
              Manage access and view intelligence
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-5 py-3 rounded-2xl bg-stone-50 border border-stone-200/50 text-stone-800 font-medium placeholder:text-stone-400 focus:bg-white focus:border-stone-300 focus:ring-2 focus:ring-stone-200/50 transition-all outline-none"
              />
            </div>
            <button onClick={() => fetchUsers()} className="p-3.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-2xl transition-colors">
              <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard
            title="Total Users"
            value={users.length}
            icon={<FiUsers size={20} />}
            color="bg-blue-50/50 text-blue-700 border-blue-100/50"
          />
          <StatCard
            title="Admins"
            value={adminCount}
            icon={<FiShield size={20} />}
            color="bg-stone-100/50 text-stone-600 border-stone-200/50"
          />
          <StatCard
            title="Customer LTV"
            value={`₹${totalRevenue.toLocaleString()}`}
            icon={<FiArrowUpRight size={20} />}
            color="bg-emerald-50/50 text-emerald-700 border-emerald-100/50"
          />
        </motion.div>

        {/* Users List */}
        <motion.div variants={fadeUp} className="bg-white rounded-3xl border border-stone-200/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-stone-50/50 border-b border-stone-100 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Segment</th>
                  <th className="px-6 py-4 text-right">Spend ({users.length > 0 ? "₹" : ""})</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-10 w-48 bg-stone-100 rounded-xl" /></td>
                      <td className="px-6 py-4"><div className="h-6 w-24 bg-stone-100 rounded-lg" /></td>
                      <td className="px-6 py-4"><div className="h-6 w-16 bg-stone-100 rounded-lg" /></td> {/* New */}
                      <td className="px-6 py-4"><div className="h-6 w-16 bg-stone-100 rounded-lg ml-auto" /></td>
                      <td className="px-6 py-4"><div className="h-8 w-20 bg-stone-100 rounded-lg ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-stone-400 font-medium">No users found</td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u._id} className={`group hover:bg-stone-50/50 transition-colors ${u.isBanned ? "bg-rose-50/30" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm transition-transform group-hover:scale-105 ${u.role === "admin" ? "bg-stone-800" : "bg-gradient-to-br from-blue-500 to-blue-600"} ${u.isBanned ? "grayscale opacity-50" : ""}`}>
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-stone-900 text-sm">{u.name}</p>
                            <p className="text-xs text-stone-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${u.role === "admin" ? "bg-stone-100 text-stone-600 border-stone-200" : "bg-blue-50 text-blue-600 border-blue-100"}`}>
                            {u.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide 
                                ${u.intelligence?.segment === "Champion" ? "bg-amber-100 text-amber-700" :
                            u.intelligence?.segment === "At Risk" ? "bg-rose-50 text-rose-600" : "bg-stone-100 text-stone-500"}`}>
                          {u.intelligence?.segment || "New"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-medium text-stone-900 text-sm">₹{u.intelligence?.totalSpent?.toLocaleString() || 0}</div>
                        <div className="text-[10px] text-stone-400 font-medium">{u.intelligence?.orderCount || 0} orders</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.role !== "admin" ? (
                          <button
                            onClick={() => setEditingUser(u)}
                            className="px-4 py-2 bg-white hover:bg-white text-stone-600 hover:text-blue-600 border border-stone-200 hover:border-blue-200 rounded-xl font-medium text-xs transition-all shadow-sm hover:shadow active:scale-95"
                          >
                            Manage
                          </button>
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-stone-300 select-none">Protected</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Deep Dive User Modal */}
        <AnimatePresence>
          {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setEditingUser(null)}
                className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-[#fafaf9] rounded-3xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col md:flex-row max-h-[90vh]"
              >
                {/* Close Button */}
                <button
                  onClick={() => setEditingUser(null)}
                  className="absolute top-4 right-4 z-10 p-2 bg-white/50 hover:bg-white rounded-full transition-colors"
                >
                  <FiX />
                </button>

                {/* Left Panel: Identity & Actions */}
                <div className="w-full md:w-1/3 bg-white p-8 border-r border-stone-200 flex flex-col items-center text-center">
                  <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-bold text-white shadow-xl mb-6 ${editingUser.isBanned ? "bg-stone-400 grayscale" : "bg-gradient-to-br from-blue-600 to-indigo-600"}`}>
                    {editingUser.name?.charAt(0).toUpperCase()}
                  </div>

                  <h2 className="text-2xl font-bold text-stone-900 mb-1">{editingUser.name}</h2>
                  <p className="text-sm text-stone-500 font-medium mb-6">{editingUser.email}</p>

                  <div className="w-full space-y-4">
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 w-full">
                      <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-2">Customer Segment</div>
                      <div className={`text-lg font-bold flex items-center justify-center gap-2 
                            ${editingUser.intelligence?.segment === "Champion" ? "text-amber-500" :
                          editingUser.intelligence?.segment === "At Risk" ? "text-rose-500" : "text-stone-700"}`}>
                        {editingUser.intelligence?.segment === "Champion" && <FiTarget />}
                        {editingUser.intelligence?.segment || "New"}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 w-full">
                      <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-2">Churn Probability</div>
                      <div className={`text-lg font-bold flex items-center justify-center gap-2 
                            ${editingUser.intelligence?.churnRisk === "High" ? "text-rose-600" :
                          editingUser.intelligence?.churnRisk === "Medium" ? "text-amber-500" : "text-emerald-600"}`}>
                        {editingUser.intelligence?.churnRisk === "High" && <FiAlertTriangle />}
                        {editingUser.intelligence?.churnRisk || "Low"}
                      </div>
                    </div>

                    <button
                      onClick={() => setEditingUser({ ...editingUser, isBanned: !editingUser.isBanned })}
                      className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border ${editingUser.isBanned
                        ? "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100"
                        : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                        }`}
                    >
                      {editingUser.isBanned ? (
                        <><FiShield /> Lift Ban</>
                      ) : (
                        <><FiShield /> Ban Account</>
                      )}
                    </button>

                    <button
                      onClick={handleUpdate}
                      className="w-full py-3 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 shadow-lg active:scale-95 transition-all"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

                {/* Right Panel: Intelligence & Activity */}
                <div className="w-full md:w-2/3 p-8 overflow-y-auto">
                  <h3 className="text-lg font-bold text-stone-800 mb-6 flex items-center gap-2">
                    <FiActivity className="text-blue-500" /> Intelligence Profile
                  </h3>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-5 rounded-2xl bg-white border border-stone-100 shadow-sm">
                      <div className="text-stone-400 text-xs font-bold uppercase mb-1">Lifetime Value</div>
                      <div className="text-2xl font-light text-stone-900">₹{editingUser.intelligence?.totalSpent?.toLocaleString()}</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white border border-stone-100 shadow-sm">
                      <div className="text-stone-400 text-xs font-bold uppercase mb-1">Avg Order Value</div>
                      <div className="text-2xl font-light text-stone-900">₹{editingUser.intelligence?.avgOrderValue?.toLocaleString()}</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white border border-stone-100 shadow-sm">
                      <div className="text-stone-400 text-xs font-bold uppercase mb-1">Total Orders</div>
                      <div className="text-2xl font-light text-stone-900">{editingUser.intelligence?.orderCount}</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white border border-stone-100 shadow-sm">
                      <div className="text-stone-400 text-xs font-bold uppercase mb-1">Last Active</div>
                      <div className="text-sm font-medium text-stone-700">
                        {editingUser.intelligence?.lastActive ? new Date(editingUser.intelligence.lastActive).toLocaleDateString() : "Never"}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                    <FiClock className="text-stone-400" /> Recent Activity
                  </h3>

                  <div className="space-y-3">
                    {editingUser.intelligence?.recentActivity?.length > 0 ? (
                      editingUser.intelligence.recentActivity.map((act, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white border border-stone-100">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-stone-700">{act.details}</div>
                            <div className="text-[10px] text-stone-400">{act.action}</div>
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono">
                            {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-stone-400 text-sm italic">
                        No recent activity logs found.
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className={`p-6 rounded-3xl border flex items-center gap-5 transition-transform hover:scale-[1.02] ${color}`}>
      <div className="p-3 bg-white/60 rounded-2xl backdrop-blur-sm shadow-sm">{icon}</div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-0.5">{title}</p>
        <p className="text-2xl font-light">{value}</p>
      </div>
    </div>
  );
}