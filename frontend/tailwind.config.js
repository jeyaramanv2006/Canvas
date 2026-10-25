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
          dark: '#0d0e12',
          card: '#16171d',
          border: '#27272e',
          accent: '#FFD700', // Yellow accent
          purple: '#9333ea',
          green: '#10b981',
          red: '#ef4444',
          gray: '#333333'
        }
      },
      fontFamily: {
        sans: ['"Google Sans Flex"', '"Google Sans"', '"Google Sans Text"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Google Sans Flex"', '"Google Sans"', '"Google Sans Text"', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
