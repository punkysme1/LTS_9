/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}", // <-- INI PERBAIKAN FINAL. Memindai semua file di semua folder dari root.
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Roboto', 'sans-serif'],
        'serif': ['Merriweather', 'serif'],
      },
      colors: {
        'brand-dark': '#1a2c42',
        'brand-light': '#f0e9e0',
        'brand-accent': '#c5a572',
        'brand-accent-dark': '#a88c5f',
      }
    },
  },
  plugins: [],
}