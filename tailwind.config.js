const defaultTheme = require('tailwindcss/defaultTheme');

// Theme colors are CSS variables (see styles.css) so light/dark is defined in one place.
const token = name => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),         // page background
        fg: token('fg'),         // primary text; use fg/10 etc. for borders and surfaces
        muted: token('muted'),   // secondary text
        subtle: token('subtle'), // labels, captions
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  darkMode: 'class',
};
