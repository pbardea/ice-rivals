import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Pacifico', 'cursive'],
        body: ['Quicksand', 'sans-serif'],
      },
      colors: {
        ice: {
          50: '#f0f0ff',
          100: '#e0dfff',
          200: '#c4bfff',
          300: '#a9b4fc',
          400: '#7c8deb',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#3730a3',
          800: '#1e1b4b',
          900: '#0f0b2e',
        },
        frost: {
          50: '#f8faff',
          100: '#e8f0fe',
          200: '#c5d8f8',
          300: '#a0c4f0',
          400: '#6ba3e8',
          500: '#4a8fe0',
          600: '#2d6cc0',
          700: '#1d4e8a',
          800: '#132f5a',
          900: '#0a1a35',
        },
        lilac: {
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
        },
        sparkle: {
          gold: '#fbbf24',
          silver: '#e2e8f0',
          rose: '#fda4af',
        },
      },
      animation: {
        'spin-slow': 'spin 1s linear infinite',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'dice-roll': 'diceRoll 0.8s ease-out',
        'shimmer': 'shimmer 2.5s ease-in-out infinite',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        diceRoll: {
          '0%': { transform: 'rotate(0deg) scale(0.5)', opacity: '0' },
          '50%': { transform: 'rotate(180deg) scale(1.2)' },
          '100%': { transform: 'rotate(360deg) scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
