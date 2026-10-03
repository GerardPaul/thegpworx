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
        accent: {
          DEFAULT: token('accent'),       // thruster orange: buttons, links, active states
          red: token('accent-red'),       // tiny details only
          yellow: token('accent-yellow'), // tiny details only
        },
        'on-accent': token('on-accent'), // text on accent backgrounds
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        display: ['"Space Grotesk"', ...defaultTheme.fontFamily.sans], // headings
      },
    },
  },
  darkMode: 'class',
};
