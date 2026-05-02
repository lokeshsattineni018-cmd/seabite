import { motion, AnimatePresence } from "framer-motion";

export default function AnnouncementBar({ settings }) {
    return (
        <AnimatePresence>
            {settings?.active && (
                <motion.div
                    initial={{ y: -40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -40, opacity: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "40px",
                        backgroundColor: settings.bgColor || "#1A2E2C",
                        color: settings.textColor || "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 110,
                        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                        padding: "0 20px",
                        textAlign: "center",
                        fontSize: "13px",
                        fontWeight: 700,
                        letterSpacing: "0.03em"
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                    >
                        {settings.text}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
