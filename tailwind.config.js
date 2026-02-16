/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        hmo: {
          dark: 'var(--hmo-dark)',
          card: 'var(--hmo-card)',
          border: 'var(--hmo-border)',
          primary: 'var(--primary)',
          accent: 'var(--accent)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          glow: 'var(--primary-glow)',
        },
        accent: 'var(--accent)',
      },
    },
  },
  plugins: [],
}
