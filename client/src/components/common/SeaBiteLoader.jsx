import React from "react";

const SeaBiteLoader = ({ fullScreen = false, small = false }) => {
  const containerStyle = fullScreen
    ? {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#fff",
      position: "fixed",
      inset: 0,
      zIndex: 9999
    }
    : {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      padding: small ? "0" : "40px 0",
    };

  const size = small ? "20px" : "40px";

  return (
    <div style={containerStyle}>
      <style>{`
        .sb-minimal-spinner {
          width: ${size};
          height: ${size};
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-left-color: #5BA8A0;
          border-radius: 50%;
          animation: sb-spin 0.8s linear infinite;
        }

        @keyframes sb-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div className="sb-minimal-spinner" role="status" aria-label="Loading" />
    </div>
  );
};

export default SeaBiteLoader;
