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
        tata: {
          purple: "#2F0B33", // Dark purple background
          "purple-dark": "#1E071F", // Darker purple for panels
          "purple-lighter": "#3F1C42", // Lighter purple for cards
          cyan: "#75E0E4",   // Cyan accent color
          white: "#FFFFFF"   // White text
        }
      }
    }
  },
  plugins: [],
};
export default config;
