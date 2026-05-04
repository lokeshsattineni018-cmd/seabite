import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

export default function AnnouncementBar({ settings }) {
    const [visible, setVisible] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY < 60);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const isAdminPage = location.pathname.startsWith("/admin") || location.pathname.startsWith("/command-center");

    if (!settings?.active || !settings?.text || isAdminPage) return null;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    key="announcement"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "36px", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1200,
                        backgroundColor: settings.bgColor || "#ffffff",
                        color: settings.textColor || "#000000",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                >
                    <style>{`
                        @keyframes marquee-seamless {
                            0% { transform: translateX(0); }
                            100% { transform: translateX(-50%); }
                        }
                        .marquee-container {
                            display: flex;
                            width: fit-content;
                            animation: marquee-seamless 60s linear infinite;
                            will-change: transform;
                        }
                        .marquee-content {
                            display: flex;
                            align-items: center;
                            white-space: nowrap;
                            flex-shrink: 0;
                            padding-right: 50px;
                        }
                        .marquee-item {
                            font-family: 'Plus Jakarta Sans', sans-serif;
                            font-size: 11px;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.15em;
                            display: flex;
                            align-items: center;
                        }
                        .marquee-dot {
                            width: 4px;
                            height: 4px;
                            border-radius: 50%;
                            background-color: currentColor;
                            margin: 0 30px;
                            opacity: 0.5;
                        }
                        .rolling-wrapper:hover .marquee-container {
                            animation-play-state: paused;
                        }
                    `}</style>
                    <div className="rolling-wrapper" style={{ width: "100%", overflow: "hidden" }}>
                        <div className="marquee-container">
                            <div className="marquee-content">
                                {[...Array(6)].map((_, i) => (
                                    <div key={`set1-${i}`} className="marquee-item">
                                        {settings.text}
                                        <div className="marquee-dot" />
                                    </div>
                                ))}
                            </div>
                            <div className="marquee-content">
                                {[...Array(6)].map((_, i) => (
                                    <div key={`set2-${i}`} className="marquee-item">
                                        {settings.text}
                                        <div className="marquee-dot" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
