import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        white: "#ffffff",
        gray: {
          900: "#171717",
          // Add other gray shades as needed
          800: "#1f1f1f",
          700: "#2e2e2e",
          600: "#525252",
          500: "#737373",
          400: "#a3a3a3",
          300: "#d4d4d4",
          200: "#e5e5e5",
          100: "#f5f5f5",
          50: "#fafafa",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config; 