import { motion } from "framer-motion";
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiShield } from "react-icons/fi";

export default function UserInfo({ user }) {
    if (!user) return null;

    const infoItems = [
        { icon: FiUser, label: "Full Name", value: user.name },
        { icon: FiMail, label: "Email Address", value: user.email },
        { icon: FiPhone, label: "Phone Number", value: user.phone || "Not provided" },
        { icon: FiMapPin, label: "Primary Address", value: user.address || "No address saved" },
        {
            icon: FiCalendar,
            label: "Member Since",
            value: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"
        },
        {
            icon: FiShield,
            label: "Account Type",
            value: user.role === "admin" ? "Administrator" : "Customer",
            highlight: user.role === "admin"
        }
    ];

    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-white/5 relative overflow-hidden">

            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-8 relative z-10">
                Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 relative z-10">
                {infoItems.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
                                <item.icon size={18} />
                            </div>
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                {item.label}
                            </span>
                        </div>
                        <div className={`pl-11 text-base font-medium ${item.highlight ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-700 dark:text-slate-200'}`}>
                            {item.value}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
