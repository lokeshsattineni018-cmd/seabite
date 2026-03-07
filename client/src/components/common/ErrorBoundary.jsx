import { useState, useEffect } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes wave {
    0%   { transform: translateX(0) scaleY(1); }
    50%  { transform: translateX(-3%) scaleY(1.04); }
    100% { transform: translateX(0) scaleY(1); }
  }
  @keyframes gentleFloat {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-10px); }
  }
  @keyframes swimAcross {
    0%   { transform: translateX(110vw) scaleX(-1); opacity: 0; }
    5%   { opacity: 1; }
    95%  { opacity: 1; }
    100% { transform: translateX(-10vw) scaleX(-1); opacity: 0; }
  }
  @keyframes swimAcrossR {
    0%   { transform: translateX(-10vw); opacity: 0; }
    5%   { opacity: 1; }
    95%  { opacity: 1; }
    100% { transform: translateX(110vw); opacity: 0; }
  }
  @keyframes crabWalk {
    0%   { transform: translateX(105vw); opacity: 0; }
    5%   { opacity: 1; }
    95%  { opacity: 1; }
    100% { transform: translateX(-10vw); opacity: 0; }
  }
  @keyframes bubbleRise {
    0%   { transform: translateY(0) scale(1); opacity: 0.6; }
    80%  { opacity: 0.3; }
    100% { transform: translateY(-100vh) scale(1.3); opacity: 0; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
  @keyframes pulsePing {
    0%   { transform: scale(1); opacity: 0.8; }
    70%  { transform: scale(2.2); opacity: 0; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  .refresh-btn:hover {
    color: #3b82f6 !important;
    transition: color 0.2s;
  }
  .pill-btn:hover {
    border-color: #3b82f6 !important;
    background: rgba(59,130,246,0.06) !important;
    transition: all 0.2s;
  }
`;

/* ── Sea creature swimming across ── */
function SeaCreature({ type, delay, top, duration, size }) {
    const creatures = {
        fish1: "🐟",
        fish2: "🐠",
        fish3: "🐡",
        crab: "🦀",
        prawn: "🦐",
    };
    const isCrab = type === "crab";
    const goRight = delay % 2 === 0;

    return (
        <span style={{
            position: "absolute",
            top,
            fontSize: size,
            animation: isCrab
                ? `crabWalk ${duration}s linear ${delay}s infinite`
                : goRight
                    ? `swimAcrossR ${duration}s linear ${delay}s infinite`
                    : `swimAcross ${duration}s linear ${delay}s infinite`,
            pointerEvents: "none",
            userSelect: "none",
            opacity: 0,
        }}>
            {creatures[type]}
        </span>
    );
}

/* ── Bubbles ── */
function Bubbles() {
    const bubbles = [
        { left: "8%", size: 7, delay: 0, dur: 7 },
        { left: "18%", size: 11, delay: 1.4, dur: 9 },
        { left: "32%", size: 6, delay: 2.8, dur: 8 },
        { left: "47%", size: 9, delay: 0.6, dur: 10 },
        { left: "61%", size: 5, delay: 3.5, dur: 7.5 },
        { left: "74%", size: 12, delay: 1.1, dur: 11 },
        { left: "86%", size: 7, delay: 4.2, dur: 8.5 },
        { left: "93%", size: 9, delay: 2.0, dur: 9.5 },
    ];
    return (
        <>
            {bubbles.map((b, i) => (
                <div key={i} style={{
                    position: "absolute",
                    bottom: "0",
                    left: b.left,
                    width: b.size,
                    height: b.size,
                    borderRadius: "50%",
                    border: "1.5px solid rgba(59,130,246,0.25)",
                    background: "rgba(59,130,246,0.06)",
                    animation: `bubbleRise ${b.dur}s ease-in ${b.delay}s infinite`,
                    pointerEvents: "none",
                }} />
            ))}
        </>
    );
}

export default function SeaBiteError() {
    const [dark, setDark] = useState(false);

    const bg = dark ? "#0a1625" : "#f4f7fa";
    const cardBg = dark ? "rgba(15,28,50,0.85)" : "rgba(255,255,255,0.85)";
    const border = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
    const text1 = dark ? "#f1f5f9" : "#0f172a";
    const text2 = dark ? "#94a3b8" : "#64748b";
    const text3 = dark ? "#64748b" : "#94a3b8";
    const pillBg = dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.8)";
    const pillBdr = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
    const waveFill1 = dark ? "rgba(30,64,175,0.3)" : "rgba(186,230,253,0.4)";
    const waveFill2 = dark ? "rgba(30,58,138,0.2)" : "rgba(186,230,253,0.25)";

    return (
        <>
            <style>{STYLES}</style>

            {/* Dark mode toggle (preview helper) */}
            <button onClick={() => setDark(d => !d)} style={{
                position: "fixed", top: 16, right: 16, zIndex: 999,
                padding: "6px 14px", borderRadius: "999px",
                background: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)",
                border: `1px solid ${border}`,
                color: text2, fontSize: "12px", fontFamily: "'Inter', sans-serif",
                cursor: "pointer", fontWeight: 500,
                transition: "all 0.3s",
            }}>{dark ? "☀️ Light" : "🌙 Dark"}</button>

            <div style={{
                minHeight: "100vh",
                background: bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Inter', sans-serif",
                padding: "24px",
                position: "relative",
                overflow: "hidden",
                transition: "background 0.5s",
            }}>

                {/* ── Wave SVG bottom ── */}
                <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", pointerEvents: "none" }}>
                    <svg viewBox="0 0 1440 200" style={{ width: "100%", animation: "wave 6s ease-in-out infinite", opacity: 0.6 }} preserveAspectRatio="none">
                        <path d="M0,120 C360,180 720,80 1080,140 C1260,170 1380,100 1440,120 L1440,200 L0,200 Z" fill={waveFill1} />
                    </svg>
                    <svg viewBox="0 0 1440 200" style={{ width: "100%", position: "absolute", bottom: 0, animation: "wave 6s ease-in-out 1s infinite", opacity: 0.4 }} preserveAspectRatio="none">
                        <path d="M0,140 C240,100 480,180 720,130 C960,80 1200,160 1440,130 L1440,200 L0,200 Z" fill={waveFill2} />
                    </svg>
                </div>

                {/* ── Bubbles ── */}
                <Bubbles />

                {/* ── Sea creatures ── */}
                <SeaCreature type="fish1" delay={0} top="20%" duration={18} size={52} />
                <SeaCreature type="fish2" delay={3} top="45%" duration={22} size={38} />
                <SeaCreature type="fish3" delay={1} top="65%" duration={16} size={32} />
                <SeaCreature type="fish1" delay={5} top="35%" duration={25} size={28} />
                <SeaCreature type="fish2" delay={7} top="75%" duration={20} size={44} />
                <SeaCreature type="prawn" delay={2} top="15%" duration={28} size={24} />
                <SeaCreature type="crab" delay={4} top="85%" duration={30} size={48} />
                <SeaCreature type="crab" delay={10} top="88%" duration={35} size={36} />

                {/* ── Main card ── */}
                <div style={{
                    position: "relative", zIndex: 10,
                    textAlign: "center", paddingLeft: "24px", paddingRight: "24px",
                    animation: "gentleFloat 5s ease-in-out infinite",
                    maxWidth: "480px", width: "100%",
                }}>

                    {/* Logo */}
                    <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center", animation: "fadeUp 0.5s ease 0.1s both" }}>
                        <div style={{
                            width: 72, height: 72,
                            borderRadius: "20px",
                            background: dark ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.9)",
                            border: `1px solid ${border}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 36,
                            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                            backdropFilter: "blur(8px)",
                        }}>🌊</div>
                    </div>

                    {/* Wordmark */}
                    <div style={{ marginBottom: "20px", animation: "fadeUp 0.5s ease 0.15s both" }}>
                        <span style={{
                            fontSize: "20px", fontWeight: 600, color: text1,
                            letterSpacing: "-0.3px",
                        }}>Sea</span><span style={{
                            fontSize: "20px", fontWeight: 600, color: "#3b82f6",
                            letterSpacing: "-0.3px",
                        }}>Bite</span>
                    </div>

                    {/* Blue divider */}
                    <div style={{
                        width: 64, height: 2, background: "#3b82f6",
                        borderRadius: "999px", margin: "0 auto 20px",
                        animation: "fadeUp 0.5s ease 0.25s both",
                    }} />

                    {/* Heading */}
                    <h1 style={{
                        fontSize: "26px", fontWeight: 600,
                        color: text1, lineHeight: 1.3,
                        marginBottom: "10px", letterSpacing: "-0.5px",
                        animation: "fadeUp 0.5s ease 0.3s both",
                    }}>
                        Something went wrong
                    </h1>

                    {/* Subtext */}
                    <p style={{
                        fontSize: "14.5px", fontWeight: 300,
                        color: text2, lineHeight: 1.8,
                        marginBottom: "6px",
                        animation: "fadeUp 0.5s ease 0.35s both",
                    }}>
                        An unexpected error occurred
                    </p>
                    <p style={{
                        fontSize: "13.5px", color: text3,
                        maxWidth: "380px", margin: "0 auto 32px",
                        lineHeight: 1.75, fontWeight: 400,
                        animation: "fadeUp 0.5s ease 0.4s both",
                    }}>
                        Don't worry — your fresh{" "}
                        <span style={{ color: text2, fontWeight: 500 }}>🐟 fish, 🦐 prawns & 🦀 crabs</span>
                        {" "}are safe. Try refreshing or head back home.
                    </p>

                    {/* Status pill */}
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "8px",
                        padding: "10px 20px", borderRadius: "999px",
                        background: pillBg,
                        border: `1px solid ${pillBdr}`,
                        backdropFilter: "blur(8px)",
                        fontSize: "13px", color: text2, fontWeight: 500,
                        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                        marginBottom: "28px",
                        animation: "fadeUp 0.5s ease 0.45s both",
                    }}>
                        <span style={{ position: "relative", display: "inline-flex" }}>
                            <span style={{
                                width: 8, height: 8, borderRadius: "50%", background: "#ef4444",
                                display: "block",
                                animation: "pulse 1.5s ease-in-out infinite",
                            }} />
                            <span style={{
                                position: "absolute", inset: 0,
                                width: 8, height: 8, borderRadius: "50%", background: "#ef4444",
                                animation: "pulsePing 1.5s ease-out infinite",
                            }} />
                        </span>
                        Something went wrong on our end
                    </div>

                    {/* Buttons */}
                    <div style={{
                        display: "flex", gap: "10px", justifyContent: "center",
                        flexWrap: "wrap", marginBottom: "28px",
                        animation: "fadeUp 0.5s ease 0.5s both",
                    }}>
                        <button className="pill-btn" onClick={() => window.location.reload()} style={{
                            display: "inline-flex", alignItems: "center", gap: "8px",
                            padding: "10px 22px", borderRadius: "999px",
                            background: pillBg,
                            border: `1px solid ${pillBdr}`,
                            backdropFilter: "blur(8px)",
                            fontSize: "13px", color: text2,
                            fontWeight: 500, cursor: "pointer",
                            fontFamily: "'Inter', sans-serif",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                        }}>
                            ↺ Refresh Page
                        </button>

                        <button className="pill-btn" onClick={() => { }} style={{
                            display: "inline-flex", alignItems: "center", gap: "8px",
                            padding: "10px 22px", borderRadius: "999px",
                            background: pillBg,
                            border: `1px solid ${pillBdr}`,
                            backdropFilter: "blur(8px)",
                            fontSize: "13px", color: text2,
                            fontWeight: 500, cursor: "pointer",
                            fontFamily: "'Inter', sans-serif",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                        }}>
                            ⌂ Back Home
                        </button>
                    </div>

                    {/* Refresh status link */}
                    <button
                        className="refresh-btn"
                        onClick={() => window.location.reload()}
                        style={{
                            background: "none", border: "none", cursor: "pointer",
                            fontSize: "11px", color: text3,
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 700, letterSpacing: "2px",
                            textTransform: "uppercase",
                            animation: "fadeUp 0.5s ease 0.6s both",
                        }}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        </>
    );
}