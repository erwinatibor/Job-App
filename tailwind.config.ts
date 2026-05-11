import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        bg: {
          950: '#02040c',
          900: '#04060f',
          800: '#080a16',
          700: '#0c0f1e',
          600: '#111528',
          card: 'rgba(14, 17, 30, 0.75)',
        },
        gold: {
          300: '#f5d67a',
          400: '#ecc448',
          500: '#d4a827',
          600: '#b8901a',
          700: '#8a6a0e',
        },
        indigo: {
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
        },
        status: {
          applied: '#6366f1',
          contacted: '#22d3ee',
          screening: '#f59e0b',
          interview: '#8b5cf6',
          final: '#ec4899',
          offer: '#10b981',
          rejected: '#ef4444',
          ghosted: '#6b7280',
        },
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #d4a827 0%, #f0c84a 50%, #d4a827 100%)',
        'indigo-gradient': 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        'hero-glow': 'radial-gradient(ellipse at 50% 0%, rgba(212, 168, 39, 0.15) 0%, transparent 60%)',
      },
      boxShadow: {
        'glow-gold': '0 0 30px rgba(212, 168, 39, 0.2)',
        'glow-indigo': '0 0 30px rgba(99, 102, 241, 0.25)',
        'glow-sm': '0 0 15px rgba(212, 168, 39, 0.12)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255, 255, 255, 0.05) inset',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255, 255, 255, 0.07) inset',
        'modal': '0 25px 80px rgba(0, 0, 0, 0.7)',
      },
      animation: {
        'float-1': 'float1 18s ease-in-out infinite',
        'float-2': 'float2 24s ease-in-out infinite',
        'float-3': 'float3 20s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-gold': 'pulseGold 3s ease-in-out infinite',
        'gradient-flow': 'gradientFlow 6s ease infinite',
        'slide-up': 'slideUp 0.4s ease forwards',
        'fade-in': 'fadeIn 0.5s ease forwards',
        'count-up': 'countUp 0.6s ease forwards',
        'border-glow': 'borderGlow 3s ease-in-out infinite',
      },
      keyframes: {
        float1: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -40px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
        float2: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '40%': { transform: 'translate(-40px, 30px) scale(1.08)' },
          '70%': { transform: 'translate(25px, -20px) scale(0.92)' },
        },
        float3: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(20px, 40px) scale(1.04)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGold: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(212, 168, 39, 0)' },
          '50%': { opacity: '0.85', boxShadow: '0 0 20px 4px rgba(212, 168, 39, 0.2)' },
        },
        gradientFlow: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        borderGlow: {
          '0%, 100%': { borderColor: 'rgba(212, 168, 39, 0.2)' },
          '50%': { borderColor: 'rgba(212, 168, 39, 0.5)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
