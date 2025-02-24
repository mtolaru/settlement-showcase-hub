
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
    extend: {
      colors: {
        /* Primary */
        primary: {
          50: "#F0F7FF",
          100: "#C8DEF6",
          200: "#A0C6EA",
          300: "#77AEDE",
          400: "#4F95D1",
          500: "#267DC4",
          600: "#1E67A3",
          700: "#175182",
          800: "#0F3B61",
          900: "#0A2540",
        },
        /* Accent */
        accent: {
          100: "#C3F0E4",
          300: "#4DC4A7",
          500: "#00A67E",
        },
        /* Neutrals */
        neutral: {
          50: "#F7F7F7",
          100: "#E6E6E6",
          200: "#CCCCCC",
          300: "#B3B3B3",
          400: "#999999",
          500: "#808080",
          600: "#666666",
          700: "#4D4D4D",
          800: "#333333",
          900: "#1A1A1A",
        },
        /* Semantic */
        success: "#00A67E",
        warning: "#FFAB00",
        error: "#DC2626",
        info: "#267DC4",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["Montserrat", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      spacing: {
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
        8: "var(--space-8)",
        10: "var(--space-10)",
        12: "var(--space-12)",
        16: "var(--space-16)",
        20: "var(--space-20)",
        24: "var(--space-24)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
