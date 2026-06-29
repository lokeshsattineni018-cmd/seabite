import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Award,
  Calendar,
  Gift,
  Flame,
  Zap,
  TrendingUp,
  RefreshCw,
  Info,
  CheckCircle,
  Trophy
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

export default function LoyaltyCenter() {
  const [loyalty, setLoyalty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  const fetchLoyaltyStatus = async () => {
    try {
      const { data } = await axios.get(`${API}/api/loyalty/status`, { withCredentials: true });
      setLoyalty(data);
    } catch (err) {
      toast.error("Failed to load loyalty status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoyaltyStatus();
  }, []);

  const handleCheckin = async () => {
    setCheckingIn(true);
    try {
      const { data } = await axios.post(`${API}/api/loyalty/checkin`, {}, { withCredentials: true });
      toast.success(data.message);
      fetchLoyaltyStatus();
    } catch (err) {
      toast.error(err.response?.data?.error || "Check-in failed");
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a1625] text-slate-400">
        <Trophy size={48} className="text-amber-500 animate-bounce mb-4" />
        <p className="text-xs">Gathering reward catalog...</p>
      </div>
    );
  }

  if (!loyalty) return null;

  return (
    <div className="p-6 min-h-screen bg-[#0a1625] text-slate-100 font-sans max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/15 border border-amber-500/30">
            <Trophy className="text-amber-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              SeaBite Rewards Club
            </h1>
            <p className="text-xs text-slate-400">Earn points on orders, maintain checkout streaks, and unlock exclusive discounts</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns: Tier Info & Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Tier Progress Card */}
          <div className="bg-gradient-to-br from-[#1a2333] to-[#0f172a] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
            {/* Background design glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full opacity-10 bg-amber-500 blur-xl" />

            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Membership Tier</span>
                <span className="text-3xl font-extrabold text-white mt-1 block flex items-center gap-2">
                  {loyalty.tier} Tier <Award size={24} className="text-amber-400" />
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Points Balance</span>
                <span className="text-3xl font-bold text-amber-400 mt-1 block">{loyalty.totalPoints || 0} pts</span>
              </div>
            </div>

            {/* Progress bar to next tier */}
            <div className="mt-8 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-400">
                <span>Progress to {loyalty.tierProgress?.nextTier}</span>
                <span>{loyalty.tierProgress?.currentPoints} / {loyalty.tierProgress?.nextTierThreshold} PTS</span>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full"
                  style={{ width: `${loyalty.tierProgress?.progressPct || 0}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 text-left pt-1">
                You need {loyalty.tierProgress?.nextTierThreshold - loyalty.tierProgress?.currentPoints} more points to reach {loyalty.tierProgress?.nextTier} level.
              </p>
            </div>
          </div>

          {/* Card: Active Benefits */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-400" /> Active Tier Privileges
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Extra Discount</span>
                <span className="text-lg font-bold text-white mt-1 block">{loyalty.activeBenefits?.discountPct || 0}% OFF</span>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Free Delivery</span>
                <span className="text-lg font-bold text-white mt-1 block">{loyalty.activeBenefits?.freeDelivery ? "Yes" : "No"}</span>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Exclusive Sales</span>
                <span className="text-lg font-bold text-white mt-1 block">{loyalty.activeBenefits?.earlyAccess ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Gamification Checkin & Streaks */}
        <div className="space-y-6">
          {/* Card: Streaks & Checkin */}
          <div className="bg-[#1a2333] border border-white/5 rounded-3xl p-6 space-y-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Checkout Streak</span>
                <span className="text-2xl font-black text-white mt-1 block flex items-center gap-2">
                  {loyalty.currentStreak || 0} Days <Flame className="text-amber-500 animate-pulse" size={24} />
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Longest Streak</span>
                <span className="text-sm font-bold text-slate-400 block">{loyalty.longestStreak || 0} Days</span>
              </div>
            </div>

            <button
              onClick={handleCheckin}
              disabled={checkingIn}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 text-slate-900 font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Calendar size={14} />
              {checkingIn ? "Processing Check-in..." : "Daily Reward Check-in (+10 pts)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
