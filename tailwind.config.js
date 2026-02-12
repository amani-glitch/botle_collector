/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0f172a',
          card: '#1e293b',
          accent: '#3b82f6',
          success: '#10b981',
          text: '#f8fafc',
        },
      },
    },
  },
  plugins: [],
};
