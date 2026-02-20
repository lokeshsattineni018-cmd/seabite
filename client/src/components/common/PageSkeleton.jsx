import { motion } from "framer-motion";

export default function PageSkeleton() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto space-y-8"
        >
            <style>{`
                @keyframes shimmer-sweep {
                  0% { background-position: -200% 0; }
                  100% { background-position: 200% 0; }
                }
                .skeleton-shimmer {
                  background: linear-gradient(90deg, #E2EEEC 25%, #F4F9F8 50%, #E2EEEC 75%);
                  background-size: 400% 100%;
                  animation: shimmer-sweep 2s infinite cubic-bezier(0.4, 0, 0.2, 1);
                }
                .dark .skeleton-shimmer {
                  background: linear-gradient(90deg, #1A2B35 25%, #2A3F4C 50%, #1A2B35 75%);
                }
            `}</style>

            {/* Header Skeleton */}
            <div className="space-y-4">
                <div className="h-4 skeleton-shimmer rounded w-1/4"></div>
                <div className="h-10 md:h-12 skeleton-shimmer rounded-xl w-3/4 md:w-1/2"></div>
            </div>

            {/* Content Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-64 skeleton-shimmer rounded-2xl col-span-2"></div>
                <div className="h-64 skeleton-shimmer rounded-2xl col-span-1"></div>
            </div>

            {/* List Skeletons */}
            <div className="space-y-4 pt-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 skeleton-shimmer rounded-xl w-full"></div>
                ))}
            </div>
        </motion.div>
    );
}
