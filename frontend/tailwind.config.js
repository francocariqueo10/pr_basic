/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'fifa-navy':    '#0B1E3D',
        'fifa-navy-light': '#1A3A6B',
        'fifa-gold':    '#F5C322',
        'fifa-red':     '#E5000F',
        'fifa-cyan':    '#00A9CE',
        'fifa-dark':    '#060E1F',
      },
      fontFamily: {
        display: ['Impact', 'Arial Black', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-fifa': 'linear-gradient(135deg, #0B1E3D 0%, #1A3A6B 50%, #0B1E3D 100%)',
        'gradient-gold': 'linear-gradient(135deg, #F5C322 0%, #E8A800 100%)',
      },
      animation: {
        'pulse-live': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
