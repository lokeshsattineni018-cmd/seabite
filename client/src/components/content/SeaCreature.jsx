import { useEffect, useState } from "react";

const Fish1 = ({ size = 48 }) => (
    <svg width={size} height={size * 0.6} viewBox="0 0 80 48" fill="none">
        <ellipse cx="35" cy="24" rx="28" ry="14" fill="hsl(195 50% 70%)" />
        <path d="M63 24 C70 14, 78 10, 80 12 L78 24 L80 36 C78 38, 70 34, 63 24Z" fill="hsl(195 45% 65%)" />
        <circle cx="22" cy="20" r="3" fill="hsl(210 30% 20%)" />
        <circle cx="23" cy="19" r="1" fill="white" />
        <path d="M35 10 C38 6, 42 8, 40 14" stroke="hsl(195 40% 60%)" strokeWidth="1.5" fill="none" />
    </svg>
);

const Fish2 = ({ size = 40 }) => (
    <svg width={size} height={size * 0.7} viewBox="0 0 64 44" fill="none">
        <ellipse cx="28" cy="22" rx="22" ry="11" fill="hsl(15 60% 70%)" />
        <path d="M50 22 C56 14, 62 12, 64 14 L62 22 L64 30 C62 32, 56 30, 50 22Z" fill="hsl(15 55% 65%)" />
        <circle cx="16" cy="19" r="2.5" fill="hsl(210 30% 15%)" />
        <circle cx="17" cy="18" r="0.8" fill="white" />
        <path d="M20 13 Q28 8 36 13" stroke="hsl(15 50% 60%)" strokeWidth="1" fill="none" />
    </svg>
);

const Fish3 = ({ size = 36 }) => (
    <svg width={size} height={size * 0.65} viewBox="0 0 56 36" fill="none">
        <ellipse cx="24" cy="18" rx="18" ry="10" fill="hsl(165 35% 65%)" />
        <path d="M42 18 C47 11, 53 10, 56 12 L54 18 L56 24 C53 26, 47 25, 42 18Z" fill="hsl(165 30% 60%)" />
        <circle cx="14" cy="15" r="2" fill="hsl(210 30% 15%)" />
        <circle cx="15" cy="14.5" r="0.7" fill="white" />
    </svg>
);

const Crab = ({ size = 52 }) => (
    <svg width={size} height={size * 0.7} viewBox="0 0 72 50" fill="none">
        <ellipse cx="36" cy="32" rx="20" ry="14" fill="hsl(15 65% 55%)" />
        <ellipse cx="36" cy="30" rx="18" ry="12" fill="hsl(15 60% 60%)" />
        {/* Eyes */}
        <line x1="28" y1="22" x2="24" y2="12" stroke="hsl(15 55% 50%)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="44" y1="22" x2="48" y2="12" stroke="hsl(15 55% 50%)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="24" cy="10" r="4" fill="hsl(15 60% 60%)" />
        <circle cx="48" cy="10" r="4" fill="hsl(15 60% 60%)" />
        <circle cx="24" cy="9" r="2" fill="hsl(210 30% 15%)" />
        <circle cx="48" cy="9" r="2" fill="hsl(210 30% 15%)" />
        <circle cx="24.8" cy="8.5" r="0.7" fill="white" />
        <circle cx="48.8" cy="8.5" r="0.7" fill="white" />
        {/* Claws */}
        <path d="M16 30 C10 28, 4 22, 2 20 C0 18, 4 16, 6 18 L10 22" stroke="hsl(15 55% 50%)" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M56 30 C62 28, 68 22, 70 20 C72 18, 68 16, 66 18 L62 22" stroke="hsl(15 55% 50%)" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Legs */}
        <line x1="20" y1="38" x2="12" y2="46" stroke="hsl(15 55% 50%)" strokeWidth="2" strokeLinecap="round" />
        <line x1="24" y1="40" x2="16" y2="48" stroke="hsl(15 55% 50%)" strokeWidth="2" strokeLinecap="round" />
        <line x1="52" y1="38" x2="60" y2="46" stroke="hsl(15 55% 50%)" strokeWidth="2" strokeLinecap="round" />
        <line x1="48" y1="40" x2="56" y2="48" stroke="hsl(15 55% 50%)" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const SeaCreature = ({ type, delay, top, duration, size = 48 }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), delay * 1000);
        return () => clearTimeout(timer);
    }, [delay]);

    if (!visible) return null;

    const animClass = type === "crab" ? "animate-crab-walk" :
        Math.random() > 0.5 ? "animate-swim-right" : "animate-swim-left";

    return (
        <div
            className={`absolute pointer-events-none ${animClass}`}
            style={{
                top,
                animationDuration: `${duration}s`,
                animationIterationCount: "infinite",
                opacity: 0.7,
            }}
        >
            {type === "fish1" && <Fish1 size={size} />}
            {type === "fish2" && <Fish2 size={size} />}
            {type === "fish3" && <Fish3 size={size} />}
            {type === "crab" && <Crab size={size} />}
        </div>
    );
};

export default SeaCreature;
