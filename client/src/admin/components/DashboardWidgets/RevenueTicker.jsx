import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export default function RevenueTicker({ revenue = 0, previousRevenue = 0, label = "Today's Revenue" }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const start = prevValue.current;
    const end = revenue;
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      const current = Math.round(start + (end - start) * eased);
      setDisplayValue(current);

      if (progress < 1) requestAnimationFrame(animate);
      else prevValue.current = end;
    };

    requestAnimationFrame(animate);
  }, [revenue]);

  const changePct = previousRevenue > 0
    ? Math.round(((revenue - previousRevenue) / previousRevenue) * 100)
    : 0;
  const isUp = changePct >= 0;

  const formatCurrency = (val) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val.toLocaleString()}`;
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-[#fbfbfa] to-white border border-stone-200 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated glow effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #5BBFB5 0%, transparent 70%)" }} />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 border border-emerald-100">
            <DollarSign size={16} className="text-emerald-600" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</span>
        </div>

        <div className="flex items-end gap-3">
          <motion.span
            className="text-4xl font-bold text-stone-900 tabular-nums"
            style={{ fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}
            key={displayValue}
          >
            {formatCurrency(displayValue)}
          </motion.span>

          <AnimatePresence mode="wait">
            {changePct !== 0 && (
              <motion.div
                key={changePct}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${
                  isUp ? "bg-emerald-50 text-emerald-600 border-emerald-100/50" : "bg-rose-50 text-rose-600 border-rose-100/50"
                }`}
              >
                {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {isUp ? "+" : ""}{changePct}%
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mini sparkline dots */}
        <div className="flex items-center gap-1 mt-3">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: 4,
                height: Math.max(4, Math.random() * 16 + 4),
                background: i === 11 ? "#5BBFB5" : "rgba(91, 191, 181, 0.3)",
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
