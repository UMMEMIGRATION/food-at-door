import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange:  '#FF6B35',
          red:     '#E63946',
          yellow:  '#FFD60A',
          dark:    '#0A0A0A',
          card:    '#141414',
          border:  '#2A2A2A',
          muted:   '#A0A0A0',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #FF6B35 0%, #E63946 100%)',
        'card-gradient':  'linear-gradient(145deg, #1A1A1A 0%, #111111 100%)',
        'hero-gradient':  'linear-gradient(135deg, rgba(255,107,53,0.15) 0%, rgba(230,57,70,0.05) 100%)',
      },
      fontFamily: {
        sans:     ['var(--font-inter)', 'sans-serif'],
        heading:  ['var(--font-sora)', 'sans-serif'],
      },
      borderRadius: {
        '2xl':  '1rem',
        '3xl':  '1.5rem',
        '4xl':  '2rem',
      },
      boxShadow: {
        'brand':    '0 0 30px rgba(255,107,53,0.25)',
        'card':     '0 4px 24px rgba(0,0,0,0.4)',
        'glow-sm':  '0 0 15px rgba(255,107,53,0.3)',
      },
      animation: {
        'fade-in':        'fadeIn 0.5s ease-in-out',
        'slide-up':       'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-brand':    'pulseBrand 2s infinite',
        'float':          'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        slideInRight: {
          '0%':   { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',     opacity: '1' },
        },
        pulseBrand: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,107,53,0.4)' },
          '50%':      { boxShadow: '0 0 0 10px rgba(255,107,53,0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
