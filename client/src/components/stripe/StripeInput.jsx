import { useState, forwardRef } from "react";

const StripeInput = forwardRef(({
    label,
    value,
    onChange,
    onKeyDown,
    disabled,
    type = "text",
    Icon,
    style = {}
}, ref) => {
    const [focus, setFocus] = useState(false);

    const active = focus || value;

    return (
        <div
            style={{
                position: "relative",
                border: `1px solid ${focus ? "#5BA8A0" : "#E2EEEC"}`,
                borderRadius: 12,
                padding: "20px 12px 6px",
                background: disabled ? "#F9FAFC" : "#fff",
                transition: "border-color 0.15s",
                display: "flex",
                alignItems: "center",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                ...style
            }}
        >
            {Icon && (
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8BA5B3" }}>
                    <Icon size={14} />
                </span>
            )}
            <label
                style={{
                    position: "absolute",
                    top: active ? 6 : 16,
                    left: Icon ? 36 : 12,
                    fontSize: active ? 10 : 13,
                    color: focus ? "#5BA8A0" : "#8BA5B3",
                    fontWeight: 700,
                    transition: "0.15s",
                    pointerEvents: "none",
                }}
            >
                {label}
            </label>

            <input
                ref={ref}
                type={type}
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                disabled={disabled}
                style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    fontSize: 14,
                    fontWeight: 500,
                    background: "transparent",
                    paddingLeft: Icon ? 24 : 0,
                    color: "#1A2B35",
                    fontFamily: "'Plus Jakarta Sans', sans-serif"
                }}
            />
        </div>
    );
});

export default StripeInput;
