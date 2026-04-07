/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      colors: {
        // Brand palette
        brand: {
          50: '#f0f0ff',
          100: '#e4e3ff',
          200: '#cccbff',
          300: '#b0adff',
          400: '#9488ff',
          500: '#7c68ff',
          600: '#6d4fff',
          700: '#5e3bf5',
          800: '#4e30d0',
          900: '#412aa8',
          950: '#271a6b',
        },
        // Dark background shades
        dark: {
          50: '#f8f8ff',
          100: '#1a1a2e',
          200: '#16162a',
          300: '#12121f',
          400: '#0f0f1a',
          500: '#0c0c16',
        },
        // Semantic
        success: { DEFAULT: '#22c55e', light: '#4ade80', dark: '#16a34a' },
        warning: { DEFAULT: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
        danger:  { DEFAULT: '#ef4444', light: '#f87171', dark: '#dc2626' },
        info:    { DEFAULT: '#3b82f6', light: '#60a5fa', dark: '#2563eb' },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
        'dark-gradient': 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { opacity: 0, transform: 'translateY(20px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99,102,241,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(139,92,246,0.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      boxShadow: {
        'brand': '0 0 30px rgba(99, 102, 241, 0.3)',
        'brand-lg': '0 0 60px rgba(99, 102, 241, 0.4)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
};
