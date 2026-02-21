import { motion } from "framer-motion";

export default function AnnouncementBar({ settings }) {
    if (!settings || !settings.active) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0, left: 0, right: 0,
                zIndex: 110,
                padding: "8px 16px",
                textAlign: "center",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.03em",
                backgroundColor: settings.bgColor || "#1A2B35",
                color: settings.textColor || "#fff",
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {settings.text}
            </motion.div>
        </div>
    );
}
