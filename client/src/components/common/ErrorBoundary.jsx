import React from "react";
import { Link } from "react-router-dom";

/* ─── Keyframe injection ─── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');

  @keyframes floatUp {
    0%   { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
    50%  { transform: translateY(-28px) rotate(8deg); opacity: 1; }
    100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
  }
  @keyframes floatUpB {
    0%   { transform: translateY(0px) rotate(-5deg) scaleX(-1); opacity: 0.6; }
    50%  { transform: translateY(-22px) rotate(5deg) scaleX(-1); opacity: 1; }
    100% { transform: translateY(0px) rotate(-5deg) scaleX(-1); opacity: 0.6; }
  }
  @keyframes floatUpC {
    0%   { transform: translateY(0px) rotate(3deg); opacity: 0.5; }
    50%  { transform: translateY(-32px) rotate(-6deg); opacity: 0.9; }
    100% { transform: translateY(0px) rotate(3deg); opacity: 0.5; }
  }
  @keyframes bubbleRise {
    0%   { transform: translateY(0) scale(1); opacity: 0.7; }
    80%  { opacity: 0.4; }
    100% { transform: translateY(-120px) scale(1.4); opacity: 0; }
  }
  @keyframes waveScroll {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes shimmer {
    0%   { opacity: 0.15; transform: scaleX(0.95) skewY(-2deg); }
    50%  { opacity: 0.3;  transform: scaleX(1.05) skewY(2deg); }
    100% { opacity: 0.15; transform: scaleX(0.95) skewY(-2deg); }
  }
  @keyframes slideIn {
    0%   { opacity: 0; transform: translateY(40px) scale(0.95); }
    100% { opacity: 1; transform: translateY(0px) scale(1); }
  }
  @keyframes pulseGlow {
    0%   { box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.4); }
    70%  { box-shadow: 0 0 0 14px rgba(255, 107, 53, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 107, 53, 0); }
  }
  @keyframes wiggle {
    0%, 100% { transform: rotate(0deg) scale(1.1); }
    25%  { transform: rotate(-8deg) scale(1.15); }
    75%  { transform: rotate(8deg) scale(1.15); }
  }
  @keyframes swimLeft {
    0%   { transform: translateX(0px) rotate(-3deg); }
    50%  { transform: translateX(-8px) rotate(3deg); }
    100% { transform: translateX(0px) rotate(-3deg); }
  }
  @keyframes fadeInUp {
    from { opacity:0; transform: translateY(18px); }
    to   { opacity:1; transform: translateY(0); }
  }
  @keyframes crackle {
    0%, 100% { filter: drop-shadow(0 0 6px rgba(255,107,53,0.7)); }
    50%       { filter: drop-shadow(0 0 18px rgba(255,107,53,1)); }
  }

  .sb-btn-primary:hover {
    transform: translateY(-3px) scale(1.04);
    box-shadow: 0 12px 32px rgba(255, 107, 53, 0.45) !important;
  }
  .sb-btn-secondary:hover {
    transform: translateY(-3px) scale(1.04);
    background: rgba(255,107,53,0.15) !important;
  }
  .sb-card {
    animation: slideIn 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
`;

/* ─── Floating sea creature ─── */
function SeaCreature({ emoji, style, animName, delay, size = 36 }) {
    return (
        <span
            style={{
                position: "absolute",
                fontSize: size,
                animation: `${animName} ${3 + Math.random() * 2}s ease-in-out ${delay}s infinite`,
                userSelect: "none",
                pointerEvents: "none",
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.18))",
                ...style,
            }}
        >
            {emoji}
        </span>
    );
}

