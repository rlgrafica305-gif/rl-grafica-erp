/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // RL Gráfica brand palette (ouro + azul + magenta)
        brand: {
          gold:    '#D4A017',
          'gold-light': '#F5C842',
          blue:    '#1565C0',
          'blue-light': '#1E88E5',
          magenta: '#D81B60',
          'magenta-light': '#E91E8C',
          dark:    '#0D1117',
          'dark-card': '#161B22',
          'dark-border': '#21262D',
        },
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'brand': '0 0 20px rgba(216, 27, 96, 0.3)',
        'gold':  '0 0 20px rgba(212, 160, 23, 0.3)',
      },
    },
  },
  plugins: [],
}
