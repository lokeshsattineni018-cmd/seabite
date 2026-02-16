import { motion } from "framer-motion";
import { FiTool, FiClock, FiRefreshCw, FiExternalLink } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function Maintenance({ message }) {
    return (
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-600/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-2xl relative z-10"
            >
                <div className="w-20 h-20 bg-blue-600/10 border border-blue-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 relative">
                    <FiTool size={40} className="text-blue-500" />
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center"
                    >
                        <FiRefreshCw size={14} className="text-blue-400" />
                    </motion.div>
                </div>

                <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-6 leading-none">
                    Upgrading the <br /> <span className="text-blue-500">Supply Chain</span>
                </h1>

                <p className="text-slate-400 text-lg md:text-xl font-medium mb-10 leading-relaxed max-w-lg mx-auto">
                    {message || "We're currently performing scheduled maintenance to bring you an even fresher experience. We'll be back under the surface shortly."}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <div className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3 text-slate-400 font-bold text-sm">
                        <FiClock className="text-blue-500" />
                        Estimated: 30 Minutes
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/10 active:scale-95"
                    >
                        Check Status <FiRefreshCw size={16} />
                    </button>
                </div>

                <div className="mt-16 pt-8 border-t border-slate-900 flex flex-col items-center gap-4">
                    <p className="text-slate-600 text-xs font-black uppercase tracking-widest">Connect with our support catch</p>
                    <div className="flex gap-6">
                        <Link to="/contact" className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold underline underline-offset-4">
                            Support <FiExternalLink size={12} />
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Aesthetic Floating Circles */}
            <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 left-10 w-4 h-4 rounded-full bg-blue-500/20 blur-sm"
            />
            <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-1/4 right-10 w-6 h-6 rounded-full bg-cyan-500/20 blur-sm"
            />
        </div>
    );
}
