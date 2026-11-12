/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        separator: 'var(--separator)',
        label: 'var(--label)',
        'label-2': 'var(--label-2)',
        'label-3': 'var(--label-3)',
        accent: 'var(--accent)',
        red: 'var(--red)',
        blue: 'var(--blue)',
        green: 'var(--green)',
        yellow: 'var(--yellow)',
        orange: 'var(--orange)',
        glass: 'var(--glass)'
      },
      borderRadius: {
        window: 'var(--radius-window)',
        card: 'var(--radius-card)',
        field: 'var(--radius-field)',
        capsule: '9999px'
      },
      fontFamily: {
        sans: ['var(--font)']
      },
      transitionTimingFunction: {
        ios: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
      },
      transitionDuration: {
        250: '250ms'
      }
    },
  },
  plugins: [],
}
