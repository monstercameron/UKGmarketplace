/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/**/*.{html,js}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'rgb(0 48 135)',     // Dark Teal
        secondary: 'rgb(102 163 210)', // Light Teal
        neutral: 'rgb(204 204 204)',    // Subtle Grey
        'page-bg': '#FFFFFF'     // White background
      }
    },
  },
  plugins: [],
} 