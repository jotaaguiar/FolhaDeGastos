/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'theme-escuro',
    'theme-emerald',
    'theme-ocean',
    'theme-sunset',
    'theme-claro',
  ],
  theme: {
    extend: {
      colors: {
        // All structural colors use CSS variable RGB channels so they adapt per theme
        bg:      'rgb(var(--bg-rgb) / <alpha-value>)',
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        s2:      'rgb(var(--s2-rgb) / <alpha-value>)',
        s3:      'rgb(var(--s3-rgb) / <alpha-value>)',
        muted:   'rgb(var(--muted-rgb) / <alpha-value>)',
        muted2:  'rgb(var(--muted2-rgb) / <alpha-value>)',
        'text-base': 'rgb(var(--text-rgb) / <alpha-value>)',
        // Status colors — darker variants used in light mode via CSS vars
        'fluxo-green':   'rgb(var(--green-rgb) / <alpha-value>)',
        'fluxo-red':     'rgb(var(--red-rgb) / <alpha-value>)',
        'fluxo-amber':   'rgb(var(--amber-rgb) / <alpha-value>)',
        'fluxo-blue':    'rgb(var(--blue-rgb) / <alpha-value>)',
        'fluxo-purple':  'rgb(var(--purple-rgb) / <alpha-value>)',
        'fluxo-teal':    'rgb(var(--teal-rgb) / <alpha-value>)',
        'fluxo-pink':    'rgb(var(--pink-rgb) / <alpha-value>)',
        'brand-primary': 'rgb(var(--brand-primary-rgb) / <alpha-value>)',
      },
      fontFamily: {
        sans:  ['Syne', 'sans-serif'],
        mono:  ['"DM Mono"', 'monospace'],
      },
      borderColor: {
        DEFAULT: 'var(--border)',
      },
      animation: {
        'progress': 'progress 1s ease-in-out',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-in-out',
        'slide-up-sheet': 'slideUpSheet 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        'scale-in': 'scaleIn 0.2s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        progress: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress-width)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUpSheet: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px var(--brand-glow)' },
          '100%': { boxShadow: '0 0 40px var(--brand-glow)' },
        },
      },
    },
  },
  plugins: [],
}
