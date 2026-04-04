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
        'pulse-live':    'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'marquee':       'marquee 18s linear infinite',
        'ball-pop':      'ball-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'ball-wait':     'ball-wait 1s ease-in-out infinite',
        'confetti-fall': 'confettiFall 3.5s ease-in forwards',
        'champion-pop':  'championPop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'ball-pop': {
          '0%':   { transform: 'scale(0) rotate(-15deg)', opacity: '0' },
          '100%': { transform: 'scale(1) rotate(0deg)',   opacity: '1' },
        },
        'ball-wait': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        confettiFall: {
          '0%':   { transform: 'translateY(-20px) rotate(0deg)',    opacity: '1' },
          '80%':  { opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(540deg)', opacity: '0' },
        },
        championPop: {
          '0%':   { transform: 'scale(0.5)', opacity: '0' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
