// AdminUsers.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch, FiUsers, FiRefreshCw,
  FiShield, FiUser, FiArrowUpRight, FiEdit2, FiX, FiCheck
} from "react-icons/fi";
import toast from "react-hot-toast";

const ease = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  visible: (i = 0) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.05, duration: 0.5, ease },
  }),
};

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="py-4 px-5"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-slate-100 shrink-0" /><div className="space-y-2"><div className="h-3.5 w-24 bg-slate-100 rounded" /><div className="h-2.5 w-16 bg-slate-50 rounded" /></div></div></td>
    <td className="py-4 px-5"><div className="h-3.5 w-36 bg-slate-100 rounded" /></td>
    <td className="py-4 px-5"><div className="h-5 w-14 bg-slate-100 rounded-md" /></td>
    <td className="py-4 px-5"><div className="h-3 w-20 bg-slate-100 rounded" /></td>
    <td className="py-4 px-5 text-right"><div className="space-y-2 ml-auto"><div className="h-4 w-16 bg-slate-100 rounded ml-auto" /><div className="h-2.5 w-12 bg-slate-50 rounded ml-auto" /></div></td>
  </tr>
);

const SkeletonCard = () => (
  <div className="p-4 flex items-center gap-4 animate-pulse">
    <div className="w-11 h-11 rounded-full bg-slate-100 shrink-0" />
    <div className="flex-1 space-y-2.5"><div className="flex justify-between"><div className="h-4 w-1/3 bg-slate-100 rounded" /><div className="h-3 w-10 bg-slate-100 rounded" /></div><div className="h-3 w-1/2 bg-slate-100 rounded" /></div>
  </div>
);

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null); // 🟢 For Modal
  const [statusMessage, setStatusMessage] = useState({ type: "", message: "" });

  const fetchUsers = (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setStatusMessage({ type: "", message: "" });
    axios
      .get("/api/admin/users/intelligence")
      .then((res) => {
        setUsers(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setStatusMessage({ type: "error", message: err.response?.data?.message || "Failed to load users." });
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      if (!editingUser) return;
      // Only sending isBanned status, Role is no longer editable here
      const res = await axios.put(`/api/admin/users/${editingUser._id}`, {
        isBanned: editingUser.isBanned
      }, { withCredentials: true });

      toast.success(editingUser.isBanned ? "User Banned Successfully" : "User Unbanned Successfully");
      setUsers(users.map(u => u._id === editingUser._id ? { ...u, isBanned: editingUser.isBanned } : u));
      setEditingUser(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update user");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (u.email?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const adminCount = users.filter((u) => u.role === "admin").length;
  const totalRevenue = users.reduce((sum, u) => sum + (u.intelligence?.totalSpent || 0), 0);

  return (
    <motion.div initial="hidden" animate="visible" className="p-4 md:p-6 min-h-screen relative font-sans flex flex-col">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Users & Permissions</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1">Manage customer access and monitor bans</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => fetchUsers()} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={16} />
          </motion.button>
          <div className="relative flex-1 md:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input type="text" placeholder="Search name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/10 text-sm transition-all shadow-sm" />
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row items-center md:items-start gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><FiUsers size={18} /></div>
          <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Users</p><p className="text-xl font-bold text-slate-900">{users.length}</p></div>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row items-center md:items-start gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><FiShield size={18} /></div>
          <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admins</p><p className="text-xl font-bold text-slate-900">{adminCount}</p></div>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row items-center md:items-start gap-4 shadow-sm col-span-2 md:col-span-1">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><FiArrowUpRight size={18} /></div>
          <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total CLV</p><p className="text-xl font-bold text-slate-900">₹{totalRevenue.toLocaleString()}</p></div>
        </div>
      </motion.div>

      <AnimatePresence>
        {statusMessage.message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium shadow-sm border ${statusMessage.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
            {statusMessage.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users Table Card */}
      <motion.div variants={fadeUp} custom={2} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        {/* Desktop Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <div className="col-span-4">User Details</div>
          <div className="col-span-3">Role & Status</div>
          <div className="col-span-2 text-right">Activity</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="w-10 h-10 bg-slate-100 rounded-full" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-slate-100 rounded w-1/4" />
                    <div className="h-3 bg-slate-50 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <FiUsers size={32} className="mb-2 opacity-50" />
              <p className="text-sm">No users found matching "{search}"</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredUsers.map((u, i) => (
                <motion.div
                  key={u._id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className={`p-4 hover:bg-slate-50 transition-colors group ${u.isBanned ? "bg-red-50/40 hover:bg-red-50/60" : ""}`}
                >
                  <div className="flex flex-col md:grid md:grid-cols-12 md:gap-4 md:items-center">
                    {/* User Info */}
                    <div className="flex items-center gap-3 col-span-4 mb-2 md:mb-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm ${u.role === "admin" ? "bg-slate-800" : "bg-blue-600"} ${u.isBanned ? "grayscale opacity-75" : ""}`}>
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 truncate">{u.name}</p>
                          {u.isBanned && <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md uppercase tracking-wide">Banned</span>}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      </div>
                    </div>

                    {/* Role & Status */}
                    <div className="flex items-center justify-between md:justify-start gap-4 col-span-3 mb-2 md:mb-0">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 ${u.role === "admin" ? "bg-slate-100 text-slate-700" : "bg-blue-50 text-blue-700"}`}>
                        {u.role === "admin" ? <FiShield /> : <FiUser />} {u.role}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 md:hidden">#{u._id.slice(-4)}</span>
                    </div>

                    {/* Activity */}
                    <div className="flex justify-between md:block text-right col-span-2 mb-2 md:mb-0">
                      <span className="md:hidden text-xs text-slate-400">Spent</span>
                      <div>
                        <p className="font-bold text-slate-900">₹{u.intelligence?.totalSpent?.toLocaleString() || 0}</p>
                        <p className="text-[10px] font-semibold text-slate-400">{u.intelligence?.orderCount || 0} orders</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end col-span-3">
                      {u.role !== "admin" ? (
                        <button
                          onClick={() => setEditingUser(u)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm flex items-center gap-2"
                        >
                          <FiEdit2 size={12} /> Manage
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 uppercase select-none">Protected</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* 🟢 EDIT USER MODAL (Simplified) */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setEditingUser(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-slate-900">Manage User</h2>
                  <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                    <FiX size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* User Profile Summary */}
                  <div className="flex gap-4 items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-12 h-12 bg-white border border-slate-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-sm">
                      {editingUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-lg leading-tight">{editingUser.name}</p>
                      <p className="text-xs text-slate-500">{editingUser.email}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 rounded">{editingUser.role}</span>
                        {editingUser.isBanned && <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-50 px-1.5 rounded">Banned</span>}
                      </div>
                    </div>
                  </div>

                  {/* Ban Toggle Section */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Account Status</label>
                    <button
                      onClick={() => setEditingUser({ ...editingUser, isBanned: !editingUser.isBanned })}
                      className={`w-full py-4 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-3 ${editingUser.isBanned ? "bg-red-50 text-red-600 border-red-100 hover:border-red-200" : "bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-200"}`}
                    >
                      {editingUser.isBanned ? (
                        <><FiShield size={18} /> Account Banned</>
                      ) : (
                        <><FiCheck size={18} /> Account Active</>
                      )}
                    </button>
                    <p className="text-[10px] text-center text-slate-400 px-4">
                      {editingUser.isBanned
                        ? "This user is currently blocked from logging in."
                        : "This user has full access to their account."}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button onClick={() => setEditingUser(null)} className="py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateUser}
                      className="py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 text-sm"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}