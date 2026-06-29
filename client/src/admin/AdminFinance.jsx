import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import {
  DollarSign,
  TrendingUp,
  Percent,
  Plus,
  Search,
  Filter,
  FileText,
  Calendar,
  AlertCircle,
  TrendingDown,
  RefreshCw,
  Tag
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const API = import.meta.env.VITE_API_URL || "";

const EXPENSE_CATEGORIES = [
  "cogs",
  "shipping",
  "packaging",
  "marketing",
  "salary",
  "rent",
  "utilities",
  "technology",
  "licenses",
  "insurance",
  "other"
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function AdminFinance() {
  const [revenueStats, setRevenueStats] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: "cogs",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    receiptUrl: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [revRes, expRes] = await Promise.all([
        axios.get(`${API}/api/admin/finance/revenue`, { withCredentials: true }),
        axios.get(`${API}/api/admin/finance/expenses`, { withCredentials: true })
      ]);
      setRevenueStats(revRes.data);
      setExpenses(expRes.data || []);
    } catch (err) {
      toast.error("Failed to load financial records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.description) {
      toast.error("Amount and Description are required");
      return;
    }

    try {
      await axios.post(`${API}/api/admin/finance/expenses`, {
        ...expenseForm,
        amount: Number(expenseForm.amount)
      }, { withCredentials: true });
      
      toast.success("Expense logged successfully!");
      setShowAddExpense(false);
      setExpenseForm({
        category: "cogs",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        receiptUrl: ""
      });
      fetchData();
    } catch (err) {
      toast.error("Failed to log expense");
    }
  };

  const getExpensesByCategory = () => {
    const categoriesMap = {};
    expenses.forEach(exp => {
      categoriesMap[exp.category] = (categoriesMap[exp.category] || 0) + exp.amount;
    });
    return Object.entries(categoriesMap).map(([name, value]) => ({ name, value }));
  };

  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const netProfit = revenueStats ? revenueStats.monthlyRevenue - totalExpenses : 0;
  const margin = revenueStats && revenueStats.monthlyRevenue > 0
    ? Math.round((netProfit / revenueStats.monthlyRevenue) * 100)
    : 0;

  return (
    <div className="p-6 min-h-screen bg-[#0a1625] text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30">
            <DollarSign className="text-emerald-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Finance & Accounting</h1>
            <p className="text-xs text-slate-400">Track company margins, tax obligations, operational expenses and direct P&L charts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddExpense(!showAddExpense)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus size={14} />
            Log Expense
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Sync Ledger
          </button>
        </div>
      </div>

      {/* Expense Overlay form modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f172a] border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4"
          >
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Log New Operational Expense</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Category</label>
                  <select
                    value={expenseForm.category}
                    onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer"
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Amount (INR)</label>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    placeholder="e.g. 5000"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Description</label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="e.g. Office packaging supplies or server fees"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Transaction Date</label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <DollarSign size={48} className="text-emerald-500 animate-pulse" />
          <p className="text-xs text-slate-400">Balancing double-entry ledgers...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Monthly Gross Revenue</span>
              <span className="text-2xl font-bold text-white mt-1 block">₹{revenueStats?.monthlyRevenue.toLocaleString()}</span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Logged Expenses</span>
              <span className="text-2xl font-bold text-white mt-1 block">₹{totalExpenses.toLocaleString()}</span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Net Operating Profit</span>
              <span className={`text-2xl font-bold mt-1 block ${netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                ₹{netProfit.toLocaleString()}
              </span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Net Margin Ratio</span>
              <span className="text-2xl font-bold text-white mt-1 block">{margin}% margin</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart: Expenses Breakdown */}
            <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 flex flex-col justify-between min-h-[300px]">
              <div>
                <h3 className="text-sm font-bold text-white mb-2">Expenses by Category</h3>
                <p className="text-[10px] text-slate-500">Distribution of company operational spending</p>
              </div>
              <div className="h-[200px] flex items-center justify-center">
                {expenses.length === 0 ? (
                  <span className="text-xs text-slate-500">No expenses logged this month</span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getExpensesByCategory()}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {getExpensesByCategory().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 mt-2 justify-center">
                {getExpensesByCategory().map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="capitalize">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* List: Recent Expense Ledger */}
            <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white">Expense Transaction Journal</h3>
              </div>

              <div className="overflow-y-auto max-h-[350px] no-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-400 font-bold uppercase">
                      <th className="pb-3 pr-4">Description</th>
                      <th className="pb-3 px-4">Category</th>
                      <th className="pb-3 px-4">Date</th>
                      <th className="pb-3 pl-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500">No expense records found.</td>
                      </tr>
                    ) : (
                      expenses.map(exp => (
                        <tr key={exp._id} className="border-b border-white/5 hover:bg-white/[0.01]">
                          <td className="py-3 pr-4">
                            <p className="font-bold text-white">{exp.description}</p>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-300">
                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] uppercase tracking-wider font-bold">
                              {exp.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400">{new Date(exp.date).toLocaleDateString()}</td>
                          <td className="py-3 pl-4 text-right font-mono font-bold text-red-400">−₹{exp.amount.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
