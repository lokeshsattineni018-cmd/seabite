import { motion } from "framer-motion";

const COLORS = {
  primary: "#5BA8A0",
  primaryDark: "#3D8C85",
  primarySoft: "rgba(91,168,160,0.08)",
  border: "#E2EEEC",
  textDark: "#1A2B35",
  textMid: "#4A6572",
  textLite: "#8BA5B3",
  surface: "#ffffff",
};

const baseStyle = {
  borderRadius: 999,
  fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: "-0.01em",
  border: "none",
  outline: "none",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  transition: "box-shadow 0.18s ease, background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.12s ease",
  whiteSpace: "nowrap",
};

const sizeStyles = {
  sm: {
    padding: "7px 13px",
    fontSize: 11,
  },
  md: {
    padding: "11px 18px",
    fontSize: 12,
  },
  lg: {
    padding: "14px 22px",
    fontSize: 13,
  },
};

const variantStyles = {
  primary: {
    background: COLORS.primary,
    color: "#fff",
    boxShadow: "0 6px 18px rgba(91,168,160,0.35)",
    border: "none",
  },
  secondary: {
    background: COLORS.surface,
    color: COLORS.textDark,
    border: `1px solid ${COLORS.border}`,
    boxShadow: "0 2px 10px rgba(26,43,53,0.04)",
  },
  ghost: {
    background: "transparent",
    color: COLORS.textMid,
    border: `1px solid rgba(226,238,236,0.9)`,
    boxShadow: "none",
  },
  link: {
    background: "transparent",
    color: COLORS.primary,
    border: "none",
    boxShadow: "none",
    padding: 0,
    fontWeight: 600,
  },
};

const disabledStyle = {
  opacity: 0.7,
  cursor: "not-allowed",
  boxShadow: "none",
};

function Spinner() {
  return (
    <span
      style={{
        width: 14,
        height: 14,
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.4)",
        borderTopColor: "#fff",
        animation: "sb_spin 0.8s linear infinite",
      }}
    />
  );
}

/**
 * Stripe-style animated button with shared motion + visual system.
 *
 * Props:
 * - variant: "primary" | "secondary" | "ghost" | "link"
 * - size: "sm" | "md" | "lg"
 * - fullWidth: boolean
 * - loading: boolean
 * - disabled: boolean
 * - children: ReactNode
 */
export default function StripeButton({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled = false,
  children,
  style = {},
  ...rest
}) {
  const isDisabled = disabled || loading;
  const variantStyle = variantStyles[variant] || variantStyles.primary;
  const sizeStyle = sizeStyles[size] || sizeStyles.md;

  const hover = isDisabled || variant === "link"
    ? {}
    : {
        y: -2,
        boxShadow:
          variant === "primary"
            ? "0 10px 28px rgba(91,168,160,0.40)"
            : "0 4px 16px rgba(26,43,53,0.12)",
      };

  const tap = isDisabled || variant === "link"
    ? {}
    : {
        scale: 0.97,
        y: 0,
        boxShadow: "0 2px 8px rgba(26,43,53,0.18)",
      };

  return (
    <>
      <motion.button
        whileHover={hover}
        whileTap={tap}
        disabled={isDisabled}
        style={{
          ...baseStyle,
          ...sizeStyle,
          ...variantStyle,
          ...(fullWidth ? { width: "100%" } : {}),
          ...(isDisabled ? disabledStyle : {}),
          ...style,
        }}
        {...rest}
      >
        {loading && variant !== "link" ? <Spinner /> : children}
      </motion.button>
      <style>{`
        @keyframes sb_spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

