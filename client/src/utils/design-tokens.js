// client/src/utils/design-tokens.js

export const tokens = {
  colors: {
    primarySea: "#1A2E2C", // Deep professional blue/teal
    accentFresh: "#F07468", // Vibrant coral
    grayscaleText: "#374151", // Dark grey for body
    grayscaleBackground: "#F9FAFB", // Subtle off-white
    white: "#FFFFFF",
    black: "#000000",
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    scales: {
      h1: "48px",
      h2: "36px",
      h3: "24px",
      h4: "20px",
      body: "16px",
      small: "14px",
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    xxl: "48px",
    scale: 8, // 8-point spacing scale base
  },
  shadows: {
    subtle: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    premium: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  },
  borderRadius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    full: "9999px",
  },
};
