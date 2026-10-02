/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./frontend/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-raised': 'rgb(var(--color-surface-raised) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        text: 'rgb(var(--color-text) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        'accent-hover': 'rgb(var(--color-accent-hover) / <alpha-value>)',
        gain: 'rgb(var(--color-gain) / <alpha-value>)',
        loss: 'rgb(var(--color-loss) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      keyframes: {
        'flash-up': {
          '0%': { backgroundColor: 'rgb(var(--color-gain) / 0.2)' },
          '100%': { backgroundColor: 'transparent' },
        },
        'flash-down': {
          '0%': { backgroundColor: 'rgb(var(--color-loss) / 0.2)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
      animation: {
        'flash-up': 'flash-up 800ms ease-out',
        'flash-down': 'flash-down 800ms ease-out',
      },
      transitionDuration: {
        '800': '800ms',
      },
    },
  },
  plugins: [],
}
