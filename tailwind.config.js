const defaultTheme = require('tailwindcss/defaultTheme');

// Theme colors are CSS variables (see styles.css) so light/dark is defined in one place.
const token = name => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),             // page background
        surface: token('surface'),   // cards, image panels
        line: token('line'),         // borders, dividers
        fg: token('fg'),             // primary text
        muted: token('muted'),       // secondary text
        accent: token('accent'),     // buttons, links, active/hover states
        'on-accent': token('on-accent'), // text on accent backgrounds
        success: token('success'),   // checkmarks
        warning: token('warning'),   // small decorative details
        error: token('error'),       // small decorative details
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        display: ['"Space Grotesk"', ...defaultTheme.fontFamily.sans], // headings
      },
    },
  },
  darkMode: 'class',
};
