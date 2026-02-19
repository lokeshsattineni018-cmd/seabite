import { motion } from "framer-motion";

export default function AnnouncementBar({ settings }) {
    if (!settings || !settings.active) return null;

    return (
        <div
            className="w-full py-2.5 px-4 text-center text-xs md:text-sm font-bold tracking-wide relative z-[60]"
            style={{
                backgroundColor: settings.bgColor || "#000",
                color: settings.textColor || "#fff"
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
