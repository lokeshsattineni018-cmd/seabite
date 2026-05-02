import { motion, AnimatePresence } from "framer-motion";

export default function AnnouncementBar({ settings }) {
    if (!settings?.active || !settings?.text) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "36px", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    backgroundColor: settings.bgColor || "#1A2E2C",
                    color: settings.textColor || "#ffffff",
                    width: "100%",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    position: "relative",
                    zIndex: 40,
                    borderBottom: "1px solid rgba(255,255,255,0.1)"
                }}
            >
                <style>
                    {`
                    @keyframes marquee {
                        0% { transform: translateX(100%); }
                        100% { transform: translateX(-100%); }
                    }
                    .rolling-text {
                        animation: marquee 15s linear infinite;
                        white-space: nowrap;
                        padding-left: 20px;
                        display: inline-block;
                        font-family: 'Sora', sans-serif;
                        font-size: 11px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.1em;
                    }
                    .rolling-container:hover .rolling-text {
                        animation-play-state: paused;
                    }
                    `}
                </style>
                <div className="rolling-container" style={{ width: "100%", overflow: "hidden" }}>
                    <div className="rolling-text">
                        {settings.text} • {settings.text} • {settings.text} • {settings.text}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
