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
        'bg': 'var(--bg)',
        'fg': 'var(--fg)',
        'accent': 'var(--accent)',
        'card': 'var(--card)',
        'card-01': 'var(--card-01)',
        'card-02': 'var(--card-02)',
        'card-03': 'var(--card-03)',
        'card-04': 'var(--card-04)',
      }
    },
  },
  plugins: [],
}
