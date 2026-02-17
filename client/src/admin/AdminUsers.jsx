'use client';

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, RefreshCw, Users, Shield, User, TrendingUp, Edit2, X, Check
} from "lucide-react";

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
  const [editingUser, setEditingUser] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: "", message: "" });

  const fetchUsers = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setStatusMessage({ type: "", message: "" });
    try {
      const res = await fetch("/api/admin/users/intelligence");
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data || []);
    } catch (err) {
      setStatusMessage({ type: "error", message: "Failed to load users." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      if (!editingUser) return;
      const res = await fetch(`/api/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBanned: editingUser.isBanned })
      });

      if (!res.ok) throw new Error("Failed to update user");
      setUsers(users.map(u => u._id === editingUser._id ? { ...u, isBanned: editingUser.isBanned } : u));
      setEditingUser(null);
    } catch (err) {
      setStatusMessage({ type: "error", message: "Failed to update user" });
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
    <motion.div initial="hidden" animate="visible" className="p-6 md:p-8 min-h-screen relative font-sans flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Users & Permissions</h1>
          <p className="text-muted-foreground text-sm mt-2">Manage customer access and monitor account status</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => fetchUsers()} className="p-2.5 rounded-lg bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary transition-all shadow-sm">
            <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
          </motion.button>
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all shadow-sm" />
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Users size={20} /></div>
          <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Total Users</p><p className="text-2xl font-bold text-foreground mt-1">{users.length}</p></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent"><Shield size={20} /></div>
          <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Admins</p><p className="text-2xl font-bold text-foreground mt-1">{adminCount}</p></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive"><TrendingUp size={20} /></div>
          <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Total Revenue</p><p className="text-2xl font-bold text-foreground mt-1">₹{totalRevenue.toLocaleString()}</p></div>
        </div>
      </motion.div>

      <AnimatePresence>
        {statusMessage.message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`mb-6 p-4 rounded-lg flex items-center gap-3 text-sm font-medium shadow-sm border ${statusMessage.type === "error" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
            {statusMessage.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users Table Card */}
      <motion.div variants={fadeUp} custom={2} className="bg-card rounded-xl shadow-lg border border-border overflow-hidden flex-1 flex flex-col">
        {/* Desktop Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-5 border-b border-border bg-secondary/30 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
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
                  <div className="w-10 h-10 bg-secondary rounded-full" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-secondary rounded w-1/4" />
                    <div className="h-3 bg-secondary rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Users size={40} className="mb-2 opacity-30" />
              <p className="text-sm font-medium">No users found matching "{search}"</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredUsers.map((u, i) => (
                <motion.div
                  key={u._id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className={`p-5 hover:bg-secondary/30 transition-colors group ${u.isBanned ? "bg-destructive/5 hover:bg-destructive/10" : ""}`}
                >
                  <div className="flex flex-col md:grid md:grid-cols-12 md:gap-4 md:items-center">
                    {/* User Info */}
                    <div className="flex items-center gap-3 col-span-4 mb-3 md:mb-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-card shrink-0 shadow-sm ${u.role === "admin" ? "bg-primary" : "bg-primary/70"} ${u.isBanned ? "grayscale opacity-60" : ""}`}>
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground truncate">{u.name}</p>
                          {u.isBanned && <span className="text-xs font-bold bg-destructive/10 text-destructive px-2 py-0.5 rounded-md uppercase tracking-wide">Banned</span>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>

                    {/* Role & Status */}
                    <div className="flex items-center justify-between md:justify-start gap-4 col-span-3 mb-3 md:mb-0">
                      <span className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase flex items-center gap-1.5 ${u.role === "admin" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                        {u.role === "admin" ? <Shield size={14} /> : <User size={14} />} {u.role}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground md:hidden">#{u._id.slice(-4)}</span>
                    </div>

                    {/* Activity */}
                    <div className="flex justify-between md:block text-right col-span-2 mb-3 md:mb-0">
                      <span className="md:hidden text-xs text-muted-foreground">Spent</span>
                      <div>
                        <p className="font-semibold text-foreground">₹{u.intelligence?.totalSpent?.toLocaleString() || 0}</p>
                        <p className="text-xs font-medium text-muted-foreground">{u.intelligence?.orderCount || 0} orders</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end col-span-3">
                      {u.role !== "admin" ? (
                        <button
                          onClick={() => setEditingUser(u)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 hover:border-primary/40 transition-all shadow-sm flex items-center gap-2"
                        >
                          <Edit2 size={12} /> Manage
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground/50 uppercase select-none">Protected</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* EDIT USER MODAL */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
              onClick={() => setEditingUser(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-card rounded-2xl shadow-2xl overflow-hidden border border-border"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-foreground">Manage User</h2>
                  <button onClick={() => setEditingUser(null)} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* User Profile Summary */}
                  <div className="flex gap-4 items-center p-4 bg-secondary/50 rounded-xl border border-border">
                    <div className="w-12 h-12 bg-primary text-card rounded-lg flex items-center justify-center font-bold text-lg shadow-md">
                      {editingUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-base leading-tight">{editingUser.name}</p>
                      <p className="text-xs text-muted-foreground">{editingUser.email}</p>
                      <div className="flex gap-2 mt-1">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${editingUser.role === "admin" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>{editingUser.role}</span>
                        {editingUser.isBanned && <span className="text-xs font-bold uppercase tracking-wider text-destructive bg-destructive/10 px-2 py-0.5 rounded-md">Banned</span>}
                      </div>
                    </div>
                  </div>

                  {/* Ban Toggle Section */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Account Status</label>
                    <button
                      onClick={() => setEditingUser({ ...editingUser, isBanned: !editingUser.isBanned })}
                      className={`w-full py-4 rounded-lg border-2 text-sm font-bold transition-all flex items-center justify-center gap-3 ${editingUser.isBanned ? "bg-destructive/10 text-destructive border-destructive/30 hover:border-destructive/50" : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-300"}`}
                    >
                      {editingUser.isBanned ? (
                        <><Shield size={18} /> Account Banned</>
                      ) : (
                        <><Check size={18} /> Account Active</>
                      )}
                    </button>
                    <p className="text-xs text-center text-muted-foreground px-4">
                      {editingUser.isBanned
                        ? "This user is currently blocked from logging in and accessing their account."
                        : "This user has full access to their account and features."}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button onClick={() => setEditingUser(null)} className="py-3 rounded-lg border border-border text-foreground font-semibold text-sm hover:bg-secondary/50 transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateUser}
                      className="py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-lg transition-all active:scale-95 text-sm"
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