/* ─── Rising bubble ─── */
function Bubble({ style, delay, size = 10 }) {
    return (
        <span
            style={{
                position: "absolute",
                width: size,
                height: size,
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.45)",
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(4px)",
                animation: `bubbleRise ${2.5 + Math.random() * 2}s ease-in ${delay}s infinite`,
                pointerEvents: "none",
                ...style,
            }}
        />
    );
}

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = "/";
    };

    render() {
        if (this.state.hasError) {
            return (
                <>
                    <style>{STYLES}</style>

                    {/* ── Ocean background ── */}
                    <div
                        style={{
                            minHeight: "100vh",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "'DM Sans', sans-serif",
                            padding: "24px",
                            position: "relative",
                            overflow: "hidden",
                            background:
                                "linear-gradient(160deg, #0b1e3d 0%, #0e3558 30%, #0a5c6e 60%, #0e8c7e 100%)",
                        }}
                    >
                        {/* animated gradient shimmer layer */}
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                background:
                                    "linear-gradient(270deg, rgba(14,140,126,0.25), rgba(11,30,61,0.0), rgba(14,140,126,0.25))",
                                backgroundSize: "400% 400%",
                                animation: "waveScroll 8s ease infinite",
                                pointerEvents: "none",
                            }}
                        />

                        {/* sparkle shimmer bar */}
                        <div
                            style={{
                                position: "absolute",
                                top: "35%",
                                left: "-10%",
                                width: "120%",
                                height: "2px",
                                background:
                                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.3) 40%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.3) 60%, transparent)",
                                animation: "shimmer 4s ease-in-out infinite",
                                pointerEvents: "none",
                            }}
                        />

                        {/* ── Floating sea creatures ── */}
                        <SeaCreature emoji="🐟" animName="floatUp" delay={0} style={{ top: "12%", left: "8%" }} size={42} />
                        <SeaCreature emoji="🦐" animName="floatUpC" delay={0.8} style={{ top: "20%", left: "18%" }} size={38} />
                        <SeaCreature emoji="🦀" animName="floatUpB" delay={1.4} style={{ top: "10%", right: "10%" }} size={44} />
                        <SeaCreature emoji="🐠" animName="swimLeft" delay={0.3} style={{ top: "55%", left: "5%" }} size={40} />
                        <SeaCreature emoji="🦐" animName="floatUp" delay={2.1} style={{ bottom: "18%", left: "14%" }} size={34} />
                        <SeaCreature emoji="🦀" animName="floatUpC" delay={0.5} style={{ bottom: "20%", right: "8%" }} size={40} />
                        <SeaCreature emoji="🐟" animName="floatUpB" delay={1.7} style={{ top: "38%", right: "6%" }} size={36} />
                        <SeaCreature emoji="🐡" animName="floatUp" delay={2.6} style={{ bottom: "8%", right: "22%" }} size={38} />

                        {/* ── Bubbles ── */}
                        <Bubble delay={0} size={8} style={{ bottom: "10%", left: "20%" }} />
                        <Bubble delay={0.6} size={12} style={{ bottom: "15%", left: "35%" }} />
                        <Bubble delay={1.2} size={6} style={{ bottom: "8%", left: "60%" }} />
                        <Bubble delay={0.4} size={10} style={{ bottom: "5%", right: "20%" }} />
                        <Bubble delay={1.8} size={7} style={{ bottom: "12%", right: "40%" }} />
                        <Bubble delay={2.2} size={9} style={{ bottom: "20%", right: "55%" }} />

                        {/* ── Card ── */}
                        <div
                            className="sb-card"
                            style={{
                                maxWidth: "520px",
                                width: "100%",
                                background: "rgba(255,255,255,0.06)",
                                backdropFilter: "blur(24px)",
                                WebkitBackdropFilter: "blur(24px)",
                                border: "1px solid rgba(255,255,255,0.14)",
                                padding: "52px 44px 44px",
                                borderRadius: "32px",
                                boxShadow:
                                    "0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                                textAlign: "center",
                                position: "relative",
                                zIndex: 10,
                            }}
                        >
                            {/* logo wordmark */}
                            <div
                                style={{
                                    marginBottom: "28px",
                                    animation: "fadeInUp 0.5s ease 0.15s both",
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: "'Playfair Display', serif",
                                        fontWeight: 900,
                                        fontSize: "26px",
                                        background:
                                            "linear-gradient(135deg, #ff6b35 0%, #ffa45c 100%)",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        letterSpacing: "-0.5px",
                                    }}
                                >
                                    SeaBite
                                </span>
                            </div>

                            {/* icon cluster */}
                            <div
                                style={{
                                    position: "relative",
                                    width: "100px",
                                    height: "100px",
                                    margin: "0 auto 28px",
                                    animation: "fadeInUp 0.5s ease 0.25s both",
                                }}
                            >
                                {/* glow ring */}
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        borderRadius: "50%",
                                        background:
                                            "radial-gradient(circle, rgba(255,107,53,0.3) 0%, transparent 70%)",
                                        animation: "pulseGlow 2s ease-in-out infinite",
                                    }}
                                />
                                {/* center icon */}
                                <div
                                    style={{
                                        width: "100px",
                                        height: "100px",
                                        borderRadius: "50%",
                                        background:
                                            "linear-gradient(135deg, rgba(255,107,53,0.25), rgba(255,164,92,0.12))",
                                        border: "2px solid rgba(255,107,53,0.5)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "46px",
                                        animation: "wiggle 2.4s ease-in-out infinite",
                                    }}
                                >
                                    🚫
                                </div>
                                {/* orbiting mini emojis */}
                                <span
                                    style={{
                                        position: "absolute",
                                        top: "-6px",
                                        right: "-8px",
                                        fontSize: "24px",
                                        animation: "floatUp 2s ease-in-out 0.4s infinite",
                                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                                    }}
                                >
                                    🐟
                                </span>
                                <span
                                    style={{
                                        position: "absolute",
                                        bottom: "-4px",
                                        left: "-10px",
                                        fontSize: "22px",
                                        animation: "floatUpC 2.2s ease-in-out 1s infinite",
                                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                                    }}
                                >
                                    🦐
                                </span>
                                <span
                                    style={{
                                        position: "absolute",
                                        bottom: "6px",
                                        right: "-14px",
                                        fontSize: "22px",
                                        animation: "floatUpB 2.6s ease-in-out 0.2s infinite",
                                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                                    }}
                                >
                                    🦀
                                </span>
                            </div>

                            {/* heading */}
                            <h1
                                style={{
                                    fontFamily: "'Playfair Display', serif",
                                    fontSize: "28px",
                                    fontWeight: "900",
                                    color: "#ffffff",
                                    marginBottom: "12px",
                                    lineHeight: 1.2,
                                    animation: "fadeInUp 0.5s ease 0.35s both",
                                }}
                            >
                                Oops! Something's{" "}
                                <span
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #ff6b35, #ffa45c)",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                    }}
                                >
                                    Fishy
                                </span>
                            </h1>

                            {/* subtext */}
                            <p
                                style={{
                                    color: "rgba(255,255,255,0.62)",
                                    lineHeight: 1.7,
                                    fontSize: "15px",
                                    marginBottom: "36px",
                                    animation: "fadeInUp 0.5s ease 0.45s both",
                                }}
                            >
                                An unexpected wave crashed our page. Don't worry — your
                                freshest catch of{" "}
                                <span
                                    style={{
                                        color: "rgba(255,255,255,0.9)",
                                        fontWeight: 600,
                                    }}
                                >
                                    🐟 fish, 🦐 prawns & 🦀 crabs
                                </span>{" "}
                                are still safe! Let's swim back to safety.
                            </p>

                            {/* CTA buttons */}
                            <div
                                style={{
                                    display: "flex",
                                    gap: "14px",
                                    justifyContent: "center",
                                    flexWrap: "wrap",
                                    animation: "fadeInUp 0.5s ease 0.55s both",
                                }}
                            >
                                <button
                                    className="sb-btn-primary"
                                    onClick={() => window.location.reload()}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        padding: "14px 28px",
                                        borderRadius: "14px",
                                        background:
                                            "linear-gradient(135deg, #ff6b35 0%, #ff9a5c 100%)",
                                        color: "white",
                                        fontWeight: "700",
                                        fontSize: "15px",
                                        border: "none",
                                        cursor: "pointer",
                                        transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)",
                                        boxShadow: "0 6px 20px rgba(255,107,53,0.35)",
                                        animation: "crackle 2.5s ease-in-out infinite",
                                        fontFamily: "'DM Sans', sans-serif",
                                    }}
                                >
                                    🔄 Refresh Page
                                </button>

                                <Link
                                    to="/"
                                    className="sb-btn-secondary"
                                    onClick={this.handleReset}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        padding: "14px 28px",
                                        borderRadius: "14px",
                                        background: "rgba(255,107,53,0.08)",
                                        border: "1px solid rgba(255,107,53,0.35)",
                                        color: "rgba(255,255,255,0.9)",
                                        fontWeight: "700",
                                        fontSize: "15px",
                                        textDecoration: "none",
                                        cursor: "pointer",
                                        transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)",
                                        fontFamily: "'DM Sans', sans-serif",
                                    }}
                                >
                                    🏠 Back to Shore
                                </Link>
                            </div>

                            {/* wave divider */}
                            <div
                                style={{
                                    marginTop: "36px",
                                    height: "1px",
                                    background:
                                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.15) 70%, transparent)",
                                    animation: "fadeInUp 0.5s ease 0.65s both",
                                }}
                            />

                            {/* fun tagline */}
                            <p
                                style={{
                                    marginTop: "18px",
                                    fontSize: "12px",
                                    color: "rgba(255,255,255,0.3)",
                                    letterSpacing: "0.5px",
                                    animation: "fadeInUp 0.5s ease 0.7s both",
                                    fontFamily: "'DM Sans', sans-serif",
                                }}
                            >
                                🌊 SeaBite — Fresh from the ocean to your door
                            </p>

                            {/* dev debug panel */}
                            {process.env.NODE_ENV !== "production" && (
                                <div
                                    style={{
                                        marginTop: "24px",
                                        padding: "16px 18px",
                                        background: "rgba(0,0,0,0.35)",
                                        border: "1px solid rgba(255,77,79,0.4)",
                                        borderRadius: "14px",
                                        fontSize: "11px",
                                        color: "#ff7875",
                                        textAlign: "left",
                                        overflow: "auto",
                                        maxHeight: "160px",
                                        animation: "fadeInUp 0.5s ease 0.8s both",
                                        fontFamily: "monospace",
                                    }}
                                >
                                    <strong
                                        style={{
                                            display: "block",
                                            marginBottom: "8px",
                                            color: "#ff4d4f",
                                            fontSize: "10px",
                                            letterSpacing: "1px",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        🐛 Debug Info — Dev Only
                                    </strong>
                                    <code style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                                        {this.state.error?.toString()}
                                    </code>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;