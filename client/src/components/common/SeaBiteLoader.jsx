import React from "react";

const SeaBiteLoader = ({ fullScreen = false, small = false }) => {
  const size = small ? 24 : 64;
  
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
      padding: small ? "0" : "48px 0",
    };

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes sb-pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes sb-spin {
          to { transform: rotate(360deg); }
        }
        .sb-loader-wrap {
          position: relative;
          display: flex;
          alignItems: center;
          justifyContent: center;
        }
        .sb-ring {
          position: absolute;
          width: ${size + (small ? 4 : 12)}px;
          height: ${size + (small ? 4 : 12)}px;
          border: ${small ? 1.5 : 2}px solid rgba(91, 191, 181, 0.08);
          border-top: ${small ? 1.5 : 2}px solid #5BBFB5;
          border-radius: 50%;
          animation: sb-spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .sb-logo-inner {
          width: ${size}px;
          height: ${size}px;
          object-fit: contain;
          animation: sb-pulse 1.8s ease-in-out infinite;
          filter: drop-shadow(0 2px 8px rgba(91, 191, 181, 0.15));
        }
      `}</style>
      <div className="sb-loader-wrap">
        <div className="sb-ring" />
        <img 
          src="/logo.png" 
          alt="SeaBite" 
          className="sb-logo-inner"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>
    </div>
  );
};

export default SeaBiteLoader;
