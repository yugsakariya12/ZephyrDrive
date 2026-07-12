/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        alabaster: '#fbfbfa', // Primary background color (off-white/warm)
        cream: '#f5f3ef',     // Secondary warm accent/input backgrounds
        rosewood: '#9f1239',  // Deep crimson/ruby branding color
        crimson: '#be123c',   // Secondary buttons / alert color
        coral: {
          50: '#fef2f2',
          500: '#ef4444',
          900: '#7f1d1d',
        }
      },
      boxShadow: {
        'elegant': '0 8px 30px rgba(0, 0, 0, 0.03)',
        'elegant-hover': '0 20px 40px -12px rgba(159, 18, 57, 0.08)',
        'button-glow': '0 4px 14px rgba(159, 18, 57, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-in': 'slideIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
