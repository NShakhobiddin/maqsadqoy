/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/index.html', './app/src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,.04), 0 14px 40px -18px rgba(15,23,42,.22)',
        soft: '0 1px 2px rgba(15,23,42,.04), 0 6px 18px -10px rgba(15,23,42,.18)',
        glow: '0 10px 32px -12px rgba(99,102,241,.55)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pop: {
          '0%': { transform: 'scale(.85)', opacity: '0' },
          '70%': { transform: 'scale(1.04)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-7px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp .45s cubic-bezier(.22,1,.36,1) both',
        fadeIn: 'fadeIn .35s ease both',
        pop: 'pop .35s cubic-bezier(.22,1,.36,1) both',
        floaty: 'floaty 5s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        slideDown: 'slideDown .25s ease both',
      },
    },
  },
  plugins: [],
}
