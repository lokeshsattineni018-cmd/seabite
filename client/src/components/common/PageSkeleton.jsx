import { motion } from "framer-motion";

export default function PageSkeleton() {
    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto space-y-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="space-y-4">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
                <div className="h-10 md:h-12 bg-slate-200 dark:bg-slate-800 rounded-xl w-3/4 md:w-1/2"></div>
            </div>

            {/* Content Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl col-span-2"></div>
                <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl col-span-1"></div>
            </div>

            {/* List Skeletons */}
            <div className="space-y-4 pt-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl w-full"></div>
                ))}
            </div>
        </div>
    );
}
