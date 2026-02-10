import { useEffect, useState, memo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiUsers, FiRefreshCw } from "react-icons/fi";

// ✅ NEW: Skeleton Row for Desktop
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="py-4 px-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-slate-100 shrink-0" />
        <div className="space-y-2">
          <div className="h-3 w-24 bg-slate-100 rounded" />
          <div className="h-2 w-16 bg-slate-50 rounded" />
        </div>
      </div>
    </td>
    <td className="py-4 px-6"><div className="h-3 w-32 bg-slate-100 rounded" /></td>
    <td className="py-4 px-6"><div className="h-4 w-12 bg-slate-100 rounded-full" /></td>
    <td className="py-4 px-6"><div className="h-3 w-20 bg-slate-100 rounded" /></td>
    <td className="py-4 px-6 text-right">
      <div className="space-y-2 ml-auto">
        <div className="h-3 w-16 bg-slate-100 rounded ml-auto" />
        <div className="h-2 w-12 bg-slate-50 rounded ml-auto" />
      </div>
    </td>
  </tr>
);

// ✅ NEW: Skeleton Card for Mobile
const SkeletonCard = () => (
  <div className="p-4 flex items-center gap-4 animate-pulse">
    <div className="w-12 h-12 rounded-full bg-slate-100 shrink-0 shadow-sm" />
    <div className="flex-1 space-y-3">
      <div className="flex justify-between"><div className="h-4 w-1/3 bg-slate-100 rounded" /><div className="h-3 w-10 bg-slate-100 rounded" /></div>
      <div className="h-3 w-1/2 bg-slate-100 rounded" />
    </div>
  </div>
);

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusMessage, setStatusMessage] = useState({
    type: "",
    message: "",
  });

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
        setStatusMessage({
          type: "error",
          message: err.response?.data?.message || "Failed to load users.",
        });
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      (u.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (u.email?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-10 bg-slate-50 min-h-screen relative font-sans">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">Users</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1">Manage accounts and permissions.</p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => fetchUsers()}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 transition-all shadow-sm"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
          </button>
          <div className="relative flex-1 md:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium transition-all shadow-sm"
            />
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {statusMessage.message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium shadow-sm border ${
              statusMessage.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            {statusMessage.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="py-4 px-6">User</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6">Joined</th>
                <th className="py-4 px-6 text-right">Value & Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                // ✅ Show Skeletons instead of text
                [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${u.role === "admin" ? "bg-slate-800" : "bg-blue-600"}`}>
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div><p className="font-bold text-slate-900">{u.name}</p><p className="text-[10px] text-slate-400 font-mono">#{u._id.slice(-6)}</p></div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{u.email}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${u.role === "admin" ? "bg-slate-100 text-slate-700" : "bg-blue-50 text-blue-700 border-blue-100"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}</td>
                    <td className="py-4 px-6 text-right">
                      <p className="font-black text-slate-900">₹{u.intelligence?.totalSpent?.toLocaleString() || 0}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{u.intelligence?.orderCount || 0} Orders</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            [...Array(5)].map((_, i) => <SkeletonCard key={i} />)
          ) : (
            filteredUsers.map((u) => (
              <div key={u._id} className="p-4 flex items-center gap-4 active:bg-slate-50 transition-colors">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm ${u.role === "admin" ? "bg-slate-800" : "bg-blue-600"}`}>
                  {u.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm text-slate-900 truncate">{u.name}</h3>
                    <span className={`text-[9px] font-black uppercase px-1.5 rounded border ${u.role === "admin" ? "bg-slate-100" : "bg-blue-50 text-blue-700 border-blue-100"}`}>
                      {u.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Joined: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}</p>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900 leading-none">₹{u.intelligence?.totalSpent?.toLocaleString() || 0}</p>
                      <p className="text-[9px] font-bold text-blue-500 uppercase">{u.intelligence?.orderCount || 0} Orders</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {!loading && filteredUsers.length === 0 && (
          <div className="py-20 text-center px-6">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><FiUsers size={32} /></div>
            <h3 className="text-slate-900 font-bold text-lg">No Users Found</h3>
            <p className="text-slate-500 text-sm mt-1">Try a different search term.</p>
          </div>
        )}
      </div>
    </div>
  );
}