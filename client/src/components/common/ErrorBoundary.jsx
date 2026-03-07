import { useState } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes floatA {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    40%       { transform: translateY(-16px) rotate(4deg); }
    70%       { transform: translateY(-8px) rotate(-2deg); }
  }
  @keyframes floatB {
    0%, 100% { transform: translateY(0px) rotate(2deg); }
    50%       { transform: translateY(-20px) rotate(-3deg); }
  }
  @keyframes floatC {
    0%, 100% { transform: translateY(0px) rotate(-1deg); }
    45%       { transform: translateY(-12px) rotate(3deg); }
  }
  @keyframes driftFish {
    0%, 100% { transform: translateX(0) rotate(-2deg); }
    50%       { transform: translateX(-8px) rotate(2deg); }
  }
  @keyframes orbitA {
    from { transform: rotate(0deg)   translateX(48px) rotate(0deg); }
    to   { transform: rotate(360deg) translateX(48px) rotate(-360deg); }
  }
  @keyframes orbitB {
    from { transform: rotate(120deg)  translateX(48px) rotate(-120deg); }
    to   { transform: rotate(480deg)  translateX(48px) rotate(-480deg); }
  }
  @keyframes orbitC {
    from { transform: rotate(240deg)  translateX(48px) rotate(-240deg); }
    to   { transform: rotate(600deg)  translateX(48px) rotate(-600deg); }
  }
  @keyframes spinRing {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes spinRingRev {
    from { transform: rotate(0deg); }
    to   { transform: rotate(-360deg); }
  }
  @keyframes breatheBlob {
    0%, 100% { transform: scale(1);    opacity: 0.5; }
    50%       { transform: scale(1.08); opacity: 0.8; }
  }
  @keyframes pulseOut {
    0%   { transform: scale(0.92); opacity: 0.6; }
    70%  { transform: scale(1.15); opacity: 0; }
    100% { transform: scale(1.15); opacity: 0; }
  }
  @keyframes lineGrow {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  @keyframes tagFloat {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-5px); }
  }

  .btn-primary {
    transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .btn-primary:hover {
    background: #ea580c !important;
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(234,88,12,0.3) !important;
  }
  .btn-secondary {
    transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .btn-secondary:hover {
    border-color: #0f172a !important;
    background: #0f172a !important;
    color: #fff !important;
    transform: translateY(-2px);
  }
`;

function Ghost({ emoji, style, anim, delay, dur, size = 26 }) {
    return (
        <span style={{
            position: "absolute", fontSize: size,
            animation: `${anim} ${dur}s ease-in-out ${delay}s infinite`,
            userSelect: "none", pointerEvents: "none",
            ...style,
        }}>{emoji}</span>
    );
}

export default function SeaBiteError() {
    const [hovered, setHovered] = useState(false);

    return (
        <>
            <style>{STYLES}</style>
            <div style={{
                minHeight: "100vh",
                background: "#F8F7F4",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Syne', sans-serif",
                padding: "24px",
                position: "relative",
                overflow: "hidden",
            }}>

                {/* ── Fine grain texture overlay ── */}
                <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.025, pointerEvents: "none" }}>
                    <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
                    <rect width="100%" height="100%" filter="url(#noise)" />
                </svg>

                {/* ── Blobs ── */}
                <div style={{
                    position: "absolute", width: 600, height: 600, borderRadius: "50%",
                    top: "-200px", right: "-150px",
                    background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 65%)",
                    animation: "breatheBlob 7s ease-in-out infinite",
                    pointerEvents: "none",
                }} />
                <div style={{
                    position: "absolute", width: 500, height: 500, borderRadius: "50%",
                    bottom: "-160px", left: "-100px",
                    background: "radial-gradient(circle, rgba(20,184,166,0.06) 0%, transparent 65%)",
                    animation: "breatheBlob 9s ease-in-out 3s infinite",
                    pointerEvents: "none",
                }} />

                {/* ── Ghost emojis ── */}
                <Ghost emoji="🐟" anim="floatA" delay={0} dur={5.5} size={24} style={{ top: "9%", left: "5%", opacity: 0.12 }} />
                <Ghost emoji="🦐" anim="floatB" delay={1.3} dur={6.2} size={20} style={{ top: "20%", left: "13%", opacity: 0.10 }} />
                <Ghost emoji="🦀" anim="floatC" delay={0.7} dur={5.8} size={22} style={{ top: "8%", right: "8%", opacity: 0.11 }} />
                <Ghost emoji="🐠" anim="driftFish" delay={2.0} dur={5.0} size={18} style={{ top: "54%", left: "3.5%", opacity: 0.09 }} />
                <Ghost emoji="🦐" anim="floatA" delay={2.6} dur={6.0} size={16} style={{ bottom: "22%", left: "11%", opacity: 0.09 }} />
                <Ghost emoji="🦀" anim="floatB" delay={0.4} dur={6.4} size={22} style={{ bottom: "15%", right: "6%", opacity: 0.11 }} />
                <Ghost emoji="🐟" anim="floatC" delay={1.6} dur={5.6} size={18} style={{ top: "40%", right: "4.5%", opacity: 0.08 }} />
                <Ghost emoji="🐡" anim="floatA" delay={3.1} dur={5.2} size={20} style={{ bottom: "8%", right: "22%", opacity: 0.09 }} />

                {/* ── CARD ── */}
                <div style={{
                    maxWidth: "460px", width: "100%",
                    background: "#ffffff",
                    borderRadius: "24px",
                    border: "1px solid rgba(0,0,0,0.06)",
                    padding: "56px 44px 48px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.07), 0 0 0 1px rgba(255,255,255,0.8) inset",
                    textAlign: "center",
                    position: "relative", zIndex: 10,
                    animation: "fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.05s both",
                }}>

                    {/* Orange pill top accent */}
                    <div style={{
                        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                        width: "52px", height: "3px", borderRadius: "0 0 6px 6px",
                        background: "linear-gradient(90deg,#f97316,#fb923c)",
                        animation: "fadeIn 0.5s ease 0.5s both",
                    }} />

                    {/* ── Wordmark ── */}
                    <div style={{ animation: "fadeUp 0.45s ease 0.15s both", marginBottom: "40px" }}>
                        <span style={{
                            fontFamily: "'DM Serif Display', serif",
                            fontSize: "22px", fontWeight: 400,
                            color: "#0f172a", letterSpacing: "0.3px",
                        }}>Sea</span><span style={{
                            fontFamily: "'DM Serif Display', serif",
                            fontSize: "22px", fontWeight: 400,
                            color: "#f97316",
                        }}>Bite</span>
                    </div>

                    {/* ── Orbit system ── */}
                    <div
                        style={{
                            position: "relative", width: "116px", height: "116px",
                            margin: "0 auto 40px",
                            animation: "fadeUp 0.45s ease 0.25s both",
                            cursor: "default",
                        }}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                    >
                        {/* Outer dashed ring */}
                        <div style={{
                            position: "absolute", inset: "-2px", borderRadius: "50%",
                            border: "1.5px dashed rgba(249,115,22,0.2)",
                            animation: "spinRing 22s linear infinite",
                        }} />
                        {/* Inner solid ring */}
                        <div style={{
                            position: "absolute", inset: "16px", borderRadius: "50%",
                            border: "1px solid rgba(249,115,22,0.12)",
                            animation: "spinRingRev 14s linear infinite",
                        }} />
                        {/* Pulse on hover */}
                        {hovered && <div style={{
                            position: "absolute", inset: "-6px", borderRadius: "50%",
                            border: "2px solid rgba(249,115,22,0.35)",
                            animation: "pulseOut 0.8s ease-out forwards",
                        }} />}
                        {/* Center */}
                        <div style={{
                            position: "absolute", inset: "24px", borderRadius: "50%",
                            background: "linear-gradient(135deg,#fff7ed,#ffedd5)",
                            border: "1px solid rgba(249,115,22,0.15)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "30px",
                            boxShadow: "0 2px 12px rgba(249,115,22,0.12)",
                        }}>🌊</div>
                        {/* Orbiting emojis */}
                        {[
                            { emoji: "🐟", anim: "orbitA", dur: "7s" },
                            { emoji: "🦐", anim: "orbitB", dur: "7s" },
                            { emoji: "🦀", anim: "orbitC", dur: "7s" },
                        ].map(({ emoji, anim, dur }) => (
                            <span key={emoji} style={{
                                position: "absolute", top: "50%", left: "50%",
                                marginTop: "-11px", marginLeft: "-11px",
                                fontSize: "17px",
                                animation: `${anim} ${dur} linear infinite`,
                                display: "inline-block",
                            }}>{emoji}</span>
                        ))}
                    </div>

                    {/* ── Heading ── */}
                    <h1 style={{
                        fontFamily: "'DM Serif Display', serif",
                        fontSize: "32px", fontWeight: 400,
                        color: "#0f172a", lineHeight: 1.25,
                        marginBottom: "14px",
                        animation: "fadeUp 0.45s ease 0.35s both",
                    }}>
                        Something went{" "}
                        <span style={{ fontStyle: "italic", color: "#f97316" }}>adrift</span>
                    </h1>

                    {/* Accent line */}
                    <div style={{
                        width: "36px", height: "2px", borderRadius: "2px",
                        background: "#f97316", margin: "0 auto 22px",
                        transformOrigin: "left center",
                        animation: "lineGrow 0.6s cubic-bezier(0.22,1,0.36,1) 0.6s both",
                    }} />

                    {/* ── Body ── */}
                    <p style={{
                        color: "#64748b", fontSize: "14.5px", lineHeight: 1.85,
                        fontWeight: 400,
                        marginBottom: "40px",
                        animation: "fadeUp 0.45s ease 0.45s both",
                    }}>
                        An unexpected current swept this page away.<br />
                        Your{" "}
                        <span style={{ color: "#0f172a", fontWeight: 600, fontSize: "15px" }}>
                            🐟 fish&nbsp;&nbsp;🦐 prawns&nbsp;&nbsp;🦀 crabs
                        </span>
                        {" "}are safe — let's get you back.
                    </p>

                    {/* ── Buttons ── */}
                    <div style={{
                        display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap",
                        animation: "fadeUp 0.45s ease 0.55s both",
                    }}>
                        <button className="btn-primary" style={{
                            padding: "12px 26px", borderRadius: "10px",
                            background: "#f97316", color: "#fff",
                            fontFamily: "'Syne', sans-serif",
                            fontWeight: 600, fontSize: "13.5px", letterSpacing: "0.3px",
                            border: "none", cursor: "pointer",
                            boxShadow: "0 4px 16px rgba(249,115,22,0.22)",
                        }}>↺ &nbsp;Refresh Page</button>

                        <button className="btn-secondary" style={{
                            padding: "12px 26px", borderRadius: "10px",
                            background: "transparent", color: "#0f172a",
                            fontFamily: "'Syne', sans-serif",
                            fontWeight: 600, fontSize: "13.5px", letterSpacing: "0.3px",
                            border: "1.5px solid rgba(0,0,0,0.14)", cursor: "pointer",
                        }}>⌂ &nbsp;Back to Shore</button>
                    </div>

                    {/* ── Floating tags ── */}
                    <div style={{
                        display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap",
                        marginTop: "36px",
                        animation: "fadeUp 0.45s ease 0.7s both",
                    }}>
                        {["🐟 Fresh Fish", "🦐 Prawns", "🦀 Crabs"].map((label, i) => (
                            <span key={label} style={{
                                padding: "5px 12px",
                                borderRadius: "999px",
                                background: "#f8f7f4",
                                border: "1px solid rgba(0,0,0,0.07)",
                                fontSize: "11.5px", fontWeight: 500,
                                color: "#94a3b8", letterSpacing: "0.3px",
                                animation: `tagFloat ${2.5 + i * 0.4}s ease-in-out ${i * 0.3}s infinite`,
                            }}>{label}</span>
                        ))}
                    </div>

                    {/* ── Footer ── */}
                    <p style={{
                        marginTop: "32px", fontSize: "11px",
                        color: "#cbd5e1", letterSpacing: "1.2px",
                        textTransform: "uppercase", fontWeight: 600,
                        animation: "fadeIn 0.5s ease 0.85s both",
                    }}>
                        SeaBite · Ocean to Door
                    </p>

                </div>
            </div>
        </>
    );
}