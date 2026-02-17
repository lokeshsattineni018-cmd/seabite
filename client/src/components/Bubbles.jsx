import React from "react";

const Bubbles = () => {
    // Generate random bubbles
    const bubbles = Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        size: Math.random() * 20 + 10,
        delay: Math.random() * 5,
        duration: Math.random() * 10 + 10,
    }));

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {bubbles.map((bubble) => (
                <div
                    key={bubble.id}
                    className="bubble"
                    style={{
                        left: bubble.left,
                        width: `${bubble.size}px`,
                        height: `${bubble.size}px`,
                        bottom: `-${bubble.size}px`,
                        animationDelay: `${bubble.delay}s`,
                        animationDuration: `${bubble.duration}s`,
                    }}
                />
            ))}
        </div>
    );
};

export default Bubbles;
