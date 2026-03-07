import { useState } from "react";

export default function StripeInput({
    label,
    value,
    onChange,
    onKeyDown,
    disabled,
    type = "text",
    Icon,
    style = {}
}) {
    const [focus, setFocus] = useState(false);

    const active = focus || value;

    return (
        <div
            style={{
                position: "relative",
                border: `1px solid ${focus ? "#635BFF" : "#E6E8EC"}`,
                borderRadius: 8,
                padding: "18px 12px 6px",
                background: disabled ? "#F9FAFC" : "#fff",
                transition: "border-color 0.15s",
                display: "flex",
                alignItems: "center",
                ...style
            }}
        >
            {Icon && (
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#6B7280" }}>
                    <Icon size={14} />
                </span>
            )}
            <label
                style={{
                    position: "absolute",
                    top: active ? 4 : 16,
                    left: Icon ? 34 : 12,
                    fontSize: active ? 11 : 14,
                    color: focus ? "#635BFF" : "#6B7280",
                    transition: "0.15s",
                    pointerEvents: "none",
                }}
            >
                {label}
            </label>

            <input
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
                    background: "transparent",
                    paddingLeft: Icon ? 28 : 0,
                    color: "#1A2B35"
                }}
            />
        </div>
    );
}
