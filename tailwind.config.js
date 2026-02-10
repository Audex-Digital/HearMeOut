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
          dark: '#05070a',
          card: '#0d1117',
          border: 'rgba(255, 255, 255, 0.1)',
          primary: '#6366f1',
          accent: '#818cf8',
        },
        primary: {
          DEFAULT: '#6366f1',
          glow: 'rgba(99, 102, 241, 0.4)',
        },
        accent: '#818cf8',
      },
    },
  },
  plugins: [],
}
