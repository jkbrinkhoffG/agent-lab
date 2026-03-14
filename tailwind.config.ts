import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          950: "#050816",
          900: "#0a1020",
          800: "#11192d",
          700: "#1a2740",
          600: "#243350",
        },
        accent: {
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
        },
        lime: {
          400: "#a3e635",
          500: "#84cc16",
        },
        coral: {
          400: "#fb7185",
          500: "#f43f5e",
        },
      },
      boxShadow: {
        panel: "0 18px 60px rgba(0, 0, 0, 0.28)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to right, rgba(125, 211, 252, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(125, 211, 252, 0.08) 1px, transparent 1px)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
