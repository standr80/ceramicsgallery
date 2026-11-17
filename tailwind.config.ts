import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        clay: {
          50: "#faf6f2",
          100: "#f2e9e0",
          200: "#e5d2c0",
          300: "#d4b599",
          400: "#c49973",
          500: "#b07f5a",
          600: "#9d6a4d",
          700: "#825541",
          800: "#6b463a",
          900: "#593c33",
        },
        ink: { DEFAULT: "#221b17", soft: "#3a302a" },
        paper: "#f5efe6",
        terracotta: { DEFAULT: "#c0532d", dark: "#9c3f1f", light: "#e8a184" },
        celadon: { DEFAULT: "#8ea98a", light: "#c9d8c3", dark: "#5f7a5c" },
        tenmoku: "#4a2c1d",
        stone: {
          50: "#f7f6f4",
          100: "#ebe8e4",
          200: "#d9d4cc",
          300: "#c0b8ab",
          400: "#a69b8a",
          500: "#948875",
        },
      },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
      },
      animation: { marquee: "marquee 40s linear infinite" },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
