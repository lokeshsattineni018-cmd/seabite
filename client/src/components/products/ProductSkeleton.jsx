import { motion } from "framer-motion";

export default function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden p-4 space-y-4 animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-square bg-slate-100 rounded-xl relative overflow-hidden">
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />
      </div>
      
      {/* Content Skeletons */}
      <div className="space-y-2">
        <div className="h-3 bg-slate-100 rounded-md w-1/4" />
        <div className="h-4 bg-slate-100 rounded-md w-3/4" />
        <div className="h-4 bg-slate-100 rounded-md w-1/2" />
      </div>
      
      {/* Button Skeleton */}
      <div className="h-10 bg-slate-100 rounded-lg w-full mt-4" />
    </div>
  );
}
