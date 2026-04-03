/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'ucl-black':  '#03071E',
        'ucl-navy':   '#080F28',
        'ucl-blue':   '#1B44C8',
        'ucl-blue-d': '#0F2B80',
        'ucl-blue-l': '#4A6FE3',
        'ucl-silver': '#7B8EA8',
        'ucl-silver-l': '#A8B8CC',
        'ucl-gold':   '#C8A84B',
        // keep backwards compat aliases
        'fifa-navy':  '#080F28',
        'fifa-gold':  '#C8A84B',
        'fifa-dark':  '#03071E',
      },
      fontFamily: {
        display: ['Impact', 'Arial Black', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-ucl': 'linear-gradient(160deg, #0F2B80 0%, #03071E 60%)',
        'gradient-hero': 'linear-gradient(180deg, #080F28 0%, #03071E 100%)',
      },
      animation: {
        'pulse-live': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'marquee': 'marquee 18s linear infinite',
        'ball-pop': 'ball-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'ball-wait': 'ball-wait 1s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease forwards',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'ball-pop': {
          '0%': { transform: 'scale(0) rotate(-15deg)', opacity: '0' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        'ball-wait': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
