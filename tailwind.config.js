/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'maroon-bg': '#4a0404', // Deep Burgundy
        'maroon-accent-bg': '#2d0202', // Darker Oxblood
        'gold-text': '#d4af37', // Burnished Gold
        'maroon-text': '#6b0a0a', // Rich Maroon
        'gold-bg': '#c5a028', // Deeper Gold for backgrounds
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
