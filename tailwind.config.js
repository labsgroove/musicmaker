/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dj-dark': '#0a0a0f',
        'dj-panel': '#151520',
        'dj-accent': '#00d4ff',
        'dj-secondary': '#ff006e',
        'dj-success': '#39ff14',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'equalizer': 'equalizer 0.5s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #00d4ff, 0 0 10px #00d4ff' },
          '100%': { boxShadow: '0 0 20px #00d4ff, 0 0 30px #00d4ff' },
        },
        equalizer: {
          '0%, 100%': { height: '20%' },
          '50%': { height: '100%' },
        },
      },
    },
  },
  plugins: [],
}
