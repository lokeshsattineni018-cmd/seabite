import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { FiX } from "react-icons/fi";
import { FaCookie } from "react-icons/fa";

export default function CookieConsent() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("seabite_cookie_consent");
        if (!consent) {
            // Small delay so it doesn't pop up instantly on load
            const t = setTimeout(() => setShow(true), 2000);
            return () => clearTimeout(t);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem("seabite_cookie_consent", "true");
        setShow(false);
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[400px] z-[9999]"
                >
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden">
                        {/* Decoration */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-500/10 to-transparent rounded-bl-full -mr-4 -mt-4 pointer-events-none" />

                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                                <FaCookie size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                                    We use cookies 🍪
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    We use cookies to improve your experience and analyze traffic. Read our{" "}
                                    <Link to="/privacy" className="text-teal-600 dark:text-teal-400 hover:underline font-medium">Privacy Policy</Link>.
                                </p>
                            </div>
                            <button
                                onClick={() => setShow(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 self-start"
                            >
                                <FiX size={16} />
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleAccept}
                                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
                            >
                                Accept All
                            </button>
                            <button
                                onClick={() => setShow(false)}
                                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold py-2.5 rounded-xl transition-colors"
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
