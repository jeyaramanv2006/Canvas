/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        murugan: {
          dark: '#111111',
          card: '#1a1a1a',
          accent: '#FFD700', // Yellow accent from PDF
          purple: '#9333ea', // Secondary accent from PDF
          green: '#10b981',
          red: '#ef4444',
          gray: '#333333'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
