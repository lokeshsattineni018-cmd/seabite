import React from "react";

const SeaCreature = ({ type, delay, top, duration, size }) => {
    const getCreature = () => {
        switch (type) {
            case "fish1":
                return (
                    <svg viewBox="0 0 100 60" className="w-full h-full text-ocean-dark fill-current">
                        <path d="M90,30 Q80,10 50,10 Q20,10 10,30 Q20,50 50,50 Q80,50 90,30 Z M90,30 L100,10 L100,50 Z" />
                        <circle cx="25" cy="25" r="3" fill="white" />
                    </svg>
                );
            case "fish2":
                return (
                    <svg viewBox="0 0 100 60" className="w-full h-full text-coral fill-current">
                        <path d="M80,30 Q70,5 40,15 Q10,25 20,30 Q10,35 40,45 Q70,55 80,30 Z M80,30 L95,20 L95,40 Z" />
                        <circle cx="30" cy="25" r="3" fill="white" />
                    </svg>
                );
            case "fish3":
                return (
                    <svg viewBox="0 0 100 50" className="w-full h-full text-seafoam fill-current">
                        <ellipse cx="50" cy="25" rx="40" ry="15" />
                        <path d="M90,25 L100,10 L100,40 Z" />
                        <circle cx="25" cy="22" r="2" fill="white" />
                    </svg>
                );
            case "crab":
                return (
                    <svg viewBox="0 0 100 80" className="w-full h-full text-accent fill-current">
                        <path d="M20,40 Q10,30 20,20 M80,40 Q90,30 80,20" stroke="currentColor" strokeWidth="4" fill="none" />
                        <ellipse cx="50" cy="50" rx="30" ry="20" />
                        <path d="M20,50 L10,60 M80,50 L90,60 M25,60 L15,75 M75,60 L85,75" stroke="currentColor" strokeWidth="3" />
                        <circle cx="40" cy="45" r="3" fill="white" />
                        <circle cx="60" cy="45" r="3" fill="white" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const animationClass = type === "crab" ? "animate-crab-walk" : (Math.random() > 0.5 ? "animate-swim-right" : "animate-swim-left");
    const colorClass = type === "fish1" ? "text-blue-400" : type === "fish2" ? "text-orange-400" : type === "fish3" ? "text-teal-400" : "text-red-400";

    return (
        <div
            className={`absolute ${animationClass} ${colorClass} opacity-80`}
            style={{
                top: top,
                width: size,
                height: size,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
            }}
        >
            {getCreature()}
        </div>
    );
};

export default SeaCreature;
