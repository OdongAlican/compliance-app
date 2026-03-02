/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        primary2: '#eff6ff',
        secondary2: '#0d9488',
        secondary: '#7c3aed',
        tertiary: '#f8fafc',
        // Dark theme palette
        dark: {
          bg:      '#0d1117',
          surface: '#161b22',
          raised:  '#1c2333',
          border:  '#30363d',
          muted:   '#8b949e',
          text:    '#e6edf3',
        },
        accent: {
          blue:   '#2563eb',
          teal:   '#0d9488',
          violet: '#7c3aed',
          amber:  '#d97706',
          rose:   '#e11d48',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(37,99,235,0.25)',
        'glow-sm':   '0 0 10px rgba(37,99,235,0.15)',
        'dark-md':   '0 4px 24px rgba(0,0,0,0.4)',
        'dark-lg':   '0 8px 40px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'gradient-sidebar': 'linear-gradient(180deg,#0d1117 0%,#161b22 100%)',
        'gradient-card':    'linear-gradient(135deg,#1c2333 0%,#161b22 100%)',
        'gradient-hero':    'linear-gradient(135deg,#0d1117 0%,#1a2744 50%,#0d1117 100%)',
      },
      animation: {
        'fade-in':   'fadeIn .2s ease-in-out',
        'slide-in':  'slideIn .25s ease-out',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { '0%': { opacity: 0 },              '100%': { opacity: 1 } },
        slideIn:  { '0%': { opacity: 0, transform: 'translateY(-8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        pulseDot: { '0%,100%': { opacity: 1 },         '50%': { opacity: 0.4 } },
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
}
