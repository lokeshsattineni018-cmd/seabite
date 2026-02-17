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
      const res = await axios.put(`/api/admin/users/${editingUser._id}`, {
        role: editingUser.role,
        isBanned: editingUser.isBanned
      }, { withCredentials: true });

      toast.success("User updated successfully");
      setUsers(users.map(u => u._id === editingUser._id ? { ...u, role: editingUser.role, isBanned: editingUser.isBanned } : u));
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
    <motion.div initial="hidden" animate="visible" className="p-4 md:p-8 lg:p-10 min-h-screen relative font-sans">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Users</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <p className="text-slate-500 text-xs md:text-sm">Manage accounts and permissions</p>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{users.length} total</span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{adminCount} admins</span>
          </div>
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
      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-slate-100 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><FiUsers size={15} /></div>
          <div><p className="text-[10px] font-semibold text-slate-400 uppercase">Total Users</p><p className="text-lg font-bold text-slate-900">{users.length}</p></div>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600"><FiShield size={15} /></div>
          <div><p className="text-[10px] font-semibold text-slate-400 uppercase">Admins</p><p className="text-lg font-bold text-slate-900">{adminCount}</p></div>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-3.5 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><FiArrowUpRight size={15} /></div>
          <div><p className="text-[10px] font-semibold text-slate-400 uppercase">Total CLV</p><p className="text-lg font-bold text-slate-900">₹{totalRevenue.toLocaleString()}</p></div>
        </div>
      </motion.div>

      <AnimatePresence>
        {statusMessage.message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium shadow-sm border ${statusMessage.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
            {statusMessage.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users Table */}
      <motion.div variants={fadeUp} custom={2} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">User</th>
                <th className="py-3.5 px-5">Email</th>
                <th className="py-3.5 px-5">Role</th>
                <th className="py-3.5 px-5">Joined</th>
                <th className="py-3.5 px-5 text-right">Value & Activity</th>
                <th className="py-3.5 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {loading ? (
                [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
              ) : (
                filteredUsers.map((u, i) => (
                  <motion.tr
                    key={u._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={`hover:bg-slate-50/60 transition-colors group ${u.isBanned ? "bg-red-50/30" : ""}`}
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm ${u.role === "admin" ? "bg-slate-800" : "bg-blue-600"}`}>
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 flex items-center gap-2">
                            {u.name}
                            {u.isBanned && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase font-bold">Banned</span>}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">#{u._id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 text-sm">{u.email}</td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${u.role === "admin" ? "bg-slate-100 text-slate-700" : "bg-blue-50 text-blue-700"}`}>
                        {u.role === "admin" ? (
                          <span className="flex items-center gap-1"><FiShield size={9} /> Admin</span>
                        ) : (
                          <span className="flex items-center gap-1"><FiUser size={9} /> User</span>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 text-sm">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}</td>
                    <td className="py-3.5 px-5 text-right">
                      <p className="font-bold text-slate-900">₹{u.intelligence?.totalSpent?.toLocaleString() || 0}</p>
                      <p className="text-[10px] font-semibold text-slate-400">{u.intelligence?.orderCount || 0} orders</p>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <FiEdit2 size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-50">
          {loading ? (
            [...Array(5)].map((_, i) => <SkeletonCard key={i} />)
          ) : (
            filteredUsers.map((u) => (
              <div key={u._id} className={`p-4 flex items-center gap-3.5 active:bg-slate-50 transition-colors ${u.isBanned ? "bg-red-50/30" : ""}`}>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm ${u.role === "admin" ? "bg-slate-800" : "bg-blue-600"}`}>
                  {u.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-sm text-slate-900 truncate flex items-center gap-2">
                      {u.name}
                      {u.isBanned && <span className="text-[8px] bg-red-100 text-red-600 px-1 py-0.5 rounded uppercase font-bold">Banned</span>}
                    </h3>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${u.role === "admin" ? "bg-slate-100 text-slate-600" : "bg-blue-50 text-blue-600"}`}>{u.role}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  <div className="flex items-center justify-between mt-2">
                    <button
                      onClick={() => setEditingUser(u)}
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg"
                    >
                      <FiEdit2 size={12} /> Edit
                    </button>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900">₹{u.intelligence?.totalSpent?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {!loading && filteredUsers.length === 0 && (
          <div className="py-20 text-center px-6">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300"><FiUsers size={28} /></div>
            <h3 className="text-slate-900 font-bold text-lg">No Users Found</h3>
            <p className="text-slate-400 text-sm mt-1">Try a different search term.</p>
          </div>
        )}
      </motion.div>

      {/* 🟢 EDIT USER MODAL */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setEditingUser(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-slate-900">Edit User</h2>
                  <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <FiX size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4 items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                      {editingUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{editingUser.name}</p>
                      <p className="text-xs text-slate-500">{editingUser.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingUser({ ...editingUser, role: "user" })}
                        className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${editingUser.role === "user" ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                      >
                        User
                      </button>
                      <button
                        onClick={() => setEditingUser({ ...editingUser, role: "admin" })}
                        className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${editingUser.role === "admin" ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                      >
                        Admin
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                    <button
                      onClick={() => setEditingUser({ ...editingUser, isBanned: !editingUser.isBanned })}
                      className={`w-full py-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${editingUser.isBanned ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"}`}
                    >
                      {editingUser.isBanned ? (
                        <>🚫 User is Banned (Click to Unban)</>
                      ) : (
                        <>✅ User is Active (Click to Ban)</>
                      )}
                    </button>
                  </div>

                  <button
                    onClick={handleUpdateUser}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 mt-4"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}