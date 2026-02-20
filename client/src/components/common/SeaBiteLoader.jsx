import React from "react";

const SeaBiteLoader = ({ fullScreen = false, small = false }) => {
  // Determine scale and padding based on context
  const scale = small ? 0.4 : 1;

  const containerStyle = fullScreen
    ? {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #eaf8fc 0%, #fdf9f4 100%)",
      position: "fixed",
      inset: 0,
      zIndex: 9999
    }
    : {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: small ? "auto" : "100%",
      padding: small ? "0" : "40px 0",
    };

  return (
    <div style={containerStyle}>
      <style>{`
        .sb-loader-wrapper {
          position: relative;
          width: 68px;
          height: 68px;
        }

        /* tri-color spinning arc */
        .sb-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 3px solid transparent;
          border-top-color:    #38c8e8;
          border-right-color:  #ff8c5a;
          border-bottom-color: #f5c030;
          border-left-color:   transparent;
          animation: sb-spin 1.2s cubic-bezier(0.5,0.1,0.5,0.9) infinite;
        }

        @keyframes sb-spin {
          to { transform: rotate(360deg); }
        }

        /* soft inner circle */
        .sb-inner {
          position: absolute;
          inset: 9px;
          border-radius: 50%;
          background: rgba(255,255,255,0.45);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        /* emoji creature */
        .sb-creature {
          position: absolute;
          font-size: 38px;
          line-height: 1;
          opacity: 0;
          transform: scale(0.3) rotate(-15deg);
          animation: sb-pop 3.3s ease-in-out infinite;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }

        .sb-fish  { animation-delay: 0s; }
        .sb-prawn { animation-delay: 1.1s; }
        .sb-crab  { animation-delay: 2.2s; }

        @keyframes sb-pop {
          0%         { opacity: 0; transform: scale(0.3) rotate(-15deg); }
          10%        { opacity: 1; transform: scale(1.15) rotate(4deg); }
          20%        { opacity: 1; transform: scale(1) rotate(0deg); }
          32%        { opacity: 1; transform: scale(1) translateY(-3px); }
          40%        { opacity: 1; transform: scale(1); }
          50%        { opacity: 0; transform: scale(0.3) rotate(15deg); }
          100%       { opacity: 0; transform: scale(0.3) rotate(-15deg); }
        }
      `}</style>

      <div className="sb-loader-wrapper" style={{ transform: `scale(${scale})` }}>
        <div className="sb-ring"></div>
        <div className="sb-inner">
          <div className="sb-creature sb-fish">🐠</div>
          <div className="sb-creature sb-prawn">🦐</div>
          <div className="sb-creature sb-crab">🦀</div>
        </div>
      </div>
    </div>
  );
};

export default SeaBiteLoader;
