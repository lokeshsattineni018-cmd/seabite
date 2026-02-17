import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const BannerPopup = ({ bannerSettings, onClose }) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Check if banner is active and if we should show it
        if (bannerSettings?.active && bannerSettings?.imageUrl) {
            const hasSeenBanner = sessionStorage.getItem("hasSeenBanner");
            if (!hasSeenBanner) {
                // Delay slightly for better UX
                const timer = setTimeout(() => setIsOpen(true), 1500);
                return () => clearTimeout(timer);
            }
        }
    }, [bannerSettings]);

    const handleClose = () => {
        setIsOpen(false);
        sessionStorage.setItem("hasSeenBanner", "true");
        if (onClose) onClose();
    };

    const handleLinkClick = () => {
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                onClick={handleClose}
            >
                <motion.div
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-lg bg-transparent rounded-3xl overflow-hidden shadow-2xl"
                >
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 z-20 bg-white/20 backdrop-blur-md text-white hover:bg-white/40 p-2 rounded-full transition-all"
                    >
                        <X size={20} />
                    </button>

                    {bannerSettings.link ? (
                        bannerSettings.link.startsWith("http") ? (
                            <a href={bannerSettings.link} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick} className="block group relative">
                                <img
                                    src={bannerSettings.imageUrl}
                                    alt="Special Offer"
                                    className="w-full h-auto object-cover rounded-3xl"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-slate-900 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                        Explore <ExternalLink size={14} />
                                    </span>
                                </div>
                            </a>
                        ) : (
                            <Link to={bannerSettings.link} onClick={handleLinkClick} className="block group relative">
                                <img
                                    src={bannerSettings.imageUrl}
                                    alt="Special Offer"
                                    className="w-full h-auto object-cover rounded-3xl"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-slate-900 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                        View Offer <ExternalLink size={14} />
                                    </span>
                                </div>
                            </Link>
                        )
                    ) : (
                        <img
                            src={bannerSettings.imageUrl}
                            alt="Special Offer"
                            className="w-full h-auto object-cover rounded-3xl"
                        />
                    )}

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default BannerPopup;
