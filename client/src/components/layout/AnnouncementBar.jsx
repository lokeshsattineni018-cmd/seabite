import { motion, AnimatePresence } from "framer-motion";

export default function AnnouncementBar({ settings }) {
    // If not active or no text, don't render anything
    if (!settings?.active || !settings?.text) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "36px", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    backgroundColor: settings.bgColor || "#1c1917",
                    color: settings.textColor || "#ffffff",
                    width: "100%",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 999, // Ensure it's above everything
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    backdropFilter: "blur(8px)",
                }}
            >
                <style>
                    {`
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
                    `}
                </style>
                <div className="rolling-wrapper" style={{ width: "100%", overflow: "hidden" }}>
                    <div className="marquee-container">
                        {/* Two copies of the content for a seamless loop */}
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
        </AnimatePresence>
    );
}
