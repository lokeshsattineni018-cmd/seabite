import { useMemo } from "react";

const Bubbles = () => {
    const bubbles = useMemo(
        () =>
            Array.from({ length: 15 }, (_, i) => ({
                id: i,
                left: `${Math.random() * 100}%`,
                size: 4 + Math.random() * 12,
                delay: Math.random() * 8,
                duration: 6 + Math.random() * 8,
            })),
        []
    );

    return (
        <>
            {bubbles.map((b) => (
                <div
                    key={b.id}
                    className="bubble"
                    style={{
                        left: b.left,
                        bottom: "-20px",
                        width: b.size,
                        height: b.size,
                        animationDelay: `${b.delay}s`,
                        animationDuration: `${b.duration}s`,
                    }}
                />
            ))}
        </>
    );
};

export default Bubbles;
