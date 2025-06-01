/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  /* Tell Tailwind where to look for class names */
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",     // Next-JS "app" router pages
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",   // (only if you keep a /pages dir)
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      /* Your custom fonts plus the Tailwind defaults as fallback */
      fontFamily: {
        sans: ['var(--font-geist-sans)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-geist-mono)', ...defaultTheme.fontFamily.mono],
        eina: ['EinaSemibold', 'sans-serif'],
      },
    },
  },

  plugins: [],
};
