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
        primary: "#FFC750",
        secondary: "#00A8B1",
        dark: "#1A1A1A",
        light: "#F5F5F5",
        text: "#333333",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      spacing: {
        "8": "8px",
        "16": "16px",
        "24": "24px",
        "32": "32px",
        "48": "48px",
      },
      borderRadius: {
        "4": "4px",
        "8": "8px",
        "12": "12px",
      },
    },
  },
  plugins: [],
};
export default config;


