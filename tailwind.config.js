/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gain': '#10b981',
        'loss': '#ef4444',
      }
    },
  },
  plugins: [],
}
