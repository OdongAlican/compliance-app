/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Your custom colors
        primary: '#1785cf',
        primary2: '#f3f6fb',
        secondary2: '#13a994',
        secondary: '#42006C',
        tertiary: '#ffff',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        }
      }
    }
  },
  plugins: [],
  variants: {
    extend: {
      display: ['focus-group'],
    }
  }
}
