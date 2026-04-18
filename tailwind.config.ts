import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/styles/dist/**/*.{js,ts,jsx,tsx,css}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#4F6EF7",
          light: "#EEF1FE",
          dark: "#3451D1",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          secondary: "#F7F8FC",
          border: "#ECEEF5",
        },
        text: {
          primary: "#0F1117",
          secondary: "#6B7280",
          muted: "#9CA3AF",
        },
        metric: {
          purple: { bg: "#F0EEFF", fg: "#6C4EF2" },
          blue:   { bg: "#E8F0FE", fg: "#4F6EF7" },
          orange: { bg: "#FEF3E8", fg: "#F58C37" },
          green:  { bg: "#E8FAF0", fg: "#22C55E" },
          red:    { bg: "#FEE8E8", fg: "#EF4444" },
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
        badge: "6px",
      },
    },
  },
  darkMode: "class",
}

export default config
