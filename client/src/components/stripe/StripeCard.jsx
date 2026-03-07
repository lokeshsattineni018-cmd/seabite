export default function StripeCard({ children, style = {} }) {
    return (
        <div
            style={{
                background: "#fff",
                borderRadius: 12,
                padding: 24,
                border: "1px solid #E6E8EC",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                ...style
            }}
        >
            {children}
        </div>
    );
}
