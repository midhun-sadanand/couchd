/**
 * Tailwind v4 requires its dedicated wrapper package for PostCSS.
 * Using the old `"tailwindcss"` plugin string will throw the error you just saw.
 */
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},   // ⬅️  wrapper plugin
    autoprefixer: {}
  }
};
