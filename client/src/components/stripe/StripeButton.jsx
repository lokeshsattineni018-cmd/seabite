import { motion } from "framer-motion";

export default function StripeButton({
    children,
    onClick,
    loading = false,
    disabled = false,
    style = {},
    type = "button"
}) {
    return (
        <motion.button
            type={type}
            whileHover={{
                scale: 1.02,
                boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            }}
            whileTap={{
                scale: 0.96,
            }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
            }}
            onClick={onClick}
            disabled={disabled || loading}
            style={{
                height: 48,
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg,#635BFF,#7A73FF)",
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: "-0.01em",
                cursor: (disabled || loading) ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                position: "relative",
                overflow: "hidden",
                opacity: (disabled || loading) ? 0.75 : 1,
                ...style,
            }}
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: loading ? 1 : 0 }}
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    style={{
                        width: 16,
                        height: 16,
                        border: "2px solid rgba(255,255,255,0.5)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                    }}
                />
            </motion.div>

            <motion.span
                animate={{ opacity: loading ? 0 : 1 }}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
                {children}
            </motion.span>
        </motion.button>
    );
}
