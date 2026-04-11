/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "surface": "#f9f9f9",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f4f4",
        "surface-container": "#ebeeef",
        "surface-container-high": "#e4e9ea",
        "surface-container-highest": "#dde4e5",
        "on-surface": "#2d3435",
        "on-surface-variant": "#5a6061",
        "primary": "#055cb9",
        "primary-dim": "#0051a4",
        "on-primary": "#f7f7ff",
        "primary-container": "#d7e3ff",
        "on-primary-container": "#0050a2",
        "secondary-container": "#e3e1ec",
        "tertiary": "#5e5c78",
        "outline": "#757c7d",
        "outline-variant": "#adb3b4",
        "error-container": "#fe8983",
      },
      fontFamily: {
        headline: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
      }
    },
  },
  plugins: [],
}