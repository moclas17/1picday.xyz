import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--paper)",
        foreground: "var(--ink)",
        ink: "var(--ink)",
        paper: "var(--paper)",
        mist: "var(--mist)",
        ash: "var(--ash)",
        stone: "var(--stone)",
        moss: "var(--moss)",
        sun: "var(--sun)",
      },
    },
  },
  plugins: [],
};
export default config;
