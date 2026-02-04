/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'selector', // 🟢 Forces dark mode based on the 'dark' class
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        primary: "#2563eb",
        // 🧬 Dual-theme backgrounds
        bg: {
          light: "#f4f7fa", // Clinical Light
          dark: "#0a1625",  // Ocean Dark
        }
      },
      boxShadow: {
        card: "0 10px 30px rgba(0,0,0,0.06)",
        // 🧬 Tech-glow for dark mode
        glow: "0 0 20px rgba(59, 130, 246, 0.2)", 
      },
    },
  },
  plugins: [],
};