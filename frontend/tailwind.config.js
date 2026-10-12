/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fdfbf7',
          100: '#faf6ee',
          200: '#f5edd9',
          300: '#ebdcc0',
          400: '#dec49e',
          500: '#d0aa7e',
          800: '#4a3b2c',
          900: '#2b2219',
        },
        rescue: {
          green: '#16a34a',
          darkgreen: '#15803d',
          forest: '#14532d',
          lightgreen: '#f0fdf4',
          orange: '#ea580c',
          amber: '#f59e0b',
          lightorange: '#fff7ed',
          cream: '#faf6ee',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
