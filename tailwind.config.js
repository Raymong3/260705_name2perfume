/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2f7f4',
          100: '#e1ede7',
          200: '#c5dbd1',
          300: '#9bbfae',
          400: '#6d9c87',
          500: '#4d806a',
          600: '#3c6654',
          700: '#325244',
          800: '#2a4339',
          900: '#1b2d26',
          950: '#0c1814', // Deepest forest green
        },
        luxury: {
          cream: '#fdfbf7', // Soft background cream
          sand: '#f5f0e6',  // Medium background cream
          gold: '#c5a880',  // Muted luxury gold accent
          goldLight: '#e4d5c3',
          goldDark: '#9c815c',
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'Playfair Display', 'Didot', 'Georgia', 'serif'],
        sans: ['Inter', 'Noto Sans KR', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'draw-line': 'drawLine 1.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        drawLine: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        }
      }
    },
  },
  plugins: [],
}
