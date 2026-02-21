import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lora:ital,wght@0,600;1,600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #F0F7F6; --surface: #ffffff; --border: #D8ECEA;
    --text-dark: #1A2E2C; --text-mid: #4A6572; --text-lite: #8BA5B3;
    --primary: #5BA8A0; --sky: #89C2D9; --coral: #E8816A;
  }
  .nf-body {
    min-height: 100vh; background: var(--bg);
    font-family: 'Plus Jakarta Sans', sans-serif;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; position: relative;
  }
  .bg-grid {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image: linear-gradient(rgba(91,168,160,0.04) 1px,transparent 1px),
      linear-gradient(90deg,rgba(91,168,160,0.04) 1px,transparent 1px);
    background-size: 48px 48px;
  }
  .glow-tl { position:fixed;top:-10%;left:-10%;width:600px;height:600px;border-radius:50%;
    background:radial-gradient(circle,rgba(91,168,160,0.13) 0%,transparent 65%);pointer-events:none;z-index:0; }
  .glow-br { position:fixed;bottom:-10%;right:-5%;width:700px;height:700px;border-radius:50%;
    background:radial-gradient(circle,rgba(137,194,217,0.12) 0%,transparent 65%);pointer-events:none;z-index:0; }
  .waves { position:fixed;bottom:0;left:0;right:0;height:160px;pointer-events:none;z-index:1;overflow:hidden; }
  .wave { position:absolute;bottom:0;left:0;width:200%; }
  .w1 { animation:wm 9s linear infinite; }
  .w2 { animation:wm 14s linear infinite reverse;bottom:-8px; }
  .w3 { animation:wm 11s linear infinite;bottom:-16px; }
  @keyframes wm { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  .bub {
    position:fixed;border-radius:50%;
    background:radial-gradient(circle at 30% 30%,rgba(255,255,255,0.8),rgba(91,168,160,0.15));
    border:1px solid rgba(91,168,160,0.25);pointer-events:none;z-index:2;
    animation:bubUp var(--d) var(--dl) ease-in infinite; opacity:0;
  }
  @keyframes bubUp {
    0%{transform:translateY(0) translateX(0);opacity:0} 15%{opacity:0.7}
    85%{opacity:0.5} 100%{transform:translateY(-140px) translateX(var(--drift));opacity:0}
  }
  .sw { position:fixed;bottom:0;transform-origin:bottom center;pointer-events:none;z-index:2; }
  .sw-a { animation:swa 4s ease-in-out infinite; }
  .sw-b { animation:swb 3.5s ease-in-out infinite; }
  @keyframes swa { 0%,100%{transform:rotate(-6deg)} 50%{transform:rotate(6deg)} }
  @keyframes swb { 0%,100%{transform:rotate(7deg)} 50%{transform:rotate(-7deg)} }
  .nf-fish {
    position:fixed;pointer-events:none;z-index:3;
    animation:fishGo 5s linear forwards;
    filter:drop-shadow(0 2px 6px rgba(26,46,44,0.12));
  }
  @keyframes fishGo {
    0%{left:-60px;opacity:0} 8%{opacity:1} 88%{opacity:1} 100%{left:calc(100vw + 80px);opacity:0}
  }
  .page {
    position:relative;z-index:10;display:flex;align-items:center;gap:72px;
    max-width:960px;width:100%;padding:40px 32px;
  }
  .left { flex:0 0 auto;display:flex;flex-direction:column;align-items:center; }
  .illustration { position:relative;width:280px;height:280px; }
  .illus-circle {
    position:absolute;inset:0;border-radius:50%;
    background:linear-gradient(135deg,rgba(91,168,160,0.13) 0%,rgba(137,194,217,0.09) 100%);
    border:1.5px solid rgba(91,168,160,0.18);
    animation:circPulse 4s ease-in-out infinite;
  }
  @keyframes circPulse {
    0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(91,168,160,0)}
    50%{transform:scale(1.02);box-shadow:0 0 0 14px rgba(91,168,160,0.06)}
  }
  .illus-ring {
    position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
    width:215px;height:215px;border-radius:50%;
    border:1px dashed rgba(91,168,160,0.22);
    animation:spinRing 22s linear infinite;
  }
  @keyframes spinRing { to{transform:translate(-50%,-50%) rotate(360deg)} }
  .illus-inner {
    position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
    width:155px;height:155px;border-radius:50%;
    background:rgba(255,255,255,0.6);backdrop-filter:blur(12px);
    border:1px solid rgba(255,255,255,0.8);
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    box-shadow:0 8px 32px rgba(26,46,44,0.06),0 2px 8px rgba(26,46,44,0.04);
  }
  .num-404 { font-family:'Lora',serif;font-size:64px;font-weight:600;letter-spacing:-0.06em;line-height:1;color:var(--text-dark); }
  .num-404 .zero { color:var(--primary);display:inline-block;animation:zFloat 3s ease-in-out infinite; }
  @keyframes zFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
  .num-label { font-size:9px;font-weight:800;color:var(--text-lite);text-transform:uppercase;letter-spacing:0.14em;margin-top:4px; }
  .orbit-wrap { position:absolute;inset:0;border-radius:50%;animation:orb 10s linear infinite; }
  @keyframes orb { to{transform:rotate(360deg)} }
  .orbit-fish { position:absolute;top:-10px;left:50%;transform:translateX(-50%);font-size:18px;animation:counterOrb 10s linear infinite; }
  @keyframes counterOrb { to{transform:translateX(-50%) rotate(-360deg)} }
  .diver { position:absolute;bottom:8px;right:4px;animation:diverBob 3.5s ease-in-out infinite;z-index:3; }
  @keyframes diverBob {
    0%,100%{transform:translateY(0) rotate(-4deg)} 50%{transform:translateY(-10px) rotate(3deg)}
  }
  .illus-sw { position:absolute;bottom:6px;left:16px;transform-origin:bottom center;animation:swa 4s 0.5s ease-in-out infinite; }
  .right { flex:1;min-width:0; }
  .badge {
    display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;
    background:rgba(91,168,160,0.08);border:1px solid rgba(91,168,160,0.2);margin-bottom:20px;
  }
  .badge-dot { width:6px;height:6px;border-radius:50%;background:var(--primary);animation:dotPulse 2s ease-in-out infinite; }
  @keyframes dotPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
  .badge-text { font-size:10px;font-weight:800;color:var(--primary);text-transform:uppercase;letter-spacing:0.1em; }
  .headline { font-family:'Lora',serif;font-size:clamp(28px,4vw,40px);font-weight:600;color:var(--text-dark);letter-spacing:-0.03em;line-height:1.15;margin-bottom:16px; }
  .headline em { font-style:italic;color:var(--primary); }
  .subtext { font-size:14px;color:var(--text-mid);line-height:1.75;margin-bottom:28px;max-width:380px; }
  .rule { display:flex;align-items:center;gap:12px;margin-bottom:24px; }
  .rule-line { flex:1;height:1px;background:var(--border); }
  .actions { display:flex;flex-direction:column;gap:10px;margin-bottom:20px; }
  .btn-main {
    display:flex;align-items:center;justify-content:center;gap:10px;
    padding:15px 24px;border-radius:14px;background:var(--text-dark);color:#fff;border:none;
    font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;font-weight:700;cursor:pointer;
    box-shadow:0 4px 24px rgba(26,46,44,0.18);transition:all 0.22s ease;
  }
  .btn-main:hover { background:var(--primary);transform:translateY(-2px);box-shadow:0 10px 32px rgba(91,168,160,0.3); }
  .btn-main:active { transform:scale(0.97); }
  .btn-row { display:grid;grid-template-columns:1fr 1fr;gap:10px; }
  .btn-sec {
    display:flex;align-items:center;justify-content:center;gap:7px;
    padding:12px 16px;border-radius:12px;background:var(--surface);color:var(--text-mid);
    border:1.5px solid var(--border);font-family:'Plus Jakarta Sans',sans-serif;
    font-size:12px;font-weight:700;cursor:pointer;transition:all 0.18s ease;
  }
  .btn-sec:hover { border-color:var(--primary);color:var(--primary);background:rgba(91,168,160,0.04);transform:translateY(-1px); }
  .btn-sec:active { transform:scale(0.97); }
  .countdown-strip {
    display:flex;align-items:center;gap:12px;padding:13px 16px;border-radius:12px;
    background:var(--surface);border:1px solid var(--border);box-shadow:0 1px 6px rgba(26,46,44,0.04);
  }
  .cd-ring { position:relative;width:34px;height:34px;flex-shrink:0; }
  .cd-ring svg { transform:rotate(-90deg); }
  .cd-bg { fill:none;stroke:var(--border);stroke-width:2.5; }
  .cd-arc { fill:none;stroke:var(--primary);stroke-width:2.5;stroke-linecap:round;transition:stroke-dashoffset 1s linear; }
  .cd-num { position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:var(--primary); }
  .cd-text { font-size:12px;color:var(--text-mid);font-weight:500;line-height:1.5; }
  .cd-text strong { color:var(--text-dark);font-weight:700; }
  .footer-brand {
    position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
    font-size:11px;color:var(--text-lite);font-weight:500;z-index:10;white-space:nowrap;
    background:rgba(240,247,246,0.85);backdrop-filter:blur(8px);
    padding:6px 14px;border-radius:20px;border:1px solid rgba(91,168,160,0.1);
  }
  @media (max-width:680px) {
    .page { flex-direction:column;align-items:center;gap:28px;padding:28px 20px 80px;text-align:center; }
    .illustration { width:220px;height:220px; }
    .illus-ring { width:170px;height:170px; }
    .illus-inner { width:125px;height:125px; }
    .num-404 { font-size:52px; }
    .headline { font-size:26px; }
    .subtext { margin:0 auto 28px; }
    .rule { justify-content:center; }
  }
