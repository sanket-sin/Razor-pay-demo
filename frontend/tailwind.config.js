/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#0c0f14',
          900: '#121826',
          800: '#1a2235',
          700: '#243049',
          600: '#2d3a52',
        },
        accent: { DEFAULT: '#6366f1', glow: '#818cf8' },
        surface: '#161d2e',
      },
    },
  },
  plugins: [],
};
