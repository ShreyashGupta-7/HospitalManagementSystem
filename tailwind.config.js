/** Colours come from CSS variables so high-contrast mode can swap them all at once. */
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        soft: v('soft'),
        ink: v('ink'),
        muted: v('muted'),
        line: v('line'),
        primary: v('primary'),
        'on-primary': v('on-primary'),
        danger: v('danger'),
        'on-danger': v('on-danger'),
        'danger-soft': v('danger-soft'),
        warn: v('warn'),
        'warn-soft': v('warn-soft'),
        ok: v('ok'),
        'ok-soft': v('ok-soft'),
        info: v('info'),
        'info-soft': v('info-soft'),
        focus: v('focus'),
      },
      minHeight: { btn: '3.5rem', 'btn-lg': '5rem' },
      fontFamily: {
        sans: [
          'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Noto Sans', 'Noto Sans Devanagari',
          'Noto Sans Tamil', 'Nirmala UI', 'Mangal', 'Latha', 'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
