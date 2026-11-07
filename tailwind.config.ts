import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Nicely palette. Change these to rebrand the whole app.
        ink: "#15122B",
        night: "#0E0B1F",
        accent: { DEFAULT: "#7C3AED", dark: "#6D28D9", soft: "#F3EDFF" },
        cream: "#FBF9F6",
      },
      backgroundImage: {
        // The signature Nicely gradient: violet -> pink -> warm orange.
        brand: "linear-gradient(120deg, #7C3AED 0%, #DB2777 55%, #F59E0B 100%)",
        "brand-soft":
          "linear-gradient(120deg, rgba(124,58,237,.12) 0%, rgba(219,39,119,.10) 55%, rgba(245,158,11,.12) 100%)",
      },
      boxShadow: {
        glow: "0 18px 50px -18px rgba(124,58,237,.55), 0 8px 24px -12px rgba(219,39,119,.35)",
        soft: "0 1px 2px rgba(21,18,43,.04), 0 12px 32px -16px rgba(21,18,43,.18)",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(0,-18px,0) scale(1.05)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
      animation: {
        float: "float 12s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
