import React from "react";
import { Link } from "react-router-dom";
import { FiAlertTriangle, FiRefreshCcw, FiHome } from "react-icons/fi";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = "/";
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#F4F9F8",
                    fontFamily: "'Inter', sans-serif",
                    padding: "20px"
                }}>
                    <div style={{
                        maxWidth: "500px",
                        width: "100%",
                        background: "white",
                        padding: "40px",
                        borderRadius: "24px",
                        boxShadow: "0 20px 50px rgba(91, 168, 160, 0.1)",
                        textAlign: "center"
                    }}>
                        <div style={{
                            width: "80px",
                            height: "80px",
                            background: "rgba(232, 129, 106, 0.1)",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 24px",
                            color: "#E8816A"
                        }}>
                            <FiAlertTriangle size={40} />
                        </div>

                        <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#1A2B35", marginBottom: "12px" }}>
                            Something went wrong
                        </h1>

                        <p style={{ color: "#4A6572", lineHeight: "1.6", marginBottom: "32px" }}>
                            We encountered an unexpected error. Don't worry, your fresh seafood is still safe! Try refreshing or going back home.
                        </p>

                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "12px 24px",
                                    borderRadius: "12px",
                                    background: "#5BA8A0",
                                    color: "white",
                                    fontWeight: "700",
                                    border: "none",
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                            >
                                <FiRefreshCcw size={18} /> Refresh Page
                            </button>

                            <Link
                                to="/"
                                onClick={this.handleReset}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "12px 24px",
                                    borderRadius: "12px",
                                    background: "rgba(91, 168, 160, 0.1)",
                                    color: "#5BA8A0",
                                    fontWeight: "700",
                                    textDecoration: "none",
                                    transition: "all 0.2s"
                                }}
                            >
                                <FiHome size={18} /> Take Me Home
                            </Link>
                        </div>

                        {process.env.NODE_ENV !== "production" && (
                            <div style={{
                                marginTop: "32px",
                                padding: "16px",
                                background: "#f8f9fa",
                                borderRadius: "12px",
                                fontSize: "12px",
                                color: "#ff4d4f",
                                textAlign: "left",
                                overflow: "auto",
                                maxHeight: "200px"
                            }}>
                                <strong style={{ display: "block", marginBottom: "8px" }}>Debug Info (Dev Only):</strong>
                                <code style={{ whiteSpace: "pre-wrap" }}>{this.state.error?.toString()}</code>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
