import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#0A0A0A",
        "void-2": "#0D0E15",
        cyanpunk: "#00F5FF",
        magpunk: "#FF00FF",
        purplepunk: "#8800CC",
        acid: "#F0FF00",
      },
      boxShadow: {
        cyan: "0 0 18px rgba(0, 245, 255, 0.45)",
        magenta: "0 0 18px rgba(255, 0, 255, 0.42)",
        purple: "0 0 22px rgba(136, 0, 204, 0.45)",
        panel:
          "0 0 0 1px rgba(0, 245, 255, 0.18), 0 20px 80px rgba(0, 0, 0, 0.65)",
        "glow-cyan": "0 0 6px rgba(0, 245, 255, 0.6), 0 0 20px rgba(0, 245, 255, 0.2)",
        "glow-magenta": "0 0 6px rgba(255, 0, 255, 0.6), 0 0 20px rgba(255, 0, 255, 0.2)",
      },
      backgroundImage: {
        "cyber-grid":
          "linear-gradient(rgba(0,245,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,255,0.05) 1px, transparent 1px)",
        "neon-sheen":
          "linear-gradient(120deg, rgba(0,245,255,0.18), rgba(255,0,255,0.10), rgba(136,0,204,0.18))",
      },
      fontFamily: {
        mono: [
          "var(--font-geist-mono)",
          "JetBrains Mono",
          "Fira Code",
          "monospace",
        ],
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1" },
          "42%": { opacity: "0.72" },
          "44%": { opacity: "1" },
          "74%": { opacity: "0.82" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 8px rgba(255,0,255,0.5), 0 0 24px rgba(255,0,255,0.25)",
          },
          "50%": {
            boxShadow: "0 0 16px rgba(255,0,255,0.8), 0 0 40px rgba(255,0,255,0.5)",
          },
        },
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-1px, 1px)" },
          "40%": { transform: "translate(1px, -1px)" },
          "60%": { transform: "translate(-1px, -1px)" },
          "80%": { transform: "translate(1px, 1px)" },
        },
      },
      animation: {
        flicker: "flicker 3.5s infinite",
        scan: "scan 6s linear infinite",
        "pulse-glow": "pulse-glow 1.5s ease-in-out infinite",
        glitch: "glitch 0.3s ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
