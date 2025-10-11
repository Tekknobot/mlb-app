/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // we’ll force 'dark' on the document root
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        diamond:  "#0b1724", // night sky / page bg
        outfield: "#0f2437", // header / nav rails
        infield:  "#1b2836", // cards / panels
        chalk:    "#f8fafc", // text on dark
        seam:     "#cc2b3a", // accent red
        ivy:      "#1d7a4d", // accent green
      },
      boxShadow: {
        dugout: "0 6px 24px rgba(0,0,0,0.35)",
      },
      borderRadius: { '2xl': '1.25rem' },
    },
  },
  plugins: [],
}
