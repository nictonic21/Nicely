import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Nicely palette. Change these to rebrand the whole app.
        ink: "#1E1B2E",
        accent: { DEFAULT: "#6C4CF1", dark: "#5636D6", soft: "#EEE9FF" },
        cream: "#FBF9F6",
      },
    },
  },
  plugins: [],
};

export default config;