`;

const FISH_LIST = ['🐟', '🐠', '🐡', '🦑', '🐙'];
const C = 81.7;

export default function NotFound() {
    const navigate = useNavigate();
    const [timer, setTimer] = useState(10);
    const fishContainerRef = useRef(null);

    // Countdown + redirect
    useEffect(() => {
        const iv = setInterval(() => {
            setTimer(t => {
                if (t <= 1) { clearInterval(iv); navigate('/'); return 0; }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(iv);
    }, [navigate]);

    // Swimming fish spawner
    useEffect(() => {
        let timeoutId;
        const spawnFish = () => {
            if (!fishContainerRef.current) return;
            const f = document.createElement('div');
            f.className = 'nf-fish';
            f.textContent = FISH_LIST[Math.floor(Math.random() * FISH_LIST.length)];
            f.style.top = (12 + Math.random() * 60) + '%';
            f.style.fontSize = (16 + Math.random() * 12) + 'px';
            fishContainerRef.current.appendChild(f);
            f.addEventListener('animationend', () => f.remove());
            timeoutId = setTimeout(spawnFish, 4500 + Math.random() * 5000);
        };
        timeoutId = setTimeout(spawnFish, 3000);
        return () => clearTimeout(timeoutId);
    }, []);

    const dashOffset = C * (1 - timer / 10);

    return (
        <div className="nf-body" ref={fishContainerRef}>
            <Helmet>
                <title>Page Not Found | SeaBite</title>
                <meta name="robots" content="noindex" />
            </Helmet>
            <style>{CSS}</style>

            <div className="bg-grid" />
            <div className="glow-tl" />
            <div className="glow-br" />

            {/* Seaweeds */}
            <div className="sw sw-b" style={{ left: '3%', animationDelay: '0s' }}>
                <svg width="22" height="88" viewBox="0 0 22 88"><path d="M11 88C11 66 3 60 5 44 7 28 19 22 17 6" stroke="#5BA8A0" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.45" /><ellipse cx="17" cy="6" rx="5" ry="3" fill="#5BA8A0" opacity="0.35" /><path d="M7 50C3 46 1 39 5 36" stroke="#5BA8A0" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.35" /><ellipse cx="5" cy="36" rx="4" ry="2.5" fill="#5BA8A0" opacity="0.3" /></svg>
            </div>
            <div className="sw sw-a" style={{ left: '9%', animationDelay: '.7s' }}>
                <svg width="18" height="68" viewBox="0 0 18 68"><path d="M9 68C9 52 3 47 4 34 5 22 14 17 13 4" stroke="#89C2D9" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4" /><ellipse cx="13" cy="4" rx="4" ry="2.5" fill="#89C2D9" opacity="0.35" /></svg>
            </div>
            <div className="sw sw-a" style={{ right: '4%', animationDelay: '.4s' }}>
                <svg width="22" height="88" viewBox="0 0 22 88"><path d="M11 88C11 66 19 60 17 44 15 28 3 22 5 6" stroke="#5BA8A0" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.45" /><ellipse cx="5" cy="6" rx="5" ry="3" fill="#5BA8A0" opacity="0.35" /></svg>
            </div>
            <div className="sw sw-b" style={{ right: '10%', animationDelay: '1s' }}>
                <svg width="18" height="68" viewBox="0 0 18 68"><path d="M9 68C9 52 15 47 14 34 13 22 4 17 5 4" stroke="#89C2D9" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.38" /><ellipse cx="5" cy="4" rx="4" ry="2.5" fill="#89C2D9" opacity="0.3" /></svg>
            </div>

            {/* Bubbles */}
            {[
                { bottom: '14%', left: '6%', w: 9, d: '5s', dl: '.2s', drift: '6px' },
                { bottom: '8%', left: '13%', w: 6, d: '4.5s', dl: '1.1s', drift: '-4px' },
                { bottom: '11%', left: '20%', w: 12, d: '6s', dl: '.6s', drift: '8px' },
                { bottom: '16%', left: '78%', w: 7, d: '4s', dl: '1.6s', drift: '-5px' },
                { bottom: '9%', left: '85%', w: 11, d: '5.5s', dl: '.9s', drift: '4px' },
                { bottom: '13%', left: '93%', w: 5, d: '3.8s', dl: '2.1s', drift: '-3px' },
                { bottom: '10%', left: '52%', w: 8, d: '5s', dl: '.4s', drift: '5px' },
            ].map((b, i) => (
                <div key={i} className="bub" style={{ bottom: b.bottom, left: b.left, width: b.w, height: b.w, '--d': b.d, '--dl': b.dl, '--drift': b.drift }} />
            ))}

            {/* Waves */}
            <div className="waves">
                <svg className="wave w1" viewBox="0 0 1440 160" preserveAspectRatio="none" height="160"><path d="M0,80 C360,130 720,30 1080,80 C1260,106 1380,54 1440,80 L1440,160 L0,160 Z" fill="rgba(91,168,160,0.10)" /></svg>
                <svg className="wave w2" viewBox="0 0 1440 160" preserveAspectRatio="none" height="160"><path d="M0,95 C240,55 480,130 720,95 C960,60 1200,130 1440,95 L1440,160 L0,160 Z" fill="rgba(91,168,160,0.07)" /></svg>
                <svg className="wave w3" viewBox="0 0 1440 160" preserveAspectRatio="none" height="160"><path d="M0,70 C320,110 640,35 960,70 C1120,90 1280,46 1440,70 L1440,160 L0,160 Z" fill="rgba(137,194,217,0.06)" /></svg>
            </div>

            {/* Main layout */}
            <div className="page">
                {/* LEFT */}
                <div className="left">
                    <div className="illustration">
                        <div className="illus-circle" />
                        <div className="illus-ring" />
                        <div className="orbit-wrap">
                            <div className="orbit-fish">🐠</div>
                        </div>
                        <div className="illus-inner">
                            <span className="num-404">4<span className="zero">0</span>4</span>
                            <span className="num-label">Not Found</span>
                        </div>
                        <div className="diver">
                            <svg width="66" height="66" viewBox="0 0 120 120" fill="none">
                                <rect x="52" y="55" width="16" height="28" rx="8" fill="#89C2D9" opacity="0.85" />
                                <rect x="55" y="50" width="10" height="6" rx="3" fill="#5BA8A0" />
                                <ellipse cx="60" cy="48" rx="18" ry="22" fill="#E8816A" opacity="0.9" />
                                <circle cx="60" cy="26" r="16" fill="#f5c9a0" />
                                <ellipse cx="60" cy="28" rx="13" ry="10" fill="#89C2D9" opacity="0.75" />
                                <ellipse cx="60" cy="28" rx="10" ry="7.5" fill="rgba(255,255,255,0.2)" />
                                <ellipse cx="32" cy="55" rx="14" ry="7" fill="#5BA8A0" opacity="0.65" transform="rotate(-20 32 55)" />
                                <ellipse cx="88" cy="55" rx="14" ry="7" fill="#5BA8A0" opacity="0.65" transform="rotate(20 88 55)" />
                                <ellipse cx="48" cy="80" rx="8" ry="14" fill="#5BA8A0" opacity="0.65" transform="rotate(15 48 80)" />
                                <ellipse cx="72" cy="80" rx="8" ry="14" fill="#5BA8A0" opacity="0.65" transform="rotate(-15 72 80)" />
                                <circle cx="76" cy="21" r="3" fill="rgba(255,255,255,0.55)" />
                                <circle cx="82" cy="15" r="2" fill="rgba(255,255,255,0.4)" />
                                <circle cx="87" cy="10" r="1.5" fill="rgba(255,255,255,0.3)" />
                            </svg>
                        </div>
                        <div className="illus-sw">
                            <svg width="14" height="44" viewBox="0 0 14 44"><path d="M7 44C7 33 2 30 3 22 4 14 11 11 10 3" stroke="#5BA8A0" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4" /><ellipse cx="10" cy="3" rx="3" ry="2" fill="#5BA8A0" opacity="0.3" /></svg>
                        </div>
                    </div>
                </div>

                {/* RIGHT */}
                <div className="right">
                    <div className="badge">
                        <div className="badge-dot" />
                        <span className="badge-text">Page Not Found</span>
                    </div>
                    <h1 className="headline">Lost in the<br /><em>deep ocean</em></h1>
                    <p className="subtext">
                        Looks like this page swam away. Our diver searched every corner of the ocean floor but couldn't find what you're looking for.
                    </p>
                    <div className="rule">
                        <div className="rule-line" />
                        <span style={{ fontSize: 16, opacity: .7 }}>🦞</span>
                        <div className="rule-line" />
                    </div>
                    <div className="actions">
                        <button className="btn-main" onClick={() => navigate('/')}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9,22 9,12 15,12 15,22" /></svg>
                            Take Me Home
                        </button>
                        <div className="btn-row">
                            <button className="btn-sec" onClick={() => navigate('/products')}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>
                                Browse Products
                            </button>
                            <button className="btn-sec" onClick={() => navigate(-1)}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                                Go Back
                            </button>
                        </div>
                    </div>

                    {/* Countdown */}
                    <div className="countdown-strip">
                        <div className="cd-ring">
                            <svg width="34" height="34" viewBox="0 0 34 34">
                                <circle className="cd-bg" cx="17" cy="17" r="13" />
                                <circle className="cd-arc" cx="17" cy="17" r="13" strokeDasharray="81.7" strokeDashoffset={dashOffset} />
                            </svg>
                            <div className="cd-num">{timer}</div>
                        </div>
                        <p className="cd-text">
                            Redirecting to home in <strong>{timer === 1 ? '1 second' : `${timer} seconds`}</strong>
                        </p>
                    </div>
                </div>
            </div>

            <div className="footer-brand">🌊 SeaBite · Fresh from the sea</div>
        </div>
    );
}
